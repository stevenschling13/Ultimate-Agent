import { BaseAgent } from "./base-agent";
import { CoordinatorAgent } from "./coordinator";
import { CoderAgent } from "./coder";
import { AnalystAgent } from "./analyst";
import { ReviewerAgent } from "./reviewer";
import { AgentRole } from "../types";

export class AgentRegistry {
  private agents = new Map<AgentRole, BaseAgent>([
    ["coordinator", new CoordinatorAgent()],
    ["coder", new CoderAgent()],
    ["analyst", new AnalystAgent()],
    ["reviewer", new ReviewerAgent()],
  ]);

  get(role: AgentRole): BaseAgent {
    const agent = this.agents.get(role);
    if (!agent) throw new Error(`Agent ${role} not found`);
    return agent;
  }
}
