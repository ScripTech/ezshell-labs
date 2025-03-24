export type Lab = {
  id: string;
  name: string;
  description?: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
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
