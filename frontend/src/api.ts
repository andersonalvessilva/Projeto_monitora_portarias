// import type { Portaria } from "./types"

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
// const API_PORTARIAS = `${API_BASE_URL}/api/v1/portarias`

// function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
//   if (!params) {
//     return path
//   }

//   const query = new URLSearchParams()
//   Object.entries(params).forEach(([key, value]) => {
//     // Evita enviar filtros vazios ou os textos de controle do front ("Todos...")
//     if (
//       value !== undefined && 
//       value !== "" && 
//       value !== "Todos os anos" && 
//       value !== "Todos os status"
//     ) {
//       // Se for o status, garante que vai em minúsculo (ex: "ativa") para casar com o banco
//       const safeValue = key === "status" ? String(value).toLowerCase() : String(value)
//       query.append(key, safeValue)
//     }
//   })

//   return query.toString().length ? `${path}?${query.toString()}` : path
// }

// async function request<T>(url: string): Promise<T> {
//   const response = await fetch(url)
//   if (!response.ok) {
//     throw new Error(`Falha ao carregar dados: ${response.status} ${response.statusText}`)
//   }

//   return response.json() as Promise<T>
// }

// export async function listPortarias(filters?: {
//   year?: string 
//   status?: string
//   limit?: number
//   skip?: number
// }): Promise<Portaria[]> {
//   const url = buildUrl(API_PORTARIAS, {
//     ano: filters?.year,     
//     status: filters?.status,
//     skip: filters?.skip,
//     limit: filters?.limit ?? 20,
//   })
//   return request<Portaria[]>(url)
// }

// export async function searchPortarias(query: string, limit = 20, skip = 0): Promise<Portaria[]> {
//   const url = buildUrl(`${API_PORTARIAS}/search`, { q: query, limit, skip })
//   return request<Portaria[]>(url)
// }

// export async function fetchNotificacoes(): Promise<any[]> {
//   const url = `${API_BASE_URL}/api/v1/notificacoes` 
//   return request<any[]>(url)
// }


import type { Portaria, PortariaStatus } from "./types"

// 🌐 URL Base do servidor FastAPI (ajuste a porta conforme seu ambiente local)
const API_BASE_URL = "http://localhost:8000"

/**
 * Auxiliar para injetar cabeçalhos padrão e o Token JWT se disponível
 */
function getHeaders(isPost: boolean = false): HeadersInit {
  const headers: Record<string, string> = {}
  
  if (isPost) {
    headers["Content-Type"] = "application/json"
  }

  // Se houver token de autenticação salvo, injeta no padrão OAuth2 Bearer
  const token = localStorage.getItem("@MonitoraPortarias:token")
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

/**
 * 🔍 Busca parametrizada de portarias (Listagem e Filtros)
 */
export async function listPortarias(params?: {
  year?: string
  status?: string
  skip?: number
  limit?: number
}): Promise<Portaria[]> {
  const query = new URLSearchParams()
  if (params?.year) query.append("ano", params.year)
  if (params?.status) query.append("status", params.status)
  if (params?.skip !== undefined) query.append("skip", String(params.skip))
  if (params?.limit !== undefined) query.append("limit", String(params.limit))

  const response = await fetch(`${API_BASE_URL}/api/v1/portarias/?${query.toString()}`, {
    method: "GET",
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error("Falha ao recuperar a listagem de portarias do servidor.")
  }

  return response.json()
}

/**
 * 🔎 Busca global por texto (Número, ano ou título)
 */
export async function searchPortarias(
  termo: string,
  limit: number = 5,
  skip: number = 0
): Promise<Portaria[]> {
  const query = new URLSearchParams({
    q: termo,
    limit: String(limit),
    skip: String(skip)
  })

  const response = await fetch(`${API_BASE_URL}/api/v1/portarias/search?${query.toString()}`, {
    method: "GET",
    headers: getHeaders(),
  })

  if (!response.ok) {
    throw new Error("Erro ao realizar a busca textual de portarias.")
  }

  return response.json()
}

/**
 * 🔒 Serviço de Autenticação - Emissão de Token JWT
 */
export async function loginAuthentication(username: string, password: string): Promise<{ access_token: string; username: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: getHeaders(true),
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || "Credenciais inválidas para o painel SESA.")
  }

  return response.json()
}