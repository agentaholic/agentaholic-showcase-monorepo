#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ZSH is the default shell
if [[ "$SHELL" != *"zsh"* ]]; then
  echo -e "${RED}Error: This setup script only supports ZSH.${NC}"
  echo -e "${RED}Your current default shell is: $SHELL${NC}"
  echo -e "${RED}Please switch to ZSH before running this script.${NC}"
  exit 1
fi

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to print status messages
print_status() {
  echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}Warning:${NC} $1"
}

print_error() {
  echo -e "${RED}Error:${NC} $1"
}

# Check and install Homebrew if not present
if ! command_exists brew; then
  print_status "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  print_status "Homebrew is already installed"
fi

# Install Git
if ! command_exists git; then
  print_status "Installing Git..."
  brew install git
else
  # Check if Git is from Homebrew
  GIT_PATH=$(which git)
  if [[ "$GIT_PATH" != *"/opt/homebrew/"* && "$GIT_PATH" != *"/usr/local/"* ]]; then
    print_status "Installing Git from Homebrew..."
    brew install git
  else
    print_status "Git is already installed via Homebrew"
  fi
fi

# Install prerequisites using Homebrew
print_status "Installing prerequisites..."

# Install Docker
if ! command_exists docker; then
  print_status "Installing Docker..."
  brew install --cask docker
else
  print_status "Docker is already installed"
fi

# Install PostgreSQL
if ! command_exists psql; then
  print_status "Installing PostgreSQL..."
  brew install postgresql@16
  echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >>~/.zshrc
  export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
else
  print_status "PostgreSQL is already installed"
fi

# Install direnv
if ! command_exists direnv; then
  print_status "Installing direnv..."
  brew install direnv

  # Add direnv hook to shell config if not already present
  if ! grep -q 'direnv hook' ~/.zshrc; then
    echo 'eval "$(direnv hook zsh)"' >>~/.zshrc
    print_status "Added direnv hook to ~/.zshrc"
    eval "$(direnv hook bash)"
    print_status "Activated direnv hook for current session"
  fi
else
  print_status "direnv is already installed"
fi

# Install flock
if ! command_exists flock; then
  print_status "Installing flock..."
  brew install flock
else
  print_status "flock is already installed"
fi

# Install jq
if ! command_exists jq; then
  print_status "Installing jq..."
  brew install jq
else
  print_status "jq is already installed"
fi

# Install nvm (supports Homebrew or manual installs)
if ! brew list nvm >/dev/null 2>&1 && [ ! -s "$HOME/.nvm/nvm.sh" ]; then
  print_status "Installing Node Version Manager (nvm) with Homebrew..."
  brew install nvm
else
  print_status "nvm is already installed (brew or manual)"
fi

mkdir -p "$HOME/.nvm"

if ! grep -q 'NVM bootstrap' ~/.zshrc; then
  cat >>~/.zshrc <<'ZRC'
# NVM bootstrap (added by setup.sh)
export NVM_DIR="$HOME/.nvm"
if command -v brew >/dev/null 2>&1; then
  NVM_PREFIX="$(brew --prefix nvm 2>/dev/null || true)"
  [ -n "$NVM_PREFIX" ] && [ -s "$NVM_PREFIX/nvm.sh" ] && . "$NVM_PREFIX/nvm.sh"
  [ -n "$NVM_PREFIX" ] && [ -s "$NVM_PREFIX/etc/bash_completion.d/nvm" ] && . "$NVM_PREFIX/etc/bash_completion.d/nvm"
fi
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
ZRC
  print_status "Added NVM configuration to ~/.zshrc"
fi

# Load NVM for this session
NVM_PREFIX="$(brew --prefix nvm 2>/dev/null || true)"
if [ -n "$NVM_PREFIX" ] && [ -s "$NVM_PREFIX/nvm.sh" ]; then
  . "$NVM_PREFIX/nvm.sh"
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
else
  print_error "nvm not found. Please install nvm (brew or manual) and re-run."
  exit 1
fi

# Install Encore
if ! command_exists encore; then
  print_status "Installing Encore..."
  brew install encoredev/tap/encore
else
  print_status "Encore is already installed"
fi

# Setup Node using NVM
print_status "Setting up Node.js..."

# Load NVM (try brew first, fall back to manual installation)
NVM_PREFIX="$(brew --prefix nvm 2>/dev/null || true)"
if [ -n "$NVM_PREFIX" ] && [ -s "$NVM_PREFIX/nvm.sh" ]; then
  . "$NVM_PREFIX/nvm.sh"
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
else
  print_error "Could not find nvm.sh"
  exit 1
fi

nvm install
nvm use
nvm alias default "$(cat .nvmrc)"

# Check Docker daemon status
print_status "Checking Docker daemon status..."
if ! docker info >/dev/null 2>&1; then
  print_warning "Docker daemon is not running"
  print_status "Attempting to start Docker Desktop..."
  open -a Docker

  # Wait for Docker daemon to start (timeout after 60 seconds)
  print_status "Waiting for Docker daemon to start..."
  TIMEOUT=60
  while ! docker info >/dev/null 2>&1 && [ $TIMEOUT -gt 0 ]; do
    sleep 1
    TIMEOUT=$((TIMEOUT - 1))
  done

  if [ $TIMEOUT -eq 0 ]; then
    print_error "Timed out waiting for Docker daemon to start"
    print_error "Please start Docker Desktop manually and run this script again"
    exit 1
  fi
  print_status "Docker daemon is now running"
else
  print_status "Docker daemon is running"
fi

# Encore authentication
print_status "Please authenticate with Encore..."
if encore auth whoami | grep -q "not logged in."; then
  echo "Not logged into Encore. Initiating login process..."
  encore auth login
  sleep 5
else
  echo "Already logged into Encore. Skipping login step."
fi

# Install project dependencies
print_status "Installing project dependencies..."
npm install

# Install linearis CLI
if ! command_exists linearis; then
  print_status "Installing linearis CLI..."
  npm install -g https://github.com/L8D/linearis/releases/download/v2025.12.0/linearis-2025.12.0.tgz
else
  print_status "linearis CLI is already installed"
fi

# Link app with Encore
print_status "Linking app with Encore..."
if encore app link 2>&1 | grep -q "already linked"; then
  print_status "App is already linked to Encore"
else
  encore app link || true
fi

# Run tests to verify installation
print_status "Running tests to verify installation..."
npm test

print_status "${GREEN}Refresh your shell:${NC} source ~/.zshenv && source ~/.zshrc"
