# SkillSphere

SkillSphere is a full-stack student growth tracking platform for students, faculty, and administrators. It combines skill tracking, project portfolios, coding analytics, goals, achievements, opportunity matching, notifications, leaderboards, and role-based dashboards in one web app.

## Tech Stack

**Frontend**

- React 18
- React Router 6
- Tailwind CSS
- Framer Motion
- Recharts
- Axios
- React Query
- React Hot Toast

**Backend**

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Email OTP verification with Nodemailer
- bcryptjs password hashing
- Helmet, CORS, Morgan, and rate limiting
- Multer file uploads

## Project Structure

```txt
skillsphere-full/
+-- client/          React frontend
+-- server/          Express API and MongoDB models
+-- package.json     Root scripts for install, dev, seed, and build
`-- README.md
```

## Features

- Public landing, login, registration, and OTP verification
- JWT-based auth with refresh tokens
- Role-based access for students, faculty, and admins
- Student dashboard for profile, skills, goals, projects, analytics, and recommendations
- Faculty dashboard for student visibility and academic/career insights
- Admin dashboard for platform-level management
- Coding profile stats for LeetCode, Codeforces, and GitHub
- XP, achievements, streaks, and leaderboards
- Opportunity feed with student applications and matching
- Notifications and broadcast announcements
- Career recommendation profile, history, and generated guidance

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB running locally or a MongoDB Atlas connection string
- Gmail app password or SMTP-compatible credentials for OTP emails

## Setup

Install root dependencies and both app workspaces:

```bash
npm install
npm run install:all
```

Create the backend environment file:

```bash
cd server
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Update `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/skillsphere
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=replace_with_another_long_random_secret
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:3000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Seed demo data:

```bash
npm run seed
```

Start the frontend and backend together:

```bash
npm run dev
```

## Local URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

## Demo Accounts

After running `npm run seed`, use these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@nit.edu` | `Admin@1234` |
| Faculty | `faculty@nit.edu` | `Faculty@1234` |
| Student | `arjun@nit.edu` | `Student@1234` |
| Student | `priya@nit.edu` | `Student@1234` |
| Student | `<student-first-name>@nit.edu` | `Student@1234` |

The seeder creates ten student profiles with skills, goals, projects, opportunities, achievements, and notifications.

## Scripts

Run from the repository root:

```bash
npm run install:all   # install server and client dependencies
npm run dev           # run server and client concurrently
npm run server        # run only the Express server with nodemon
npm run client        # run only the React client
npm run seed          # seed MongoDB with demo data
npm run build         # build the React app
```

Server-only scripts from `server/`:

```bash
npm run dev
npm start
npm run seed
```

Client-only scripts from `client/`:

```bash
npm start
npm run build
```

## Frontend Routes

| Route | Page | Access |
| --- | --- | --- |
| `/` | Landing or role dashboard redirect | Public/auth-aware |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/verify-otp` | OTP verification | Public |
| `/dashboard` | Student dashboard | Student |
| `/profile` | Student profile | Student |
| `/skills` | Skills and goals | Student |
| `/projects` | Project portfolio | Student |
| `/recommendations` | Career recommendations | Student |
| `/faculty` | Faculty dashboard | Faculty, Admin |
| `/students` | Student management view | Faculty, Admin |
| `/admin` | Admin dashboard | Admin |
| `/leaderboard` | Leaderboard | Authenticated users |
| `/opportunities` | Opportunities | Authenticated users |
| `/notifications` | Notifications | Authenticated users |
| `/analytics` | Analytics | Authenticated users |
| `/settings` | Settings | Authenticated users |

## API Overview

Base URL: `http://localhost:5000/api`

```txt
GET    /health

POST   /auth/register
POST   /auth/verify-otp
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
PUT    /auth/profile

GET    /users
GET    /users/:id
PUT    /users/:id
DELETE /users/:id
PUT    /users/:id/coding-stats
PUT    /users/:id/import/leetcode
PUT    /users/:id/import/github
POST   /users/:id/certifications
POST   /users/:id/showcase

GET    /skills
POST   /skills
PUT    /skills/:id
DELETE /skills/:id

GET    /goals
POST   /goals
PUT    /goals/:id
DELETE /goals/:id
PUT    /goals/:id/milestones/:milestoneId/toggle

GET    /projects
POST   /projects
PUT    /projects/:id
DELETE /projects/:id
POST   /projects/:id/like

GET    /opportunities
POST   /opportunities
PUT    /opportunities/:id
DELETE /opportunities/:id
POST   /opportunities/:id/apply
GET    /opportunities/:id/matched-students

GET    /achievements
GET    /achievements/my
GET    /leaderboard
GET    /leaderboard/department-summary

GET    /analytics/my-stats
GET    /analytics/overview
GET    /analytics/skills-distribution
GET    /analytics/aspirations
GET    /analytics/coding-activity
GET    /analytics/placement-readiness

GET    /notifications
PUT    /notifications/mark-all-read
PUT    /notifications/:id/read
POST   /notifications/broadcast

GET    /recommendations/profile
PUT    /recommendations/profile
POST   /recommendations/generate
GET    /recommendations/latest
GET    /recommendations/history
GET    /recommendations/dashboard-summary
```

Most endpoints require an `Authorization: Bearer <token>` header after login.

## Production Build

Build the React client:

```bash
npm run build
```

Start the API:

```bash
cd server
npm start
```

If you want Express to serve the built React app, add static serving in `server/index.js` and point it at `../client/build`.

## Notes

- The React client proxies API requests to `http://localhost:5000` in development.
- Uploaded files are served from `/uploads`.
- `npm run seed` clears existing seeded collections before inserting demo data.
- Keep real secrets out of Git. Use `server/.env.example` as the template and store actual credentials in `server/.env`.
