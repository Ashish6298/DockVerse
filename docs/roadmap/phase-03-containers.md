# Phase 3 Roadmap: Container Manager Specification

---

## 1. Objectives & Scopes
- **Goal**: Enable developers to view, inspect, start, stop, restart, pause, unpause, kill, remove, and rename Docker containers running on the local daemon through versioned REST APIs.
- **Scope**: Includes creation forms, container detail drawers, resource inspection parameters, and simulated live logging streams via periodic query polling.

---

## 2. API Endpoints Mounted (v1)
- `GET /api/v1/containers` - List all containers.
- `GET /api/v1/containers/:id` - Inspect container details.
- `POST /api/v1/containers` - Create container.
- `POST /api/v1/containers/:id/start` - Start container.
- `POST /api/v1/containers/:id/stop` - Stop container.
- `POST /api/v1/containers/:id/restart` - Restart container.
- `POST /api/v1/containers/:id/pause` - Pause container.
- `POST /api/v1/containers/:id/unpause` - Unpause container.
- `POST /api/v1/containers/:id/kill` - Kill container.
- `DELETE /api/v1/containers/:id` - Delete container.
- `POST /api/v1/containers/:id/rename` - Rename container.
- `GET /api/v1/containers/:id/logs` - Retrieve container logs.
