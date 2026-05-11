import { BaseAgent } from "../core/BaseAgent";

type SafetyAgentInput = {
  text: string;
};

type SafetyAgentOutput = {
  classification: "safe" | "needs_confirmation" | "blocked";
  blocked: boolean;
  requiresConfirmation: boolean;
  warnings: string[];
};

export class SafetyAgent extends BaseAgent<SafetyAgentInput, SafetyAgentOutput> {
  constructor() {
    super({
      id: "screensmart.safety",
      name: "SafetyAgent",
      department: "screensmart",
      role: "Check visible screen risks",
      description: "Flags obvious sensitive or risky content before suggesting next actions."
    });
  }

  async run(input: SafetyAgentInput): Promise<SafetyAgentOutput> {
    const normalized = input.text.toLowerCase();
    const warnings: string[] = [];
    let classification: SafetyAgentOutput["classification"] = "safe";

    if (/password|one-time code|verification code|ssn|social security/.test(normalized)) {
      warnings.push("Sensitive credential or identity information may be visible.");
      classification = "needs_confirmation";
    }

    if (/payment|bank|transfer|crypto|wire|invoice|balance/.test(normalized)) {
      warnings.push("Financial information may be visible. Review carefully before acting.");
      classification = "needs_confirmation";
    }

    if (/legal|lawsuit|contract|court|attorney|medical|diagnosis|prescription|delete|submit|purchase|checkout|send email|send message/.test(normalized)) {
      warnings.push("This screen may involve an action that needs user confirmation before proceeding.");
      classification = "needs_confirmation";
    }

    if (/delete all|wire transfer|submit payment|purchase now|send now/.test(normalized)) {
      warnings.push("High-impact action detected. ScreenSmart will not automate this action.");
      classification = "blocked";
    }

    return {
      blocked: classification === "blocked",
      classification,
      requiresConfirmation: classification === "needs_confirmation",
      warnings
    };
  }
}
