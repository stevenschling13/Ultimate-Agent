import { BaseAgent } from "./base-agent";
import { AgentContext } from "../types";

export class AnalystAgent extends BaseAgent {
  constructor() {
    super(
      "analyst",
      `You are a requirements analyst. You:
- Analyze requirements and constraints
- Identify edge cases
- Evaluate architectures
- Provide recommendations`
    );
  }

  canHandle(taskType: string): boolean {
    return ["analyze", "evaluate"].includes(taskType);
  }

  protected async act(reasoning: string, context: AgentContext): Promise<any> {
    const analysis = await this.reason(
      `Based on reasoning:\n${reasoning}\n\nProvide detailed analysis.`,
      context
    );
    return { analysis };
  }
}
