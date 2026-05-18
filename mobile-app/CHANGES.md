# SkillSphere Mobile — Fix Summary

## Files Changed

| File | Status | Key Change |
|------|--------|------------|
| `app/index.tsx` | **NEW** | Auth-aware entry point — redirects to `/login` or `/(tabs)` |
| `app/_layout.tsx` | Fixed | Removed `unstable_settings`, registered `index` screen |
| `app/login.tsx` | Fixed | Uses centralized `authAPI`, added Sign up link |
| `app/register.tsx` | Fixed | Fixed `fullName` → `name` bug, uses centralized `authAPI` |
| `app/otp-verification.tsx` | Fixed | Uses centralized `authAPI.verifyOtp()` |
| `app/(tabs)/profile.tsx` | Fixed | Real API data + working Logout button |
| `app/(tabs)/leaderboard.tsx` | Fixed | Connects to real `/leaderboard` endpoint |
| `app/(tabs)/notifications.tsx` | Fixed | Connects to real `/notifications` endpoint |
| `app/(tabs)/_components/skill-screen.tsx` | Fixed | Added `refreshControl` prop support |
| `lib/api.ts` | Fixed | Added `authAPI.login/register/verifyOtp/logout`, `leaderboardAPI`, `notificationsAPI`, 10s timeout |
| `app.json` | Fixed | Removed `reactCompiler`, fixed slug/name/colors |

---

## Bug-by-Bug Breakdown

### 1. Expo Router 404
**Root cause:** No `app/index.tsx` existed. Expo Router v4+ requires a root index file as the entry
point. Without it, the router had no starting point and returned 404.

**Fix:** Created `app/index.tsx` that reads AsyncStorage for a JWT token and redirects:
- If token exists → `/(tabs)` (user is already logged in)
- If no token → `/login`

Also removed `unstable_settings = { anchor: '(tabs)' }` from `_layout.tsx` — this is a deprecated/
experimental API that can conflict with the router.

---

### 2. Register sends wrong field name (`fullName` vs `name`)
**Root cause:** `register.tsx` was posting `{ fullName: ... }` but the Express controller does:
```js
const { name, email, password, department, rollNumber, semester } = req.body;
```
So `name` was always `undefined`, causing Mongoose validation to fail.

**Fix:** Changed state variable from `fullName` to `name` and the POST body now sends `{ name }`.

---

### 3. Fragmented API config (3 separate `API_BASE_URL` constants)
**Root cause:** `login.tsx`, `register.tsx`, and `otp-verification.tsx` all had their own hardcoded
`const API_BASE_URL = 'http://10.38.159.20:5000/api'`. Any IP change required editing 3 files.

**Fix:** All screens now import from `@/lib/api` — one single source of truth. The IP is only
defined in `lib/api.ts`.

---

### 4. Login screen used raw axios instead of intercepted instance
**Root cause:** `login.tsx` imported `axios` directly and called `axios.post(...)`. This bypassed
the request interceptor that auto-attaches JWT headers, and the response interceptor that handles
401s.

**Fix:** Login now uses `authAPI.login()` from `lib/api.ts`, which uses the configured axios
instance.

---

### 5. `reactCompiler: true` in `app.json`
**Root cause:** The React Compiler is an experimental Babel transform that requires additional
setup (`babel-plugin-react-compiler`). Without it installed, Metro bundler throws on startup.

**Fix:** Removed `reactCompiler: true` from `experiments`. `typedRoutes: true` is kept (it only
needs the TypeScript plugin, which Expo provides).

---

### 6. Profile/Leaderboard/Notifications were all static mocks
**Root cause:** The three tab screens used hardcoded dummy data (e.g., `const learners = [...]`).

**Fix:** All three now call real API endpoints and handle loading/error/refresh states properly.

---

### 7. No logout functionality
**Fix:** Profile screen now has a Logout button that:
1. Calls `POST /auth/logout` on the server
2. Removes the JWT from AsyncStorage  
3. Navigates back to `/login`

---

### 8. No navigation between login/register
**Fix:** Added "Don't have an account? Sign up" on the login screen, and "Already have an account?
Sign in" on the register screen.

---

## How to Run

### 1. Start the backend
```bash
cd server
npm run dev
# Check: http://10.38.159.20:5000/api/health should return {"status":"ok"}
```

### 2. Start the mobile app
```bash
cd mobile-app
npm install        # if you haven't already
npx expo start
```

Press `a` for Android, or scan the QR code in Expo Go.

### 3. If you change Wi-Fi / get a new IP
Update **one line** in `mobile-app/lib/api.ts`:
```ts
export const API_BASE_URL = 'http://YOUR_NEW_IP:5000/api';
```

---

## Remaining Known Issues

1. **Resend OTP** — The backend has no `/auth/resend-otp` endpoint yet. The button shows a
   message but doesn't actually re-send. Add this endpoint to `server/routes/auth.js` when ready.

2. **`register.tsx` does not send `department/rollNumber/semester`** — These fields are optional
   in the schema (schema shows them in the register body) but the register form only collects
   `name`, `email`, `password`, `role`. You can add those fields to the form later.

3. **Profile/Leaderboard/Notifications screens are basic** — They show real data now but are
   minimal. The full feature screens (skill management, goal editing, etc.) are yet to be built
   as mobile UI.

4. **`newArchEnabled: true`** is set in `app.json`. The new React Native architecture should
   work fine with all packages listed, but if you hit native module crashes on a physical device,
   try setting it to `false` temporarily.

5. **Expo Go + New Architecture** — On some Android versions, `newArchEnabled: true` with
   Expo Go can be unstable. Use a development build (`npx expo run:android`) for production-like
   testing.
