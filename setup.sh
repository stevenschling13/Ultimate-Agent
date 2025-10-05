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
