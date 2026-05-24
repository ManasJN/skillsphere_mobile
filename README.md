# SkillSphere

SkillSphere is a mobile-first student productivity ecosystem built with Expo/React Native and a Node.js/Express backend. The current app centers on goal tracking, productivity insights, achievement progress, campus opportunities, and a streamlined onboarding/auth experience.

## Current status

- Active `mobile-app` Expo client with modern navigation and mobile-first UX
- Backend API in `server` using Express and MongoDB
- Role-aware registration for students and faculty
- Verified college access to announcements, events, and opportunities
- Goal management with milestones, XP rewards, and progress insights
- Explore feed combining reminders, campus updates, and opportunities

## Key features

- Password login + email OTP verification flow
- Persistent JWT auth with auto-refresh handling
- Personalized dashboard with XP, streak health, and goal context
- Goal creation, editing, completion, and milestone tracking
- Achievement summaries and productivity signals
- Explore tab with academic reminders, college announcements, and filtered opportunities
- Notifications and profile management
- Clean Expo Router tab navigation with safe-area and mobile-first design

## Goals and productivity

SkillSphere puts student goals at the center of the experience:

- Active goals are surfaced first on the home dashboard
- Goals support priority, deadlines, progress, and status filters
- Milestones can be toggled within each goal
- XP rewards are attached to goal completion
- Productivity insights highlight overdue tasks, streak risk, and progress milestones
- Analytics surface completion rate, average skill level, and project momentum

## Onboarding and auth flow

The current onboarding flow is focused on a simple, secure mobile experience:

- New users register with name, email, password, and role selection
- Registration sends an OTP email for verification
- OTP verification completes onboarding and signs in the user
- Auth state is persisted in `AsyncStorage`
- The app routes authenticated users directly into the dashboard

## Achievements and insights

The app now includes a refined student progress surface:

- Achievement cards appear when earned
- A contextual insight bar surfaces actionable signals
- XP progress and level advancement are visible on the dashboard
- A setup checklist helps new users onboard faster
- Verified students unlock richer campus updates and opportunity feeds

## Explore, opportunities, and reminders

The Explore tab combines multiple campus workflows into one feed:

- Static academic reminders for upcoming coursework and exams
- Live college announcements and event updates for verified students
- Opportunity search and filter for internships, hackathons, jobs, research, and scholarships
- Apply actions for opportunity listings
- Daily urgency labels and deadline-based reminders

## Tech stack

- Mobile: Expo, Expo Router, React Native, TypeScript
- Backend: Node.js, Express, MongoDB, Mongoose
- Networking: Axios with centralized auth interceptor
- Storage: `AsyncStorage` for JWT persistence
- UI: custom component library plus Expo vector icons

## Architecture overview

- `server/` contains the API, middleware, controllers, and Mongoose models
- `mobile-app/` contains the active Expo app with file-based routing under `app/`
- `mobile-app/lib/` centralizes API access and environment configuration
- `mobile-app/hooks/` contains goal and productivity business logic
- `mobile-app/components/` contains reusable UI primitives and feature-specific components

## Folder structure

- `server/`
  - `controllers/` — request handlers
  - `models/` — Mongoose schemas
  - `routes/` — Express route definitions
  - `middleware/` — auth and validation
  - `utils/` — JWT, email, seed scripts
- `mobile-app/`
  - `app/` — Expo Router screens and tab layout
  - `components/` — UI components, goal sheet, achievement row
  - `hooks/` — goal and productivity hooks
  - `lib/` — API client and config
  - `assets/` — images and screenshot placeholders

## Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or Atlas)
- Expo CLI is optional; use `npx expo` with Expo SDK 54

### Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and configure:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`

Start the backend:

```bash
npm run dev
```

### Mobile app setup

```bash
cd mobile-app
npm install
cp .env.example .env
```

Edit `mobile-app/.env` and set:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:5000/api
```

Start the app:

```bash
npx expo start --clear
```

Open the app in Expo Go or an emulator.

## Environment variables

### `server/.env`

- `PORT` — server port (default `5000`)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — access token secret
- `JWT_EXPIRES_IN` — access token expiry
- `JWT_REFRESH_SECRET` — refresh token secret
- `JWT_REFRESH_EXPIRES_IN` — refresh token expiry
- `CLIENT_URL` — client origin (used by email links and CORS)
- `EMAIL_USER` — SMTP sender address
- `EMAIL_PASS` — SMTP password

### `mobile-app/.env`

- `EXPO_PUBLIC_API_URL` — backend API base URL, including `/api`

> `mobile-app/lib/config.ts` falls back to `http://localhost:5000/api` during development if the env var is not set.

## Screenshots

Place app screenshots under `mobile-app/assets/screenshots/` and update the references below:

- `mobile-app/assets/screenshots/dashboard.png`
- `mobile-app/assets/screenshots/goals.png`
- `mobile-app/assets/screenshots/explore.png`

## Future roadmap

- Push notifications for reminders and opportunity updates
- Live event and announcement sync for verified campuses
- Historical goal analytics and calendar views
- Improved offline support for the mobile client

## Contribution

1. Fork the repository and create a feature branch.
2. Install dependencies for `server` and `mobile-app`.
3. Verify the backend and mobile client run locally.
4. Open a pull request with a clear summary and screenshots for UI changes.

## License

MIT License.
