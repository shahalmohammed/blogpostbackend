import type { Request, Response, NextFunction } from 'express';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// ---- JWT helpers (typed) ----------------------------------------------------
const JWT_SECRET: Secret = process.env.JWT_SECRET as Secret;
const JWT_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '7d';

const signToken = (user: { _id: mongoose.Types.ObjectId | string; role: string }) =>
  jwt.sign(
    { sub: String(user._id), role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

// ---- Controllers ------------------------------------------------------------

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err: any = new Error('Validation error');
      err.status = 400;
      err.details = errors.array();
      throw err;
    }

    const { name, email, password } = req.body as {
      name: string; email: string; password: string;
    };

    const exists = await User.findOne({ email });
    if (exists) {
      const err: any = new Error('Email already in use');
      err.status = 409;
      throw err;
    }

    const user = await User.create({ name, email, password, role: 'user' });
    const token = signToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token
      }
    });
  } catch (err: any) {
    if ((err as any)?.code === 11000) {
      const dupe: any = new Error('Email already in use');
      dupe.status = 409;
      return next(dupe);
    }
    next(err);
  }
};

/** First admin is open; after that only an authenticated admin can create more.
 *  Additionally, cap total admins to 2 (as per your logic).
 */
export const registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });

    if (adminCount >= 1) {
      if (!req.user || req.user.role !== 'admin') {
        const err: any = new Error('Forbidden');
        err.status = 403;
        throw err;
      }
    }

    if (adminCount >= 2) {
      const err: any = new Error('Maximum number of admins reached');
      err.status = 403;
      throw err;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err: any = new Error('Validation error');
      err.status = 400;
      err.details = errors.array();
      throw err;
    }

    const { name, email, password } = req.body as {
      name: string; email: string; password: string;
    };

    const exists = await User.findOne({ email });
    if (exists) {
      const err: any = new Error('Email already in use');
      err.status = 409;
      throw err;
    }

    const user = await User.create({ name, email, password, role: 'admin' });
    const token = signToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err: any = new Error('Validation error');
      err.status = 400;
      err.details = errors.array();
      throw err;
    }

    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await (user as any).comparePassword(password))) {
      const err: any = new Error('Invalid credentials');
      err.status = 401;
      throw err;
    }

    const token = signToken(user);

    res.json({
      success: true,
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response) => {
  res.json({ success: true, data: { user: req.user } });
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body as { name?: string; email?: string };

    if (!name && !email) {
      const err: any = new Error('Nothing to update');
      err.status = 400;
      throw err;
    }

    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.user!._id } });
      if (exists) {
        const err: any = new Error('Email already in use');
        err.status = 409;
        throw err;
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: { ...(name && { name }), ...(email && { email }) } },
      { new: true }
    ).select('-password');

    res.json({ success: true, data: { user: updated } });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = (req.body?.currentPassword ?? '').toString();
    const nextPw  = (req.body?.newPassword ?? '').toString();

    if (!current || !nextPw) {
      const err: any = new Error('currentPassword and newPassword are required');
      err.status = 400;
      throw err;
    }

    const me = await User.findById(req.user!._id).select('+password');
    if (!me) {
      const err: any = new Error('User not found');
      err.status = 404;
      throw err;
    }
    if (!me.password) {
      const err: any = new Error('Password hash missing on user');
      err.status = 500;
      throw err;
    }

    // Prefer instance method; fallback to bcrypt as a safety net
    const matches =
      typeof (me as any).comparePassword === 'function'
        ? await (me as any).comparePassword(current)
        : await bcrypt.compare(current, String(me.password));

    if (!matches) {
      const err: any = new Error('Current password is incorrect');
      err.status = 400;
      throw err;
    }

    me.password = nextPw; // pre('save') will hash
    await me.save();

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    next(err);
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out' });
};
