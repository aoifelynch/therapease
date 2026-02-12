# Docker Setup for TherapEase Backend

## Quick Start

### Start all services (backend + MongoDB):
```bash
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
```

### Stop and remove volumes (clears database):
```bash
docker-compose down -v
```

## Services

- **Backend**: http://localhost:3001
- **MongoDB**: localhost:27017

## Environment Variables

Copy `.env.example` to `.env` and update values:
- `MONGODB_URI`: MongoDB connection string (default: `mongodb://mongo:27017/therapease`)
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `JWT_ACCESS_EXPIRY`: Access token expiration (default: 15m)
- `JWT_REFRESH_EXPIRY`: Refresh token expiration (default: 7d)

## Notes

- MongoDB data persists in a Docker volume `mongo-data`
- Backend code is mounted as a volume for hot-reload during development
- If running backend locally (outside Docker), change `MONGODB_URI` to `mongodb://localhost:27017/therapease`
