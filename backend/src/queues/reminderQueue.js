import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

export const reminderQueue = new Queue("sms-reminders", {
  connection: redisConnection
});