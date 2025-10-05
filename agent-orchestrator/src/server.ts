import express from "express";
import cors from "cors";
import { CoordinatorAgent } from "./agents/coordinator";
import { Executor } from "./orchestrator/executor";
import { metrics } from "./observability/metrics";

const app = express();
app.use(cors());
app.use(express.json());

const coordinator = new CoordinatorAgent();
const executor = new Executor();

app.post("/api/execute", async (req, res) => {
  try {
    const { goal } = req.body ?? {};
    if (typeof goal !== "string" || goal.trim().length === 0) {
      res.status(400).json({ error: "goal is required" });
      return;
    }

    const sessionId = `s_${Date.now()}`;

    const plan = await coordinator.plan(goal, {
      sessionId,
      messages: [],
      memory: {},
      tools: [],
    });

    const result = await executor.run(plan, sessionId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error?.message ?? "Unknown error" });
  }
});

app.get("/api/execute/stream", async (req, res) => {
  const goal = typeof req.query.goal === "string" ? req.query.goal : "";
  if (goal.trim().length === 0) {
    res.status(400).json({ error: "goal query parameter is required" });
    return;
  }

  const sessionId = `s_${Date.now()}`;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  try {
    const plan = await coordinator.plan(goal, {
      sessionId,
      messages: [],
      memory: {},
      tools: [],
    });

    await executor.run(plan, sessionId, (event) => {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
    });

    res.end();
  } catch (error: any) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: error?.message ?? "Unknown error" })}\n\n`);
    res.end();
  }
});

app.get("/api/metrics", (_req, res) => {
  res.json(metrics.snapshot());
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`Agent system: ${port}`);
});
