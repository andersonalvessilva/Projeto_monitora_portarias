import { useEffect, useMemo, useState } from "react"
import { listPortarias, searchPortarias } from "./api"
import type { Portaria, PortariaStatus } from "./types"
import { PortariaGraph } from "./components/PortariaGraph"
import TimelineRelacoes from "./components/TimelineRelacoes"
import Login from "./pages/Login" 
import { Search, ChevronLeft, ChevronRight, Filter, FileText, Network, LogOut, AlertTriangle } from "lucide-react"
import "./App.css"

const statusLabel: Record<PortariaStatus, string> = {
  ativa: "Ativa",
  revogada: "Revogada",
  alterada: "Alterada",
  regulamentada: "Regulamentada",
}

const statusColorsHex: Record<PortariaStatus, { bg: string; text: string }> = {
  ativa: { bg: '#064e3b', text: '#ffffff' },        
  revogada: { bg: '#991b1b', text: '#ffffff' },     
  alterada: { bg: '#d97706', text: '#ffffff' },     
  regulamentada: { bg: '#1e40af', text: '#ffffff' }, 
}

const ITEMS_PER_PAGE = 5

const formatDateBR = (dateString: string | undefined | null) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString; 
  return `${day}/${month}/${year}`;
};

const getStatusColors = (statusKey: string) => {
  const normalizedKey = String(statusKey).toLowerCase() as PortariaStatus;
  return statusColorsHex[normalizedKey] || { bg: '#64748b', text: '#ffffff' }; 
};

