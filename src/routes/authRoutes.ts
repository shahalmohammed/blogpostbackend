import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, me, updateMe, changePassword, logout, registerAdmin } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = Router();

router.post(
  '/register',
  [body('name').isString().trim().isLength({ min: 2 }), body('email').isEmail().normalizeEmail(), body('password').isString().isLength({ min: 6 })],
  register
);

router.post('/login', [body('email').isEmail().normalizeEmail(), body('password').isString().isLength({ min: 6 })], login);

router.post(
  '/register-admin',
  [body('name').isString().trim().isLength({ min: 2 }), body('email').isEmail().normalizeEmail(), body('password').isString().isLength({ min: 8 })],
  optionalAuth,
  registerAdmin
);

router.get('/me', auth, me);
router.put('/me', auth, updateMe);
router.put('/me/password', auth, changePassword);
router.post('/logout', auth, logout);

export default router;
