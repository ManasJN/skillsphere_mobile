# SkillSphere

SkillSphere is a production-minded full‑stack student growth platform that helps students, faculty, and administrators track skills, projects, goals, achievements, and placement readiness. This repository contains the Express/MongoDB backend, a legacy React web client, and a modern React Native Expo mobile app with Expo Router.

Key highlights:
- Modern mobile-first dashboard and UX ✅
- JWT auth with refresh tokens & OTP email verification ✅
- Centralized API configuration for easy LAN testing (Expo) ✅
- Expo Router-based navigation and responsive tab layout ✅

---

## Features

- Role-based auth and dashboards for Students, Faculty, and Admins
- Skill tracking, goals & milestones, projects & portfolios
- Coding profile imports (LeetCode/GitHub) and analytics
- Leaderboards, achievements, streaks, and XP system
- Opportunity feed with matching & applications
- Real-time notifications and broadcast messages
- Mobile-first UI with accessible, safe-area aware navigation

---

## Tech Stack

- Backend: Node.js, Express, MongoDB (Mongoose)
- Mobile: React Native (Expo), Expo Router, TypeScript
- Web (legacy): React, Tailwind CSS
- Auth: JWT access + refresh tokens, email OTP via Nodemailer
- Storage: Local filesystem uploads (development), MongoDB for data

---

## Mobile App Highlights

- Built with Expo and Expo Router for file-based navigation
- Centralized API client (`mobile-app/lib/api.ts`) using `EXPO_PUBLIC_API_URL`
- Safe-area aware floating tab bar for modern UX
- Token persistence using `AsyncStorage` and automatic header injection

---

## Backend Highlights

- REST API with modular controllers and middleware
- JWT access + refresh token handling and secure cookie/headers patterns
- Email OTP verification flow for new registrations
- Seed scripts for demo data

---

## Authentication Flow

1. User registers (email + password) → backend creates user and sends OTP email.
2. User verifies OTP → backend enables account.
3. User logs in → backend returns `{ token, refreshToken, user }`.
4. Mobile app stores `token` in `AsyncStorage` and uses `Authorization: Bearer <token>` on API calls.
5. On 401 responses, client attempts refresh with `refreshToken`.

---

## Repository Structure

```
/server         # Express API, controllers, models, middleware
/client         # Legacy React web frontend (optional)
/mobile-app     # Expo React Native app (current mobile client)
README.md       # This file
```

See server and mobile-app folders for full sub-structure.

---

## Installation (full stack)

Prerequisites
- Node.js 18+ and npm
- MongoDB locally or Atlas
- Expo CLI (optional): `npm install -g expo-cli` (not required for Expo CLI v7+)

Install everything from the repository root:

```bash
npm install
npm run install:all
```

This runs installs for `server`, `client`, and `mobile-app`.

---

## Backend Setup (server)

1. Copy the example env file and edit secrets:

```bash
cd server
cp .env.example .env
# (on PowerShell) Copy-Item .env.example .env
```

2. Edit `server/.env` with your values. Key variables:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — long random secrets
- `EMAIL_USER` / `EMAIL_PASS` — SMTP credentials for OTP

3. Seed demo data (optional):

```bash
npm run seed
```

4. Start server (dev):

```bash
npm run dev
```

The API will be available at the port configured in `server/.env` (default `5000`). Health check: `http://localhost:5000/api/health`.

---

## Mobile App Setup (mobile-app)

1. Copy the mobile example env and set the API base URL for your environment:

```bash
cd mobile-app
cp .env.example .env
# or on PowerShell: Copy-Item .env.example .env
```

2. Edit `mobile-app/.env` and set `EXPO_PUBLIC_API_URL` to your backend API base, including `/api`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.42:5000/api
```

Notes:
- Use your machine's LAN IP (e.g. `192.168.x.x`) when testing on a physical device with Expo Go.
- Do NOT commit `.env`.

3. Install and run the app:

```bash
cd mobile-app
npm install
npx expo start --clear
```

Open the project in Expo Go (scan QR) or run on emulator.

---

## Environment Variables

- `server/.env` — backend secrets (see `server/.env.example`)
- `mobile-app/.env` — contains `EXPO_PUBLIC_API_URL` used by the mobile client

Important: When your development machine IP changes (Wi‑Fi/ethernet), update `mobile-app/.env:EXPO_PUBLIC_API_URL` and restart Expo with `npx expo start --clear` — no code edits required.

---

## Running the Backend

From repository root:

```bash
npm run server      # run server only (uses server/ package.json)
```

Or inside `server`:

```bash
npm run dev
```

---

## Running the Expo App

From `mobile-app`:

```bash
npm install
npx expo start --clear
```

Tips:
- If using a physical device, ensure your phone and dev machine are on the same LAN.
- Use `EXPO_PUBLIC_API_URL` with your machine's LAN IP.

---

## Expo Go / Android Troubleshooting (network & IP)

- If the app reports "Cannot reach server", ensure `EXPO_PUBLIC_API_URL` points to your dev machine LAN IP and the backend is running.
- On Windows, get the LAN IP with `ipconfig` and look for the IPv4 address under your active adapter.
- If using an emulator, `10.0.2.2` is Android emulator localhost; use it if you run the server on the same machine and emulator cannot reach host.
- Restart Expo with `npx expo start --clear` after changing `.env`.
- If CORS or network errors appear, check backend `CORS` middleware and that the server binds to `0.0.0.0` if needed.

---

## API Configuration Guide

- Mobile: `mobile-app/lib/config.ts` reads `EXPO_PUBLIC_API_URL` and falls back to `http://localhost:5000/api` for local dev.
- Web: the legacy client proxies requests in development — see `client/package.json` proxy settings.

Updating API URL for mobile devices:

1. Edit `mobile-app/.env` and set `EXPO_PUBLIC_API_URL` to `http://<YOUR_LAN_IP>:<PORT>/api`.
2. Run `npx expo start --clear`.

---

## Screenshots

Add screenshots of the mobile app UI in `mobile-app/assets/screenshots/` and update the links below:

- Mobile: `assets/screenshots/dashboard.png` (placeholder)
- Mobile: `assets/screenshots/login.png` (placeholder)

---

## Future Roadmap

- E2E tests for API and mobile flows
- Push notifications integration (FCM)
- Multi-tenant support for colleges
- Analytics & insights dashboards for admins

---

## Contributing

Contributions welcome — please follow these steps:

1. Fork the repo and create a feature branch.
2. Run tests (if added) and ensure linting passes.
3. Open a pull request describing the change and migration notes.

For UI/UX changes, include screenshots and device previews.

---

## License

This repository is provided under the MIT License. Update the license file as needed for your project.

---

If you want, I can also generate a `mobile-app/README.md` with mobile-specific quickstart steps and screenshots placeholders. Would you like that? 
