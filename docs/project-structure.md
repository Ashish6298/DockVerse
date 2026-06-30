# DockVerse Project Structure

DockVerse uses a monorepo workspace to enforce separation of concerns and maintain package boundaries.

```text
dockverse/
├── apps/
│   ├── api/             # Express API application
│   │   └── src/
│   │       ├── config/        # Server configuration loader
│   │       ├── controllers/   # Route handler controllers
│   │       ├── docker/        # Docker service layer
│   │       ├── middleware/    # Global handlers (CORS, errors, logging)
│   │       ├── routes/        # Router mounting api/v1 paths
│   │       ├── utils/         # Backend-specific helpers
│   │       └── server.ts      # Server bootstrap script
│   └── web/             # React SPA web application
│       └── src/
│           ├── app/           # App root and entry providers
│           ├── api/           # TanStack Query client & REST calls
│           ├── components/    # Reusable dashboard, status, layout components
│           ├── pages/         # Page components (Dashboard)
│           ├── store/         # Zustand state stores
├── packages/            # Shareable monorepo packages
│   ├── config/          # Environment variable validation schema via Zod
│   ├── docker-client/   # Dockerode client initialization
│   ├── types/           # Shared types (API responses, DockerInfo)
│   └── utils/           # Shared utility functions (byte conversion)
├── docs/                # Architecture, API and setup documentation
├── tests/               # Standalone test placeholder
├── scripts/             # Development and deployment scripts placeholder
├── examples/            # Example files and templates
└── package.json         # Workspace package manifest definition
```
