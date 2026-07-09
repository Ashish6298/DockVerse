# Contributing to DockVerse

Thank you for your interest in contributing to DockVerse! Please follow these guidelines to keep our development consistent and clean.

## Codebase Architecture
DockVerse follows a strict **Clean Architecture** boundary:
```
React Components (UI)
  ↓
Zustand (UI State Only) / React Query (Server State Only)
  ↓
Express Router REST endpoints
  ↓
Zod Validators
  ↓
Thin Controllers
  ↓
Services Layer (Business Logic)
  ↓
Docker Client Package (Dockerode) / MongoDB Database Models
```

## Guidelines
1. **No Real-Time Protocols**: Do not introduce WebSockets, Server-Sent Events, or GraphQL. All operations must use standard HTTP REST and polling.
2. **Type Safety**: Maintain strict TypeScript configuration. Use `any` only where third-party packages make it unavoidable.
3. **Linter Compliance**: Run `npm run lint` before committing. Ensure 0 warnings or errors are reported by `oxlint`.
4. **Git Commits**: Use semantic commits (e.g. `feat: ...`, `fix: ...`, `docs: ...`).
5. **Testing**: Build all workspaces using `npm run build` to ensure bundlers and TypeScript compiler pass.
