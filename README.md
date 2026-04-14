# Anax — standalone Usage dashboard

Export of the Helix `/usage` experience (full viewport, no app sidebar).

## Setup

```bash
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_BASE_URL to your API origin.
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You are redirected to **`/login`** until you complete facility sign-in (same flow as Helix admin: choose facility → email/password → OTP). After verification, the app sets `helix-session` and optional `helix-facility` cookies and loads the dashboard.

Use **Sign out** in the dashboard header to clear the session.

## Data / auth

Proxies match Helix: `NEXT_PUBLIC_API_BASE_URL` should point at the same backend Helix uses. Login uses `/api/proxy/facilities`, `/api/proxy/auth/admin/login`, and `/api/proxy/auth/admin/verify-otp`. Analytics uses `/api/proxy/analytics` with the session cookie.

## Production

```bash
npm run build && npm start
```

Set `NEXT_PUBLIC_API_BASE_URL` in the deployment environment.
