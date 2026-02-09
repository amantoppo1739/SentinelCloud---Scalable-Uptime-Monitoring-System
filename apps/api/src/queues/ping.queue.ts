import { Queue } from 'bullmq';
import { redis } from '../db/redis.js';

export const pingQueue = new Queue('monitor-pings', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000,
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

// Set up repeatable job to run every 60 seconds
export async function setupPingSchedule() {
  await pingQueue.add(
    'ping-all-monitors',
    {},
    {
      repeat: {
        every: 60000, // 60 seconds
      },
      jobId: 'ping-all-monitors-repeat',
    }
  );
  console.log('✅ Ping schedule configured (every 60 seconds)');
}
