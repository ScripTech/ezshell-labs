export type LabSession = {
  id: string
  userId: string
  startTime: Date
  endTime: Date
  isActive: boolean
  labType?: string
  status?: 'running' | 'stopped' | 'failed'
}
