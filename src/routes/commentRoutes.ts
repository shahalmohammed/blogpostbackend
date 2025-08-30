import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { addComment, listComments, deleteComment } from '../controllers/commentController.js';

const router = Router();

router.get('/posts/:postId/comments', listComments);
router.post('/posts/:postId/comments', auth, [body('content').isString().isLength({ min: 1 })], addComment);
router.delete('/comments/:commentId', auth, deleteComment);

export default router;
