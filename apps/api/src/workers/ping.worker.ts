import { Worker } from 'bullmq';
import { redis } from '../db/redis.js';
import { db } from '../db/postgres.js';
import { monitors } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getMongoDB } from '../db/mongodb.js';
import { sendAlerts, sendRecoveryAlerts } from '../services/alert.service.js';
import got from 'got';
import { connectMongoDB } from '../db/mongodb.js';

async function pingUrl(url: string, timeout: number = 10000): Promise<{
  statusCode: number;
  responseTimeMs: number;
  success: boolean;
}> {
  const startTime = Date.now();
  
  try {
    const response = await got(url, {
      timeout: {
        request: timeout,
      },
      retry: {
        limit: 0, // No retries for monitoring
      },
      throwHttpErrors: false, // Don't throw on 4xx/5xx
    });

    const responseTimeMs = Date.now() - startTime;
    const success = response.statusCode >= 200 && response.statusCode < 300;

    return {
      statusCode: response.statusCode,
      responseTimeMs,
      success,
    };
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    
    // Determine status code from error
    let statusCode = 0;
    if (error.response) {
      statusCode = error.response.statusCode;
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      statusCode = 408; // Request Timeout
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      statusCode = 503; // Service Unavailable
    } else {
      statusCode = 500; // Internal Server Error
    }

    return {
      statusCode,
      responseTimeMs,
      success: false,
    };
  }
}

async function processPingJob() {
  console.log('🔄 Starting ping job...');
  
  try {
    // Get all active monitors
    const activeMonitors = await db
      .select()
      .from(monitors)
      .where(eq(monitors.isActive, true));

    console.log(`📊 Found ${activeMonitors.length} active monitors`);

    const mongoDb = getMongoDB();
    const pingLogs = mongoDb.collection('ping_logs');

    // Ping each monitor
    for (const monitor of activeMonitors) {
      try {
        const result = await pingUrl(monitor.url);

        // Get previous ping for this monitor (for state-based alerting)
        const previousLog = await pingLogs
          .find({ monitorId: monitor.id })
          .sort({ timestamp: -1 })
          .limit(1)
          .next();

        const wasUp = previousLog == null || previousLog.success === true;
        const wasDown = previousLog != null && previousLog.success === false;
        const isUp = result.success;
        const isDown = !result.success;
        const transitionToDown = isDown && wasUp;
        const transitionToUp = isUp && wasDown;

        // Store ping log in MongoDB
        const pingTimestamp = new Date();
        await pingLogs.insertOne({
          monitorId: monitor.id,
          timestamp: pingTimestamp,
          statusCode: result.statusCode,
          responseTimeMs: result.responseTimeMs,
          success: result.success,
        });

        console.log(`✅ ${monitor.name}: ${result.statusCode} (${result.responseTimeMs}ms)`);

        // Send alert when monitor transitions from up → down
        if (transitionToDown && (monitor.alertEmail || monitor.webhookUrl)) {
          console.log(`🚨 Alert triggered for ${monitor.name} (state changed to down)`);
          await sendAlerts({
            monitorName: monitor.name,
            url: monitor.url,
            statusCode: result.statusCode,
            responseTimeMs: result.responseTimeMs,
            email: monitor.alertEmail || undefined,
            webhookUrl: monitor.webhookUrl || undefined,
          });
        }

        // Send recovery alert when monitor transitions from down → up
        if (transitionToUp && (monitor.alertEmail || monitor.webhookUrl) && previousLog) {
          console.log(`✅ Recovery alert triggered for ${monitor.name} (state changed to up)`);
          await sendRecoveryAlerts({
            monitorName: monitor.name,
            url: monitor.url,
            downSince: previousLog.timestamp,
            recoveredAt: pingTimestamp,
            email: monitor.alertEmail || undefined,
            webhookUrl: monitor.webhookUrl || undefined,
          });
        }
      } catch (error) {
        console.error(`❌ Error pinging ${monitor.name}:`, error);
      }
    }

    console.log('✅ Ping job completed');
  } catch (error) {
    console.error('❌ Ping job error:', error);
    throw error;
  }
}

// Create worker
const worker = new Worker(
  'monitor-pings',
  async (job) => {
    if (job.name === 'ping-all-monitors') {
      await processPingJob();
    }
  },
  {
    connection: redis,
    concurrency: 1, // Process one job at a time
  }
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

console.log('✅ Ping worker started');

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down worker...');
  await worker.close();
  process.exit(0);
});
