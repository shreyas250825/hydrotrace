const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export { API_URL }

export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) {
    throw new ApiError(`GET ${path} failed (${response.status})`, response.status)
  }
  return (await response.json()) as T
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new ApiError(`POST ${path} failed (${response.status})`, response.status)
  }
  return (await response.json()) as T
}

export async function apiGetText(path: string): Promise<string> {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) {
    throw new ApiError(`GET ${path} failed (${response.status})`, response.status)
  }
  return response.text()
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const data = await apiGet<{ ok?: boolean }>('/api/health')
    return data.ok === true
  } catch {
    return false
  }
}
