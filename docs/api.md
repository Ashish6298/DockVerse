# DockVerse REST API Documentation

All communication with the DockVerse API must follow versioned, uniform structures.

## REST Endpoints (v1)

### Base URL
`http://localhost:5000/api/v1`

### Consistent Payload Envelopes

#### Success Envelope
```json
{
  "success": true,
  "timestamp": "2026-06-30T17:00:00.000Z",
  "message": "Resource retrieved successfully",
  "data": {}
}
```

#### Error Envelope
```json
{
  "success": false,
  "timestamp": "2026-06-30T17:00:00.000Z",
  "message": "Error details here",
  "error": "Error stack trace (development mode only)"
}
```

### Route Definitions

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| **GET** | `/health` | API service health check | `200` |
| **GET** | `/docker/status` | Docker daemon connection status | `200` |
| **GET** | `/docker/dashboard` | Aggregated dashboard card telemetry | `200` (Connected), `503` (Offline) |
| **GET** | `/docker/version` | Docker Engine & API versions | `200` (Connected), `503` (Offline) |
| **GET** | `/docker/info` | Raw Dockerode system information | `200` (Connected), `503` (Offline) |
| **GET** | `/containers` | List all local Docker containers | `200` |
| **GET** | `/containers/:id` | Inspect specific container details | `200`, `404` |
| **POST** | `/containers` | Create a new Docker container | `201`, `400` |
| **POST** | `/containers/:id/start` | Start container process | `200`, `404` |
| **POST** | `/containers/:id/stop` | Stop container process | `200`, `404` |
| **POST** | `/containers/:id/restart` | Restart container process | `200`, `404` |
| **POST** | `/containers/:id/pause` | Pause container process | `200`, `404` |
| **POST** | `/containers/:id/unpause` | Unpause container process | `200`, `404` |
| **POST** | `/containers/:id/kill` | Kill running container process | `200`, `404` |
| **DELETE** | `/containers/:id` | Delete/remove container | `200`, `404`, `409` |
| **POST** | `/containers/:id/rename` | Rename container | `200`, `404`, `409` |
| **GET** | `/containers/:id/logs` | Fetch multiplexed decoded logs | `200`, `404` |
| **GET** | `/images` | List local Docker images | `200` |
| **GET** | `/images/:id` | Inspect specific image settings | `200`, `404` |
| **POST** | `/images/pull` | Pull image from registry | `201`, `400` |
| **DELETE** | `/images/:id` | Remove local Docker image | `200`, `404`, `409` |
| **POST** | `/images/:id/tag` | Apply repository tag to image | `200`, `404` |
| **GET** | `/images/:id/history` | Fetch build layers history | `200`, `404` |
| **POST** | `/images/prune` | Prune unused dangling images | `200` |
| **GET** | `/networks` | List virtual Docker networks | `200` |
| **POST** | `/networks` | Create a new virtual network | `201`, `400` |
| **POST** | `/networks/prune` | Prune unused Docker networks | `200` |
| **GET** | `/networks/:id` | Inspect network configuration | `200`, `404` |
| **DELETE** | `/networks/:id` | Delete/remove virtual network | `200`, `404`, `409` |
| **POST** | `/networks/:id/connect` | Link container to network | `200`, `404` |
| **POST** | `/networks/:id/disconnect` | Unlink container from network | `200`, `404` |
| **GET** | `/volumes` | List local persistent volumes | `200` |
| **POST** | `/volumes` | Create a new persistent volume | `201`, `400` |
| **POST** | `/volumes/prune` | Prune unused Docker volumes | `200` |
| **GET** | `/volumes/:name` | Inspect volume configuration | `200`, `404` |
| **DELETE** | `/volumes/:name` | Delete/remove persistent volume | `200`, `404`, `409` |
| **GET** | `/dockerfiles/templates` | Retrieve available template strings | `200` |
| **POST** | `/dockerfiles/validate` | Validate Dockerfile instruction syntax | `200`, `400` |
| **POST** | `/dockerfiles/analyze` | Parse structure directives (ports, image) | `200`, `400` |
| **POST** | `/dockerfiles/build` | Spawn background Docker build task | `201`, `400` |
| **GET** | `/dockerfiles/build/:buildId` | Poll active build progress and logs | `200`, `404` |
| **GET** | `/dockerfiles/history` | List session builds history logs | `200` |
| **GET** | `/compose/templates` | Retrieve available compose template example strings | `200` |
| **POST** | `/compose/validate` | Validate Compose YAML schema | `200`, `400` |
| **POST** | `/compose/analyze` | Parse Compose service stack configurations | `200`, `400` |
| **POST** | `/compose/run` | Execute Compose action (up, down, restart, build) | `201`, `400` |
| **GET** | `/compose/operation/:operationId` | Poll active compose CLI execution logs | `200`, `404` |
| **GET** | `/compose/history` | Fetch history logs | `200` |
| **GET** | `/monitoring/summary` | Fetch global host metrics telemetry summary | `200` |
| **GET** | `/monitoring/containers/:id/stats` | Fetch rolling metric history for a running container | `200`, `404` |

---

## WebSocket & Real-Time Protocol Exclusion

WebSockets and Socket.IO are intentionally excluded from Phase 1 through Phase 10 because they are unnecessary for the current product goals. DockVerse is a local-first developer environment, and all dashboard metrics and resource lists operate efficiently using REST APIs combined with TanStack Query caching and polling. Bidirectional communication will only be evaluated in the future if interactive terminal sessions or true streaming logs require it.
