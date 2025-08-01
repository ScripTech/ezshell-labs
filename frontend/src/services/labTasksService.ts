import { LabTask, TaskEditFormData, TaskStatusUpdate } from '@/types/lab-tasks';

export class LabTasksService {
  static async getLabTasks(labId: string): Promise<LabTask[]> {
    const response = await fetch(`/api/labs/${labId}/tasks`);
    if (!response.ok) {
      throw new Error('Failed to fetch lab tasks');
    }
    return response.json();
  }

  static async getTask(labId: string, taskId: string): Promise<LabTask> {
    const response = await fetch(`/api/labs/${labId}/tasks/${taskId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch task');
    }
    return response.json();
  }

  static async createTask(labId: string, taskData: TaskEditFormData): Promise<LabTask> {
    const response = await fetch(`/api/labs/${labId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    return response.json();
  }

  static async updateTask(labId: string, taskId: string, taskData: TaskEditFormData): Promise<void> {
    const response = await fetch(`/api/labs/${labId}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error('Failed to update task');
    }
  }

  static async updateTaskStatus(labId: string, taskId: string, statusData: TaskStatusUpdate): Promise<void> {
    const response = await fetch(`/api/labs/${labId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusData),
    });

    if (!response.ok) {
      throw new Error('Failed to update task status');
    }
  }

  static async deleteTask(labId: string, taskId: string): Promise<void> {
    const response = await fetch(`/api/labs/${labId}/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  }
}
