import { BaseAgent } from "../core/BaseAgent";

export class BrowserAgent extends BaseAgent<{ url?: string }, { message: string }> {
  constructor() {
    super({
      id: "browser.browser",
      name: "BrowserAgent",
      department: "browser",
      role: "Plan browser context tasks",
      description: "Safe placeholder for future browser context; does not control browsers in the MVP."
    });
  }

  async run() {
    return { message: "Browser control is disabled for the MVP agent architecture." };
  }
}