function App() {
  // 🔒 FIXADO EM NULL: Força o app a iniciar sempre na tela de login para testes.
  const [user, setUser] = useState<string | null>(null)

  // Estados de negócio do monitoramento
  const [portarias, setPortarias] = useState<Portaria[]>([])
  const [selectedPortaria, setSelectedPortaria] = useState<Portaria | null>(null)
  const [search, setSearch] = useState("")
  const [year, setYear] = useState("")
  const [status, setStatus] = useState<PortariaStatus | "">("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dispara a busca inicial assim que o usuário estiver autenticado
  useEffect(() => {
    if (user) {
      loadPortarias({ page: 1 })
    }
  }, [user])

  async function loadPortarias(params?: { 
    search?: string
    year?: string
    status?: string
    page?: number
  }) {
    setLoading(true)
    setError(null) // 🔄 Reseta o erro a cada nova tentativa de carregamento
    const page = params?.page ?? currentPage
    const skip = (page - 1) * ITEMS_PER_PAGE

    // Define quais filtros usar (se os novos do clique ou os que já estão no state)
    const currentSearch = params?.hasOwnProperty('search') ? params.search : search
    const currentYear = params?.hasOwnProperty('year') ? params.year : year
    const currentStatus = params?.hasOwnProperty('status') ? params.status : status

    try {
      const data = currentSearch
        ? await searchPortarias(currentSearch, ITEMS_PER_PAGE, skip)
        : await listPortarias({
            year: currentYear,
            status: currentStatus,
            skip,
            limit: ITEMS_PER_PAGE,
          })

      setPortarias(data)
      setCurrentPage(page)
      
      setSelectedPortaria((current) => {
        if (current) {
          const updated = data.find((item) => item.id === current.id)
          return updated ?? data[0] ?? null
        }
        return data[0] ?? null
      })
    } catch (err) {
      console.error(err)
      // 🛡️ Define a mensagem amigável no estado
      setError("Não foi possível conectar ao servidor de portarias. Verifique se o serviço está ativo ou tente novamente.")
      setPortarias([])
    } finally {
      setLoading(false)
    }
  }

  // Atalho para o botão de re-tentativa usar o contexto atual de filtros
  const handleRetry = () => {
    loadPortarias({ page: currentPage })
  }

  // 🎯 GESTÃO DE LOGIN
  const handleLoginSuccess = (username: string) => {
    localStorage.setItem("@MonitoraPortarias:user", username);
    setUser(username);
  };

  // 🎯 GESTÃO DE LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("@MonitoraPortarias:user");
    localStorage.removeItem("@MonitoraPortarias:token");
    setUser(null);
    setSelectedPortaria(null);
    setPortarias([]);
  };

  const yearsOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2000;
    const years = [];
    for (let i = currentYear; i >= startYear; i--) {
      years.push(i);
    }
    return years;
  }, []);

  const totalRelations = (selectedPortaria?.relacoes_saida?.length ?? 0) + (selectedPortaria?.relacoes_entrada?.length ?? 0)

  // 🔒 BLOQUEIO DE SEGURANÇA
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="page-wrapper">
      <div className="app-card-capsule">
        {/* HEADER INSTITUCIONAL */}
        <header className="sesa-header">
          <div className="header-top-utility"></div>

          <div className="header-main-brand">
            <div className="brand-group">
              <img src="src/assets/logo.png" alt="SESA Logo" className="logo" style={{ height: '60px' }} />
              <div className="v-divider"></div>
              <div className="title-group">
                <h1>Monitoramento de Portarias</h1>
                <p>Acompanhe e monitore as portarias do Estado do Ceará</p>
              </div>
            </div>

            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
              <div className="stats-pills">
                <span className="pill">{portarias.length} portarias</span>
                <span className="pill">{totalRelations} relações</span>
              </div>

              {/* USER CARD */}
              <div className="user-card">
                <div className="user-info">
                  <span className="name" style={{ textTransform: 'capitalize' }}>{user}</span>
                </div>
                <div className="avatar" style={{ textTransform: 'uppercase' }}>
                  {user.slice(0, 2)}
                </div>
                <button 
                  onClick={handleLogout}
                  title="Desconectar do painel"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    marginLeft: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <LogOut size={22} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ÁREA DE BUSCA GLOBAL */}
        <div className="global-search-container">
          <div className="search-row-layout">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por número, ano ou título..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPortarias({ search, page: 1 })}
              />
            </div> 
            <button className="btn-search-main" onClick={() => loadPortarias({ search, page: 1 })}>
              BUSCAR
            </button>
          </div>
        </div>

        {/* WORKSPACE GRID */}
        <div className="workspace-grid">
          
          {/* COLUNA 1: FILTROS */}
          <aside className="sidebar-controls">
            <h3><Filter size={12} /> Filtros Avançados</h3>
            
            <div className="filter-input-group">
              <label>Filtrar por Ano</label>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">Todos os anos</option>
                {yearsOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="filter-input-group">
              <label>Status do Documento</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as PortariaStatus | "")}>
                <option value="">Todos os status</option>
                <option value="ativa">Ativa</option>
                <option value="revogada">Revogada</option>
                <option value="alterada">Alterada</option>
                <option value="regulamentada">Regulamentada</option>
              </select>
            </div>

            <div className="sidebar-btns">
              <button className="btn-apply-filters" onClick={() => loadPortarias({ year, status, page: 1 })}>
                APLICAR FILTROS
              </button>
              <button className="btn-clear-filters" onClick={() => { setSearch(""); setYear(""); setStatus(""); loadPortarias({ search: "", year: "", status: "", page: 1 }); }}>
                LIMPAR TUDO
              </button>
            </div>
          </aside>

          {/* COLUNA 2: LISTAGEM DE PORTARIAS */}
          <div className="list-column">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 20px 0' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Listagem de Portarias</h3>
              {loading && <span className="loader-mini" style={{ fontSize: '12px', color: 'var(--sesa-green)' }}>Carregando...</span>}
            </div>
            
            {/* RENDERIZAÇÃO CONDICIONAL: ERRO VS CONTEÚDO */}
            {error ? (
              <div className="error-state-box" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: '1px dashed #f59e0b',
                marginBottom: '20px'
              }}>
                <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '50%', marginBottom: '14px' }}>
                  <AlertTriangle size={28} color="#d97706" />
                </div>
                <h4 style={{ color: '#b45309', margin: '0 0 6px 0', fontWeight: 600, fontSize: '15px' }}>Conexão Indisponível</h4>
                <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '320px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  {error}
                </p>
                <button 
                  onClick={handleRetry}
                  style={{
                    backgroundColor: '#15803d',
                    color: '#fff',
                    padding: '8px 22px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#166534'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                >
                  Tentar Novamente
                </button>
              </div>
            ) : (
              <>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Nº/Ano</th>
                      <th>Título da Portaria</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portarias.length > 0 ? (
                      portarias.map((p) => (
                        <tr 
                          key={p.id} 
                          className={selectedPortaria?.id === p.id ? "row-selected" : ""}
                          onClick={() => setSelectedPortaria(p)}
                        >
                          <td className="col-numero">{p.numero}/{p.ano}</td>
                          <td className="col-titulo">{p.titulo}</td>
                          <td className="col-status">
                            <span className={`status-pill status-${String(p.status).toLowerCase()}`}>
                              {statusLabel[p.status as PortariaStatus] || p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          {loading ? "Buscando registros..." : "Nenhuma portaria encontrada para os critérios selecionados."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                <div className="pagination-wrapper">
                  <button 
                    className="pagination-button"
                    disabled={currentPage === 1 || loading} 
                    onClick={() => loadPortarias({ page: currentPage - 1 })}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>

                  <div className="pagination-current-info">
                    <span className="label">Página</span>
                    <span className="number"> {currentPage} </span>
                  </div>

                  <button 
                    className="pagination-button"
                    disabled={portarias.length < ITEMS_PER_PAGE || loading}
                    onClick={() => loadPortarias({ page: currentPage + 1 })}
                  >
                    Próxima <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* COLUNA 3: DETALHES DA PORTARIA SELECIONADA */}
          {selectedPortaria && !error && (
            <div className="detail-panel">
              <div className="detail-header" style={{ textAlign: 'center' }}>
                <span className="detail-eyebrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--sesa-green)', fontWeight: 800, fontSize: '11px', letterSpacing: '1px' }}>
                  <FileText size={14} /> INFORMAÇÕES DETALHADAS
                </span>
                <h2 style={{ fontSize: '24px', marginTop: '10px', color: '#1e293b', lineHeight: '1.4', textAlign: 'center' }}>
                  {selectedPortaria.titulo}
                </h2>
              </div>

              <div className="detail-metadata" style={{ justifyContent: 'center' }}>
                <span className="meta-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <strong>Publicação:</strong> {formatDateBR(selectedPortaria.data_publicacao)}
                </span>
                <span className="meta-badge">
                  <strong>Situação:</strong> {statusLabel[selectedPortaria.status as PortariaStatus] || selectedPortaria.status}
                </span>
              </div>

              <p className="detail-desc" style={{ lineHeight: '1.7', color: '#475569', fontSize: '14px', marginBottom: '25px', textAlign: 'justify' }}>
                {selectedPortaria.descricao_completa}
              </p>
              
              {/* SEÇÃO DO GRÁFICO */}
              <div className="graph-section">
                <h4 style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px', 
                  marginBottom: '15px', 
                  textTransform: 'uppercase', 
                  fontSize: '11px', 
                  color: '#94a3b8', 
                  letterSpacing: '1px', 
                  fontWeight: 700 
                }}>
                  <Network size={16} /> Mapa Visual de Relações
                </h4>
                  
                {totalRelations > 0 ? (
                  <PortariaGraph 
                    selectedPortaria={selectedPortaria} 
                    onNodeClick={(id) => {
                      const found = portarias.find(p => p.id === id);
                      if(found) setSelectedPortaria(found);
                    }} 
                  />
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    color: '#64748b',
                    fontSize: '13.5px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1',
                    lineHeight: '1.5',
                    margin: '10px 0'
                  }}>
                    Este documento não possui vínculos ou alterações com outras portarias até o momento.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RODAPÉ INTEGRADO: HISTÓRICO JURÍDICO */}
          {selectedPortaria && !error && (
            <div className="timeline-section" style={{ gridColumn: '1 / -1', width: '100%', boxSizing: 'border-box', marginTop: '24px' }}>
              <div className="timeline-container-ajustado" style={{ backgroundColor: '#EFF6FF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ textAlign: 'center', marginBottom: '28px', width: '100%' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
                    Histórico de Alterações Jurídicas
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                      Situação Atual do Documento:
                    </span>
                    <span style={{
                      backgroundColor: getStatusColors(selectedPortaria.status).bg, 
                      color: getStatusColors(selectedPortaria.status).text,        
                      padding: '4px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '20px', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'inline-block'
                    }}>
                      {statusLabel[selectedPortaria.status as PortariaStatus] || selectedPortaria.status}
                    </span>
                  </div>
                </div>

                <TimelineRelacoes selectedPortaria={selectedPortaria} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default App