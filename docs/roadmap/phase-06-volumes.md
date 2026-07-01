# Phase 6 Roadmap: Volume Manager Specification

---

## 1. Objectives & Scopes
- **Goal**: Enable developers to view, inspect, create, delete, and prune persistent volumes on the Docker daemon through versioned REST APIs.
- **Scope**: Supports driver type select, labels configuration, mount path visual mappings, usage size calculations, and confirmation gates.

---

## 2. API Endpoints Mounted (v1)
- `GET /api/v1/volumes` - List local persistent volumes.
- `POST /api/v1/volumes` - Create new volume.
- `POST /api/v1/volumes/prune` - Prune unused volumes.
- `GET /api/v1/volumes/:name` - Inspect volume details.
- `DELETE /api/v1/volumes/:name` - Remove volume.
