import { Request, Response, NextFunction } from 'express';
import { verifyApiKey } from '../services/apiKey.service.js';
import { eq } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import { users } from '../db/schema/index.js';
import { AuthRequest } from './auth.middleware.js';

export async function requireApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  // Check if it's an API key (starts with sc_live_)
  if (!authHeader?.startsWith('Bearer sc_live_')) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key format' });
  }
  
  const key = authHeader.slice(7); // Remove "Bearer "
  
  const keyInfo = await verifyApiKey(key);
  if (!keyInfo) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired API key' });
  }
  
  // Get user
  const [user] = await db.select().from(users).where(eq(users.id, keyInfo.userId)).limit(1);
  
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Unauthorized: User not found or inactive' });
  }
  
  req.userId = keyInfo.userId;
  req.user = user;
  next();
}
