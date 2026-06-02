# SkillSphere

[License: MIT](LICENSE)

SkillSphere is a student growth and faculty engagement platform built for campus communities, with an initial design focus on Jorhat Engineering College (JEC). The system combines a React Native + Expo mobile client with a Node.js + Express backend and MongoDB data storage.

The repository is split into:
- `mobile-app/` — the Expo mobile application with TypeScript and Expo Router
- `server/` — the REST API, authentication, role-based access control, and data models

---

# Key Features

## Student Features

- Authentication with OTP verification and JWT session handling
- Student profile and portfolio system for academic and coding credentials
- QR-based profile sharing for quick access and presentations
- GitHub integration for importing public profile data and repository stats
- LeetCode statistics support for coding progress and achievement tracking
- Leaderboard and ranking system based on coding and portfolio metrics
- Goals and achievements tracking with configurable student milestones
- Opportunities and announcements feed for campus updates

## Faculty Features

- Faculty login with role-based access control
- Faculty dashboard for student monitoring and aggregate progress
- Read-only student visibility and portfolio inspection
- Shared announcement system for campus-wide messaging
- Faculty announcement publishing and admin visibility in the backend

---

# Tech Stack

## Frontend

- React Native
- Expo
- Expo Router
- TypeScript

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

---

# Architecture Overview

- Role-based routing: the mobile client identifies `student` and `faculty` roles and routes users to separate tab navigators and dashboard flows.
- Student and faculty dashboards: students see progress, goals, and portfolio entry points; faculty users access student summaries, details, and announcement controls.
- Shared announcements architecture: announcements are stored in MongoDB, exposed via `/api/announcements`, and rendered for authenticated users across the student and faculty experience.
- Portfolio ecosystem: portfolio data is assembled from user profile fields, skills, projects, coding stats, and share links, then delivered via QR and deep link sharing.

---

# Screenshots Section

## Login Screen
(Add screenshot here)

## Student Dashboard
(Add screenshot here)

## Faculty Dashboard
(Add screenshot here)

## Portfolio Screen
(Add screenshot here)

---

# Installation

## Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or Atlas)
- Expo CLI installed or use `npx expo`

## Backend setup

```bash
cd server
npm install
cp .env.example .env
# Edit server/.env to set MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, EMAIL_USER and EMAIL_PASS
npm run dev
```

## Mobile app setup

```bash
cd mobile-app
npm install
cp .env.example .env
# Edit mobile-app/.env and set EXPO_PUBLIC_API_URL to the backend API base URL
npx expo start
```

## Notes

- On a physical device, set `EXPO_PUBLIC_API_URL` to your machine’s local network address (for example `http://192.168.x.x:5000/api`).
- The mobile client and backend are separate projects and should be started independently.

---

# Project Status

Current Status:
- Demo-ready prototype

Implemented:
- student ecosystem with profile, goals, and portfolio features
- faculty ecosystem with role-based access and student visibility
- shared announcements for campus messaging
- OTP-based authentication and session management
- portfolio system with shareable links and QR codes
- leaderboard and coding progress tracking

Future Scope:
- faculty verification workflow
- multi-college support and campus separation
- advanced analytics and dashboard reporting
- push notifications and richer notification delivery

---

# Team / Author

- Manas Jyoti Nath

---

**Repository structure**

- `mobile-app/` — Expo mobile app, UI components, hooks, and API client
- `server/` — Express API, controllers, routes, models, and backend services
