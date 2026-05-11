import { BaseAgent } from "../core/BaseAgent";

type SafetyAgentInput = {
  text: string;
};

type SafetyAgentOutput = {
  blocked: boolean;
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

    if (/password|one-time code|verification code|ssn|social security/.test(normalized)) {
      warnings.push("Sensitive credential or identity information may be visible.");
    }

    if (/payment|bank|transfer|crypto|wire|invoice|balance/.test(normalized)) {
      warnings.push("Financial information may be visible. Review carefully before acting.");
    }

    return {
      blocked: false,
      warnings
    };
  }
}
