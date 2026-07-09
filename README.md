<h1 align="center">
  🐋 DockVerse Enterprise
</h1>

<h4 align="center">
  The Modern, Open-Source Docker Desktop Alternative
</h4>

<br />

<table>
  <tr>
    <td>
      <strong>📖 Overview</strong><br><br>
      DockVerse is a professional, open-source enterprise Docker management platform and modern web-based Docker Desktop alternative. It allows engineers and administrators to manage local and remote Docker environments, build Dockerfiles, compose multi-container deployments, and audit daemon governance through a single clean interface.
    </td>
  </tr>
</table>

<br>

<table align="center">
  <tr>
    <!-- MIT License / GitHub Repository Link -->
    <td align="center">
      <a href="https://github.com/Ashish6298/DockVerse/blob/main/LICENSE">
        <img src="https://skillicons.dev/icons?i=github" height="56" alt="GitHub & MIT License"/>
      </a>
    </td>
    <!-- TypeScript Workspace Core -->
    <td align="center">
      <a href="https://www.typescriptlang.org/">
        <img src="https://skillicons.dev/icons?i=ts" height="56" alt="TypeScript"/>
      </a>
    </td>
    <!-- React SPA Frontend -->
    <td align="center">
      <a href="https://react.dev/">
        <img src="https://skillicons.dev/icons?i=react" height="56" alt="React"/>
      </a>
    </td>
    <!-- Docker Engine Core Architecture -->
    <td align="center">
      <a href="https://www.docker.com/">
        <img src="https://skillicons.dev/icons?i=docker" height="56" alt="Docker"/>
      </a>
    </td>
  </tr>
</table>

<table align="center" width="90%">  <tr>
    <td>
      <h3>📌 Table of Contents</h3>
      <ul>
        <li>
          <a href="#features">✨ Key Features</a> 
          — <i>Comprehensive list of what DockVerse can do.</i>
        </li>
        <li>
          <a href="#monorepo-architecture">🏗️ Monorepo Architecture</a> 
          — <i>Deep dive into our workspaces and engine design.</i>
        </li>
        <li>
          <a href="#folder-structure">📁 Folder Structure</a> 
          — <i>A map of the codebase modules and apps.</i>
        </li>
        <li>
          <a href="#prerequisites">🛑 Prerequisites</a> 
          — <i>System requirements and dependencies needed to run.</i>
        </li>
        <li>
          <a href="#installation">🚀 Installation & Setup</a> 
          — <i>Step-by-step instructions to clone and install.</i>
        </li>
        <li>
          <a href="#development-setup">🛠️ Development Environment</a> 
          — <i>How to start up local API and frontend servers concurrently.</i>
        </li>
        <li>
          <a href="#production-build">📦 Production Build</a> 
          — <i>Compilation steps for typescript workspaces and bundles.</i>
        </li>
        <li>
          <a href="#state-management-paradigm">🧠 State Management Paradigm</a> 
          — <i>How we separate server state from client UI states.</i>
        </li>
        <li>
          <a href="#roadmap">🗺️ Product Roadmap</a> 
          — <i>Completed milestones and what we are building next.</i>
        </li>
        <li>
          <a href="#license">📄 Open Source License</a> 
          — <i>Legal information regarding terms of usage.</i>
        </li>
      </ul>
    </td>
  </tr>
</table>

<br>

<h2 align="center">✨ Enterprise Feature Suite</h2>

<p align="center">
  <em>DockVerse equips you with a robust set of tools to orchestrate, audit, and secure your entire Docker ecosystem.</em>
</p>

