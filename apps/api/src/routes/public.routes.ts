import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import { monitors } from '../db/schema/index.js';
import { getMongoDB } from '../db/mongodb.js';

const router = Router();

// Cache for status responses (60 seconds)
const statusCache = new Map<string, { data: any; expiresAt: number }>();

// GET /api/public/monitors/:monitorId/status — public monitor status (no auth)
router.get('/monitors/:monitorId/status', async (req: Request, res: Response) => {
  try {
    const { monitorId } = req.params;

    // Check cache
    const cached = statusCache.get(monitorId);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }

    // Find monitor
    const [monitor] = await db
      .select()
      .from(monitors)
      .where(eq(monitors.id, monitorId))
      .limit(1);

    if (!monitor || !monitor.isActive) {
      return res.status(404).json({
        monitorId,
        name: 'Unknown',
        status: 'unknown',
        uptime: 0,
        lastCheck: null,
        avgResponseTime: 0,
      });
    }

    // Get ping logs from last 24 hours
    const mongoDb = getMongoDB();
    const pingLogs = mongoDb.collection('ping_logs');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const logs = await pingLogs
      .find({
        monitorId: monitor.id,
        timestamp: { $gte: twentyFourHoursAgo },
      })
      .sort({ timestamp: -1 })
      .toArray();

    if (logs.length === 0) {
      const response = {
        monitorId: monitor.id,
        name: monitor.name,
        status: 'unknown',
        uptime: 0,
        lastCheck: null,
        avgResponseTime: 0,
      };
      
      // Cache for 60 seconds
      statusCache.set(monitorId, {
        data: response,
        expiresAt: Date.now() + 60 * 1000,
      });
      
      return res.json(response);
    }

    // Calculate uptime
    const successfulPings = logs.filter((log) => log.statusCode >= 200 && log.statusCode < 300);
    const uptime = (successfulPings.length / logs.length) * 100;
    const avgResponseTime =
      logs.reduce((sum: number, log: any) => sum + (log.responseTimeMs || 0), 0) / logs.length;

    // Determine status
    let status: 'up' | 'down' | 'degraded' | 'unknown' = 'unknown';
    if (logs.length > 0) {
      const lastLog = logs[0];
      if (lastLog.success) {
        if (uptime >= 95) {
          status = 'up';
        } else if (uptime >= 80) {
          status = 'degraded';
        } else {
          status = 'down';
        }
      } else {
        status = 'down';
      }
    }

    const response = {
      monitorId: monitor.id,
      name: monitor.name,
      status,
      uptime: Math.round(uptime * 100) / 100,
      lastCheck: logs[0]?.timestamp || null,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    };

    // Cache for 60 seconds
    statusCache.set(monitorId, {
      data: response,
      expiresAt: Date.now() + 60 * 1000,
    });

    res.json(response);
  } catch (error) {
    console.error('Public status error:', error);
    res.status(500).json({
      monitorId: req.params.monitorId,
      name: 'Unknown',
      status: 'unknown',
      uptime: 0,
      lastCheck: null,
      avgResponseTime: 0,
    });
  }
});

// GET /api/public/status — system-wide status
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Check API health
    const apiHealth = { status: 'operational', lastCheck: new Date() };

    // Check worker health (last ping should be within last 2 minutes)
    const mongoDb = getMongoDB();
    const pingLogs = mongoDb.collection('ping_logs');
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const recentPings = await pingLogs
      .find({ timestamp: { $gte: twoMinutesAgo } })
      .limit(1)
      .toArray();

    const workerHealth = {
      status: recentPings.length > 0 ? 'operational' : 'degraded',
      lastCheck: recentPings[0]?.timestamp || null,
    };

    // Check database connectivity (PostgreSQL)
    let dbHealth = { status: 'operational' as 'operational' | 'degraded' | 'down' };
    try {
      await db.select().from(monitors).limit(1);
    } catch (error) {
      dbHealth.status = 'down';
    }

    res.json({
      services: [
        {
          name: 'API',
          status: apiHealth.status,
          description: 'REST API and authentication',
        },
        {
          name: 'Monitoring Workers',
          status: workerHealth.status,
          description: 'Ping checks and alerting',
          lastCheck: workerHealth.lastCheck,
        },
        {
          name: 'Database',
          status: dbHealth.status,
          description: 'PostgreSQL and MongoDB',
        },
      ],
      overall: dbHealth.status === 'operational' && workerHealth.status === 'operational' ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({
      services: [
        { name: 'API', status: 'down', description: 'REST API and authentication' },
        { name: 'Monitoring Workers', status: 'unknown', description: 'Ping checks and alerting' },
        { name: 'Database', status: 'unknown', description: 'PostgreSQL and MongoDB' },
      ],
      overall: 'down',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
