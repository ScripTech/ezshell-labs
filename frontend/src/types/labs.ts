import { Instructor } from './instructors'

export type LabExercise = {
  id: string;
  labId: string;
  title: string;
  description?: string;
  orderIndex: number;
  completed?: boolean;
  completedAt: Date | undefined;
};

export type Lab = {
  id: string;
  name: string;
  labId: string;
  description?: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  enrolledCount?: number;
  isEnrolled?: boolean;
  exercises?: LabExercise[];
  instructor?: Instructor;
  progress: {
    completed: number;
    total: number;
    exercises: LabExercise[];
  };
  enrollment?: LabEnrollment | null;
};

export interface LabEnrollment {
  id: string;
  status: "enrolled" | "in_progress" | "completed";
  progress: number;
  enrolledAt: Date;
  completedAt: Date;
}

export type LabSession = {
  id: string;
  userId: string;
  labId: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  labType?: string;
  status?: "running" | "stopped" | "failed";
  lab?: Lab;
};
