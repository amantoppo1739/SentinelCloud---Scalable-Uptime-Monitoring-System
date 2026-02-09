import { Router, Response } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import { monitors, type NewMonitor } from '../db/schema/index.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware.js';
import { requireCsrf } from '../middleware/csrf.middleware.js';

const router = Router();

const createMonitorSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  alertEmail: z.string().email().optional(),
  webhookUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

const updateMonitorSchema = createMonitorSchema.partial();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userMonitors = await db
      .select()
      .from(monitors)
      .where(eq(monitors.userId, req.userId!));

    res.json({ monitors: userMonitors });
  } catch (error) {
    console.error('Get monitors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const [monitor] = await db
      .select()
      .from(monitors)
      .where(and(eq(monitors.id, req.params.id), eq(monitors.userId, req.userId!)))
      .limit(1);

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    res.json({ monitor });
  } catch (error) {
    console.error('Get monitor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireCsrf, async (req: AuthRequest, res: Response) => {
  try {
    const body = createMonitorSchema.parse(req.body);
    
    const [monitor] = await db
      .insert(monitors)
      .values({
        userId: req.userId!,
        name: body.name,
        url: body.url,
        alertEmail: body.alertEmail,
        webhookUrl: body.webhookUrl,
        isActive: body.isActive ?? true,
      } as NewMonitor)
      .returning();

    res.status(201).json({ monitor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create monitor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', requireCsrf, async (req: AuthRequest, res: Response) => {
  try {
    const body = updateMonitorSchema.parse(req.body);
    
    const [monitor] = await db
      .update(monitors)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(eq(monitors.id, req.params.id), eq(monitors.userId, req.userId!)))
      .returning();

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    res.json({ monitor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update monitor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireCsrf, async (req: AuthRequest, res: Response) => {
  try {
    const [monitor] = await db
      .delete(monitors)
      .where(and(eq(monitors.id, req.params.id), eq(monitors.userId, req.userId!)))
      .returning();

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    res.json({ message: 'Monitor deleted successfully' });
  } catch (error) {
    console.error('Delete monitor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
