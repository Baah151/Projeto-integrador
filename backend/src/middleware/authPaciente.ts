import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

export interface JwtPacientePayload {
  id: number;
  email: string;
  tipo: string;
}

declare global {
  namespace Express {
    interface Request {
      paciente?: JwtPacientePayload;
    }
  }
}

export function authPacienteMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token nao fornecido', error: 'UNAUTHORIZED', timestamp: new Date().toISOString() });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ success: false, message: 'Token invalido', error: 'UNAUTHORIZED', timestamp: new Date().toISOString() });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as JwtPacientePayload;
    if (decoded.tipo !== 'paciente') throw new Error('Token nao e de paciente');
    req.paciente = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token invalido ou expirado', error: 'INVALID_TOKEN', timestamp: new Date().toISOString() });
  }
}
