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
