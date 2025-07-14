import { z } from "zod"

export const LabSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  isActive: z.boolean(),
})

export type LabSession = z.infer<typeof LabSessionSchema>
