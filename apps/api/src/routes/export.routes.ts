import { Router, Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import { monitors } from '../db/schema/index.js';
import { getMongoDB } from '../db/mongodb.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware.js';
import env from '../config/env.js';

const router = Router();

router.use(requireAuth);

const s3Client = env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET_NAME
  ? new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    })
  : null;

router.post('/csv/:monitorId', async (req: AuthRequest, res: Response) => {
  try {
    const { monitorId } = req.params;
    const { startDate, endDate } = req.query;

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
      .toArray();

    // Generate CSV
    const csvHeader = 'Timestamp,Status Code,Response Time (ms),Success\n';
    const csvRows = logs.map((log) => {
      const timestamp = new Date(log.timestamp).toISOString();
      const statusCode = log.statusCode || '';
      const responseTime = log.responseTimeMs || '';
      const success = log.success ? 'Yes' : 'No';
      return `${timestamp},${statusCode},${responseTime},${success}`;
    });
    const csv = csvHeader + csvRows.join('\n');

    // Upload to S3 if configured
    if (s3Client && env.S3_BUCKET_NAME) {
      const fileName = `reports/${req.userId}/${monitorId}-${Date.now()}.csv`;
      
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: fileName,
          Body: csv,
          ContentType: 'text/csv',
        })
      );

      // Generate presigned download URL (valid for 1 hour)
      const downloadUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: fileName,
        }),
        { expiresIn: 3600 }
      );

      return res.json({
        message: 'Report exported successfully',
        downloadUrl,
        s3Key: fileName,
      });
    } else {
      // Return CSV directly if S3 not configured
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="monitor-${monitorId}-${Date.now()}.csv"`);
      return res.send(csv);
    }
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/presigned-url/:s3Key', async (req: AuthRequest, res: Response) => {
  try {
    if (!s3Client || !env.S3_BUCKET_NAME) {
      return res.status(503).json({ error: 'S3 not configured' });
    }

    const s3Key = decodeURIComponent(req.params.s3Key);
    
    // Verify the S3 key belongs to the user
    if (!s3Key.startsWith(`reports/${req.userId}/`)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const presignedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: s3Key,
      }),
      { expiresIn: 3600 } // 1 hour
    );

    res.json({ url: presignedUrl });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
