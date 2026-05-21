export type RelacaoTipo = "complementa" | "altera" | "revoga" | "regulamenta"
export type PortariaStatus = "ativa" | "revogada" | "alterada" | "regulamentada"

export interface Relacao {
  id?: number // 🎯 Opcional, pois o schema RelacaoResponse do Python não envia ID
  portaria_origem_id: number
  portaria_destino_id: number
  tipo_relacao: RelacaoTipo
  descricao?: string | null
  escopo?: string // 🎯 Alterado para string para bater com o padrão do banco
  data_relacao?: string | null
  origem_titulo?: string | null
  destino_titulo?: string | null
}

export interface Portaria {
  id: number
  numero: number
  ano: number
  titulo: string
  descricao_completa?: string | null
  status: PortariaStatus
  data_publicacao: string // Receberá a data formatada em texto do Python (ex: "2026-02-27")
  link_externo?: string | null
  link_local?: string | null
  relacoes_saida?: Relacao[] | null
  relacoes_entrada?: Relacao[] | null
}