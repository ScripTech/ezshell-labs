
export async function getUserLabSessions() {
  const response = await fetch('/api/labs/sessions')
  if (!response.ok) throw new Error('Failed to fetch lab sessions')
  return response.json()
}

export async function enrollInLab(labId: string) {
  const response = await fetch('/api/labs/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labId }),
  })

  if (!response.ok) throw new Error('Failed to enroll in lab')
  return response.json()
}
