import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { getDb } from './db.js';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  api_key: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

export function generateApiKey(): string {
  return `tk_${crypto.randomBytes(20).toString('hex')}`;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
  const authHeader = req.headers['authorization'];

  let token = apiKeyHeader?.trim();
  if (!token && authHeader) {
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token) {
    res.status(401).json({
      error: 'Authentication required. Provide X-API-Key header or Authorization: Bearer <api_key>.',
    });
    return;
  }

  const db = getDb();
  const row = db
    .prepare('SELECT id, username, email, api_key FROM users WHERE api_key = ?')
    .get(token) as AuthUser | undefined;

  if (!row) {
    res.status(401).json({ error: 'Invalid API key or session token.' });
    return;
  }

  req.user = row;
  next();
}
