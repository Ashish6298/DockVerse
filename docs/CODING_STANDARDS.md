# DockVerse Coding Standards

This document establishes the code guidelines, naming conventions, and structural rules for all typescript/javascript code across the DockVerse monorepo.

---

## 1. TypeScript Conventions
- **Strict Mode Enabled**: Explicit strict type-checking is enforced. Do not set `noImplicitAny` or `strict` to `false` in any `tsconfig.json`.
- **No `any` Types**: The use of `any` is strictly prohibited. If a type cannot be statically determined, use `unknown` or a generic parameter `<T>`.
- **Type-Only Imports**: Always use `import type` when importing interfaces, types, or signatures from packages to prevent runtime bundle overhead:
  ```typescript
  import type { DockerInfo, ApiResponse } from '@dockverse/types';
  ```
- **Type Assertions**: Avoid unsafe type assertions like `as MyType`. Prefer type guards, Zod parsers, or explicit type narrowing.

---

## 2. React Conventions
- **Functional Components Only**: Class components are prohibited. Use function declarations for all React component definitions:
  ```tsx
  export function ContainerCard() { ... }
  ```
- **Props Definition**: Explicitly type props for all components using interfaces or types:
  ```tsx
  interface ContainerCardProps {
    id: string;
    name: string;
    status: string;
  }
  ```
- **Custom Hooks**: Isolate stateful logic or async queries in custom hooks. Component files should focus on UI structure, mapping, and rendering.
- **Key Prop Rule**: Always use a unique identifier (like database `_id` or container `Id`) for `key` attributes when rendering lists. Never use array index values.

---

## 3. Naming Conventions
- **Directories**: Always use kebab-case (e.g., `docker-client`, `ui-components`).
- **React Components**: Use PascalCase (e.g., `StatusCard.tsx`).
- **Hooks**: Use camelCase starting with `use` (e.g., `useDockerTelemetry.ts`).
- **Backend API Routes/Controllers/Services**: Use dot-notation representing their role (e.g., `docker.controller.ts`, `docker.service.ts`).
- **Variables/Functions**: Use camelCase (e.g., `formatBytes`).
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `DEFAULT_POLLING_INTERVAL`).
- **CSS Classes**: Use standard CSS nesting or class structures matching layout selectors.

---

## 4. Import Ordering
Organize imports logically in the following order, separated by a blank line:
1. Third-party library imports (e.g., `react`, `express`, `@tanstack/react-query`).
2. Internal monorepo workspace packages (`@dockverse/types`, `@dockverse/utils`).
3. Local application code relative imports (e.g., `../../components/...`).
4. Styles or static asset imports (e.g., `import './styles.css'`).

---

## 5. Coding Bounds & Complexity
- **Max Function Length**: Keep functions under `40 lines`. If a function grows larger, refactor sub-flows into smaller modular functions.
- **Max File Length**: Files must remain under `250 lines` of code (excluding long mock test files). If a file exceeds this, split it into separate modules or helper files.
- **Cyclomatic Complexity**: Maintain a cyclomatic complexity index under `10` for every logical block.

---

## 6. Error Handling & Logging
- **Backend Handlers**: All custom errors must extend the base `AppError` class.
- **Uncaught Exception Catching**: Always run controller queries inside `try/catch` and pass errors to Express's `next(error)` middleware.
- **Structured Logs**: Use the `logger` instance. Do not call raw `console.log` or `console.error` in production paths. Mask passwords, secrets, and auth tokens.
- **Frontend Safe Failures**: Wrap component pages with custom `ErrorBoundary` shells and render fallback states when exceptions occur.

---

## 7. Testing Practices
- **No Mocking on Daemon**: Automated tests must never interact with the active local system daemon directly. Always bind requests to mock docker clients.
- **Coverage Requirements**: Every package/service must provide at least `80%` test coverage on critical logical paths.
