import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const sign = (user: { _id: string; role: string }) =>
    jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET as string, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const err: any = new Error('Validation error');
            err.status = 400;
            err.details = errors.array();
            throw err;
        }
        const { name, email, password } = req.body as { name: string; email: string; password: string };

        const exists = await User.findOne({ email });
        if (exists) {
            const err: any = new Error('Email already in use');
            err.status = 409;
            throw err;
        }

        const user = await User.create({ name, email, password, role: 'user' });
        const token = sign(user);
        res.status(201).json({
            success: true,
            data: { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }
        });
    } catch (err: any) {
        if (err.code === 11000) {
            err = new Error('Email already in use') as any;
            (err as any).status = 409;
        }
        next(err);
    }
};

export const registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const adminCount = await User.countDocuments({ role: 'admin' });

        // Allow first admin without login
        if (adminCount >= 1) {
            // For the second admin, require the requester to be an existing admin
            if (!req.user || req.user.role !== 'admin') {
                const err: any = new Error('Forbidden');
                err.status = 403;
                throw err;
            }
        }

        // Block creation if 2 admins already exist
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
            name: string;
            email: string;
            password: string;
        };

        const exists = await User.findOne({ email });
        if (exists) {
            const err: any = new Error('Email already in use');
            err.status = 409;
            throw err;
        }

        const user = await User.create({ name, email, password, role: 'admin' });
        const token = sign(user);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
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
        if (!user || !(await user.comparePassword(password))) {
            const err: any = new Error('Invalid credentials');
            err.status = 401;
            throw err;
        }

        const token = sign(user);
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
        const nextPw = (req.body?.newPassword ?? '').toString();

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

        const matches =
            typeof (me as any).comparePassword === 'function'
                ? await (me as any).comparePassword(current)
                : await bcrypt.compare(current, String(me.password));

        if (!matches) {
            const err: any = new Error('Current password is incorrect');
            err.status = 400;
            throw err;
        }

        me.password = nextPw;
        await me.save();

        res.json({ success: true, message: 'Password updated' });
    } catch (err) {
        next(err);
    }
};


export const logout = async (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out' });
};
