import AgentDashboard from './components/AgentDashboard';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2 text-slate-100">
          <h1 className="text-4xl font-semibold tracking-tight">Agent Orchestrator</h1>
          <p className="max-w-2xl text-slate-300">
            Monitor the live status of autonomous agents, inspect their recent
            activity, and prioritize follow-up actions with confidence.
          </p>
        </header>
        <AgentDashboard />
      </div>
    </div>
  );
}

export default App;
