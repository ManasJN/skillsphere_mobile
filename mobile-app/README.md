# SkillSphere Mobile App

This folder contains the Expo mobile client for SkillSphere, built with React Native, TypeScript, and Expo Router.

The app supports student growth tracking, goal management, portfolio sharing, QR profile sharing, and faculty engagement with role-based navigation.

## Quick start

```bash
cd mobile-app
npm install
cp .env.example .env
# Update EXPO_PUBLIC_API_URL to the backend API base URL, for example http://localhost:5000/api
npm run start
```

## Available scripts

- `npm run start` — start Expo in development mode
- `npm run android` — open the app in an Android device or emulator
- `npm run ios` — open the app in an iOS simulator
- `npm run web` — open the app in a browser
- `npm run lint` — run Expo ESLint checks

## Environment variables

Copy `mobile-app/.env.example` to `mobile-app/.env` and set:

- `EXPO_PUBLIC_API_URL` — backend API URL, for example `http://localhost:5000/api`

## Notes

- The mobile app communicates with the backend API for authentication, user profiles, announcements, goals, and portfolio data.
- For physical device testing, use a local network address and ensure the backend is reachable from the device.
- App source files are under `mobile-app/app` using Expo Router file-based routing.

## Project structure

- `app/` — page routes and screens
- `components/` — reusable UI components
- `hooks/` — custom React hooks
- `lib/` — API client and helper modules

## More information

For full backend setup and repository-level instructions, see the root `README.md`.
