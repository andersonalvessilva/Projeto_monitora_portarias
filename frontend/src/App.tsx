import { useEffect, useMemo, useState } from "react"
import { listPortarias, searchPortarias } from "./api"
import type { Portaria, PortariaStatus } from "./types"
import { PortariaGraph } from "./components/PortariaGraph"
import "./App.css"

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "ativa", label: "Ativa" },
  { value: "revogada", label: "Revogada" },
  { value: "alterada", label: "Alterada" },
  { value: "regulamentada", label: "Regulamentada" },
]

const statusLabel: Record<PortariaStatus, string> = {
  ativa: "Ativa",
  revogada: "Revogada",
  alterada: "Alterada",
  regulamentada: "Regulamentada",
}

const relationColor: Record<string, string> = {
  complementa: "#22c55e",
  altera: "#f59e0b",
  revoga: "#ef4444",
  regulamenta: "#3b82f6",
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function App() {
  const [portarias, setPortarias] = useState<Portaria[]>([])
  const [selectedPortaria, setSelectedPortaria] = useState<Portaria | null>(null)
  const [search, setSearch] = useState("")
  const [year, setYear] = useState("")
  const [status, setStatus] = useState<PortariaStatus | "">("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPortarias()
  }, [])

  async function loadPortarias(params?: { search?: string; year?: string; status?: string }) {
    setLoading(true)
    setError(null)

    try {
      const data = params?.search
        ? await searchPortarias(params.search)
        : await listPortarias({
            year: params?.year,
            status: params?.status,
            limit: 100,
          })

      setPortarias(data)
      setSelectedPortaria((current) => {
        if (current) {
          const updated = data.find((item) => item.id === current.id)
          return updated ?? data[0] ?? null
        }
        return data[0] ?? null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar portarias.")
      setPortarias([])
      setSelectedPortaria(null)
    } finally {
      setLoading(false)
    }
  }

  const years = useMemo(
    () => Array.from(new Set(portarias.map((item) => item.ano))).sort((a, b) => b - a),
    [portarias],
  )

  const relationSummary = useMemo(() => {
    const counts = {
      complementa: 0,
      altera: 0,
      revoga: 0,
      regulamenta: 0,
    }

    const relations = [
      ...(selectedPortaria?.relacoes_saida ?? []),
      ...(selectedPortaria?.relacoes_entrada ?? []),
    ]

    relations.forEach((relation) => {
      counts[relation.tipo_relacao] += 1
    })

    return counts
  }, [selectedPortaria])

  const totalRelations =
    (selectedPortaria?.relacoes_saida?.length ?? 0) +
    (selectedPortaria?.relacoes_entrada?.length ?? 0)

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Monitora Portarias</p>
          <h1 className="title">Dashboard inicial</h1>
          <p className="subtitle">
            Lista de portarias, filtros e painel de detalhes.
          </p>
        </div>
        <div className="header-badges">
          <span className="badge">{portarias.length} portarias</span>
          <span className="badge">{years.length} anos</span>
          <span className="badge">{selectedPortaria ? totalRelations : 0} relações</span>
        </div>
      </header>

      <section className="controls">
        <form
          className="filter-grid"
          onSubmit={(event) => {
            event.preventDefault()
            loadPortarias({ search, year, status })
          }}
        >
          <label className="filter-field">
            Buscar
            <input
              type="search"
              placeholder="Número, ano ou título"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="filter-field">
            Ano
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              <option value="">Todos os anos</option>
              {years.map((optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as PortariaStatus | "")}> 
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="filter-actions">
            <button type="submit" className="button button-primary">
              Filtrar
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setSearch("")
                setYear("")
                setStatus("")
                loadPortarias()
              }}
            >
              Limpar
            </button>
          </div>
        </form>
        <div className="status-line">
          {loading && <span>Carregando portarias...</span>}
          {error && <span className="error-message">{error}</span>}
          {!loading && !error && <span>{portarias.length} portarias encontradas</span>}
        </div>
      </section>

      <main className="workspace">
        <aside className="portaria-list">
          <div className="panel-header">
            <h2>Portarias</h2>
            <span className="hint">Selecione uma portaria para ver detalhes.</span>
          </div>

          {portarias.length === 0 ? (
            <div className="empty-state">Nenhuma portaria disponível para estes filtros.</div>
          ) : (
            <div className="list-grid">
              {portarias.map((portaria) => (
                <button
                  key={portaria.id}
                  type="button"
                  className={`list-card ${selectedPortaria?.id === portaria.id ? "active" : ""}`}
                  onClick={() => setSelectedPortaria(portaria)}
                >
                  <div className="card-title">
                    <span>{portaria.ano}</span>
                    <span className={`status-pill status-${portaria.status}`}>
                      {statusLabel[portaria.status]}
                    </span>
                  </div>
                  <p className="card-subtitle">{portaria.titulo.toUpperCase()}</p>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="detail-panel">
          <div className="panel-header">
            <h2>Detalhes da portaria</h2>
            <span className="hint">Painel com dados principais e relações.</span>
          </div>

          {!selectedPortaria ? (
            <div className="empty-state">Selecione uma portaria para visualizar mais informações.</div>
          ) : (
            <div className="detail-stack">
              <div className="detail-card">
                <div className="detail-head">
                  <div>
                    <span className="detail-label">Portaria</span>
                    <h3>{selectedPortaria.titulo}</h3>
                    <p className="muted">
                      Publicada em {formatDate(selectedPortaria.data_publicacao)} • {selectedPortaria.numero}/{selectedPortaria.ano}
                    </p>
                  </div>
                  <span className={`status-pill status-${selectedPortaria.status}`}>
                    {statusLabel[selectedPortaria.status]}
                  </span>
                </div>

                {selectedPortaria.descricao_completa ? (
                  <p className="detail-text">{selectedPortaria.descricao_completa}</p>
                ) : (
                  <p className="detail-text">Descrição completa ainda não disponível.</p>
                )}

                <div className="links-row">
                  {selectedPortaria.link_externo && (
                    <a href={selectedPortaria.link_externo} target="_blank" rel="noreferrer" className="detail-link">
                      Ver Diário Oficial
                    </a>
                  )}
                  {selectedPortaria.link_local && (
                    <a href={selectedPortaria.link_local} target="_blank" rel="noreferrer" className="detail-link">
                      Ver documento local
                    </a>
                  )}
                </div>
              </div>

              <div className="detail-card">
                <h3>Relações</h3>
                <p className="muted">Relações de entrada e saída para esta portaria.</p>
                <div className="summary-grid">
                  {Object.entries(relationSummary).map(([type, count]) => (
                    <div key={type} className="summary-card">
                      <span>{type}</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
                <PortariaGraph
                  selectedPortaria={selectedPortaria}
                  onNodeClick={(portariaId) => {
                    const portaria = portarias.find((p) => p.id === portariaId)
                    if (portaria) {
                      setSelectedPortaria(portaria)
                    }
                  }}
                />
              </div>

              <div className="detail-card">
                <h3>Relações recentes</h3>
                {(selectedPortaria.relacoes_saida?.length || 0) + (selectedPortaria.relacoes_entrada?.length || 0) === 0 ? (
                  <p className="muted">Nenhuma relação registrada para esta portaria.</p>
                ) : (
                  <ul className="relation-list">
                    {[...(selectedPortaria.relacoes_saida ?? []), ...(selectedPortaria.relacoes_entrada ?? [])].map((relation) => (
                      <li key={`${relation.id}-${relation.portaria_destino_id}-${relation.portaria_origem_id}`}>
                        <span className="relation-badge" style={{ backgroundColor: relationColor[relation.tipo_relacao] }}>
                          {relation.tipo_relacao} | {relation.escopo ?? "sem escopo"}
                        </span> 
                        <div>
                          {(selectedPortaria.status == "ativa") ?
                            (<strong>{relation.destino_titulo} ?? "Portaria relacionada"</strong>) :
                            (<strong>{relation.origem_titulo} ??  "Portaria relacionada"</strong>)
                          }
                          <p>{relation.descricao ?? "Sem descrição adicional."}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
