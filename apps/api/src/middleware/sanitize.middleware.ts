import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import validator from 'validator';

// XSS sanitizer options
const xssOptions = {
  whiteList: {}, // No HTML tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script'],
};

export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  // Remove HTML tags and escape entities
  return xss(value, xssOptions);
}

export function sanitizeUrl(url: string): string {
  // Validate URL; do not HTML-escape (store as-is; React escapes on render)
  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    throw new Error('Invalid URL format');
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('URL must use http or https protocol');
  }
  return url.trim();
}

export function sanitizeEmail(email: string): string {
  // Normalize email (lowercase, trim)
  const normalized = validator.normalizeEmail(email);
  if (!normalized || !validator.isEmail(normalized)) {
    throw new Error('Invalid email format');
  }
  return normalized;
}

export function sanitizeBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    // Sanitize string fields
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Special handling for URLs
        if (key.toLowerCase().includes('url') || key.toLowerCase().includes('webhook')) {
          try {
            req.body[key] = sanitizeUrl(req.body[key]);
          } catch (error) {
            // If URL validation fails, sanitize as string
            req.body[key] = sanitizeString(req.body[key]);
          }
        }
        // Special handling for emails
        else if (key.toLowerCase().includes('email')) {
          try {
            req.body[key] = sanitizeEmail(req.body[key]);
          } catch (error) {
            req.body[key] = sanitizeString(req.body[key]);
          }
        }
        // Default string sanitization
        else {
          req.body[key] = sanitizeString(req.body[key]);
        }
      }
    }
  }
  next();
}
