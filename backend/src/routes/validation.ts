import { Router, Request, Response } from 'express'
import { taskValidationHistoryService } from '../services/TaskValidationHistoryService'

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email?: string
    role?: string
  }
}

const router = Router()

/**
 * Get validation history for a specific task
 */
router.get('/task/:taskId/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params
    const userId = req.user?.id // Assuming you have auth middleware that sets req.user

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const history = await taskValidationHistoryService.getTaskValidationHistory(userId, taskId)

    if (!history) {
      return res.json({
        taskId,
        totalAttempts: 0,
        maxAttempts: 3,
        remainingAttempts: 3,
        bestScore: 0,
        lastAttemptAt: null,
        attempts: []
      })
    }

    res.json(history)
  } catch (error) {
    console.error('Error getting task validation history:', error)
    res.status(500).json({ error: 'Failed to get task validation history' })
  }
})

/**
 * Get validation history for all tasks in a lab
 */
router.get('/lab/:labId/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { labId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const history = await taskValidationHistoryService.getLabValidationHistory(userId, labId)
    res.json(history)
  } catch (error) {
    console.error('Error getting lab validation history:', error)
    res.status(500).json({ error: 'Failed to get lab validation history' })
  }
})

/**
 * Check if user can attempt a task
 */
router.get('/task/:taskId/can-attempt', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { taskId } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const result = await taskValidationHistoryService.canUserAttemptTask(userId, taskId)
    res.json(result)
  } catch (error) {
    console.error('Error checking if user can attempt task:', error)
    res.status(500).json({ error: 'Failed to check task attempt eligibility' })
  }
})

export default router
