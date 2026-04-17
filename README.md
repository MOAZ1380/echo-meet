# Echo Meet

Echo Meet is a full-stack video meeting platform with:

- JWT authentication
- room creation and join approval flow
- realtime updates over Socket.IO
- video/audio meetings powered by LiveKit
- password reset using OTP via email

## Project Structure

```text
echo-meet/
├── backend/   # NestJS + Prisma + PostgreSQL + Socket.IO
└── frontend/  # React + Vite + LiveKit client
```

## Tech Stack

- Frontend: React, Vite, TypeScript, LiveKit Client, Socket.IO Client
- Backend: NestJS, Prisma, PostgreSQL, Socket.IO Gateway, JWT
- Realtime/Media: Socket.IO (approval workflow), LiveKit (media tracks)

## Quick Start

### 1) Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

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

Run Prisma and start backend:

```bash
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

### 2) Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL="http://localhost:3000"
VITE_LIVEKIT_URL="ws://localhost:7880"
```

Run frontend:

```bash
npm run dev
```

## Service Ports

- Frontend (Vite): default `5173`
- Backend REST API: `3000` (or `PORT`)
- Backend Socket.IO Gateway: `8000`
- LiveKit server: commonly `7880` (configure as needed)

## Screenshots

### Login

![Login Screenshot](docs/images/login.png)

### Home

![Home Screenshot](docs/images/home.png)

### Lobby

![Lobby Screenshot](docs/images/lobby.png)

### Meeting Room

![Meeting Room Screenshot](docs/images/meeting.png)
![Meeting Room Screenshot](docs/images/camera.jpg)

### Grid View

![Grid View Screenshot](docs/images/grid.png)

### Chat & Communication

![Chat Screenshot](docs/images/chat.png)

### Participants

![Participants Screenshot](docs/images/people.png)

## More Details

- Backend docs: see `backend/README.md`
- Frontend docs: see `frontend/README.md`
