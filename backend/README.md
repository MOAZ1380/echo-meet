# Echo Meet Backend

NestJS backend for authentication, rooms, join approvals, and LiveKit token generation.

## Features

- JWT-based authentication (`/auth/register`, `/auth/login`)
- Password reset flow with OTP via email
- Room CRUD for authenticated users
- Join request workflow (pending/approve/reject)
- Realtime signaling with Socket.IO on port `8000`
- LiveKit access token generation for approved participants

## Tech Stack

- NestJS 11
- Prisma ORM
- PostgreSQL
- Socket.IO Gateway
- Nodemailer
- LiveKit Server SDK

## Setup

```bash
npm install
```

Create `.env` in `backend/`:

```env
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/echo_meet?schema=public"
JWT_SECRET="change-this-secret"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-pass"
SMTP_FROM="no-reply@echo-meet.local"
```

## Database

```bash
npx prisma migrate dev
npx prisma generate
```

## Run

```bash
# development
npm run start:dev

# production build
npm run build
npm run start:prod
```

## Useful Scripts

- `npm run start:dev`: run in watch mode
- `npm run build`: build TypeScript to `dist/`
- `npm run lint`: run eslint
- `npm run test`: run unit tests
- `npm run test:e2e`: run e2e tests

## API Overview

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/request-password-reset`
- `POST /auth/verify-password-reset-otp` (guarded)
- `POST /auth/reset-password` (guarded)

### Rooms (JWT required)

- `POST /rooms`
- `GET /rooms`
- `GET /rooms/:id`
- `PATCH /rooms/:id`
- `DELETE /rooms/:id`
- `POST /rooms/:id/join`
- `POST /rooms/:id/guest-join`
- `GET /rooms/:id/pending`
- `PATCH /rooms/:id/approve/:userId`
- `PATCH /rooms/:id/reject/:userId`
- `GET /rooms/:id/token`

### LiveKit

- `GET /livekit/token?userId=<id>&roomId=<roomId>`

## Socket.IO Events

Gateway runs on `http://localhost:8000` by default.

- Client -> Server: `requestJoin`, `approveUser`, `rejectUser`, `joinRoom`
- Server -> Client: `room:join-request`, `room:approved`, `room:rejected`, `userJoined`
