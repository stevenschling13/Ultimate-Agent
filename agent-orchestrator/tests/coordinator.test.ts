import { describe, expect, it } from "vitest";
import CoordinatorAgent, { Task } from "../src/agents/coordinator";

describe("CoordinatorAgent.plan", () => {
  it("falls back to single task when parsed tasks array is empty", () => {
    const agent = new CoordinatorAgent({
      fallbackTask: {
        id: "safety-net",
        description: "Draft a minimal viable plan.",
      },
    });

    const result = agent.plan(
      JSON.stringify({
        tasks: [],
      })
    );

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toMatchObject({
      id: "safety-net",
      description: "Draft a minimal viable plan.",
    });
  });

  it("normalizes parsed tasks and filters out invalid entries", () => {
    const agent = new CoordinatorAgent();
    const plan = agent.plan(
      JSON.stringify({
        tasks: [
          { id: "  task-alpha  ", description: "  Research API options  " },
          { description: "" },
          null,
          { summary: "Review findings" },
        ],
      })
    );

    expect(plan.tasks).toHaveLength(2);
    const [first, second] = plan.tasks as Task[];

    expect(first.id).toBe("task-alpha");
    expect(first.description).toBe("Research API options");

    expect(second.id).toBe("task-4");
    expect(second.description).toBe("Review findings");
  });
});
