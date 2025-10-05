# Agent Orchestration System v3.0

An end-to-end example of an agent orchestration stack featuring:

- A TypeScript/Node.js backend that plans, executes, and monitors multi-step OpenAI workflows with retries and structured outputs
- A React dashboard that streams execution progress over Server-Sent Events
- Turnkey Docker images and a `docker-compose` stack for production-style deployment

## Repository layout

```
agent-orchestrator/           # Node.js backend service
  src/                       # Planner, executor, tools, and Express server
  web/                       # React dashboard (Vite)
```

## Prerequisites

- Node.js 20+
- npm 9+
- An OpenAI API key with access to the configured model (`OPENAI_MODEL`, default `gpt-5`)
- Docker 24+ (for containerized deployment)

## Backend configuration

Copy the provided environment template and fill in your credentials:

```bash
cp agent-orchestrator/.env.example agent-orchestrator/.env
# Edit agent-orchestrator/.env to set OPENAI_API_KEY and optional OPENAI_MODEL/PORT
```

The backend refuses to start without `OPENAI_API_KEY`.

## Local development

### Backend

```bash
cd agent-orchestrator
npm install
npm run dev
```

The dev server listens on `http://localhost:8080` and exposes:

- `POST /api/execute` for synchronous execution
- `GET /api/execute/stream` for streaming progress updates (SSE)
- `GET /health` for readiness checks

### Frontend dashboard

```bash
cd agent-orchestrator/web
npm install
npm run dev
```

The dashboard launches on Vite's default port (`5173`). It proxies `/api/*` requests to the backend (configure via `vite.config.ts` if you customize ports).

## Testing

The backend includes a Vitest suite that validates planner behavior and dependency graph handling:

```bash
cd agent-orchestrator
npm test
```

## Production builds

To produce optimized builds without Docker:

```bash
# Backend
cd agent-orchestrator
npm install
npm run build

# Frontend
cd agent-orchestrator/web
npm install
npm run build
```

- Backend artifacts land in `agent-orchestrator/dist` (start with `npm run start`).
- Frontend static files are emitted to `agent-orchestrator/web/dist`.

## Containerized deployment

The repository ships with Dockerfiles for both services and a `docker-compose.yml` that wires them together.

### Build images individually

```bash
# Backend image
docker build -t agent-orchestrator-backend ./agent-orchestrator

# Frontend image
docker build -t agent-orchestrator-frontend ./agent-orchestrator/web
```

### Launch with Docker Compose

```bash
# Export your OpenAI API key for compose substitution
export OPENAI_API_KEY=sk-your-key
# Optional: export OPENAI_MODEL if you want something other than gpt-5
# export OPENAI_MODEL=gpt-4.1

docker compose up --build
```

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:4173`

The Nginx container proxies `/api/*` requests to the backend and keeps SSE streaming unbuffered for live progress updates.

### Shutting down

```bash
docker compose down
```

## Operational notes

- The backend writes generated artifacts to `out/` (ignored by git).
- Token usage metrics accumulate via the in-memory `Metrics` helper; integrate with your observability stack as needed.
- Update `OPENAI_MODEL` to control which model the orchestration pipeline uses at runtime.

## Troubleshooting

- **Dependency installation fails with 403** — Ensure your network can reach `registry.npmjs.org`. Corporate proxies may require configuring npm's proxy settings (`npm config set proxy ...`).
- **SSE stream appears stalled** — Confirm that your deployment preserves streaming (e.g., disable reverse-proxy buffering). The provided Nginx config already disables buffering on `/api` routes.
- **OpenAI errors** — The executor retries transient 5xx/429 failures up to four times with exponential backoff; persistent errors bubble up through the SSE stream.

## License

MIT
