import { BaseAgent } from "../core/BaseAgent";

export class WebAutomationAgent extends BaseAgent<{ task?: string }, { message: string }> {
  constructor() {
    super({
      id: "browser.web-automation",
      name: "WebAutomationAgent",
      department: "browser",
      role: "Plan web automation tasks",
      description: "Blocked-by-design stub so automation is explicit and unavailable in the mobile MVP."
    });
  }

  async run() {
    return { message: "Web automation is blocked in this MVP." };
  }
}
