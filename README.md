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

## WebSocket Updates
- Namespace: `/docker`
- Event `docker:status`: Emitted periodically when status updates or on client requests.
- Event `docker:refresh`: Emitted by the client to trigger a full refresh of Docker metrics.

## Future Roadmap (Phase 2+)
- **Workspace Manager**: Create and manage groups of Docker resources.
- **Container Studio**: Edit, build, and run Dockerfiles and docker-compose files visually.
- **Docker Doctor**: AI-assisted container log auditing and issue diagnosing.
- **Monitoring & telemetry**: Real-time stats streams for CPU, RAM, Network, and Disk.
