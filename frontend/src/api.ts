import type { Portaria } from "./types"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
const API_PORTARIAS = `${API_BASE_URL}/api/v1/portarias`

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  if (!params) {
    return path
  }

  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.append(key, String(value))
    }
  })

  return query.toString().length ? `${path}?${query.toString()}` : path
}

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Falha ao carregar dados: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export async function listPortarias(filters?: {
  year?: string
  status?: string
  limit?: number
}): Promise<Portaria[]> {
  const url = buildUrl(API_PORTARIAS, {
    year: filters?.year,
    status: filters?.status,
    limit: filters?.limit ?? 100,
  })
  return request<Portaria[]>(url)
}

export async function searchPortarias(query: string, limit = 100): Promise<Portaria[]> {
  const url = buildUrl(`${API_PORTARIAS}/search`, { q: query, limit })
  return request<Portaria[]>(url)
}
