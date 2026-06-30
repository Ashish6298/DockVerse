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

---

## WebSocket & Real-Time Protocol Exclusion

WebSockets and Socket.IO are intentionally excluded from Phase 1 through Phase 10 because they are unnecessary for the current product goals. DockVerse is a local-first developer environment, and all dashboard metrics and resource lists operate efficiently using REST APIs combined with TanStack Query caching and polling. Bidirectional communication will only be evaluated in the future if interactive terminal sessions or true streaming logs require it.
