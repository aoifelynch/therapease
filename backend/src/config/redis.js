import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, 
});

redisConnection.on("connect", () => {
  console.log("Redis connected");
});

redisConnection.on("error", (err) => {
  console.error("Redis error:", err);
});

export default redisConnection;