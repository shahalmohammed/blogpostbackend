import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';

const isOwnerOrAdmin = (user: Express.Request['user'] | undefined, resource: { author: any }) =>
  !!user && (user.role === 'admin' || String(resource.author) === String(user._id));

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err: any = new Error('Validation error');
      err.status = 400;
      err.details = errors.array();
      throw err;
    }
    const { postId } = req.params as { postId: string };
    const { content } = req.body as { content: string };

    const post = await Post.findById(postId);
    if (!post) {
      const err: any = new Error('Post not found');
      err.status = 404;
      throw err;
    }

    const comment = await Comment.create({ post: post._id, author: req.user!._id, content });
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

export const listComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(String(req.query.page)) || 1, 1);
    const limit = Math.min(parseInt(String(req.query.limit)) || 10, 100);
    const skip = (page - 1) * limit;
    const { postId } = req.params as { postId: string };

    const [items, total] = await Promise.all([
      Comment.find({ post: postId }).populate('author', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Comment.countDocuments({ post: postId })
    ]);

    res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { commentId } = req.params as { commentId: string };
    const comment = await Comment.findById(commentId);
    if (!comment) {
      const err: any = new Error('Comment not found');
      err.status = 404;
      throw err;
    }
    if (!isOwnerOrAdmin(req.user, comment)) {
      const err: any = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};
