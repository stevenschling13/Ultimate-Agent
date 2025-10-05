export interface Task {
  id: string;
  description: string;
  status?: string;
  [key: string]: unknown;
}

export interface Plan {
  tasks: Task[];
}

export interface PlanParsingOptions {
  fallbackTask?: Partial<Task>;
}

function extractJsonCandidate(raw: string): string | null {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return fenceMatch[1];
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

function parseJsonSafe(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeTask(raw: unknown, index: number): Task | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const descriptionCandidate =
    typeof data.description === "string"
      ? data.description
      : typeof data.summary === "string"
      ? data.summary
      : typeof data.task === "string"
      ? data.task
      : "";

  const description = descriptionCandidate.trim();
  if (!description) {
    return null;
  }

  const idCandidate =
    typeof data.id === "string" && data.id.trim().length > 0
      ? data.id.trim()
      : `task-${index + 1}`;

  const normalizedTask: Task = {
    ...data,
    id: idCandidate,
    description,
  };

  return normalizedTask;
}

function buildFallbackTask(fallback?: Partial<Task>): Task {
  const fallbackDescription = fallback?.description;
  const trimmedDescription =
    typeof fallbackDescription === "string" ? fallbackDescription.trim() : "";
  const fallbackId = fallback?.id;
  const normalizedId =
    typeof fallbackId === "string" && fallbackId.trim().length > 0
      ? fallbackId.trim()
      : fallbackId != null
      ? String(fallbackId)
      : "";

  return {
    ...fallback,
    id: normalizedId || "fallback-task",
    description:
      trimmedDescription && trimmedDescription.length > 0
        ? trimmedDescription
        : "Analyze the request and outline the immediate next step.",
  } satisfies Task;
}

export class CoordinatorAgent {
  constructor(private readonly options: PlanParsingOptions = {}) {}

  plan(rawResponse: string): Plan {
    const candidate = extractJsonCandidate(rawResponse ?? "");
    if (candidate) {
      const parsed = parseJsonSafe(candidate);
      if (
        parsed &&
        typeof parsed === "object" &&
        "tasks" in (parsed as Record<string, unknown>)
      ) {
        const { tasks } = parsed as { tasks?: unknown };
        if (Array.isArray(tasks) && tasks.length > 0) {
          const normalized = tasks
            .map((task, index) => normalizeTask(task, index))
            .filter((task): task is Task => Boolean(task));

          if (normalized.length > 0) {
            return { tasks: normalized };
          }
        }
      }
    }

    return { tasks: [buildFallbackTask(this.options.fallbackTask)] };
  }
}

export default CoordinatorAgent;
