import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    else if (req.cookies?.token) token = req.cookies.token;

    if (!token) {
      const err: any = new Error('Authentication required');
      err.status = 401;
      throw err;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { sub: string; role: string };
    const user = await User.findById(decoded.sub).select('-password').lean();
    if (!user) {
      const err: any = new Error('User not found');
      err.status = 401;
      throw err;
    }

    req.user = user;
    next();
  } catch (err: any) {
    err.status = err.name === 'JsonWebTokenError' ? 401 : err.status || 401;
    next(err);
  }
};

export const requireRole = (...roles: Array<'user' | 'admin'>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      const err: any = new Error('Authentication required');
      err.status = 401;
      return next(err);
    }
    if (!roles.includes(req.user.role)) {
      const err: any = new Error('Forbidden');
      err.status = 403;
      return next(err);
    }
    next();
  };
