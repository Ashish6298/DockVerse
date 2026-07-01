# Phase 5 Roadmap: Network Manager Specification

---

## 1. Objectives & Scopes
- **Goal**: Enable developers to view, inspect, create, delete, and prune virtual networks, as well as link/unlink containers to/from networks through versioned REST APIs.
- **Scope**: Supports bridge, host, overlay, and macvlan drivers, IPAM subnet configurations, gateway addresses, attachable/internal flags, and container link mapping.

---

## 2. API Endpoints Mounted (v1)
- `GET /api/v1/networks` - List virtual networks.
- `POST /api/v1/networks` - Create new network.
- `POST /api/v1/networks/prune` - Prune unused networks.
- `GET /api/v1/networks/:id` - Inspect network details.
- `DELETE /api/v1/networks/:id` - Remove/delete network.
- `POST /api/v1/networks/:id/connect` - Link container to network.
- `POST /api/v1/networks/:id/disconnect` - Unlink container from network.
