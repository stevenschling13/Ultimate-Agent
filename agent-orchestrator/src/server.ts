import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config, logConfig } from './config/env.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = config.port;

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    openaiConfigured: !!config.openaiApiKey 
  });
});

app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
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
    ]
  });
});

app.get('/api/logs', (req, res) => {
  res.json({
    logs: [
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
    ]
  });
});

app.get('/api/metrics', (req, res) => {
  res.json({
    metrics: [
      { label: 'Active agents', value: '7', trend: '+2.3%' },
      { label: 'Tasks processed (24h)', value: '486', trend: '+11.8%' },
      { label: 'Incidents resolved', value: '32', trend: '+4.6%' }
    ]
  });
});

if (config.nodeEnv === 'production') {
  app.use(express.static(join(__dirname, '../web/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../web/dist/index.html'));
  });
}

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  logConfig();
});
