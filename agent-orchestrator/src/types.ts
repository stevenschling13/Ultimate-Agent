export type UUID = string;

export type ToolName =
  | "openai.synthesize"
  | "openai.generate_tests"
  | "openai.validate"
  | "openai.generate_docs"
  | "openai.synthesize_complete"
  | "file.write";

export interface Goal {
  id: UUID;
  title: string;
  description: string;
  constraints: Record<string, unknown>;
  success_criteria: string[];
}

export interface TaskSpec {
  id: UUID;
  name: string;
  tool: ToolName;
  inputs: Record<string, unknown>;
  depends_on: UUID[];
  priority: number;
  estimated_time: number; // seconds
  cost_estimate: number;  // tokens
}

export interface Plan { strategy: string; parallelism: number; tasks: TaskSpec[]; }
export type TaskStatus = "pending" | "running" | "completed" | "failed";
export interface TaskRuntime extends TaskSpec { status: TaskStatus; result?: unknown; error?: string; }
export interface Execution { id: UUID; goal: Goal; plan: Plan; startTime: number; endTime?: number; executionTime?: number; tokensUsed: number; status: TaskStatus | "queued"; tasks: TaskRuntime[]; }
