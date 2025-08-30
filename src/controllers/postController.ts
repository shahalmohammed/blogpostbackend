import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Post from '../models/Post.js';

const isOwnerOrAdmin = (user: Express.Request['user'] | undefined, post: { author: any }) =>
  !!user && (user.role === 'admin' || String(post.author) === String(user._id));

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err: any = new Error('Validation error');
      err.status = 400;
      err.details = errors.array();
      throw err;
    }
    const { title, content } = req.body as { title: string; content: string };
    const post = await Post.create({ title, content, author: req.user!._id });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

export const listPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
    const limit = Math.min(parseInt(String(req.query.limit)) || 10, 100);
    const skip = (page - 1) * limit;

    const { q, author } = req.query as { q?: string; author?: string };
    const filter: Record<string, unknown> = {};
    if (q) filter.$text = { $search: q };
    if (author) filter.author = author;

    const [items, total] = await Promise.all([
      Post.find(filter).populate('author', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(filter)
    ]);

    res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

export const listMyPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
    const limit = Math.min(parseInt(String(req.query.limit)) || 10, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Post.find({ author: req.user!._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments({ author: req.user!._id })
    ]);

    res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

export const getPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name email role');
    if (!post) {
      const err: any = new Error('Post not found');
      err.status = 404;
      throw err;
    }
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body as { title?: string; content?: string };
    const post = await Post.findById(req.params.id);
    if (!post) {
      const err: any = new Error('Post not found');
      err.status = 404;
      throw err;
    }
    if (!isOwnerOrAdmin(req.user, post)) {
      const err: any = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    if (title) post.title = title;
    if (content) post.content = content;
    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      const err: any = new Error('Post not found');
      err.status = 404;
      throw err;
    }
    if (!isOwnerOrAdmin(req.user, post)) {
      const err: any = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};
