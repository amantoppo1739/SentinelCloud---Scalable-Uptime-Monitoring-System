import { connectMongoDB } from './db/mongodb.js';
import { redis } from './db/redis.js';
import './workers/ping.worker.js';

async function start() {
  try {
    await connectMongoDB();
    console.log('✅ MongoDB connected (worker)');

    await redis.ping();
    console.log('✅ Redis connected (worker)');

    console.log('✅ Worker process started');
  } catch (error) {
    console.error('Failed to start worker:', error);
    process.exit(1);
  }
}

start();
