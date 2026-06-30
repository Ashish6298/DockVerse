# DockVerse Development and Contribution Workflow

Follow these guidelines when contributing to the DockVerse workspace.

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Ensure Node.js (v20+) and npm are installed.
3. Install monorepo dependencies:
   ```bash
   npm install
   ```

## Development Commands

### 1. Build Shared Packages
Build all internal packages before launching applications:
```bash
npm run build -w @dockverse/types -w @dockverse/utils -w @dockverse/config -w @dockverse/docker-client
```

### 2. Start Servers Concurrently
Start dev servers:
- Start API: `npm run dev -w @dockverse/api`
- Start Web: `npm run dev -w @dockverse/web`

## Code Guidelines
- **Strict Typing**: Never use `any`. Specify type-only imports using `import type` when importing interfaces from packages.
- **Service Decoupling**: Docker interactions must reside inside `docker.service.ts`. Express controllers must remain thin.
- **Consistent Response Shapes**: Always use the defined `ApiResponse` envelope.
- **REST-First Protocol**: All communication is REST-based. Do not introduce Socket.IO or WebSockets. Polling is managed via TanStack Query refetch intervals.
- **Linting**: Run `npm run lint -w apps/web` to ensure clean syntax.
