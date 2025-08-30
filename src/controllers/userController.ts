import type { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
    const limit = Math.min(parseInt(String(req.query.limit)) || 10, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments()
    ]);

    res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      const err: any = new Error('User not found');
      err.status = 404;
      throw err;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role } = req.body as { name?: string; email?: string; role?: 'user' | 'admin' };
    const update: Record<string, unknown> = {};
    if (name) update.name = name;
    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (exists) {
        const err: any = new Error('Email already in use');
        err.status = 409;
        throw err;
      }
      update.email = email;
    }
    if (role) update.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).select('-password');
    if (!user) {
      const err: any = new Error('User not found');
      err.status = 404;
      throw err;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      const err: any = new Error('User not found');
      err.status = 404;
      throw err;
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};
