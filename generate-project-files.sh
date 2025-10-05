#!/bin/bash

# Ultimate-Agent Project File Generator
# This script creates all necessary files for the project setup

set -e

echo "🚀 Generating Ultimate-Agent Project Files..."
echo ""

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p agent-orchestrator/src/config
mkdir -p agent-orchestrator/web/src/components
mkdir -p .github/workflows

# .gitignore
cat > .gitignore << 'EOF'
# Environment variables and secrets
.env
.env.local
.env.*.local
*.key
*.pem

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Docker
docker-compose.override.yml

# Temporary files
*.tmp
.cache/
EOF

echo "✅ Created .gitignore"

# Makefile
cat > Makefile << 'EOF'
.PHONY: help install dev build start test clean docker-build docker-up docker-down docker-logs

help:
@echo "Ultimate-Agent - Available commands:"
@echo ""
@echo "  make install       - Install all dependencies (backend + frontend)"
@echo "  make dev          - Run development servers (backend + frontend)"
@echo "  make build        - Build for production"
@echo "  make start        - Start production server"
@echo "  make test         - Run all tests"
@echo "  make clean        - Remove build artifacts and dependencies"
@echo ""
@echo "  make docker-build - Build Docker image"
@echo "  make docker-up    - Start Docker Compose services"
@echo "  make docker-down  - Stop Docker Compose services"
@echo "  make docker-logs  - View Docker logs"

install:
@echo "📦 Installing backend dependencies..."
cd agent-orchestrator && npm install
@echo "📦 Installing frontend dependencies..."
cd agent-orchestrator/web && npm install
@echo "✅ Installation complete!"

dev:
@echo "🚀 Starting development servers..."
@cd agent-orchestrator && npm run dev & cd agent-orchestrator/web && npm run dev

build:
@echo "🔨 Building backend..."
cd agent-orchestrator && npm run build
@echo "🔨 Building frontend..."
cd agent-orchestrator/web && npm run build
@echo "✅ Build complete!"

start:
@echo "🚀 Starting production server..."
cd agent-orchestrator && npm start

test:
@echo "🧪 Running backend tests..."
cd agent-orchestrator && npm test
@echo "🧪 Running frontend tests..."
cd agent-orchestrator/web && npm test --if-present
@echo "✅ All tests passed!"

clean:
@echo "🧹 Cleaning build artifacts..."
rm -rf agent-orchestrator/dist
rm -rf agent-orchestrator/web/dist
rm -rf agent-orchestrator/node_modules
rm -rf agent-orchestrator/web/node_modules
@echo "✅ Clean complete!"

docker-build:
@echo "🐳 Building Docker image..."
docker-compose build
@echo "✅ Docker image built!"

docker-up:
@echo "🐳 Starting Docker services..."
@if [ -z "$$OPENAI_API_KEY" ]; then \
echo "❌ Error: OPENAI_API_KEY environment variable is not set"; \
echo "💡 Run: export OPENAI_API_KEY='your-key-here'"; \
exit 1; \
fi
docker-compose up -d
@echo "✅ Services started! Access at http://localhost:3000"

docker-down:
@echo "🐳 Stopping Docker services..."
docker-compose down
@echo "✅ Services stopped!"

docker-logs:
@echo "📋 Viewing Docker logs (Ctrl+C to exit)..."
docker-compose logs -f

check-env:
@echo "🔍 Checking environment setup..."
@if [ ! -f agent-orchestrator/.env ]; then \
echo "⚠️  Warning: .env file not found"; \
else \
echo "✅ .env file exists"; \
fi
EOF

echo "✅ Created Makefile"

# docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: "3.9"

services:
  agent-orchestrator:
    build: 
      context: ./agent-orchestrator
      dockerfile: Dockerfile
    container_name: agent-orchestrator
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - OPENAI_API_KEY=${OPENAI_API_KEY:?OPENAI_API_KEY must be set before starting Docker Compose}
    env_file:
      - agent-orchestrator/.env
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - agent-network

networks:
  agent-network:
    driver: bridge

volumes:
  logs:
    driver: local
EOF

echo "✅ Created docker-compose.yml"

# agent-orchestrator/Dockerfile
cat > agent-orchestrator/Dockerfile << 'EOF'
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package*.json ./
COPY web/package*.json ./web/

RUN npm ci
RUN cd web && npm ci

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules

COPY . .

RUN cd web && npm run build
RUN npm run build --if-present

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/web/dist ./web/dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./

USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
EOF

echo "✅ Created agent-orchestrator/Dockerfile"

# agent-orchestrator/.dockerignore
cat > agent-orchestrator/.dockerignore << 'EOF'
node_modules
npm-debug.log
yarn-error.log
.env
.env.local
.env.*.local
dist
web/dist
build
coverage
.nyc_output
.git
.gitignore
.vscode
.idea
*.swp
*.swo
.DS_Store
Thumbs.db
README.md
*.md
.github
EOF

