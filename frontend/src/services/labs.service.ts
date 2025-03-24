import { LabSession } from '@/types/labs'

export async function getUserLabSessions(): Promise<LabSession[]> {
  const response = await fetch('/api/labs/sessions', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch lab sessions')
  }

  return response.json()
}
