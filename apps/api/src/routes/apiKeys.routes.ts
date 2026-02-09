import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware.js';
import { requireCsrf } from '../middleware/csrf.middleware.js';
import { generateApiKey, listUserApiKeys, revokeApiKey } from '../services/apiKey.service.js';
import { eq } from 'drizzle-orm';
import { db } from '../db/postgres.js';
import { apiKeys } from '../db/schema/apiKeys.js';

const router = Router();

const createApiKeySchema = z.object({
  name: z.string().max(255).optional(),
});

router.use(requireAuth);

// POST /api/api-keys — create new API key
router.post('/', requireCsrf, async (req: AuthRequest, res: Response) => {
  try {
    const body = createApiKeySchema.parse(req.body);
    
    const result = await generateApiKey(req.userId!, body.name);
    
    res.status(201).json({
      key: result.key, // Return plain key only once
      keyId: result.keyId,
      name: result.name,
      message: 'API key created. Save this key now - it will not be shown again.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/api-keys — list user's API keys
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userKeys = await listUserApiKeys(req.userId!);
    
    // Mask keys for security
    const maskedKeys = userKeys.map((key) => ({
      id: key.id,
      name: key.name,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      isActive: key.isActive,
      createdAt: key.createdAt,
      keyPreview: `sc_live_${key.keyHash.substring(0, 4)}...${key.keyHash.substring(key.keyHash.length - 4)}`, // Show hash preview
    }));
    
    res.json({ apiKeys: maskedKeys });
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/api-keys/:id — revoke API key
router.delete('/:id', requireCsrf, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const revoked = await revokeApiKey(id, req.userId!);
    
    if (!revoked) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
