import mongoose from 'mongoose';

const MONGO_DEFAULT = 'mongodb://127.0.0.1:27017/therapease';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || MONGO_DEFAULT;
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected (worker)');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Connect to DB first, then start workers
await connectDB();

import './emailWorker.js';
import './reminderWorker.js';
import '../jobs/reminderScheduler.js';

console.log('All workers and schedulers initialized');
