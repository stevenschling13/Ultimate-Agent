import { BaseAgent } from "./base-agent";
import { AgentContext, ExecutionPlan, Task } from "../types";

export class CoordinatorAgent extends BaseAgent {
  constructor() {
    super(
      "coordinator",
      [
        "You are a planning agent. Break goals into subtasks for:",
        "- coder: write code",
        "- analyst: analyze requirements",
        "- reviewer: validate outputs",
        "",
        'Return JSON: {"tasks":[{"type":"","description":"","assignedTo":"coder|analyst|reviewer","dependencies":[]}]}',
      ].join("\n"),
    );
  }

  canHandle(taskType: string): boolean {
    return taskType === "plan";
  }

  async plan(goal: string, context: AgentContext): Promise<ExecutionPlan> {
    const response = await this.reason(`Create a plan for: "${goal}"`, context);

    try {
      const parsed = JSON.parse(response);
      const tasks: Task[] = (parsed.tasks ?? []).map((task: any, index: number) => {
        const assigned = ["coder", "analyst", "reviewer"].includes(task.assignedTo)
          ? task.assignedTo
          : "coder";

        return {
          id: `task_${index}`,
          type: task.type,
          description: task.description,
          assignedTo: assigned,
          dependencies: task.dependencies || [],
          status: "pending",
          retries: 0,
        };
      });

      return {
        id: `plan_${Date.now()}`,
        goal,
        tasks,
        createdAt: Date.now(),
      };
    } catch {
      return {
        id: `plan_${Date.now()}`,
        goal,
        tasks: [
          {
            id: "task_0",
            type: "execute",
            description: goal,
            assignedTo: "coder",
            dependencies: [],
            status: "pending",
            retries: 0,
          },
        ],
        createdAt: Date.now(),
      };
    }
  }

  protected async act(reasoning: string, _context: AgentContext): Promise<any> {
    return { plan: reasoning };
  }
}
