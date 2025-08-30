import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    else if (req.cookies?.token) token = req.cookies.token;

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { sub: string };
    const user = await User.findById(decoded.sub).select('-password').lean();
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
};
