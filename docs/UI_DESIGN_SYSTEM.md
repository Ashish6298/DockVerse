# DockVerse UI Design System

This design system governs the visual presentation layer of the DockVerse web application, ensuring consistency, premium aesthetics, and responsive layout scaling.

---

## 1. Design Tokens

### Colors (HSL Theme Matrix)
DockVerse implements a sleeker dark mode theme by default.

| Token | Variable | Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Background** | `--background` | `hsl(224, 25%, 8%)` | Deep blue-grey canvas background |
| **Surface/Card** | `--card` | `hsl(222, 22%, 12%)` | Panel, sidebar, and dashboard surfaces |
| **Primary** | `--primary` | `hsl(217, 91%, 60%)` | Vibrant blue for primary actions and active state |
| **Secondary** | `--secondary` | `hsl(215, 20%, 65%)` | Subdued text, indicators, and details |
| **Border** | `--border` | `hsl(217, 15%, 20%)` | Structural partition lines |
| **Success** | `--status-connected` | `hsl(142, 70%, 45%)` | Active docker daemon or running containers |
| **Warning** | `--status-warning` | `hsl(38, 92%, 50%)` | Paused containers, warning thresholds |
| **Destructive** | `--status-disconnected` | `hsl(0, 84%, 60%)` | Offline docker state, stopped containers, error |

---

## 2. Spacing Scale
The spacing system uses a **4px grid** base. All margin, padding, and layout gap allocations must align with this scale:
- `space-xs`: `4px` (Very tight spacing, labels)
- `space-sm`: `8px` (Internal component gaps, card paddings)
- `space-md`: `16px` (Standard page element margins, layouts)
- `space-lg`: `24px` (Large section padding, headers)
- `space-xl`: `32px` (Outer container margins)

---

## 3. Typography
- **Primary Font Family**: `Inter, system-ui, -apple-system, sans-serif`
- **Monospace Font Family** (for ID hashes, CLI text, raw JSON outputs): `'Fira Code', Consolas, Monaco, monospace`
- **Size Scale**:
  - `text-xs`: `11px` (Status indicators, labels, footers)
  - `text-sm`: `13px` (Sidebar navigation, normal text, table cells)
  - `text-base`: `15px` (Form fields, sub-headings)
  - `text-lg`: `18px` (Card titles, modal headers)
  - `text-xl`: `24px` (Page headers, telemetry numbers)

---

## 4. Breakpoints & Layout Grid
- **Mobile**: `< 640px` (Sidebar collapses entirely, full screen page paddings)
- **Tablet**: `640px` to `1024px` (Sidebar collapsed to narrow icons)
- **Desktop**: `> 1024px` (Sidebar locked open, grid columns auto-allocate)

---

## 5. UI Elements & Interaction States

### Loading States & Skeleton Loaders
- Render custom content skeleton containers matching the target data structure shape instead of a generic blank screen.
- Active async buttons must show an inline spinner (using `animate-spin`) and disable further click interactions.

### Destructive Action Dialogues
- Destructive operations (e.g., destroying containers, clearing volumes) must present a modal confirmation prompt.
- Modal dialogues must include an explicit danger configuration (e.g., red border accents, destructive action confirmations).

### Focus Management
- Interactive focus states must use a `2px` focus ring: `outline: 2px solid var(--primary)` with a offset of `2px`.
- Tab indexing must follow a logical top-to-bottom, left-to-right reading order.
