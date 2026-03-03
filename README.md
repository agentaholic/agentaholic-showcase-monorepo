# Agentaholic Showcase Monorepo

A modern, event-sourced application built with [Encore.ts](https://encore.dev) and TypeScript on the back end.
Front end built as a React web application. This monorepo implements a
service-oriented architecture following CQRS and Event Sourcing principles.

## 🚀 Quick Start

### Automated Setup (macOS + Homebrew)

Run the automated setup script to configure your development environment:

```bash
./bin/setup.sh
```

This script ensures:

- Homebrew is installed
- a modern version of Git is installed by Homebrew
- Docker Desktop is installed and running
- direnv is installed
- The correct version of Postgres is installed
- Node Version Manager is installed
- the correct version of Node.js is installed
- Encore CLI is installed
- Node.js dependencies are installed
- Encore is authenticated
- The Encore app is linked
- Tests are executing and passing within your local dev environment

### Manual Setup

If you prefer manual setup, refer to the implementation of the setup script for details on what is involved in the setup process.

## 🏗️ Architecture

This application follows a **service-oriented architecture** with:

- **Event Sourcing**: All state changes are captured as immutable events
- **CQRS Pattern**: Separate models for reads and writes
- **Vertical Slicing**: Each service owns its UI, API, and database

Key architectural concepts:

- [Business-Agnostic Architecture](docs/BUSINESS_AGNOSTIC_ARCHITECTURE.md)
