import { Router, Response } from 'express';
import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import { monitors } from '../db/schema/index.js';
import { getMongoDB } from '../db/mongodb.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/:monitorId', async (req: AuthRequest, res: Response) => {
  try {
    const { monitorId } = req.params;
    const { startDate, endDate, limit = '100' } = req.query;

    // Verify monitor belongs to user
    const [monitor] = await db
      .select()
      .from(monitors)
      .where(and(eq(monitors.id, monitorId), eq(monitors.userId, req.userId!)))
      .limit(1);

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const mongoDb = getMongoDB();
    const pingLogs = mongoDb.collection('ping_logs');

    const query: any = { monitorId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate as string);
      }
    }

    const logs = await pingLogs
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string, 10))
      .toArray();

    res.json({ logs });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:monitorId/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { monitorId } = req.params;
    const { hours = '24' } = req.query;

    // Verify monitor belongs to user
    const [monitor] = await db
      .select()
      .from(monitors)
      .where(and(eq(monitors.id, monitorId), eq(monitors.userId, req.userId!)))
      .limit(1);

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const mongoDb = getMongoDB();
    const pingLogs = mongoDb.collection('ping_logs');

    const startDate = new Date();
    startDate.setHours(startDate.getHours() - parseInt(hours as string, 10));

    const logs = await pingLogs
      .find({
        monitorId,
        timestamp: { $gte: startDate },
      })
      .sort({ timestamp: 1 })
      .toArray();

    if (logs.length === 0) {
      return res.json({
        uptime: 0,
        avgResponseTime: 0,
        totalPings: 0,
        successfulPings: 0,
        failedPings: 0,
      });
    }

    const successfulPings = logs.filter((log) => log.statusCode >= 200 && log.statusCode < 300);
    const uptime = (successfulPings.length / logs.length) * 100;
    const avgResponseTime =
      logs.reduce((sum, log) => sum + (log.responseTimeMs || 0), 0) / logs.length;

    res.json({
      uptime: Math.round(uptime * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      totalPings: logs.length,
      successfulPings: successfulPings.length,
      failedPings: logs.length - successfulPings.length,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
