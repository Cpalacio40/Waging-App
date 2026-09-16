# Waging App

Interactive **mobile app mockup** for **Waging** — a high-fidelity, clickable web prototype that simulates the phone experience.

**Product:** [Waging](https://cpalacio40.github.io/Waging/) · **Repo:** [Cpalacio40/Waging-App](https://github.com/Cpalacio40/Waging-App)

> Academic / portfolio prototype (TFM). Not a commercial product in production. No real backend, auth, payments, or collar APIs.

---

## Academic context

Part of the **TFM (Trabajo de Fin de Máster)** by **Camila Palacio** ([Cpalacio40](https://github.com/Cpalacio40)) for the **Máster en Diseño UX/UI & AI-Native de Diseño de Producto: Digital Minds**.

| Deliverable | Repo | Role |
| --- | --- | --- |
| Marketing landing | [Cpalacio40/Waging](https://github.com/Cpalacio40/Waging) | Public positioning & brand |
| App mockup (this repo) | [Cpalacio40/Waging-App](https://github.com/Cpalacio40/Waging-App) | Interactive UI of the mobile product |

Tagline: **“La tranquilidad de saber que está bien.”**

Waging combines a **smart collar**, a **trusted certified caregiver**, and **action (not only alerts)** for dog owners.

---

## What this prototype includes

- Desktop studio with a **phone emulator** (~**390×844**, Figma / near iPhone 11)
- **Screen navigator** under the device to jump between views without walking the full flow
- In-phone flow: **iOS home** (widget arrows + Waging icon) → **splash** → **app home**
- UI copy in **Spanish**, brand tokens aligned with the landing

Screens are currently **high-level placeholders** ready to be replaced with fidelity from the Figma design library.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Icons | lucide-react |
| Styling | Custom CSS (brand variables; no UI kit) |
| Hosting target | GitHub Pages (`/Waging-App/`) |

---

## Getting started

**Requirements:** [Node.js](https://nodejs.org/) 18+

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

| Script | What it does |
| --- | --- |
| `npm run dev` | Local dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Oxlint |

---

## Design source

Figma: [Waging Design Library — User histories](https://www.figma.com/design/PKTR2OQjdoNtpE9SnY5MLn/Waging-Design-Library---USer-histories)

Landing (brand reference): [cpalacio40.github.io/Waging](https://cpalacio40.github.io/Waging/)

---

## License

[MIT](./LICENSE) © 2026 Cpalacio40
