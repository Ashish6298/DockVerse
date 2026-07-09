# DockVerse Enterprise

DockVerse is a professional, open-source enterprise Docker management platform and modern web-based Docker Desktop alternative. It allows engineers and administrators to manage local and remote Docker environments, build Dockerfiles, compose multi-container deployments, and audit daemon governance through a single clean interface.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Engine-blue.svg)](https://www.docker.com/)

---

## Table of Contents
- [Features](#features)
- [Monorepo Architecture](#monorepo-architecture)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Production Build](#production-build)
- [State Management Paradigm](#state-management-paradigm)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features
- **Dashboard**: High-level overview of running containers, images, volumes, and cpu/memory usage.
- **Workspace Manager**: Group local containers and resources by logical environments.
- **Container & Image Manager**: Dynamic lifecycle execution, static inspection, logs viewing, and image registry downloads.
- **Dockerfile & Compose Studio**: YAML validation editor, builds automation, and stack runtimes orchestration.
- **Registry Explorer**: Centralized management for Docker Hub, GitHub Package Registry, or private registries.
- **Swarm Manager**: Node provisioning, service tasks scheduling, and overlay network configurations.
- **Disaster Recovery**: Automatic volume backup schedules, compression, and decryption checks.
- **Security & Compliance Center**: Audit host daemons against CIS Docker Benchmarks and scan images for vulnerabilities.
- **Remote Hosts Fleet Manager**: Multi-cluster dashboard with TLS and SSH connection tunneling.

---

## Monorepo Architecture

DockVerse is organized as an npm workspaces monorepo:
- **`apps/api`**: Express backend application exposing versioned JSON endpoints.
- **`apps/web`**: React SPA application built with Vite and TailwindCSS.
- **`packages/types`**: Unified, shared TypeScript definitions.
- **`packages/docker-client`**: Abstracted wrapper surrounding Dockerode.

---

## Folder Structure
```
DockVerse/
├── apps/
│   ├── api/          # Express backend API
│   └── web/          # React SPA frontend
├── packages/
│   ├── types/        # Shared models/interfaces
│   └── docker-client # Isolated Dockerode wrapper
├── backups/          # Local SQLite/JSON backup metadata
├── package.json
└── tsconfig.json
```

---

## Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker Engine / Desktop**
- **MongoDB** >= 6.x

---

## Installation
Clone the repository:
```bash
git clone https://github.com/dockverse/dockverse.git
cd dockverse
npm install
```

Configure environment:
```bash
cp .env.example .env
# Edit .env variables
```

---

## Development Setup
Start the local API and Frontend dev servers concurrently:
```bash
npm run dev
```

---

## Production Build
Compile all typescript workspaces and generate production web bundles:
```bash
npm run build
```

---

## State Management Paradigm
DockVerse adheres to a strict separation of state concerns:
1. **React Query** manages server state (caching, query invalidations, optimistic mutations, and background polling).
2. **Zustand** is utilized exclusively for UI-only state (modals toggles, dark/light theme, active workspace selection, sidebar collapsed status).

---

## Roadmap
- [x] Swarm Stacks deployment
- [x] Incremental volume backups
- [x] Custom policy violations rules builder
- [x] Multi-cluster remote host connections
- [ ] AI-assisted Dockerfile and Compose YAML generator

---

## License
Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
