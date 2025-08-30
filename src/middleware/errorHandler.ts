import type { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error: any = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const payload: Record<string, unknown> = {
    success: false,
    message: err.message || 'Server Error'
  };
  if (process.env.NODE_ENV !== 'production' && err.stack) payload.stack = err.stack;
  if (err.details) payload.details = err.details;
  res.status(status).json(payload);
};
