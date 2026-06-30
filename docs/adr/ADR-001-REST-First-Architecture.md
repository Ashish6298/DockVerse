# Architecture Decision Record (ADR) - 001: REST-First Architecture Strategy

## Status
Approved

## Context
DockVerse is a local-first workspace platform centered around Docker Engine, serving as an IDE-like tool for individual developers on their local machines. 

Earlier architectures considered using Socket.IO (WebSockets) to establish a persistent bidirectional connection. However:
- A persistent duplex connection is unnecessary for simple dashboard telemetry and container state summaries.
- Socket.IO adds substantial dependencies, setup complexities (e.g. heartbeat tracking, namespace configurations, CORS complexities for sockets), and risk of memory leaks.
- DockVerse acts as a local console, where polling REST endpoints is extremely performant and reliable.

## Decision
We will completely exclude WebSockets / Socket.IO from Phase 1 through Phase 10. Communication between the frontend React application and the backend Node.js API will be REST-only.

- **Caching & Query Orchestration**: Managed by TanStack Query on the frontend.
- **Resource Telemetry**: Driven by optional periodic polling configured under `APP_CONFIG.REST_POLLING_INTERVAL_MS` (default 5 seconds).
- **Fallback / Reconnection**: Fully handled by React Query's built-in offline failover mechanisms.

Real-time WebSocket protocol support will only be evaluated and introduced in the future if true bidirectional stream processing (such as interactive terminal sessions or live streaming containers events) requires it.

## Consequences
- **Code Cleanliness**: Deleted over 100 lines of setup code and socket listeners across the workspaces.
- **Improved Performance**: Reduced initial connection handshakes, memory overhead, and eliminated socket-related memory leaks.
- **Simpler Security**: Standardized CORS rules on HTTP paths only.