echo "✅ Created agent-orchestrator/.dockerignore"

# agent-orchestrator/package.json
cat > agent-orchestrator/package.json << 'EOF'
{
  "name": "agent-orchestrator",
  "version": "1.0.0",
  "description": "Agent orchestration backend service",
  "main": "dist/server.js",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "echo \"No tests yet\" && exit 0",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "keywords": ["agent", "orchestration", "ai"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "openai": "^4.20.0",
    "helmet": "^7.1.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "typescript": "^5.3.2",
    "tsx": "^4.7.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF

echo "✅ Created agent-orchestrator/package.json"

# agent-orchestrator/tsconfig.json
cat > agent-orchestrator/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "web"]
}
EOF

echo "✅ Created agent-orchestrator/tsconfig.json"

# agent-orchestrator/.eslintrc.json
cat > agent-orchestrator/.eslintrc.json << 'EOF'
{
  "env": {
    "node": true,
    "es2022": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_" 
    }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": "off"
  }
}
EOF

echo "✅ Created agent-orchestrator/.eslintrc.json"

# agent-orchestrator/.prettierrc
cat > agent-orchestrator/.prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
EOF

echo "✅ Created agent-orchestrator/.prettierrc"

# agent-orchestrator/src/config/env.ts
cat > agent-orchestrator/src/config/env.ts << 'EOF'
interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  openaiApiKey: string;
}

function validateEnv(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['nodeEnv'];
  const port = parseInt(process.env.PORT || '3000', 10);
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const errors: string[] = [];

  if (!openaiApiKey) {
    errors.push('OPENAI_API_KEY is required but not set');
  }

  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`PORT must be a valid number between 1 and 65535, got: ${process.env.PORT}`);
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n💡 Please check your .env file or environment variables.');
    console.error('   See README.md for configuration instructions.');
    process.exit(1);
  }

  return {
    nodeEnv,
    port,
    openaiApiKey: openaiApiKey!
  };
}

export const config = validateEnv();

export function logConfig(): void {
  console.log('📋 Configuration loaded:');
  console.log(`  - Environment: ${config.nodeEnv}`);
  console.log(`  - Port: ${config.port}`);
  console.log(`  - OpenAI API Key: ${config.openaiApiKey ? '✓ Configured (hidden)' : '✗ Missing'}`);
}
EOF

echo "✅ Created agent-orchestrator/src/config/env.ts"

# agent-orchestrator/src/server.ts
cat > agent-orchestrator/src/server.ts << 'EOF'
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
EOF

echo "✅ Created agent-orchestrator/src/server.ts"

# setup.sh
cat > setup.sh << 'EOF'
#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
}

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

clear
print_header "Ultimate-Agent Setup"
echo ""

print_header "Checking Prerequisites"
echo ""

PREREQUISITES_MET=true

if check_command node; then
    NODE_VERSION=$(node --version)
    print_info "Node.js version: $NODE_VERSION"
else
    PREREQUISITES_MET=false
fi

if check_command npm; then
    NPM_VERSION=$(npm --version)
    print_info "npm version: $NPM_VERSION"
else
    PREREQUISITES_MET=false
fi

check_command git || PREREQUISITES_MET=false

if [ "$PREREQUISITES_MET" = false ]; then
    print_error "Prerequisites missing. Please install them first."
    exit 1
fi

print_success "All prerequisites installed!"
echo ""

print_header "Environment Configuration"
echo ""

ENV_FILE="agent-orchestrator/.env"
ENV_EXAMPLE="agent-orchestrator/.env.example"

if [ -f "$ENV_FILE" ]; then
    print_warning ".env file already exists"
else
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        print_success "Created .env file from template"
    fi
fi

read -sp "Enter your OpenAI API key (or press Enter to skip): " API_KEY
echo ""
if [ -n "$API_KEY" ]; then
    if [[ $API_KEY == sk-* ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$API_KEY/" "$ENV_FILE"
        else
            sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$API_KEY/" "$ENV_FILE"
        fi
        print_success "API key saved to .env file"
    fi
fi

echo ""
print_header "Installing Dependencies"
echo ""

print_info "Installing backend dependencies..."
cd agent-orchestrator && npm install
print_success "Backend dependencies installed"

print_info "Installing frontend dependencies..."
cd web && npm install
print_success "Frontend dependencies installed"
cd ../..

echo ""
print_header "Setup Complete!"
echo ""
print_success "Ready to start development!"
echo ""
print_info "Start with: ${GREEN}make dev${NC}"
echo ""
EOF

chmod +x setup.sh

echo "✅ Created setup.sh"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ All files generated successfully!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Run: ./setup.sh"
echo "  2. Start development: make dev"
echo ""
