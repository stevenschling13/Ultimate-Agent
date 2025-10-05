import { AgentRegistry } from "../agents/registry";
import { ContextManager } from "../memory/context-manager";
import { ExecutionPlan, Task, AgentContext } from "../types";
import { CircuitBreaker } from "../observability/circuit-breaker";
import { metrics } from "../observability/metrics";

export class Executor {
  private registry = new AgentRegistry();
  private memory = new ContextManager();
  private breaker = new CircuitBreaker();

  async run(plan: ExecutionPlan, sessionId: string, onEvent?: (event: any) => void) {
    const emit = (type: string, data: any) => onEvent?.({ type, data, ts: Date.now() });
    emit("start", { plan });

    const results = new Map<string, any>();
    const done = new Set<string>();

    const getReadyTasks = () =>
      plan.tasks.filter(
        (task) => task.status === "pending" && task.dependencies.every((dep) => done.has(dep))
      );

    let ready = getReadyTasks();

    while (ready.length > 0) {
      await Promise.all(
        ready.map(async (task) => {
          await this.executeTask(task, sessionId, results, done, emit);
        })
      );

      ready = getReadyTasks();
    }

    emit("done", { results: Object.fromEntries(results) });
    return { results: Object.fromEntries(results) };
  }

  private async executeTask(
    task: Task,
    sessionId: string,
    results: Map<string, any>,
    done: Set<string>,
    emit: (type: string, data: any) => void
  ) {
    try {
      task.status = "running";
      task.startedAt = Date.now();
      emit("task_start", { task });

      const context: AgentContext = {
        sessionId,
        messages: this.memory.get(sessionId),
        memory: Object.fromEntries(results),
        tools: [],
      };

      const agent = this.registry.get(task.assignedTo);
      const result = await this.breaker.execute(() => agent.execute(task.description, context));

      task.status = "completed";
      task.completedAt = Date.now();
      task.result = result;
      results.set(task.id, result);
      done.add(task.id);

      emit("task_done", { task, result });
      metrics.inc("tasks.completed");
    } catch (error: any) {
      task.retries += 1;
      if (task.retries < 3) {
        task.status = "pending";
        emit("task_retry", { task });
      } else {
        task.status = "failed";
        task.error = error?.message ?? String(error);
        emit("task_failed", { task });
        metrics.inc("tasks.failed");
      }
    }
  }
}
