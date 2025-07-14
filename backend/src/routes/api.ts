import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { TaskValidationController } from '../controllers/TaskValidationController';
import { testConnection } from '../db';
import progressRoutes from './progress';

const router = Router();
const userController = new UserController();
const taskValidationController = new TaskValidationController();

// Database health check
router.get('/health', async (req, res) => {
  try {
    const result = await testConnection();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User routes
router.get('/users', userController.getAllUsers.bind(userController));
router.get('/users/:id', userController.getUserById.bind(userController));
router.post('/users', userController.createUser.bind(userController));
router.put('/users/:id', userController.updateUser.bind(userController));
router.delete('/users/:id', userController.deleteUser.bind(userController));

// Validation routes
router.post('/validation/tasks/:taskId/execute', taskValidationController.executeTaskValidation.bind(taskValidationController));
router.get('/validation/tasks/:taskId/config', taskValidationController.getTaskValidationConfig.bind(taskValidationController));
router.get('/validation/types', taskValidationController.getAvailableValidationTypes.bind(taskValidationController));

// Progress routes
router.use('/progress', progressRoutes);

export default router;
