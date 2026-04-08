# TherapEase

TherapEase is a therapist-focused practice management application that helps reduce day-to-day admin work by combining client management, scheduling, notes, reminders, and payments in one platform.

## Features

- User authentication with optional 2FA
- Client management
- Appointment scheduling and calendar view
- Clinical notes and file/document management
- Stripe payment checkout and webhook processing
- Automated email receipts and notifications
- SMS reminder support (Twilio)
- Background jobs and queues (BullMQ + Redis)

## Tech Stack

- Frontend: React + Vite + Tailwind
- Backend: Node.js + Express
- Database: MongoDB
- Queue/Cache: Redis + BullMQ
- Payments: Stripe
- Video integration: Zoom
- Email: Nodemailer
- SMS: Twilio

## Repository Structure

- `frontend/`: React application
- `backend/`: Express API, workers, and Docker setup
- `e2e/`: end-to-end test area

## Prerequisites

- Node.js 18+
- npm
- MongoDB (if running locally without Docker)
- Redis (if running locally without Docker)
- Docker Desktop (optional, recommended for backend services)
- Stripe CLI (optional, recommended for local webhook testing)

## Environment Configuration

### Backend

1. Copy env template:

```bash
cd backend
cp .env.example .env
```

2. Update required values in `backend/.env`:

- `PORT` (default `3001`)
- `MONGODB_URI`
- `REDIS_URL`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL` (default `http://localhost:5173`)
- Any optional integrations you plan to use (Twilio/Zoom/Email)

Note:
- For Docker backend: `MONGODB_URI=mongodb://mongo:27017/therapease`
- For local backend: use a localhost Mongo URI (for example `mongodb://127.0.0.1:27017/therapease`)

### Frontend

The frontend reads:

- `VITE_API_URL` (optional)

If unset, it defaults to:

- `http://localhost:3001/api`

You can create `frontend/.env` with:

```bash
VITE_API_URL=http://localhost:3001/api
```

## Installation

Install dependencies for both apps:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Running the App

### Option A: Run Backend Locally (without Docker)

1. Ensure MongoDB and Redis are running locally.
2. Start backend:

```bash
cd backend
npm run dev
```

Backend default URL: `http://localhost:3001`

### Option B: Run Backend with Docker

```bash
cd backend
docker-compose up -d
```

Useful Docker commands:

```bash
docker-compose logs -f backend
docker-compose down
docker-compose down -v
```

### Run Frontend

```bash
cd frontend
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Stripe Local Webhook Setup

The backend webhook endpoint is:

- `POST /api/webhook/stripe`

From the repository root (or anywhere), run:

```bash
stripe listen --forward-to http://localhost:3001/api/webhook/stripe
```

Then copy the `whsec_...` value shown by Stripe CLI into:

- `backend/.env` as `STRIPE_WEBHOOK_SECRET`

Optional quick test event:

```bash
stripe trigger checkout.session.completed
```

## Backend Scripts

From `backend/`:

- `npm run dev`: start API in watch mode
- `npm run start`: start API
- `npm run workers`: start queue workers
- `npm run workers:dev`: start queue workers in watch mode
- `npm test`: run tests

## Frontend Scripts

From `frontend/`:

- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run lint`: run ESLint

## API Surface (High-Level)

The backend exposes routes under `/api`, including:

- `/api/auth`
- `/api/2fa`
- `/api/clients`
- `/api/appointments`
- `/api/notes`
- `/api/files`
- `/api/reminders`
- `/api/todos`
- `/api/payments`
- `/api/webhook/stripe`

## Troubleshooting

- Stripe CLI `404` on webhook:
	- Ensure you are forwarding to `http://localhost:3001/api/webhook/stripe` (not `/api/webhook`).
- Stripe CLI connection refused:
	- Ensure backend is running and listening on port `3001`.
- CORS/auth issues from frontend:
	- Confirm `FRONTEND_URL` and `VITE_API_URL` are aligned.

## Notes

- This project is under active development; functionality and setup may evolve.
