export type AgentRole = "coordinator" | "coder" | "analyst" | "reviewer";
export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface AgentContext {
  sessionId: string;
  messages: Message[];
  memory: Record<string, any>;
  tools: string[];
}

export interface Task {
  id: string;
  type: string;
  description: string;
  assignedTo: AgentRole;
  dependencies: string[];
  status: TaskStatus;
  result?: any;
  error?: string;
  retries: number;
  startedAt?: number;
  completedAt?: number;
}

export interface ExecutionPlan {
  id: string;
  goal: string;
  tasks: Task[];
  createdAt: number;
}
