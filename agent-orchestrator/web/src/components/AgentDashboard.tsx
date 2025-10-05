import { useMemo } from 'react';

type Agent = {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'error';
  progress: number;
  lastRun: string;
  description: string;
};

type LogEntry = {
  id: string;
  agentId: string;
  message: string;
  timestamp: string;
};

const agentPalette: Record<Agent['status'], string> = {
  idle: 'bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-400/30',
  running: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-400/30',
  error: 'bg-rose-500/20 text-rose-300 ring-1 ring-inset ring-rose-400/30'
};

const statusLabel: Record<Agent['status'], string> = {
  idle: 'Idle',
  running: 'Running',
  error: 'Needs Attention'
};

const agents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Research Synthesizer',
    status: 'running',
    progress: 72,
    lastRun: '2m ago',
    description: 'Aggregates multi-source research into concise briefs.'
  },
  {
    id: 'agent-2',
    name: 'Ops Coordinator',
    status: 'idle',
    progress: 0,
    lastRun: '12m ago',
    description: 'Queues follow-up tasks and routes them to the correct agents.'
  },
  {
    id: 'agent-3',
    name: 'Incident Triage',
    status: 'error',
    progress: 18,
    lastRun: 'Just now',
    description: 'Monitors execution logs for anomalies requiring escalation.'
  }
];

const logs: LogEntry[] = [
  {
    id: 'log-1',
    agentId: 'agent-1',
    message: 'Pulled 4 new sources from partner knowledge base.',
    timestamp: '09:21'
  },
  {
    id: 'log-2',
    agentId: 'agent-3',
    message: 'Alert acknowledged. Investigating elevated error rate.',
    timestamp: '09:18'
  },
  {
    id: 'log-3',
    agentId: 'agent-2',
    message: 'Reprioritized backlog based on stakeholder updates.',
    timestamp: '09:10'
  }
];

const AgentDashboard = () => {
  const metrics = useMemo(
    () => [
      { label: 'Active agents', value: '7', trend: '+2.3%' },
      { label: 'Tasks processed (24h)', value: '486', trend: '+11.8%' },
      { label: 'Incidents resolved', value: '32', trend: '+4.6%' }
    ],
    []
  );

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
      <section className="col-span-full grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-white/5 bg-panel/70 p-6 backdrop-blur transition hover:border-accent/70 hover:shadow-lg hover:shadow-accent/10"
          >
            <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
              {metric.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-white">{metric.value}</p>
            <p className="mt-2 text-sm text-emerald-300">{metric.trend} vs. last week</p>
          </article>
        ))}
      </section>

      <section className="col-span-full rounded-2xl border border-white/5 bg-panel/70 p-6 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Agent activity</h2>
          <button className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-medium text-accent ring-1 ring-inset ring-accent/50 transition hover:bg-accent/30">
            Refresh
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <article
              key={agent.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-slate-900/60 p-5 shadow-inner shadow-black/30"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{agent.description}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${agentPalette[agent.status]}`}>
                  {statusLabel[agent.status]}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-accent"
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  {agent.progress}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-400">
                <p>Updated {agent.lastRun}</p>
                <button className="text-accent transition hover:text-accent/80">View logs</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/5 bg-panel/70 p-6 backdrop-blur">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Latest events</h2>
          <span className="text-xs uppercase tracking-wide text-slate-400">Live feed</span>
        </header>
        <ul className="mt-6 space-y-4">
          {logs.map((log) => (
            <li
              key={log.id}
              className="rounded-xl border border-white/5 bg-slate-900/60 p-4 shadow-inner shadow-black/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-300">{log.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                    {agents.find((agent) => agent.id === log.agentId)?.name ?? 'Unknown agent'}
                  </p>
                </div>
                <span className="text-xs text-slate-500">{log.timestamp}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AgentDashboard;
