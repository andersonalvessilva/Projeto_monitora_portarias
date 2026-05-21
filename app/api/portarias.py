"""
API routes for Portarias endpoints.

GET endpoints for listing and searching Portarias (public).
POST, PUT, DELETE endpoints for management (authenticated - phase 2).
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Portaria
from app.schemas.schemas import PortariaBase, PortariaCreate, PortariaUpdate, PortariaResponse, PortariaSummary, RelacaoResponse, RelacaoSummary
from app.crud.crud import (
    create_portaria,
    get_portaria,
    list_portarias,
    search_portarias,
    update_portaria,
    delete_portaria,
    get_relacoes_portaria,
)

router = APIRouter(prefix="/api/v1/portarias", tags=["portarias"])


@router.get("", response_model=List[PortariaResponse])
async def list_portarias_endpoint(
    db: Session = Depends(get_db),
    year: Optional[int] = Query(None, alias="ano", description="Filtro por ano de publicação"),
    status: Optional[str] = Query(None, description="Filtro por status"),
    skip: int = Query(0, ge=0, description="Número de registro a desconsiderar para paginação"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de resultados"),
):
    """
    Lista todas as Portarias com filtros opcionais.
    """
    portarias = await list_portarias(db, year=year, status=status, skip=skip, limit=limit)

    for portaria in portarias:
        for relacao in portaria.relacoes_entrada:
            relacao.origem_titulo = relacao.portaria_origem.titulo if relacao.portaria_origem else None
        for relacao in portaria.relacoes_saida:
            relacao.destino_titulo = relacao.portaria_destino.titulo if relacao.portaria_destino else None

    return portarias


@router.get("/search", response_model=List[PortariaResponse])
async def search_portarias_endpoint(
    q: str = Query(..., min_length=1, description="Query (número, ano ou título)"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    Pesquisa Portarias por número, ano ou título.
    """
    portarias = await search_portarias(db, q, limit=limit)
    
    # 🎯 CORRIGIDO: Popula os títulos de entrada/saída na busca também, evitando campos vazios no front
    for portaria in portarias:
        for relacao in portaria.relacoes_entrada:
            relacao.origem_titulo = relacao.portaria_origem.titulo if relacao.portaria_origem else None
        for relacao in portaria.relacoes_saida:
            relacao.destino_titulo = relacao.portaria_destino.titulo if relacao.portaria_destino else None

    return portarias


@router.get("/{portaria_id}", response_model=PortariaResponse)
async def get_portaria_endpoint(
    portaria_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    """
    Get Portaria by ID with full details and relationships.
    """
    portaria = await get_portaria(db, portaria_id)
    
    if not portaria:
        raise HTTPException(status_code=404, detail=f"Portaria {portaria_id} não encontrada")
    
    for relacao in portaria.relacoes_saida:
        relacao.destino_titulo = relacao.portaria_destino.titulo if relacao.portaria_destino else None
    for relacao in portaria.relacoes_entrada:
        relacao.origem_titulo = relacao.portaria_origem.titulo if relacao.portaria_origem else None
    
    return portaria


@router.get("/{portaria_id}/relacoes", response_model=List[RelacaoResponse])
async def get_portaria_relacoes(
    portaria_id: int = Path(..., gt=0),
    direcao: str = Query("both", pattern="^(saida|entrada|both)$"),
    db: Session = Depends(get_db),
):
    """
    Get relationships for an Portaria.
    """
    portaria = await get_portaria(db, portaria_id)
    
    if not portaria:
        raise HTTPException(status_code=404, detail=f"Portaria {portaria_id} not found")
    
    relacoes = await get_relacoes_portaria(db, portaria_id, direcao=direcao)
    return relacoes


@router.post("", response_model=PortariaBase, status_code=201)
async def create_portaria_endpoint(
    portaria: PortariaCreate,
    db: Session = Depends(get_db),
):
    """
    Cria uma nova Portaria (autenticação - fase 2).
    """
    try:
        db_portaria = await create_portaria(db, portaria)
        return db_portaria
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=409,
                detail=f"Portaria {portaria.titulo} já existe na base de dados."
            )
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{portaria_id}", response_model=PortariaResponse)
async def update_portaria_endpoint(
    portaria_id: int,
    portaria_update: PortariaUpdate,
    db: Session = Depends(get_db),
):
    """
    Atualizar uma Portaria (authenticated - phase 2).
    """
    db_portaria = await update_portaria(db, portaria_id, portaria_update)
    
    if not db_portaria:
        raise HTTPException(status_code=404, detail=f"Portaria {portaria_id} not found")
    
    return db_portaria


@router.delete("/{portaria_id}", status_code=204)
async def delete_portaria_endpoint(
    portaria_id: int,
    db: Session = Depends(get_db),
):
    """
    Excluir uma Portaria (authenticated - phase 2).
    """
    success = await delete_portaria(db, portaria_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Portaria {portaria_id} not found")
    
    return None