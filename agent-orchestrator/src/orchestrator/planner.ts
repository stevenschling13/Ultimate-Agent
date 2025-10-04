import { Goal, Plan, TaskSpec, UUID } from "../types";

const uid = (): UUID => `task_${Math.random().toString(36).slice(2)}`;

export class AdvancedPlanner {
  plan(goal: Goal, context: any, strategy: string = "parallel_optimize"): Plan {
    switch (strategy) {
      case "simple": return this.simple(goal, context);
      case "resource_aware": return this.resourceAware(goal, context);
      case "cost_optimize": return this.costOptimize(goal, context);
      default: return this.parallel(goal, context);
    }
  }
  private baseSynthesize(goal: Goal, context: any): TaskSpec {
    return { id: uid(), name: "SynthesizeCode", tool: "openai.synthesize", inputs: { goal, context }, depends_on: [], priority: 1, estimated_time: 15, cost_estimate: 5000 };
  }
  private simple(goal: Goal, context: any): Plan {
    const synth = this.baseSynthesize(goal, context);
    const validate: TaskSpec = { id: uid(), name: "ValidateCode", tool: "openai.validate", inputs: { criteria: goal.success_criteria, from: synth.id }, depends_on: [synth.id], priority: 2, estimated_time: 8, cost_estimate: 2000 };
    const tests: TaskSpec = { id: uid(), name: "GenerateTests", tool: "openai.generate_tests", inputs: { goal, from: synth.id }, depends_on: [synth.id], priority: 2, estimated_time: 10, cost_estimate: 3000 };
    const finalize: TaskSpec = { id: uid(), name: "Finalize", tool: "file.write", inputs: { sources: [synth.id, validate.id, tests.id] }, depends_on: [synth.id, validate.id, tests.id], priority: 3, estimated_time: 2, cost_estimate: 100 };
    return { strategy: "simple", parallelism: 1, tasks: [synth, validate, tests, finalize] };
  }
  private parallel(goal: Goal, context: any): Plan {
    const synth = this.baseSynthesize(goal, context);
    const validate: TaskSpec = { id: uid(), name: "ValidateCode", tool: "openai.validate", inputs: { criteria: goal.success_criteria, from: synth.id }, depends_on: [synth.id], priority: 2, estimated_time: 8, cost_estimate: 2000 };
    const tests: TaskSpec = { id: uid(), name: "GenerateTests", tool: "openai.generate_tests", inputs: { goal, from: synth.id }, depends_on: [synth.id], priority: 2, estimated_time: 10, cost_estimate: 3000 };
    const docs: TaskSpec = { id: uid(), name: "GenerateDocs", tool: "openai.generate_docs", inputs: { goal, from: synth.id }, depends_on: [synth.id], priority: 2, estimated_time: 7, cost_estimate: 2000 };
    const finalize: TaskSpec = { id: uid(), name: "Finalize", tool: "file.write", inputs: { sources: [synth.id, validate.id, tests.id, docs.id] }, depends_on: [synth.id, validate.id, tests.id, docs.id], priority: 3, estimated_time: 2, cost_estimate: 100 };
    return { strategy: "parallel_optimize", parallelism: 3, tasks: [synth, validate, tests, docs, finalize] };
  }
  private resourceAware(goal: Goal, context: any): Plan {
    const budget = Number(context?.token_budget ?? 50_000);
    const tasks: TaskSpec[] = [];
    const synth = this.baseSynthesize(goal, context); let used = 0;
    if (used + synth.cost_estimate <= budget) { tasks.push(synth); used += synth.cost_estimate; }
    const validate: TaskSpec = { id: uid(), name: "ValidateCode", tool: "openai.validate", inputs: { criteria: goal.success_criteria, from: synth.id }, depends_on: [synth.id], priority: 2, estimated_time: 8, cost_estimate: 2000 };
    if (used + validate.cost_estimate <= budget) { tasks.push(validate); used += validate.cost_estimate; }
    return { strategy: "resource_aware", parallelism: 1, tasks };
  }
  private costOptimize(goal: Goal, context: any): Plan {
    const synthAll: TaskSpec = { id: uid(), name: "SynthesizeAll", tool: "openai.synthesize_complete", inputs: { goal, context, include_tests: true, include_docs: true }, depends_on: [], priority: 1, estimated_time: 20, cost_estimate: 8000 };
    const finalize: TaskSpec = { id: uid(), name: "Finalize", tool: "file.write", inputs: { sources: [synthAll.id] }, depends_on: [synthAll.id], priority: 2, estimated_time: 2, cost_estimate: 100 };
    return { strategy: "cost_optimize", parallelism: 1, tasks: [synthAll, finalize] };
  }
}

export function topologicalLevels(tasks: TaskSpec[]): string[][] {
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();
  const ids = new Set(tasks.map(t => t.id));
  tasks.forEach(t => { inDegree.set(t.id, t.depends_on.length); t.depends_on.forEach(d => { if (!ids.has(d)) throw new Error(`Unknown dependency: ${d}`); children.set(d, [...(children.get(d) ?? []), t.id]); }); });
  const levels: string[][] = [];
  while (inDegree.size) {
    const ready = [...inDegree.entries()].filter(([,deg])=>deg===0).map(([id])=>id);
    if (!ready.length) throw new Error("Cycle detected in task graph");
    levels.push(ready);
    ready.forEach(id => { inDegree.delete(id); (children.get(id) ?? []).forEach(ch => inDegree.set(ch, (inDegree.get(ch) ?? 0) - 1)); });
  }
  return levels;
}
