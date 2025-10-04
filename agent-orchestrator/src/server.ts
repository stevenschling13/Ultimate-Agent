import express from "express";
import cors from "cors";
import { AdvancedPlanner } from "./orchestrator/planner";
import { Executor } from "./orchestrator/executor";
import { Goal } from "./types";
import { log } from "./observability/logger";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const planner = new AdvancedPlanner();

app.post("/api/execute", async (req, res) => {
  try {
    const { goal, strategy } = req.body as { goal: Goal; strategy?: string };
    const executor = new Executor();
    const plan = planner.plan(goal, { token_budget: 50_000 }, strategy);
    const exec = await executor.run(plan, goal);
    res.json(exec);
  } catch (e: any) { res.status(400).json({ error: e?.message ?? String(e) }); }
});

app.get("/api/execute/stream", async (req, res) => {
  const goal: Goal = JSON.parse(String(req.query.goal ?? '{}'));
  const strategy = String(req.query.strategy ?? 'parallel_optimize');
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  const write = (event: string, data: any) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const executor = new Executor();
    const plan = planner.plan(goal, { token_budget: 50_000 }, strategy);
    const exec = await executor.run(plan, goal, (ev) => write("progress", ev));
    write("done", exec);
    res.end();
  } catch (e: any) {
    write("error", { message: e?.message ?? String(e) });
    res.end();
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 8080);
app.listen(port, () => log(`server on :${port}`));
