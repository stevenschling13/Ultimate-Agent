import React, { useState } from "react";
import { Play, RefreshCw, CheckCircle, XCircle, Clock, Cpu, GitBranch, Activity, Zap, Database } from "lucide-react";
import { connectSSE } from "../lib/sse";

const sampleGoal = { id: `goal_${Date.now()}`, title: "Build REST API Client", description: "Create a Python REST API client with auth, retry, and errors", constraints: { language: "python", style: "async", dependencies: ["aiohttp", "pydantic"] }, success_criteria: ["Implements async HTTP methods","Has authentication support","Includes retry mechanism","Proper error handling","Type hints throughout"] } as const;

const fmt = (n: number) => Number.isFinite(n) ? n.toFixed(1) : "-";

export default function AgentDashboard() {
  const [selectedStrategy, setSelectedStrategy] = useState("parallel_optimize");
  const [isExecuting, setIsExecuting] = useState(false);
  const [exec, setExec] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  async function execute() {
    setIsExecuting(true); setEvents([]);
    const url = `/api/execute/stream?strategy=${encodeURIComponent(selectedStrategy)}&goal=${encodeURIComponent(JSON.stringify(sampleGoal))}`;
    const es = connectSSE(url, (ev) => {
      if (ev.type === "error") {
        setIsExecuting(false);
        es.close();
        return;
      }

      let data: any = null;
      try {
        data = ev.data ? JSON.parse(ev.data) : null;
      } catch (error) {
        console.error("Failed to parse SSE payload", error);
        return;
      }

      if (ev.type === "done") {
        setExec(data);
        setIsExecuting(false);
        es.close();
        return;
      }

      if (ev.type === "progress") {
        setEvents(prev => [data, ...prev].slice(0, 200));
        return;
      }

      setExec(data);
    });
  }

  const icon = (s: string) => s==="completed"? <CheckCircle className="w-5 h-5"/> : s==="running"? <Activity className="w-5 h-5 animate-spin"/> : s==="failed"? <XCircle className="w-5 h-5"/> : <Clock className="w-5 h-5"/>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-3xl font-bold">Agent Orchestration System</h1><p className="text-gray-400 text-sm">OpenAI Responses • Streaming • Structured Outputs</p></div>
          <div className="flex items-center gap-3"><Zap className="w-6 h-6"/><Cpu className="w-6 h-6"/></div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded p-4 border border-slate-700"><div className="text-sm text-gray-400">Tokens Used</div><div className="text-2xl font-bold flex items-center gap-2"><Database className="w-5 h-5" />{exec?.tokensUsed ?? 0}</div></div>
          <div className="bg-slate-800 rounded p-4 border border-slate-700"><div className="text-sm text-gray-400">Time (s)</div><div className="text-2xl font-bold">{fmt(exec?.executionTime ?? 0)}</div></div>
          <div className="bg-slate-800 rounded p-4 border border-slate-700"><div className="text-sm text-gray-400">Tasks</div><div className="text-2xl font-bold">{exec?.tasks?.length ?? 0}</div></div>
          <div className="bg-slate-800 rounded p-4 border border-slate-700"><div className="text-sm text-gray-400">Status</div><div className="text-2xl font-bold">{exec?.status ?? "-"}</div></div>
        </div>

        <div className="bg-slate-800 rounded p-6 border border-slate-700 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Cpu className="w-5 h-5"/>Execution Control</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded p-3 border border-slate-600">
              <div className="text-sm">
                <div className="font-semibold text-blue-400 mb-1">{sampleGoal.title}</div>
                <div className="text-gray-400 text-xs mb-2">{sampleGoal.description}</div>
                <div className="flex flex-wrap gap-1">{sampleGoal.success_criteria.slice(0,3).map((c: string, i: number)=>(<span key={i} className="px-2 py-1 bg-slate-800 rounded text-xs">{c}</span>))}</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Planning Strategy</label>
              <select value={selectedStrategy} onChange={(e)=>setSelectedStrategy(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 mb-4" disabled={isExecuting}>
                <option value="simple">Simple Sequential</option>
                <option value="parallel_optimize">Parallel Optimized</option>
                <option value="resource_aware">Resource Aware</option>
                <option value="cost_optimize">Cost Optimized</option>
              </select>
              <button onClick={execute} disabled={isExecuting} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg py-3 font-semibold flex items-center justify-center gap-2">{isExecuting ? (<><RefreshCw className="w-5 h-5 animate-spin"/>Executing</>) : (<><Play className="w-5 h-5"/>Execute Goal</>)}</button>
            </div>
          </div>
        </div>

        {exec && (
          <div className="bg-slate-800 rounded p-6 border border-slate-700 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><GitBranch className="w-5 h-5"/>Current Execution: {exec.goal.title}</h2>
            <div className="text-sm text-gray-400 mb-2">Strategy: {exec.plan.strategy} • Parallelism: {exec.plan.parallelism}x</div>
            <div className="space-y-2">{exec.tasks.map((t: any)=>(<div key={t.id} className="bg-slate-900 rounded p-3 border border-slate-700 flex items-center justify-between"><div className="flex items-center gap-3">{icon(t.status)}<div><div className="font-medium">{t.name}</div><div className="text-xs text-gray-400">{t.tool} • Priority {t.priority} • ~{t.estimated_time}s</div></div></div><div className="text-right text-xs text-gray-400">{t.cost_estimate} tokens</div></div>))}</div>
          </div>
        )}

        {events.length>0 && (
          <div className="bg-slate-800 rounded p-6 border border-slate-700 mb-6">
            <h2 className="text-xl font-bold mb-4">Live events</h2>
            <div className="space-y-1 max-h-64 overflow-auto">
              {events.map((e,i)=>(<div key={i} className="text-xs text-gray-300 font-mono truncate">{JSON.stringify(e)}</div>))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm"><p>Complete Agent System v3.0 • OpenAI Responses • Streaming • Structured Outputs</p></div>
      </div>
    </div>
  );
}
