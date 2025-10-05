import { ToolRegistry } from "./registry";
import { Execution, Plan, TaskSpec } from "../types";
import { writeFile } from "../tools/files";
import { topologicalLevels } from "./planner";
import { Metrics } from "../observability/metrics";

export class Executor {
  private tools = new ToolRegistry();
  private artifacts = new Map<string, unknown>();

  async run(plan: Plan, goal: any, onEvent?: (ev: any)=>void): Promise<Execution> {
    const exec: Execution = { id: `exec_${Date.now()}`, goal, plan, startTime: Date.now(), tokensUsed: 0, status: "running", tasks: plan.tasks.map(t => ({ ...t, status: "pending" })) };
    const levels = topologicalLevels(plan.tasks);
    const emit = (type: string, data: any) => onEvent?.({ type, data, execId: exec.id, ts: Date.now() });

    emit("start", { plan });

    for (const level of levels) {
      emit("level_start", { level });
      await Promise.all(level.map(async (id) => {
        const rt = exec.tasks.find(t => t.id === id)!; rt.status = "running"; emit("task_start", { task: rt });
        const out = await this.executeTask(rt); rt.status = "completed"; rt.result = out.result; this.artifacts.set(rt.id, out.result);
        exec.tokensUsed += out.tokens; Metrics.inc("tokens", out.tokens); emit("task_end", { id: rt.id, tokens: out.tokens });
      }));
      emit("level_end", {});
    }

    exec.status = "completed"; exec.endTime = Date.now(); exec.executionTime = (exec.endTime - exec.startTime) / 1000;
    emit("end", { exec });
    return exec;
  }

  private async executeTask(task: TaskSpec): Promise<{ result: unknown; tokens: number }> {
    const take = (from?: string) => (from ? this.artifacts.get(from) : undefined);
    switch (task.tool) {
      case "openai.synthesize": {
        const { text, usage } = await this.tools.openai.synthesizeCode(task.inputs.goal, task.inputs.context);
        const tokens = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0);
        return { result: text, tokens };
      }
      case "openai.generate_tests": {
        const code = String(take(String(task.inputs.from)) ?? "");
        const { text, usage } = await this.tools.openai.generateTests(code, task.inputs.goal);
        const tokens = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0);
        return { result: text, tokens };
      }
      case "openai.validate": {
        const code = String(take(String(task.inputs.from)) ?? "");
        const { json, usage } = await this.tools.openai.validateSolution(code, task.inputs.criteria as string[]);
        const tokens = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0);
        return { result: json, tokens };
      }
      case "openai.generate_docs": {
        const { text, usage } = await this.tools.openai.generateDocs(task.inputs.goal);
        const tokens = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0);
        return { result: text, tokens };
      }
      case "openai.synthesize_complete": {
        const { content, usage } = await this.tools.openai.synthesizeComplete(task.inputs.goal, task.inputs.context);
        const tokens = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0);
        return { result: content, tokens };
      }
      case "file.write": {
        const sources = (task.inputs.sources as string[]).map(id => this.artifacts.get(id));
        const payload = JSON.stringify(sources, null, 2);
        const path = await writeFile(`output_${task.id}.json`, payload);
        return { result: { path }, tokens: 0 };
      }
      default: return { result: null, tokens: 0 };
    }
  }
}
