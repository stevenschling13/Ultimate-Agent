import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  GitBranch,
  Play,
  RefreshCw,
  XCircle,
  Zap,
} from "lucide-react";
import { connectSSE } from "../lib/sse";

export type ExecutionPlanStep = {
  id?: string;
  title?: string;
  description?: string;
  detail?: string;
  status?: string;
};

export type ExecutionPlan = {
  strategy?: string;
  parallelism?: number;
  title?: string;
  summary?: string;
  steps?: Array<ExecutionPlanStep | null | undefined> | null;
};

export type ExecutionTask = {
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  tool?: string;
  status?: string;
  priority?: string | number;
  estimated_time?: number;
  cost_estimate?: number;
};

export type ExecutionGoal = {
  title?: string;
  description?: string;
};

export type ExecutionState = {
  id?: string;
  status?: string;
  executionTime?: number;
  tokensUsed?: number;
  goal?: ExecutionGoal | null;
  plan?: ExecutionPlan | null;
  tasks?: Array<ExecutionTask | null | undefined> | null;
};

export type EventPayload = {
  execution?: ExecutionState | null;
  [key: string]: unknown;
};

const sampleGoal = {
  id: `goal_${Date.now()}`,
  title: "Build REST API Client",
  description: "Create Python REST API client with auth, retry, and error handling",
  constraints: {
    language: "python",
    style: "async",
    dependencies: ["aiohttp", "pydantic"],
  },
  success_criteria: [
    "Implements async HTTP methods",
    "Has authentication support",
    "Includes retry mechanism",
    "Provides robust error handling",
    "Uses type hints throughout",
  ],
};

function sanitizeText(value?: string | null, placeholder: string = "—"): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : placeholder;
}

function formatNumber(value?: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return value.toFixed(1);
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

  return {
    ...previous,
    ...incoming,
    goal: incoming.goal ?? previous.goal ?? null,
    plan: incoming.plan !== undefined ? incoming.plan ?? null : previous.plan ?? null,
    tasks:
      incoming.tasks !== undefined ? incoming.tasks ?? null : previous.tasks ?? null,
  };
}

const EMPTY_PLAN_PLACEHOLDERS = {
  title: "Awaiting plan title…",
  summary: "Awaiting plan summary…",
  steps: "No plan steps yet.",
};

const EMPTY_TASKS_PLACEHOLDER = "No tasks have been scheduled.";

const MAX_EVENT_HISTORY = 200;

const statusIcon = (status?: string | null) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case "running":
    case "active":
      return <Activity className="w-5 h-5 text-blue-400 animate-spin" />;
    case "failed":
      return <XCircle className="w-5 h-5 text-red-400" />;
    default:
      return <Clock className="w-5 h-5 text-gray-400" />;
  }
};

