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
 * 🔒 Serviço de Autenticação - Emissão de Token JWT (FastAPI OAuth2)
 */
export async function loginAuthentication(
  username: string, 
  password: string
): Promise<{ access_token: string; username: string }> {
  
  // 🚀 Correção para o FastAPI OAuth2 nativo: convertendo dados para Form Data
  const formData = new URLSearchParams()
  formData.append("username", username)
  formData.append("password", password)

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...getHeaders(false) // Ignora o Content-Type JSON da função auxiliar
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    // Captura o objeto de erro padrão do FastAPI: { "detail": "Mensagem de erro" }
    const errorData = await response.json().catch(() => ({}))
    
    // Constrói um objeto de erro customizado contendo o status HTTP e a mensagem
    throw {
      status: response.status,
      message: errorData.detail || "Credenciais inválidas para o painel SESA."
    }
  }

  return response.json()
}