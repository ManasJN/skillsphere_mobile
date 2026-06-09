# SkillSphere

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Repo](https://img.shields.io/badge/Repository-SkillSphere-green)](https://github.com/ManasJN/skillsphere_mobile)

SkillSphere is a student growth and faculty engagement platform built for educational institutions. The project is currently focused on Jorhat Engineering College (JEC) and supports students in showcasing skills, coding progress, projects, goals, and achievements while enabling faculty to monitor engagement and share announcements.

## Problem Statement

Students often struggle to present academic progress, coding achievements, and project work in a central location. Institutions also need a consistent way for faculty to view student growth, share updates, and support engagement without relying on disconnected spreadsheets or messaging channels.

## Solution

SkillSphere provides a mobile-first platform where students can maintain a portfolio, track goals, and share performance insights. Faculty gain access to a dedicated dashboard for student monitoring, announcement management, and engagement analytics. The system combines a React Native mobile experience with a Node.js API and MongoDB backend.

## Features

### Authentication

- Student registration and login
- OTP verification for student onboarding
- Secure logout and session handling
- Faculty registration and login
- Faculty registration protected by an institutional access code

### Student Experience

- Profile management and portfolio builder
- Profile picture upload and QR-based sharing
- GitHub integration for public profile data
- LeetCode integration for coding progress tracking
- Goal setting and achievement tracking
- Opportunities feed for relevant programs and resources
- Announcements feed for campus updates

### Faculty Experience

- Faculty dashboard with engagement summaries
- Student directory and search
- Detailed student progress views
- Dashboard statistic cards for quick insights
- Announcement publishing and management
- Student progress monitoring across portfolios and activities

### Analytics & Engagement

- Leaderboard for student engagement
- XP system for progress measurement
- Activity tracking across student actions
- Coding progress monitoring through integrated services

## Screenshots

Add screenshots here

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile App | React Native, Expo, Expo Router, TypeScript |
| Backend API | Node.js, Express.js |
| Database | MongoDB, Mongoose |

## System Architecture

SkillSphere uses a mobile-first architecture connected to a REST API and document database:

React Native App
↓
Express API
↓
MongoDB

- The mobile app handles authentication, student and faculty workflows, and UI rendering.
- The Express API manages routes, authentication, access control, and data validation.
- MongoDB stores users, portfolios, achievements, announcements, and analytics data.

## Installation

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Expo CLI or `npx expo`

### Backend setup

```bash
cd server
npm install
cp .env.example .env
# Update server/.env with required values
npm run dev
```

### Frontend setup

```bash
cd mobile-app
npm install
cp .env.example .env
# Update mobile-app/.env with EXPO_PUBLIC_API_URL to point to the backend API
npm run start
```

### Environment variables

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing key
- `JWT_REFRESH_SECRET` — JWT refresh token key
- `EMAIL_USER` / `EMAIL_PASS` — email credentials for OTP delivery
- `EXPO_PUBLIC_API_URL` — backend API base URL used by the mobile app

> When testing on a physical device, use your development machine’s local network address for `EXPO_PUBLIC_API_URL`, for example `http://192.168.x.x:5000/api`.

## Faculty Registration Protection

Faculty registration requires an institutional access code. This access code is validated on the backend before allowing faculty account creation. The code is stored securely on the server side and is not included in the mobile client or public repository.

## Future Scope

- Push notifications for announcements and activity alerts
- Advanced analytics for student engagement and performance
- Multi-college support with institution-specific workflows
- Placement tracking and internship support
- Faculty verification workflow with approval controls

## Project Status

The project is currently in active development and is demo-ready. Core student and faculty workflows are implemented, with additional analytics and verification features planned for future releases.

## Contributors

- Manas Jyoti Nath

> Add contributors from the repository history if available.

## License

This project is released under the MIT License. See `LICENSE` for details.
