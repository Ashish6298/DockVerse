# DockVerse Technical Debt & Architectural Backlog

This document tracks identified architectural issues, refactoring proposals, and improvements postponed to future phases to avoid speculative over-engineering.

## 1. Postponed Refactoring & Improvements

### API Query Validation (Low Priority)
- **Status**: Deferred to subsequent CRUD resource managers (Phase 2).
- **Description**: Bind strict Zod request schema validation middleware to GET parameters when query arguments (filtering, searching, pagination) are introduced. Currently, endpoints take no parameters.

### Mock Testing Pipeline (Medium Priority)
- **Status**: Deferred to Phase 2.
- **Description**: Add comprehensive API integration test suites utilizing mocked Docker Engine clients under `tests/` to run automatic verification on PR checks.

### Dynamic Socket fallback planning (Low Priority)
- **Status**: Frozen.
- **Description**: If streaming logs or terminals are added in future modules (Phase 11+), evaluate custom lightweight TCP sockets or server-sent events (SSE) before introducing high-overhead third-party duplex frameworks.
