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
  description?: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  enrolledCount?: number;
  isEnrolled?: boolean;
  exercises?: LabExercise[];
  progress: {
    completed: number;
    total: number;
    exercises: LabExercise[];
  };
};

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
