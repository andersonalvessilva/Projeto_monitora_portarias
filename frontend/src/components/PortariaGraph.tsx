import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  type Node,
  type Edge,
} from '@xyflow/react'
import type { Portaria } from '../types'
import './PortariaGraph.css'

interface PortariaNodeData extends Record<string, unknown> {
  label: string
  numero: number
  ano: number
  status: string
  isCenter?: boolean
  isOrigin?: boolean
}

interface GraphBuilderResult {
  nodes: Node<PortariaNodeData>[]
  edges: Edge[]
}

// Cores para tipos de relação
const relationColorMap: Record<string, string> = {
  complementa: '#22c55e',
  altera: '#f59e0b',
  alterada: '#f59e0b',
  revoga: '#ef4444',
  revogada: '#ef4444',
  regulamenta: '#3b82f6',
}

// Criar ID único para nó
function getNodeId(portariaId: number, level: 'center' | 'left' | 'right' = 'center'): string {
  return `portaria-${level}-${portariaId}`
}

// Construir nós e arestas a partir de portaria e suas relações
function buildGraphData(selectedPortaria: Portaria | null): GraphBuilderResult {
  const nodes: Node<PortariaNodeData>[] = []
  const edges: Edge[] = []

  if (!selectedPortaria) {
    return { nodes, edges }
  }

  // Nó central: portaria selecionada
  const centerNodeId = getNodeId(selectedPortaria.id, 'center')
  nodes.push({
    id: centerNodeId,
    position: { x: 0, y: 0 }, // Será recalculado por Dagre
    data: {
      label: `${selectedPortaria.titulo}}`,
      numero: selectedPortaria.numero,
      ano: selectedPortaria.ano,
      status: selectedPortaria.status,
      isCenter: true,
    },
    type: 'default',
    style: {
      padding: '16px',
      borderRadius: '12px',
      border: `3px solid ${relationColorMap[selectedPortaria.status] || '#20ad56'}`,
      background: 'white',
      fontSize: '14px',
      fontWeight: 'bold',
      minWidth: '160px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  })

  // Relações de entrada (portarias que alteram/revogam/etc a selecionada)
  if (selectedPortaria.relacoes_entrada && selectedPortaria.relacoes_entrada.length > 0) {
    selectedPortaria.relacoes_entrada.forEach((relacao, index) => {
      const nodeId = getNodeId(relacao.portaria_origem_id, 'left')

      // Adicionar nó se não existir
      if (!nodes.find((n) => n.id === nodeId)) {
        nodes.push({
          id: nodeId,
          position: { x: -400, y: index * 100 },
          data: {
            label: `${relacao.origem_titulo || 'Portaria Origem'}`,
            numero: 0, // Não temos numero exato
            ano: 0,
            status: 'ativa',
            isOrigin: true,
          },
          type: 'default',
          style: {
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #cbd5e1',
            background: '#f8fafc',
            fontSize: '12px',
            minWidth: '140px',
            textAlign: 'center',
            opacity: 0.9,
          },
        })
      }

      // Adicionar aresta
      edges.push({
        id: `edge-${relacao.id}-entrada`,
        source: nodeId,
        target: centerNodeId,
        animated: true,
        style: {
          stroke: `${relationColorMap[relacao.tipo_relacao.toLowerCase()] || '#999'}`,
          strokeWidth: 2,
        },
        label: relacao.tipo_relacao,
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: '#333',
          background: 'white',
          padding: '2px 6px',
          borderRadius: '3px',
        },
      })
    })
  }

  // Relações de saída (portarias que esta portaria altera/revoga/etc)
  if (selectedPortaria.relacoes_saida && selectedPortaria.relacoes_saida.length > 0) {
    selectedPortaria.relacoes_saida.forEach((relacao, index) => {
      const nodeId = getNodeId(relacao.portaria_destino_id, 'right')

      // Adicionar nó se não existir
      if (!nodes.find((n) => n.id === nodeId)) {
        nodes.push({
          id: nodeId,
          position: { x: 400, y: index * 100 },
          data: {
            label: `${relacao.destino_titulo || 'Portaria Destino'}`,
            numero: 0,
            ano: 0,
            status: 'ativa',
            isOrigin: false,
          },
          type: 'default',
          style: {
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #cbd5e1',
            background: '#f8fafc',
            fontSize: '12px',
            minWidth: '140px',
            textAlign: 'center',
            opacity: 0.9,
          },
        })
      }

      // Adicionar aresta
      edges.push({
        id: `edge-${relacao.id}-saida`,
        source: centerNodeId,
        target: nodeId,
        animated: true,
        style: {
          stroke: `${relationColorMap[relacao.tipo_relacao.toLowerCase()] || '#999'}`,
          strokeWidth: 2,
        },
        label: relacao.tipo_relacao,
        labelStyle: {
          fontSize: '11px',
          fontWeight: 'bold',
          fill: '#333',
          padding: '2px 6px',
          borderRadius: '20px',
        },
      })
    })
  }

  return { nodes, edges }
}

// Aplicar layout manual (hierárquico left-to-right)
function applyManualLayout(nodes: Node[], edges: Edge[]): Node[] {
  // Encontrar nó central
  const centerNode = nodes.find((n) => n.id.includes('center'))
  if (!centerNode) return nodes

  const leftNodes = nodes.filter((n) => n.id.includes('left'))
  const rightNodes = nodes.filter((n) => n.id.includes('right'))

  const nodeHeight = 80
  const verticalGap = 120
  const horizontalGap = 300

  // Posicionar nó central
  centerNode.position = { x: 0, y: 0 }

  // Posicionar nós de entrada (esquerda)
  leftNodes.forEach((node, index) => {
    const totalHeight = leftNodes.length * verticalGap
    const startY = -totalHeight / 2
    node.position = {
      x: -horizontalGap,
      y: startY + index * verticalGap,
    }
  })

  // Posicionar nós de saída (direita)
  rightNodes.forEach((node, index) => {
    const totalHeight = rightNodes.length * verticalGap
    const startY = -totalHeight / 2
    node.position = {
      x: horizontalGap,
      y: startY + index * verticalGap,
    }
  })

  return nodes
}

interface PortariaGraphProps {
  selectedPortaria: Portaria | null
  onNodeClick: (portariaId: number) => void
}

export function PortariaGraph({ selectedPortaria, onNodeClick }: PortariaGraphProps) {
  // Gerar dados do grafo
  const graphData = useMemo(() => {
    const data = buildGraphData(selectedPortaria)
    const layoutedNodes = applyManualLayout(data.nodes, data.edges)
    return { nodes: layoutedNodes, edges: data.edges }
  }, [selectedPortaria])

  // Estados do React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges)

  // Handler para click em nó
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Extrair ID da portaria do node id
      const portariaId = parseInt(node.id.match(/\d+/)?.[0] || '0', 10)
      if (portariaId > 0) {
        onNodeClick(portariaId)
      }
    },
    [onNodeClick],
  )

  // Atualizar nós quando dados mudam
  useEffect(() => {
    setNodes(graphData.nodes)
    setEdges(graphData.edges)
  }, [graphData, setNodes, setEdges])

  if (!selectedPortaria || ((!selectedPortaria.relacoes_entrada || selectedPortaria.relacoes_entrada.length === 0) &&
      (!selectedPortaria.relacoes_saida || selectedPortaria.relacoes_saida.length === 0))) {
    return (
      <div className="portaria-graph-empty">
        <p>Nenhuma relação registrada para esta portaria.</p>
      </div>
    )
  }

  return (
    <div className="portaria-graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
