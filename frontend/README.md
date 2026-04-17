# Echo Meet Frontend

React + Vite client for Echo Meet. It handles authentication screens, lobby flow, realtime join approvals, and LiveKit meeting room UI.

## Features

- Authentication pages (login, register, forgot/reset password)
- Room lobby and waiting workflow
- Meeting room with video/audio and chat
- Realtime updates via Socket.IO
- API integration with backend (JWT-based flows)

## Tech Stack

- React 18 + TypeScript
- Vite
- LiveKit Client
- Socket.IO Client
- Tailwind CSS + UI component libraries

## Setup

```bash
npm install
```

Create `.env` in `frontend/`:

```env
VITE_API_URL="http://localhost:3000"
VITE_LIVEKIT_URL="ws://localhost:7880"
```

Run development server:

```bash
npm run dev
```

## Routes

- `/` -> Home
- `/login` -> Login
- `/register` -> Register
- `/forgot-password` -> Request reset OTP
- `/reset-code` -> Verify reset code
- `/new-password` -> Set new password
- `/lobby/:meetingId` -> Waiting room / approval stage
- `/meeting/:meetingId` -> Live meeting room

## Backend Integration Notes

- REST API base URL comes from `VITE_API_URL`
- LiveKit URL comes from `VITE_LIVEKIT_URL`
- Socket.IO URL is currently fixed in code to `http://localhost:8000`
  - If your backend socket port changes, update `src/app/services/socketService.ts`

## Build

```bash
npm run build
```
