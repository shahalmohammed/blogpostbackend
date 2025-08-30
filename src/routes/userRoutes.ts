import { Router } from 'express';
import { requireRole, auth } from '../middleware/auth.js';
import { listUsers, getUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = Router();

router.use(auth, requireRole('admin'));
router.get('/', listUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