<table align="center" width="95%" cellpadding="10" cellspacing="0">
  <tr>
    <td width="50%" valign="top">
      <h4>📊 Core Management</h4>
      <ul>
        <li><strong>Dashboard:</strong> Real-time high-level monitoring of active containers, local images, volumes, and host CPU/memory utilization.</li>
        <li><strong>Workspace Manager:</strong> Logically group local containers and resources into isolated environments.</li>
        <li><strong>Container & Image Manager:</strong> Dynamic lifecycle execution (start, stop, restart), deep static inspections, real-time log streams, and registry asset downloads.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>🛠️ Orchestration & Studio</h4>
      <ul>
        <li><strong>Dockerfile & Compose Studio:</strong> Advanced YAML validation editor, automated image building, and multi-container stack orchestration.</li>
        <li><strong>Registry Explorer:</strong> Centralized dashboard for Docker Hub, GitHub Package Registry, or secure custom private registries.</li>
        <li><strong>Swarm Manager:</strong> Native cluster node provisioning, granular service task scheduling, and overlay network configurations.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h4>🛡️ Security & Governance</h4>
      <ul>
        <li><strong>Security & Compliance Center:</strong> Automated daemon auditing against official CIS Docker Benchmarks and integrated image vulnerability scanning.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>🌐 Infrastructure & Recovery</h4>
      <ul>
        <li><strong>Disaster Recovery:</strong> Scheduled automated volume backups, background file compression, and cryptographic decryption verification.</li>
        <li><strong>Remote Hosts Fleet Manager:</strong> Secure multi-cluster command center utilizing hardened TLS and SSH connection tunneling.</li>
      </ul>
    </td>
  </tr>
</table>

<br>

<h2 align="center">🏗️ Monorepo Architecture</h2>

<p align="center">
  <em>DockVerse leverages an <code>npm workspaces</code> monorepo design to guarantee strict separation of concerns, rapid local builds, and seamless internal code sharing.</em>
</p>

<table align="center" width="95%" cellpadding="10" cellspacing="0">
  <tr>
    <td width="50%" valign="top">
      <h4>🚀 Applications (<code>apps/</code>)</h4>
      <ul>
        <li>
          <strong><code>api</code></strong> — A robust <strong>Express</strong> backend application exposing versioned, high-performance RESTful JSON endpoints to interface with system daemons.
        </li>
        <li>
          <strong><code>web</code></strong> — A modern, lightning-fast React Single Page Application (SPA) built with <strong>Vite</strong> and styled using <strong>TailwindCSS</strong>.
        </li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>📦 Internal Packages (<code>packages/</code>)</h4>
      <ul>
        <li>
          <strong><code>types</code></strong> — Single source of truth holding unified, shared <strong>TypeScript</strong> definitions utilized across both the frontend and backend.
        </li>
        <li>
          <strong><code>docker-client</code></strong> — An isolated, highly abstracted infrastructure wrapper surrounding the core <strong>Dockerode</strong> client API.
        </li>
      </ul>
    </td>
  </tr>
</table>
<br>

<h2 align="center">📁 Folder Structure</h2>

<p align="center">
  <em>A high-level map of the modules, applications, and configurations that make up the DockVerse codebase.</em>
</p>

<table align="center" width="95%">
  <tr>
    <td>
      <pre>
<b>DockVerse/</b>
├── 📂 <b>apps/</b>
│   ├── 🌐 <b>api/</b>           # Express backend API application
│   └── 💻 <b>web/</b>           # React SPA frontend (Vite + Tailwind)
├── 📂 <b>packages/</b>
│   ├── 🏷️ <b>types/</b>         # Shared TypeScript models/interfaces
│   └── 🐳 <b>docker-client/</b> # Isolated Dockerode client wrapper
├── 💾 <b>backups/</b>           # Local SQLite/JSON backup metadata storage
├── 📜 <b>package.json</b>       # Root workspace configuration definitions
└── ⚙️ <b>tsconfig.json</b>     # Global TypeScript compiler configurations
      </pre>
    </td>
  </tr>
</table>
<br>

<h2 align="center">🛑 Prerequisites</h2>

<p align="center">
  <em>Ensure you have the following environments set up locally before booting the platform.</em>
</p>

<table align="center" width="95%" cellpadding="10" cellspacing="0">
  <tr>
    <td width="50%" valign="top">
      <h4>⚙️ Runtimes & Package Managers</h4>
      <ul>
        <li><strong>Node.js:</strong> <code>&gt;= 18.x</code> (LTS recommended)</li>
        <li><strong>NPM:</strong> <code>&gt;= 9.x</code> (For native monorepo workspace support)</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>🐳 Infrastructure Services</h4>
      <ul>
        <li><strong>Docker Engine / Desktop:</strong> Running locally with active daemon access.</li>
        <li><strong>MongoDB:</strong> <code>&gt;= 6.x</code> (Required for configuration and analytics state storage)</li>
      </ul>
    </td>
  </tr>
