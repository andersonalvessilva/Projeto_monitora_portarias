import { useEffect, useMemo, useState } from "react"
import { listPortarias, searchPortarias } from "./api"
import type { Portaria, PortariaStatus } from "./types"
import { PortariaGraph } from "./components/PortariaGraph"
import TimelineRelacoes from "./components/TimelineRelacoes"
import Login from "./pages/Login" 
import { Search, ChevronLeft, ChevronRight, Filter, FileText, Network, LogOut, Bell, Clock, RefreshCw } from "lucide-react"
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
  // Controle de Sessão
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

  // 🔔 ESTADOS DO COMPONENTE DE ALERTA/NOTIFICAÇÃO
  const [menuNotificacaoAberto, setMenuNotificacaoAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState([
    {
      id: '1',
      tipo: 'nova',
      titulo: 'PORTARIA GM/MS Nº 10.297/2026',
      mensagem: 'Uma nova portaria de recursos do SUS foi publicada no Diário Oficial.',
      data: 'Hoje, 10:42',
      lida: false,
    },
    {
      id: '2',
      tipo: 'alteracao',
      titulo: 'Portaria GM/MS Nº 6.494',
      mensagem: 'O documento recebeu o status de [Alterada] devido a um novo ato jurídico.',
      data: 'Ontem',
      lida: false,
    }
  ])

  const naoLidas = notificacoes.filter(n => !n.lida).length

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
    setError(null)
    const page = params?.page ?? currentPage
    const skip = (page - 1) * ITEMS_PER_PAGE

    try {
      const data = params?.search
        ? await searchPortarias(params.search, ITEMS_PER_PAGE, skip)
        : await listPortarias({
            year: params?.year || year,
            status: params?.status || status,
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
      setError(err instanceof Error ? err.message : "Erro ao carregar os dados das portarias.")
      setPortarias([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null);
    setSelectedPortaria(null);
    setPortarias([]);
    setMenuNotificacaoAberto(false);
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

  // Bloqueio de Segurança: Se não estiver logado, renderiza a tela de login
  if (!user) {
    return <Login onLoginSuccess={(username) => setUser(username)} />;
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

              {/* 🔔 BOTÃO DE NOTIFICAÇÃO DO CORPO DO HEADER */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    setMenuNotificacaoAberto(!menuNotificacaoAberto);
                    if (!menuNotificacaoAberto) {
                      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
                    }
                  }}
                  title="Central de Alertas"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Bell size={22} color="#fff" />
                  {naoLidas > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      minWidth: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--sesa-green, #0c7a52)'
                    }}>
                      {naoLidas}
                    </span>
                  )}
                </button>

                {/* DROPDOWN DA CENTRAL DE ALERTAS */}
                {menuNotificacaoAberto && (
                  <div style={{
                    position: 'absolute',
                    top: '45px',
                    right: '0',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    width: '320px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    color: '#1e293b',
                    zIndex: 999,
                    overflow: 'hidden',
                    textAlign: 'left'
                  }}>
                    <div style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid #f1f5f9', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      backgroundColor: '#f8fafc' 
                    }}>
                      <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 700 }}>Central de Alertas</span>
                      {naoLidas > 0 && (
                        <span style={{ fontSize: '11px', backgroundColor: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                          {naoLidas} novos
                        </span>
                      )}
                    </div>
                    
                    <div style={{ maxHeight: '285px', overflowY: 'auto' }}>
                      {notificacoes.length > 0 ? (
                        notificacoes.map(item => (
                          <div 
                            key={item.id} 
                            style={{ 
                              display: 'flex', 
                              gap: '12px', 
                              padding: '14px 16px', 
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: !item.lida ? '#f0fdf4' : '#ffffff',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <div style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              backgroundColor: item.tipo === 'nova' ? '#e0f2fe' : '#fef3c7', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {item.tipo === 'nova' ? <FileText size={15} color="#0369a1" /> : <RefreshCw size={15} color="#b45309" />}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <h4 style={{ margin: 0, fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>{item.titulo}</h4>
                              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: '1.3' }}>{item.mensagem}</p>
                              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <Clock size={11} /> {item.data}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '30px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                          Nenhuma nova atualização encontrada.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="user-card">
                <div className="user-info">
                  <span className="name">{user}</span>
                  <span className="role">Administrador</span>
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
              <button className="btn-clear-filters" onClick={() => { setSearch(""); setYear(""); setStatus(""); loadPortarias({ page: 1 }); }}>
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
            
            {error && <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

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
                      Nenhuma portaria encontrada para os critérios selecionados.
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
                <span className="number">{currentPage}</span>
              </div>

              <button 
                className="pagination-button"
                disabled={portarias.length < ITEMS_PER_PAGE || loading}
                onClick={() => loadPortarias({ page: currentPage + 1 })}
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* COLUNA 3: DETALHES DA PORTARIA SELECIONADA */}
          {selectedPortaria && (
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
              
              <div className="graph-section">
                <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '15px', textTransform: 'uppercase', fontSize: '11px', color: '#94a3b8', letterSpacing: '1px', fontWeight: 700 }}>
                  <Network size={16} /> Mapa Visual de Relações
                </h4>
                <PortariaGraph 
                  selectedPortaria={selectedPortaria} 
                  onNodeClick={(id) => {
                    const found = portarias.find(p => p.id === id);
                    if(found) setSelectedPortaria(found);
                  }} 
                />
              </div>
            </div>
          )}

          {/* RODAPÉ INTEGRADO: HISTÓRICO JURÍDICO */}
          {selectedPortaria && (
            <div 
              className="timeline-section" 
              style={{ 
                gridColumn: '1 / -1', 
                width: '100%',
                boxSizing: 'border-box',
                marginTop: '24px'
              }}
            >
              <div 
                className="timeline-container-ajustado"
                style={{
                  backgroundColor: '#EFF6FF', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '28px', width: '100%' }}>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: 700, 
                    color: '#1e293b', 
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.02em',
                    textAlign: 'center'
                  }}>
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