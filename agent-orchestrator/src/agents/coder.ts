import { BaseAgent } from "./base-agent";
import { AgentContext } from "../types";

export class CoderAgent extends BaseAgent {
  constructor() {
    super(
      "coder",
      `You are an expert software engineer. Write:
- Clean, production-ready code
- Comprehensive error handling
- Type-safe implementations
- Well-documented functions
Always include type hints and docstrings.`
    );
  }

  canHandle(taskType: string): boolean {
    return ["code", "implement", "fix"].includes(taskType);
  }

  protected async act(reasoning: string, context: AgentContext): Promise<any> {
    const code = await this.reason(
      `Based on reasoning:\n${reasoning}\n\nGenerate implementation. Return only code.`,
      context
    );
    return { code, language: "python" };
  }
}
