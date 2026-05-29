# SkillSphere — Minimal Developer Identity & Portfolio

[License: MIT](LICENSE)

A minimalist developer/student identity and portfolio platform focused on professional identity, GitHub integration, achievement progression, verification, and shareable portfolios (including QR-based profile sharing).

**Quick facts**
- Mobile app: Expo + React Native (TypeScript)
- Backend: Node.js, Express, MongoDB
- Intent: small, reliable, portfolio-first experience for developers and students

---

**Project introduction**

SkillSphere provides a compact, mobile-first way to present a developer identity: verified accomplishments, GitHub-connected activity, an ordered professional timeline, and a shareable portfolio view that can be delivered via link or QR code.

**Product vision**

Deliver a dependable, low-friction portfolio for individuals who want a clean, developer-focused presence. The app prioritizes clarity, verifiable signals, and an exportable/shareable portfolio while keeping the UI intentionally minimal.

---

**Core features**

- GitHub integration for importing public activity and basic profile data.
- Professional timeline: chronological display of projects, achievements and milestones.
- Verification system for vetted credentials and campus access flows.
- Portfolio preview and share mode for public-facing presentation.
- QR-based profile sharing for in-person quick exchange.
- Lightweight, handcrafted UI components focused on readability and clarity.

---

**Screens / feature overview**

- Onboarding & verification: simple email + OTP flow, role selection.
- Dashboard: XP/achievement summary and active goals.
- Goals & milestones: progress tracking and lightweight XP rewards.
- Timeline / Portfolio: professional timeline and portfolio preview mode.
- Share: generate a shareable portfolio link and QR for quick sharing.
- Explore & opportunities: curated listings and college-specific announcements (for verified users).

---

**Tech stack**

- Mobile: Expo, React Native, Expo Router, TypeScript
- Backend: Node.js, Express, MongoDB, Mongoose
- Networking: Axios (centralized client + auth interceptor)
- Storage: AsyncStorage (mobile) and JWT-based auth
- Dev tooling: ESLint, TypeScript

---

**Architecture highlights**

- `server/` — Express API, controllers, middleware, and Mongoose models.
- `mobile-app/` — Expo application using file-based routing under `app/`.
- `mobile-app/lib/` — API client, configuration, and small utilities (QR helper, theme, etc.).
- `mobile-app/components/` — focused, reusable UI primitives; portfolio and share screens live here.

This structure keeps the mobile client lightweight and keeps business logic in hooks (`mobile-app/hooks/`).

---

**Setup & installation**

Prerequisites:
- Node.js 18+ and npm or Yarn
- A MongoDB instance (local or Atlas)
- Recommended: Expo Go on your device or a simulator

Backend
```bash
cd server
npm install
cp .env.example .env
# Edit server/.env to set MONGO_URI, JWT secrets, and email credentials
npm run dev
```

Mobile app
```bash
cd mobile-app
npm install
cp .env.example .env
# Edit mobile-app/.env: set EXPO_PUBLIC_API_URL to the API base URL (including /api)
npx expo start
```

Network note: when running the mobile client on a device, point `EXPO_PUBLIC_API_URL` to your machine on the local network (e.g. `http://192.168.1.42:5000/api`).

---

**Environment configuration**

Key variables (examples)

- `server/.env`
  - `PORT` — server port (default 5000)
  - `MONGO_URI` — MongoDB connection string
  - `JWT_SECRET`, `JWT_REFRESH_SECRET` — authentication secrets
  - `EMAIL_USER`, `EMAIL_PASS` — SMTP sender credentials (OTP/email)

- `mobile-app/.env`
  - `EXPO_PUBLIC_API_URL` — backend API URL used by the mobile client

The codebase includes fallback defaults in `mobile-app/lib/config.ts` to simplify local development.

---

**Screenshots (placeholders)**

Add high-quality screenshots to `mobile-app/assets/screenshots/` and replace the placeholders below:

- `mobile-app/assets/screenshots/dashboard.png` — dashboard and achievements
- `mobile-app/assets/screenshots/timeline.png` — portfolio/timeline preview
- `mobile-app/assets/screenshots/share-qr.png` — share screen with QR

Recommended image sizes: 1080×2340 (vertical) and 1200×630 (wide preview).

---

**Roadmap (short, realistic items)**

- Improve offline resilience and caching for timeline and portfolio.
- Add background sync for GitHub imports and verification status.
- Small UX polish: export PDF of portfolio, print-friendly versions.
- Optional: native sharing extensions for deeper OS integration.

---

**Contribution**

1. Fork the repo and create a feature branch.
2. Run both `server` and `mobile-app` locally and reproduce the issue or feature.
3. Open a PR with a clear description and screenshots for UI changes.

Please keep changes focused and testable — the codebase is intentionally small and opinionated.

---

**License**

This project is open source under the MIT License.
