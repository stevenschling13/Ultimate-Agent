import React, { useEffect, useMemo, useState } from "react";

export type ExecutionPlanStep = {
  id?: string;
  title?: string;
  description?: string;
  detail?: string;
  status?: string;
};

export type ExecutionPlan = {
  title?: string;
  summary?: string;
  steps?: Array<ExecutionPlanStep | null | undefined> | null;
};

export type ExecutionTask = {
  id?: string;
  label?: string;
  description?: string;
  status?: string;
};

export type ExecutionState = {
  id?: string;
  status?: string;
  plan?: ExecutionPlan | null;
  tasks?: Array<ExecutionTask | null | undefined> | null;
};

export type EventPayload = {
  execution?: ExecutionState | null;
};

export type MessageEventLike<T = string> = {
  data: T;
};

export interface EventSourceLike {
  addEventListener(
    type: string,
    listener: (event: MessageEventLike<string>) => void
  ): void;
  removeEventListener(
    type: string,
    listener: (event: MessageEventLike<string>) => void
  ): void;
  close(): void;
}

export interface AgentDashboardProps {
  sseUrl: string;
  createEventSource?: (url: string) => EventSourceLike;
}

function defaultCreateEventSource(url: string): EventSourceLike {
  return new EventSource(url);
}

function sanitizeText(value?: string | null, placeholder: string = "—"): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : placeholder;
}

function mergeExecutionState(
  previous: ExecutionState | null,
  incoming: ExecutionState | null | undefined
): ExecutionState | null {
  if (!incoming) {
    return previous;
  }

  if (!previous) {
    return incoming;
  }

  const plan =
    incoming.plan !== undefined ? incoming.plan ?? null : previous.plan ?? null;
  const tasks =
    incoming.tasks !== undefined
      ? (incoming.tasks ?? null)
      : previous.tasks ?? null;

  return {
    ...previous,
    ...incoming,
    id: incoming.id ?? previous.id,
    status: incoming.status ?? previous.status,
    plan,
    tasks,
  };
}

const EMPTY_PLAN_PLACEHOLDERS = {
  title: "Awaiting plan title…",
  summary: "Awaiting plan summary…",
  steps: "No plan steps yet.",
};

const EMPTY_TASKS_PLACEHOLDER = "No tasks have been scheduled.";

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  sseUrl,
  createEventSource,
}) => {
  const [execution, setExecution] = useState<ExecutionState | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const factory = createEventSource ?? defaultCreateEventSource;
    const eventSource = factory(sseUrl);

    const handleMessage = (event: MessageEventLike<string>) => {
      if (!isMounted) return;

      try {
        const payload: EventPayload = JSON.parse(event.data ?? "{}");
        if (payload?.execution) {
          setExecution((current) =>
            mergeExecutionState(current, payload.execution)
          );
          setConnectionError(null);
        }
      } catch (error) {
        console.warn("Failed to parse execution payload", error);
      }
    };

    const handleError = () => {
      if (!isMounted) return;
      setConnectionError("Connection lost. Retrying…");
    };

    eventSource.addEventListener("message", handleMessage);
    eventSource.addEventListener("error", handleError);

    return () => {
      isMounted = false;
      eventSource.removeEventListener("message", handleMessage);
      eventSource.removeEventListener("error", handleError);
      eventSource.close();
    };
  }, [sseUrl, createEventSource]);

  const plan = execution?.plan ?? null;

  const planSteps = useMemo(() => {
    if (!plan || !Array.isArray(plan.steps)) {
      return [] as ExecutionPlanStep[];
    }

    return plan.steps
      .filter((step): step is ExecutionPlanStep => Boolean(step))
      .map((step, index) => ({
        ...step,
        id: step?.id ?? `step-${index}`,
      }));
  }, [plan]);

  const tasks = useMemo(() => {
    if (!execution || !Array.isArray(execution.tasks)) {
      return [] as ExecutionTask[];
    }

    return execution.tasks
      .filter((task): task is ExecutionTask => Boolean(task))
      .map((task, index) => ({
        ...task,
        id: task?.id ?? `task-${index}`,
      }));
  }, [execution]);

  const title = sanitizeText(plan?.title, EMPTY_PLAN_PLACEHOLDERS.title);
  const summary = sanitizeText(plan?.summary, EMPTY_PLAN_PLACEHOLDERS.summary);

  return (
    <div className="agent-dashboard" role="region" aria-live="polite">
      <header className="agent-dashboard__header">
        <h2 className="agent-dashboard__title">{title}</h2>
        <p className="agent-dashboard__summary">{summary}</p>
      </header>

      {connectionError ? (
        <div className="agent-dashboard__error" role="status">
          {connectionError}
        </div>
      ) : null}

      <section className="agent-dashboard__plan" aria-label="Execution plan">
        {planSteps.length > 0 ? (
          <ol className="agent-dashboard__plan-steps">
            {planSteps.map((step, index) => {
              const stepTitle = sanitizeText(
                step.title ?? step.description ?? step.detail,
                `Step ${index + 1}`
              );
              const description = sanitizeText(
                step.description ?? step.detail,
                "Awaiting step details…"
              );
              const status = sanitizeText(step.status, "pending");

              return (
                <li className="agent-dashboard__plan-step" key={step.id ?? index}>
                  <div className="agent-dashboard__plan-step-header">
                    <span className="agent-dashboard__plan-step-index">
                      {index + 1}.
                    </span>
                    <span className="agent-dashboard__plan-step-title">
                      {stepTitle}
                    </span>
                  </div>
                  <p className="agent-dashboard__plan-step-description">
                    {description}
                  </p>
                  <span className="agent-dashboard__plan-step-status">
                    Status: {status}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="agent-dashboard__plan-placeholder">
            {EMPTY_PLAN_PLACEHOLDERS.steps}
          </p>
        )}
      </section>

      <section className="agent-dashboard__tasks" aria-label="Tasks">
        <h3>Tasks</h3>
        {tasks.length > 0 ? (
          <ul className="agent-dashboard__task-list">
            {tasks.map((task, index) => {
              const taskLabel = sanitizeText(
                task.label ?? task.description,
                `Task ${index + 1}`
              );
              const status = sanitizeText(task.status, "pending");

              return (
                <li className="agent-dashboard__task" key={task.id ?? index}>
                  <span className="agent-dashboard__task-label">{taskLabel}</span>
                  <span className="agent-dashboard__task-status">
                    Status: {status}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="agent-dashboard__tasks-placeholder">
            {EMPTY_TASKS_PLACEHOLDER}
          </p>
        )}
      </section>

      <section className="agent-dashboard__metadata" aria-label="Execution metadata">
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{sanitizeText(execution?.status, "Unknown")}</dd>
          </div>
          <div>
            <dt>Execution ID</dt>
            <dd>{sanitizeText(execution?.id, "—")}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
};

export default AgentDashboard;
