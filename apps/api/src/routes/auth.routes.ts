import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq } from 'drizzle-orm';
import { loginUser, registerUser, revokeRefreshToken, verifyRefreshToken, generateAccessToken, generateRefreshToken, generatePasswordResetToken, resetPassword, verifyPasswordResetToken, revokeAllUserTokens } from '../services/auth.service.js';
import { sendPasswordResetEmail } from '../services/alert.service.js';
import { authRateLimiter, refreshRateLimiter, registerRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimit.middleware.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware.js';
import { requireCsrf, generateCsrfToken, getCsrfToken } from '../middleware/csrf.middleware.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { db } from '../db/postgres.js';
import { users } from '../db/schema/index.js';
import { s3Client, S3_BUCKET } from '../config/s3.js';

const router = Router();

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_SIZE },
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

// CSRF token endpoint
router.get('/csrf-token', (req: Request, res: Response) => {
  const token = generateCsrfToken(req);
  res.json({ csrfToken: token });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
});

router.post('/register', registerRateLimiter, requireCsrf, async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);
    
    // Validate password strength
    const passwordValidation = validatePassword(body.password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors,
        strength: passwordValidation.strength,
      });
    }
    
    const user = await registerUser(body.email, body.password, body.name);
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    if (error instanceof Error && error.message.includes('unique')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);
    const tokens = await loginUser(body.email, body.password);

    if (!tokens) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Set refresh token as HTTP-only cookie (sameSite: lax so cookie is sent on same-site API calls from frontend)
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', refreshRateLimiter, async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const user = await verifyRefreshToken(refreshToken);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = await generateRefreshToken(user.id);

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Set new refresh token
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not found' });
  }
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatarKey: req.user.avatarKey ?? undefined,
    },
  });
});

// GET /api/auth/me/avatar — presigned URL for current user's avatar (1h)
router.get('/me/avatar', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!req.user?.avatarKey || !s3Client || !S3_BUCKET) {
    return res.status(404).json({ error: 'No avatar or storage not configured' });
  }
  try {
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: req.user.avatarKey }),
      { expiresIn: 3600 }
    );
    res.json({ url });
  } catch (error) {
    console.error('Avatar presigned URL error:', error);
    res.status(500).json({ error: 'Failed to get avatar URL' });
  }
});

// POST /api/auth/me/avatar — upload avatar (multipart form field: avatar)
router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  if (!req.userId || !s3Client || !S3_BUCKET) {
    return res.status(503).json({ error: 'Avatar storage not configured' });
  }
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded; use form field "avatar"' });
  }
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type; use JPEG, PNG, or WebP' });
  }
  const ext = file.mimetype === 'image/jpeg' ? 'jpg' : file.mimetype === 'image/png' ? 'png' : 'webp';
  const key = `avatars/${req.userId}.${ext}`;
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    await db.update(users).set({ avatarKey: key, updatedAt: new Date() }).where(eq(users.id, req.userId));
    res.json({ message: 'Avatar updated', avatarKey: key });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// DELETE /api/auth/me/avatar — remove avatar
router.delete('/me/avatar', requireAuth, requireCsrf, async (req: AuthRequest, res: Response) => {
  if (!req.user?.avatarKey) {
    return res.json({ message: 'Avatar removed' });
  }
  if (s3Client && S3_BUCKET) {
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: req.user.avatarKey }));
    } catch (error) {
      console.error('Avatar delete error:', error);
    }
  }
  await db.update(users).set({ avatarKey: null, updatedAt: new Date() }).where(eq(users.id, req.userId!));
  res.json({ message: 'Avatar removed' });
});

// POST /api/auth/forgot-password — request password reset
router.post('/forgot-password', passwordResetRateLimiter, async (req: Request, res: Response) => {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    
    const response: { message: string; resetLink?: string } = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
    
    if (user && user.isActive) {
      const resetToken = await generatePasswordResetToken(user.id);
      try {
        const { sent } = await sendPasswordResetEmail(user.email, resetToken, user.name || undefined);
        // In development, if email was not sent (SES not configured), return reset link so testing works
        if (!sent && process.env.NODE_ENV === 'development') {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          response.resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
          response.message = 'Email is not configured (SES). In development, use the link below to reset your password.';
        }
      } catch (emailError) {
        console.error('Forgot password email error:', emailError);
        if (process.env.NODE_ENV === 'development') {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          response.resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
          response.message = 'Email could not be sent. In development, use the link below to reset your password.';
        }
      }
    }
    
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Forgot password error:', error);
    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
  }
});

// POST /api/auth/reset-password — reset password with token
router.post('/reset-password', passwordResetRateLimiter, async (req: Request, res: Response) => {
  try {
    const body = resetPasswordSchema.parse(req.body);
    
    // Validate password strength
    const passwordValidation = validatePassword(body.newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors,
        strength: passwordValidation.strength,
      });
    }
    
    const user = await resetPassword(body.token, body.newPassword);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    res.json({ 
      message: 'Password reset successfully. Please log in with your new password.' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify-reset-token — verify reset token validity
router.post('/verify-reset-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    const user = await verifyPasswordResetToken(token);
    res.json({ valid: !!user });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/auth/me — update profile (name, email)
router.patch('/me', requireAuth, requireCsrf, async (req: AuthRequest, res: Response) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    
    if (!body.name && !body.email) {
      return res.status(400).json({ error: 'At least one field (name or email) must be provided' });
    }
    
    // Check email uniqueness if updating email
    if (body.email) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);
      
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }
    
    const updateData: any = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, req.userId!))
      .returning();
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarKey: updatedUser.avatarKey ?? undefined,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/me/change-password — change password
router.post('/me/change-password', requireAuth, requireCsrf, async (req: AuthRequest, res: Response) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Verify current password
    const { verifyPassword } = await import('../services/auth.service.js');
    const isValid = await verifyPassword(body.currentPassword, req.user.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Validate new password strength
    const passwordValidation = validatePassword(body.newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors,
        strength: passwordValidation.strength,
      });
    }
    
    // Hash new password
    const { hashPassword } = await import('../services/auth.service.js');
    const passwordHash = await hashPassword(body.newPassword);
    
    // Update password
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.userId!));
    
    // Revoke all refresh tokens (force re-login on all devices)
    await revokeAllUserTokens(req.userId!);
    
    res.json({ message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