const AgentDashboard: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState("parallel_optimize");
  const [isExecuting, setIsExecuting] = useState(false);
  const [execution, setExecution] = useState<ExecutionState | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  const execute = () => {
    setIsExecuting(true);
    setEvents([]);
    setError(null);

    const url = `/api/execute/stream?strategy=${encodeURIComponent(
      selectedStrategy
    )}&goal=${encodeURIComponent(JSON.stringify(sampleGoal))}`;

    eventSourceRef.current?.close();

    try {
      const source = connectSSE(url, (event) => {
        if (event.type === "error") {
          setError("Connection failed. Check backend on port 8080.");
          setIsExecuting(false);
          source.close();
          eventSourceRef.current = null;
          return;
        }

        let data: any = null;
        if (typeof event.data === "string" && event.data.trim().length > 0) {
          try {
            data = JSON.parse(event.data);
          } catch (parseError) {
            console.warn("Failed to parse SSE payload", parseError);
            return;
          }
        } else {
          data = event.data ?? null;
        }

        if (event.type === "progress") {
          setEvents((current) => [data, ...current].slice(0, MAX_EVENT_HISTORY));
          return;
        }

        if (data?.execution) {
          setExecution((current) => mergeExecutionState(current, data.execution));
          setError(null);
        }

        if (event.type === "done") {
          setIsExecuting(false);
          source.close();
          eventSourceRef.current = null;
        }
      });

      source.onerror = () => {
        setError("Connection failed. Check backend on port 8080.");
        setIsExecuting(false);
        source.close();
        eventSourceRef.current = null;
      };

      eventSourceRef.current = source;
    } catch (err: any) {
      setError(err?.message ?? "Failed to start execution");
      setIsExecuting(false);
    }
  };

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

  const planTitle = sanitizeText(plan?.title, EMPTY_PLAN_PLACEHOLDERS.title);
  const planSummary = sanitizeText(plan?.summary, EMPTY_PLAN_PLACEHOLDERS.summary);
  const strategy = sanitizeText(plan?.strategy, "—");
  const parallelism = plan?.parallelism ?? null;
  const goalTitle = sanitizeText(execution?.goal?.title, sampleGoal.title);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Agent Orchestration System</h1>
            <p className="text-gray-400 text-sm">
              OpenAI GPT-4 • Streaming • Structured Outputs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-yellow-400" />
            <Cpu className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        {error ? (
          <div className="bg-red-900/30 border border-red-500 rounded p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-300">Error</div>
              <div className="text-sm text-red-200 mt-1">{error}</div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded p-4 border border-slate-700">
            <div className="text-sm text-gray-400">Tokens</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Database className="w-5 h-5" />
              {execution?.tokensUsed ?? 0}
            </div>
          </div>
          <div className="bg-slate-800 rounded p-4 border border-slate-700">
            <div className="text-sm text-gray-400">Time (s)</div>
            <div className="text-2xl font-bold">{formatNumber(execution?.executionTime)}</div>
          </div>
          <div className="bg-slate-800 rounded p-4 border border-slate-700">
            <div className="text-sm text-gray-400">Tasks</div>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </div>
          <div className="bg-slate-800 rounded p-4 border border-slate-700">
            <div className="text-sm text-gray-400">Status</div>
            <div className="text-2xl font-bold capitalize">
              {sanitizeText(execution?.status, "-")}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded p-6 border border-slate-700 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            Execution Control
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded p-3 border border-slate-600">
              <div className="text-sm">
                <div className="font-semibold text-blue-400 mb-1">{goalTitle}</div>
                <div className="text-gray-400 text-xs mb-2">
                  {sanitizeText(execution?.goal?.description, sampleGoal.description)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {sampleGoal.success_criteria.slice(0, 3).map((criterion, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-slate-800 rounded text-xs"
                    >
                      {criterion}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="strategy">
                Strategy
              </label>
              <select
                id="strategy"
                value={selectedStrategy}
                onChange={(event) => setSelectedStrategy(event.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
                disabled={isExecuting}
              >
                <option value="simple">Simple Sequential</option>
                <option value="parallel_optimize">Parallel Optimized</option>
                <option value="resource_aware">Resource Aware</option>
                <option value="cost_optimize">Cost Optimized</option>
              </select>
              <button
                onClick={execute}
                disabled={isExecuting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg py-3 font-semibold flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Execute
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {execution ? (
          <div className="bg-slate-800 rounded p-6 border border-slate-700 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Execution: {goalTitle}
            </h2>
            <div className="text-sm text-gray-400 mb-4">
              Strategy: {strategy} • Parallelism: {parallelism ?? "-"}x
            </div>
            <header className="mb-4">
              <h3 className="text-lg font-semibold">{planTitle}</h3>
              <p className="text-sm text-gray-300">{planSummary}</p>
            </header>
            {planSteps.length > 0 ? (
              <ol className="space-y-2">
                {planSteps.map((step, index) => {
                  const stepTitle = sanitizeText(
                    step.title ?? step.description ?? step.detail,
                    `Step ${index + 1}`
                  );
                  const description = sanitizeText(
                    step.description ?? step.detail,
                    "Awaiting step details…"
                  );
                  const stepStatus = sanitizeText(step.status, "pending");

                  return (
                    <li
                      key={step.id}
                      className="bg-slate-900 rounded p-3 border border-slate-700"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-blue-300">
                          {index + 1}.
                        </span>
                        <span className="font-medium">{stepTitle}</span>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">{description}</p>
                      <span className="text-xs text-gray-400">Status: {stepStatus}</span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-gray-400">{EMPTY_PLAN_PLACEHOLDERS.steps}</p>
            )}
          </div>
        ) : null}

        <div className="bg-slate-800 rounded p-6 border border-slate-700 mb-6">
          <h2 className="text-xl font-bold mb-4">Tasks</h2>
          {tasks.length > 0 ? (
            <ul className="space-y-2">
              {tasks.map((task) => {
                const taskLabel = sanitizeText(
                  task.label ?? task.name ?? task.description,
                  "Unnamed task"
                );
                const taskStatus = sanitizeText(task.status, "pending");
                const taskMeta = [
                  task.tool,
                  task.priority !== undefined ? `Priority ${task.priority}` : null,
                  task.estimated_time !== undefined
                    ? `~${task.estimated_time}s`
                    : null,
                ].filter(Boolean);

                return (
                  <li
                    key={task.id}
                    className="bg-slate-900 rounded p-3 border border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {statusIcon(task.status)}
                      <div>
                        <div className="font-medium">{taskLabel}</div>
                        {taskMeta.length > 0 ? (
                          <div className="text-xs text-gray-400">
                            {taskMeta.join(" • ")}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {task.cost_estimate !== undefined
                        ? `${task.cost_estimate} tokens`
                        : ""}
                      <span className="ml-2">Status: {taskStatus}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">{EMPTY_TASKS_PLACEHOLDER}</p>
          )}
        </div>

        {events.length > 0 ? (
          <div className="bg-slate-800 rounded p-6 border border-slate-700 mb-6">
            <h2 className="text-xl font-bold mb-4">Live Events</h2>
            <div className="space-y-1 max-h-64 overflow-auto">
              {events.map((event, index) => (
                <pre
                  key={index}
                  className="text-xs text-gray-300 font-mono bg-slate-900 p-2 rounded"
                >
                  {JSON.stringify(event, null, 2)}
                </pre>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Agent Orchestration System v3.0</p>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
