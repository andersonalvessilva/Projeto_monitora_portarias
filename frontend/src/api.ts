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
  skip?: number
}): Promise<Portaria[]> {
  const url = buildUrl(API_PORTARIAS, {
    year: filters?.year,
    status: filters?.status,
    skip: filters?.skip,
    limit: filters?.limit ?? 20,
  })
  return request<Portaria[]>(url)
}

export async function searchPortarias(query: string, limit = 20, skip = 0): Promise<Portaria[]> {
  const url = buildUrl(`${API_PORTARIAS}/search`, { q: query, limit, skip })
  return request<Portaria[]>(url)
}

// // Adicione isso ao seu arquivo api.ts existente
// export async function fetchNotificacoes(): Promise<any[]> {
//   const response = await fetch("http://localhost:8000/api/notificacoes"); // Ajuste a URL/Porta do seu backend em Python se necessário
//   if (!response.ok) {
//     throw new Error("Erro ao buscar notificações");
//   }
//   return response.json();
// }

// Mude isso no seu api.ts para ficar padronizado:
// export async function fetchNotificacoes(): Promise<any[]> {
//   // Use a constante global para não quebrar quando mudar para o servidor real
//   const url = `${API_BASE_URL}/api/v1/notificacoes`; 
  
//   const response = await fetch(url);
//   if (!response.ok) {
//     throw new Error("Erro ao buscar notificações");
//   }
//   return response.json();
// }

