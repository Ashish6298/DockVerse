# DockVerse — Phase 1 Connection Dashboard

DockVerse is a professional developer workspace centered around Docker, designed to look and feel like an IDE (similar to VS Code). It acts as a central hub for containerized application development.

Phase 1 establishes a production-quality connection dashboard showing real-time system details from the Docker Engine, gracefully handling offline/disconnected daemon states.

## Monorepo Project Architecture

The workspace utilizes npm Workspaces to share code cleanly between the frontend React application, Node/Express API server, and internal configurations:

```text
dockverse/
├── apps/
│   ├── web/           # React + TS + Vite + Tailwind CSS + Zustand + TanStack Query
│   └── api/           # Node.js + TS + Express + Dockerode + Socket.IO + Pino
├── packages/
│   ├── types/         # Shared TypeScript interfaces (DockerInfo, ApiResponse, etc.)
│   ├── utils/         # Helper functions (memory size formatting, durations)
│   ├── config/        # Environment variable schemas and validation via Zod
│   └── docker-client/ # Pluggable Dockerode client instance creator
├── README.md
└── .env.example
```

## Getting Started

### Prerequisites
- Node.js (v20+ or v24+)
- npm (v10+ or v11+)
- Docker Engine / Docker Desktop (optional, app remains functional when offline)

### Installation
1. Install monorepo dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Copy the environment file template:
   ```bash
   cp .env.example .env
   ```
3. Compile all packages:
   ```bash
   npm run build
   ```

### Running the Application
To run both the backend API and the frontend client concurrently:
```bash
npm run dev
```

Alternatively, you can run them individually:
- Run API: `npm run dev --workspace=@dockverse/api`
- Run Web: `npm run dev --workspace=@dockverse/web`

## REST API Documentation

All API responses strictly follow a unified format:

### Success Schema
```json
{
  "success": true,
  "timestamp": "2026-06-30T12:00:00.000Z",
  "message": "Retrieval success",
  "data": { ... }
}
```

### Error Schema
```json
{
  "success": false,
  "timestamp": "2026-06-30T12:00:00.000Z",
  "message": "Error description",
  "error": "Stack trace (development mode only)"
}
```

### Endpoints
- `GET /api/v1/health` - Check health status of API and Docker connection.
- `GET /api/v1/docker/status` - Return if Docker is `'connected'` or `'disconnected'`.
- `GET /api/v1/docker/dashboard` - Return complete statistics summary for dashboard cards.
- `GET /api/v1/docker/version` - Return Docker version and API version details.
- `GET /api/v1/docker/info` - Return full raw Dockerode system information.

## Communication Strategy & Polling
- **Communication Protocol**: REST APIs are used for all frontend-backend interactions. WebSockets are intentionally excluded from Phase 1 through Phase 10 because they are unnecessary for the current product goals. Bidirectional communication will only be evaluated in the future if interactive terminal sessions or streaming features require it.
- **State Management & Caching**: TanStack Query serves as the single source of truth for server state.
- **Telemetry Polling**: Option-based periodic queries (e.g. every 5 seconds) keep dashboard cards updated without UI lag or manual actions.
- **Manual Actions**: The Refresh button triggers immediate REST refetches.

## Future Roadmap (Phase 2+)
- **Workspace Manager**: Create and manage groups of Docker resources.
- **Container Studio**: Edit, run, and review Dockerfiles and compose setups.
- **Docker Doctor**: Container audits and issue diagnostics.
- **Monitoring & telemetry**: Periodic resource monitoring for CPU, RAM, Network, and Disk.