</table>

<br>



# 🚀 Getting Started

Follow the steps below to set up **Dockverse** for local development or build it for production.

---

# 📥 Installation

Clone the repository to your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/dockverse/dockverse.git
```

### 2. Navigate to the Project Directory

```bash
cd dockverse
```

### 3. Install Dependencies

Install all required packages.

```bash
npm install
```

---

# ⚙️ Environment Configuration

Create a local environment file.

```bash
cp .env.example .env
```

After creating the file, open `.env` and update the required environment variables for your setup.

---

# 💻 Development

Start both the **Frontend** and **Backend API** development servers concurrently with hot reloading.

```bash
npm run dev
```

Once the servers are running, the application will automatically reload whenever you make changes to the source code.

---

# 📦 Production Build

Generate a production-ready build by compiling all TypeScript workspaces and creating optimized frontend bundles.

```bash
npm run build
```

The generated build artifacts will be ready for deployment.

---

# ✅ Quick Start

```bash
git clone https://github.com/dockverse/dockverse.git
```

```bash
cd dockverse
```

```bash
npm install
```

```bash
cp .env.example .env
```

> Configure your `.env` file before proceeding.

```bash
npm run dev
```

When you're ready to create a production build:

```bash
npm run build
```

<h2 align="center">🧠 State Management Paradigm</h2>

<p align="center">
  <em>DockVerse enforces a strict architectural boundary between client UI mutations and external server data state syncs.</em>
</p>

<table align="center" width="95%" cellpadding="10" cellspacing="0">
  <tr>
    <td width="50%" valign="top">
      <h4>📡 1. Server State (React Query)</h4>
      <p>Manages all server state integration, network latency handling, and data synchronization layer tasks:</p>
      <ul>
        <li>Data caching and dynamic query invalidations</li>
        <li>Optimistic user interface updates</li>
        <li>Background polling for live infrastructure updates</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>🎨 2. UI State (Zustand)</h4>
      <p>Utilized exclusively for client-only synchronous interface presentation properties:</p>
      <ul>
        <li>Global modal state switches and visibility toggles</li>
        <li>Application color interface themes (Dark / Light mode)</li>
        <li>Active workspace selection and collapsed sidebar states</li>
      </ul>
    </td>
  </tr>
</table>


<h2 align="center">🗺️ Product Roadmap</h2>

<p align="center">
  <em>Track the current developmental milestones and target enterprise feature updates.</em>
</p>

<table align="center" width="95%" cellpadding="10" cellspacing="0">
  <tr>
    <td>
      <ul style="list-style-type: none; padding-left: 10px; margin: 0;">
        <li>✅ <b>Swarm Stacks Deployment</b> — Unified orchestration for cluster swarm multi-container architectures.</li>
        <li style="margin-top: 8px;">✅ <b>Incremental Volume Backups</b> — Granular scheduling logic to archive runtime persistent container volumes.</li>
        <li style="margin-top: 8px;">✅ <b>Custom Policy Violations Rules Builder</b> — UI rule configurator targeting live compliance monitoring.</li>
        <li style="margin-top: 8px;">✅ <b>Multi-Cluster Remote Host Connections</b> — Hardened multi-target connectivity layers utilizing TLS/SSH tunnels.</li>
        <li style="margin-top: 8px;">⏳ <b>AI-Assisted Dockerfile and Compose YAML Generator</b> — Intelligent layout modeling engine targeting rapid asset generation.</li>
      </ul>
    </td>
  </tr>
</table>


<h2 align="center">📄 Open Source License</h2>

<table align="center" width="95%" cellpadding="10" cellspacing="0">
  <tr>
    <td align="center">
      Distributed under the <b>MIT License</b>. 
      <br><br>
      See the accompanying <a href="LICENSE"><code>LICENSE</code></a> file documentation for more comprehensive information regarding absolute distribution terms, code usage allowances, and liability warranties.
    </td>
  </tr>
</table>
