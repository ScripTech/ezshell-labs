import { Request, Response } from 'express'
import { validationTrackingService } from '../services/ValidationTrackingService'

/**
 * Controller for handling validation history and tracking
 */
export class ValidationHistoryController {

  /**
   * Get validation history for a specific task
   * GET /api/validation/history/:taskId
   */
  async getTaskValidationHistory(req: Request, res: Response) {
    try {
      const { taskId } = req.params
      const { userId, labId, enrollmentId } = req.query

      if (!userId || !labId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: userId, labId'
        })
      }

      const history = await validationTrackingService.getTaskValidationHistory(
        userId as string,
        labId as string,
        taskId,
        enrollmentId as string | undefined
      )

      res.json({
        success: true,
        data: history
      })
    } catch (error) {
      console.error('Error getting task validation history:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  /**
   * Get the latest validation results for a task
   * GET /api/validation/latest/:taskId
   */
  async getLatestValidationResults(req: Request, res: Response) {
    try {
      const { taskId } = req.params
      const { userId, labId, enrollmentId } = req.query

      if (!userId || !labId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: userId, labId'
        })
      }

      const results = await validationTrackingService.getLatestValidationResults(
        userId as string,
        labId as string,
        taskId,
        enrollmentId as string | undefined
      )

      if (!results) {
        return res.json({
          success: true,
          data: null,
          message: 'No validation results found'
        })
      }

      res.json({
        success: true,
        data: results
      })
    } catch (error) {
      console.error('Error getting latest validation results:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }

  /**
   * Check if max attempts reached for a task
   * GET /api/validation/attempts-status/:taskId
   */
  async getAttemptsStatus(req: Request, res: Response) {
    try {
      const { taskId } = req.params
      const { userId, labId, enrollmentId } = req.query

      if (!userId || !labId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: userId, labId'
        })
      }

      const history = await validationTrackingService.getTaskValidationHistory(
        userId as string,
        labId as string,
        taskId,
        enrollmentId as string | undefined
      )

      res.json({
        success: true,
        data: {
          totalAttempts: history.totalAttempts || 0,
          maxAttemptsReached: history.maxAttemptsReached,
          remainingAttempts: history.remainingAttempts,
          hasAttempts: history.hasAttempts
        }
      })
    } catch (error) {
      console.error('Error getting attempts status:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }
}

export const validationHistoryController = new ValidationHistoryController()
