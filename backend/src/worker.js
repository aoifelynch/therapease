// Worker process for handling background jobs with BullMQ
// This file will be populated when you add your queue workers

console.log('Worker process starting...');

// TODO: Initialize BullMQ workers here
// Example:
// import { Worker } from 'bullmq';
// 
// const worker = new Worker('queueName', async (job) => {
//   // Process job
//   console.log('Processing job:', job.id);
// }, {
//   connection: {
//     host: process.env.REDIS_HOST || 'redis',
//     port: process.env.REDIS_PORT || 6379
//   }
// });

console.log('Worker ready. Waiting for jobs...');

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('Worker shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Worker shutting down...');
  process.exit(0);
});

// Keep alive (prevents worker from exiting)
setInterval(() => {
  // This keeps the process running
}, 60000); // Check every minute
