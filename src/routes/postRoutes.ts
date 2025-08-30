import { Router } from 'express';
import { body } from 'express-validator';
import { createPost, listPosts, getPost, updatePost, deletePost, listMyPosts } from '../controllers/postController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', listPosts);
router.get('/me/mine', auth, listMyPosts);

router.post('/', auth, [body('title').isString().trim().isLength({ min: 2 }), body('content').isString().isLength({ min: 1 })], createPost);

router.get('/:id', getPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);

export default router;
