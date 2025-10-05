import { describe, it, expect } from "vitest";
import { AdvancedPlanner, topologicalLevels } from "./planner";
const goal = { id: "g1", title: "t", description: "d", constraints: {}, success_criteria: ["a"] } as any;

describe("planner", () => {
  it("builds parallel plan", () => { const p = new AdvancedPlanner().plan(goal, {}, "parallel_optimize"); expect(p.tasks.length).toBe(5); const levels = topologicalLevels(p.tasks); expect(levels[0].length).toBe(1); });
  it("detects cycles", () => { const p = new AdvancedPlanner().plan(goal, {}, "parallel_optimize"); p.tasks[0].depends_on = [p.tasks[p.tasks.length-1].id]; expect(() => topologicalLevels(p.tasks)).toThrow(); });
});
