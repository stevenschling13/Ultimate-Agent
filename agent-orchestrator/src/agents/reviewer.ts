import { BaseAgent } from "./base-agent";
import { AgentContext } from "../types";

export class ReviewerAgent extends BaseAgent {
  constructor() {
    super(
      "reviewer",
      `You are a code reviewer. You:
- Review code for correctness
- Check best practices
- Validate against requirements
- Identify issues
Provide specific feedback.`
    );
  }

  canHandle(taskType: string): boolean {
    return ["review", "validate"].includes(taskType);
  }

  protected async act(reasoning: string, context: AgentContext): Promise<any> {
    const review = await this.reason(
      `Based on reasoning:\n${reasoning}\n\nProvide review with pass/fail.`,
      context
    );
    return { review, passed: true };
  }
}
