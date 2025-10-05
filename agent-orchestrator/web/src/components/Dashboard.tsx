import React, { useState } from "react";
import { Brain, Zap, Activity, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface TimelineEvent {
  type: string;
  data: any;
}

const statusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case "running":
      return <Activity className="w-4 h-4 text-blue-400 animate-spin" />;
    case "failed":
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

export default function Dashboard() {
  const [goal, setGoal] = useState("Build a Python REST API client");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  async function execute() {
    setRunning(true);
    setEvents([]);
    const es = new EventSource(`/api/execute/stream?goal=${encodeURIComponent(goal)}`);

    const pushEvent = (type: string) => (event: MessageEvent) => {
      try {
        const data = event.data ? JSON.parse(event.data) : null;
        setEvents((prev) => [...prev, { type, data }]);
      } catch (error) {
        console.error("Failed to parse event", error);
      }
    };

    es.addEventListener("start", pushEvent("start"));
    es.addEventListener("task_start", pushEvent("task_start"));
    es.addEventListener("task_done", pushEvent("task_done"));
    es.addEventListener("task_retry", pushEvent("task_retry"));
    es.addEventListener("task_failed", pushEvent("task_failed"));

    es.addEventListener("done", () => {
      es.close();
      setRunning(false);
      fetch("/api/metrics")
        .then((response) => response.json())
        .then(setMetrics)
        .catch((error) => console.error("Failed to fetch metrics", error));
    });

    es.addEventListener("error", () => {
      es.close();
      setRunning(false);
    });
  }

  const coderLatency = metrics?.histograms?.["agent.coder.latency"]?.mean;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Agent Platform
            </h1>
          </div>
          <p className="text-gray-400">Multi-agent orchestration with ReAct reasoning</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Tasks Done</div>
            <div className="text-3xl font-bold">{metrics?.counters?.["tasks.completed"] ?? 0}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Tokens</div>
            <div className="text-3xl font-bold">{metrics?.counters?.["tokens.total"] ?? 0}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-gray-400">Avg Latency</div>
            <div className="text-3xl font-bold">
              {typeof coderLatency === "number" ? `${Math.round(coderLatency)}ms` : "-"}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />Execute
          </h2>
          <input
            type="text"
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-3 mb-4 focus:outline-none focus:border-purple-500"
            disabled={running}
          />
          <button
            onClick={execute}
            disabled={running}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg py-3 font-semibold"
          >
            {running ? "Executing..." : "Execute"}
          </button>
        </div>

        {events.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Timeline</h2>
            <div className="space-y-3 max-h-96 overflow-auto">
              {events.map((event, index) => (
                <div key={index} className="bg-slate-900/50 rounded p-3 border border-slate-700">
                  <div className="flex items-center gap-2">
                    {statusIcon(event.data?.task?.status ?? "pending")}
                    <span className="font-medium text-sm">
                      {event.type === "start"
                        ? "Plan Created"
                        : event.type === "task_start"
                        ? `Started: ${event.data?.task?.description ?? "Unknown task"}`
                        : event.type === "task_done"
                        ? `Done: ${event.data?.task?.description ?? "Unknown task"}`
                        : event.type === "task_retry"
                        ? `Retry: ${event.data?.task?.description ?? "Unknown task"}`
                        : event.type === "task_failed"
                        ? `Failed: ${event.data?.task?.description ?? "Unknown task"}`
                        : event.type}
                    </span>
                  </div>
                  {event.data?.task?.assignedTo && (
                    <div className="text-xs text-gray-400 ml-6">
                      Agent: {event.data.task.assignedTo}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
