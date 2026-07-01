# Phase 4 Roadmap: Image Manager Specification

---

## 1. Objectives & Scopes
- **Goal**: Enable developers to view, inspect, pull, delete, tag, and prune local Docker Engine images through versioned REST APIs.
- **Scope**: Includes image metadata, layer build history, tag management, download indicator states, and pruning operations.

---

## 2. API Endpoints Mounted (v1)
- `GET /api/v1/images` - List local Docker images.
- `GET /api/v1/images/:id` - Inspect image details.
- `POST /api/v1/images/pull` - Pull image from registry.
- `POST /api/v1/images/prune` - Prune unused images.
- `DELETE /api/v1/images/:id` - Delete/remove image.
- `POST /api/v1/images/:id/tag` - Apply repository tag to image.
- `GET /api/v1/images/:id/history` - Fetch image layer history.
