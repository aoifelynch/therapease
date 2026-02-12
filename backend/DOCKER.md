# Docker Setup for TherapEase Backend

## Quick Start

### Start all services (backend + worker + MongoDB + Redis):
```bash
cd src/docker
docker-compose up
```

### Start in detached mode (background):
```bash
docker-compose up -d
```

### Stop all services:
```bash
docker-compose down
```

### Rebuild after code changes:
```bash
docker-compose up --build
```

### View logs:
```bash
docker-compose logs -f backend
docker-compose logs -f worker
```

### Stop and remove volumes (clears database):
```bash
docker-compose down -v
```

## Services

- **Backend API**: http://localhost:3001
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **Worker**: Background job processor (BullMQ)

## Environment Variables

Copy `.env.example` to `.env` and update values:
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://mongo:27017/therapease`)
- `REDIS_URL`: Redis connection string (default: `redis://redis:6379`)
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `JWT_ACCESS_EXPIRY`: Access token expiration (default: 15m)
- `JWT_REFRESH_EXPIRY`: Refresh token expiration (default: 7d)

## Services Architecture

- **backend**: Express API server handling HTTP requests
- **worker**: BullMQ worker processing background jobs
- **mongo**: MongoDB database with persistent storage
- **redis**: Redis for BullMQ job queue

## Notes

- MongoDB data persists in Docker volume `mongo-data`
- Redis data persists in Docker volume `redis-data`
- Backend code is mounted as a volume for hot-reload during development
- Worker automatically restarts when code changes
- If running backend/worker locally (outside Docker), change connection strings to use `localhost` instead of service names

## Adding BullMQ Workers

Edit `src/worker.js` to add your queue workers. Install BullMQ first:

```bash
npm install bullmq
```

Then implement your workers in `src/worker.js`.
