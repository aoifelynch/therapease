import nodemailer from "nodemailer";
import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";

console.log("Email Worker starting...");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const worker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("Processing job:", job.name);

    const { to, subject, html } = job.data;

    await transporter.sendMail({
      from: `"TherapEase" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to}`);
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
