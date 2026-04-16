"""
API routes for Relacoes endpoints.

GET endpoints for listing relationships (public).
POST, DELETE endpoints for management (authenticated - phase 2).
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schemas import RelacaoCreate, RelacaoResponse, RelacaoUpdate
from app.crud.crud import (
    create_relacao,
    list_relacoes,
    update_relacao,
    get_relacoes_portaria,
    delete_relacao,
)

router = APIRouter(prefix="/api/v1/relacoes", tags=["relacoes"])


@router.get("", response_model=List[RelacaoResponse])
async def list_relacoes_endpoint(
    db: Session = Depends(get_db),
    tipo_relacao: Optional[str] = Query(None, description="Filtra por tipo de relação"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    List all relationships between ordinances.
    
    Query Parameters:
    - tipo_relacao: Filtrar por tipo de relação(complementa, altera, revoga, regulamenta)
    - skip: Pagination offset
    - limit: Pagination limit
    
    Retorna:
        Lista de relacionamentos
    """
    relacoes = await list_relacoes(db, tipo_relacao=tipo_relacao, skip=skip, limit=limit)
    return relacoes


@router.post("", response_model=RelacaoResponse, status_code=201)
async def create_relacao_endpoint(
    relacao: RelacaoCreate,
    db: Session = Depends(get_db),
):
    """
    Create a relationship between ordinances (authenticated - phase 2).
    
    Request Body:
    - portaria_origem_id: Source ordinance ID
    - portaria_destino_id: Destination ordinance ID
    - tipo_relacao: Type (complementa, altera, revoga, regulamenta)
    - descricao: Description (optional)
    - escopo: Scope (total or parcial, default "total")
    
    Returns:
        Created relationship
        
    Raises:
        400: Validation error
    """
    db_relacao = await create_relacao(db, relacao)
    return db_relacao


@router.put("/{relacao_id}", response_model=RelacaoResponse)
async def update_relacao_endpoint(
    relacao_id: int,
    relacao: RelacaoUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a relationship between ordinances (authenticated - phase 2).
    
    Request Body:
    - portaria_origem_id: ID da Portaria de origem
    - portaria_destino_id: ID da Portaria de destino
    - tipo_relacao: Type (complementa, altera, revoga, regulamenta)
    - descricao: Description (optional)
    - escopo: Scope (total ou parcial, default "total")
    
    Returns:
        Updated relação
        
    Raises:
        400: Validation error
    """
    db_relacao = await update_relacao(db, relacao_id, relacao)
    return db_relacao

@router.delete("/{relacao_id}", status_code=204)
async def delete_relacao_endpoint(
    relacao_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a relationship (authenticated - phase 2).
    
    Path Parameters:
    - relacao_id: Relationship ID to delete
    
    Raises:
        404: Relação não encontrada
    """
    success = await delete_relacao(db, relacao_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Relacao {relacao_id} não encontrada")
    
    return None
