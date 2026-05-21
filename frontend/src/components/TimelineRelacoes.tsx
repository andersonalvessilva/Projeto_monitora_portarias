import React from 'react';
import { BookOpen, Pencil, XCircle, Clock3, Link as LinkIcon } from 'lucide-react'; 
import type { Portaria } from '../types';
import './TimelineRelacoes.css';

interface TimelineRelacoesProps {
  selectedPortaria: Portaria | null;
  onSelectPortariaById?: (id: string | number) => void;
}

const statusColors: Record<string, string> = {
  publicada: "#3b82f6",    
  altera: "#f59e0b",       
  alterada: "#f59e0b",     
  revoga: "#ef4444",       
  revogada: "#ef4444",     
  regulamenta: "#10b981",  
  complementa: "#6366f1",  
};

const formatDateBR = (dateString: string | undefined | null) => {
  if (!dateString) return { formatada: "Não informada", dia: "", mesExtenso: "", ano: "" };
  const parts = dateString.split('-');
  if (parts.length !== 3) return { formatada: dateString, dia: "", mesExtenso: "", ano: "" }; 
  
  const [year, month, day] = parts;
  
  const meses = [
    "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  const mesExtenso = meses[parseInt(month, 10) - 1] || "";

  return {
    formatada: `${day}/${month}/${year}`,
    dia: parseInt(day, 10).toString().padStart(2, '0'),
    mesExtenso,
    ano: year
  };
};

const TimelineRelacoes: React.FC<TimelineRelacoesProps> = ({ selectedPortaria, onSelectPortariaById }) => {
  if (!selectedPortaria) return null;

  const getIcon = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t.includes('publica')) return <BookOpen size={16} strokeWidth={2.5} />;
    if (t.includes('altera')) return <Pencil size={16} strokeWidth={2.5} />;
    if (t.includes('revoga')) return <XCircle size={16} strokeWidth={2.5} />;
    return <LinkIcon size={16} strokeWidth={2.5} />;
  };

  /**
   * 🎯 DIRECIONADOR IMEDIATO PARA O ATO DO DIÁRIO OFICIAL
   * Abre a portaria diretamente na tela se a URL exata existir no objeto.
   */
  const obterLinkExatoDOU = (slugRelacionado?: string) => {
    // 1. Se a portaria selecionada já tiver o link direto completo salvo no banco, abre ele na hora
    if (selectedPortaria.url_diario && selectedPortaria.url_diario.trim() !== "" && !slugRelacionado) {
      return selectedPortaria.url_diario;
    }

    // 2. Fallback por Filtro de Data Exata (Caso falte a URL direta, força a busca do DOU a filtrar unicamente pelo dia da publicação)
    const { formatada, dia, mesExtenso, ano } = formatDateBR(selectedPortaria.data_publicacao);
    
    // Formata o título da portaria para buscar a correspondência exata por string
    const termoBusca = slugRelacionado || selectedPortaria.titulo;

    return selectedPortaria.link_externo
    // Injeta o parâmetro de data exata na URL de busca para matar os resultados de outros anos de vez
    // return `https://www.in.gov.br/consulta/-/buscar/dou` +
    //        `?q=${encodeURIComponent(`"${termoBusca}"`)}` +
    //        `&datapublicacao=${formatada}` + // Trava o motor de busca no dia exato do ato
    //        `&secao=do1` + 
    //        `&s=todos&exactDate=all&sortType=0`;
  };

  const dataOriginal = selectedPortaria.data_publicacao;

  const events = [
    {
      id: selectedPortaria.id,
      tipo: 'PUBLICADA',
      descricao: selectedPortaria.titulo, 
      data: formatDateBR(dataOriginal).formatada,
      info: `Texto Completo`,
      color: statusColors['publicada'],
      clickable: false,
      linkDiario: obterLinkExatoDOU()
    },
    ...(selectedPortaria.relacoes_saida ?? []).map(rel => ({
      id: rel.destino_id || null, 
      tipo: rel.tipo_relacao.toUpperCase(),
      descricao: `Este documento gerou efeito de [${rel.tipo_relacao.toLowerCase()}] sobre a ${rel.destino_titulo}.`,
      data: 'Vínculo Jurídico',
      info: rel.escopo || 'Relação de Saída',
      color: statusColors[rel.tipo_relacao.toLowerCase()] || '#64748b',
      clickable: !!rel.destino_id,
      linkDiario: obterLinkExatoDOU(rel.destino_titulo) 
    })),
    ...(selectedPortaria.relacoes_entrada ?? []).map(rel => ({
      id: rel.origem_id || null,
      tipo: rel.tipo_relacao.toUpperCase(),
      descricao: `Este documento recebeu uma [${rel.tipo_relacao.toLowerCase()}] aplicada por: ${rel.origem_titulo}.`,
      data: 'Vínculo Jurídico',
      info: rel.escopo || 'Relação de Entrada',
      color: statusColors[rel.tipo_relacao.toLowerCase()] || '#64748b',
      clickable: !!rel.origem_id,
      linkDiario: obterLinkExatoDOU(rel.origem_titulo)
    }))
  ];

  return (
    <div className="historico-container" style={{ width: '100%' }}>
      <div className="timeline-ms">
        {events.map((event, index) => (
          <div key={index} className="timeline-item-ms">
            <div 
              className="timeline-icon-ms" 
              style={{ backgroundColor: event.color, color: '#fff', cursor: event.clickable ? 'pointer' : 'default' }}
              onClick={() => event.clickable && onSelectPortariaById && event.id && onSelectPortariaById(event.id)}
            >
              {getIcon(event.tipo)}
            </div>

            <div className="timeline-content-ms" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="event-label" style={{ backgroundColor: `${event.color}15`, color: event.color, border: `1px solid ${event.color}30` }}>
                  {event.tipo}
                </span>

                {event.clickable && (
                  <span 
                    onClick={() => onSelectPortariaById && event.id && onSelectPortariaById(event.id)}
                    style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Visualizar Relação →
                  </span>
                )}
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                padding: '12px 14px',
                borderRadius: '8px',
                borderLeft: `4px solid ${event.color}`,
                margin: '4px 0'
              }}>
                <p className="event-description" style={{ color: '#1e293b', fontSize: '13.5px', fontWeight: 500, margin: 0, lineHeight: '1.4' }}>
                  {event.descricao}
                </p>
              </div>
              
              <div className="event-footer" style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', marginTop: '4px' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="event-date-ms" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: '#64748b' }}>
                    <Clock3 size={13} /> {event.data}
                  </span>
                  <span className="dou-badge" style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 500 }}>
                    {event.info}
                  </span>
                </div>

                <a 
                  href={event.linkDiario} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-ver-diario"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    color: '#0284c7',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginLeft: 'auto'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  Ver Diário Oficial
                </a>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineRelacoes;