# Agent Orchestration System v3.0

Production-ready multi-agent orchestration with OpenAI GPT-4, real-time streaming, and a React dashboard.

## Prerequisites

- Node.js 20+
- OpenAI API key (GPT-4 access)
- Docker 24+ (optional)

## Quick Start

### Backend

```bash
cd agent-orchestrator
cp .env.example .env  # Add your OpenAI API key
npm install
npm run dev
```

### Frontend

```bash
cd agent-orchestrator/web
npm install
npm run dev
```

### Docker

```bash
export OPENAI_API_KEY="your-key"
docker compose up --build
```

## Architecture

- **Backend:** TypeScript/Express with OpenAI GPT-4 integration
- **Frontend:** React with Server-Sent Events streaming
- **Orchestration:** Multi-strategy task planning (parallel, sequential, cost-optimized)
- **Execution:** Topological dependency resolution with retry logic

## License

MIT
