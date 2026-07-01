# Phase 10 Roadmap: Docker Registry Manager Specification

---

## 1. Objectives & Scopes
- **Goal**: Enable developers to configure registry provider credentials, discover repositories, read tag details, view manifest layer hashes, and pull/push layers.
- **Scope**: Includes provider lists, credentials forms, search fields, tag detail tables, manifest overlay panels, and Dockerode background pull/push task stream polling logs.

---

## 2. API Endpoints Mounted (v1)
- `GET /api/v1/registry/providers` - Fetch list of registry providers.
- `POST /api/v1/registry/login` - Store credentials in-memory.
- `POST /api/v1/registry/logout/:providerId` - Clear session auth cache.
- `GET /api/v1/registry/auth/:providerId` - Check authentication.
- `POST /api/v1/registry/search` - Search catalog repositories.
- `GET /api/v1/registry/tags` - List repository tags.
- `GET /api/v1/registry/manifest` - Inspect tag layer manifest.
- `POST /api/v1/registry/pull` - Spawn background image pull task.
- `POST /api/v1/registry/push` - Spawn background image push task.
- `GET /api/v1/registry/operation/:operationId` - Poll active execution status.
- `GET /api/v1/registry/ratelimit` - Fetch rate limit stats.
- `GET /api/v1/registry/health` - Check provider health status.
