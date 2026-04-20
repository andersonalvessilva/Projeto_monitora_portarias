"""
API routes para endpoints de Relações.

GET endpoints para listagem de relacionamentos (publicas).
POST, DELETE endpoints para gerenciamento (autenticado - fase 2).

"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schemas import RelacaoCreate, RelacaoResponse, RelacaoUpdate
from app.crud.crud import (
    create_relacao,
    get_relacao,
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
    responses = []
    for relacao in relacoes:
        response = RelacaoResponse.from_orm(relacao)
        response.origem_titulo = relacao.portaria_origem.titulo if relacao.portaria_origem else None
        response.destino_titulo = relacao.portaria_destino.titulo if relacao.portaria_destino else None
        responses.append(response)
    return responses

@router.get("/{relacao_id}", response_model=RelacaoResponse)
async def get_relacao_endpoint(
    relacao_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a specific relationship by ID.
    
    Path Parameters:
    - relacao_id: Relationship ID
    
    Returns:
        Relacao instance or None if not found
    """
    relacao = await get_relacao(db, relacao_id)
    if not relacao:
        raise HTTPException(status_code=404, detail=f"Relacao {relacao_id} não encontrada")
    
    response = RelacaoResponse.from_orm(relacao)
    response.origem_titulo = relacao.portaria_origem.titulo if relacao.portaria_origem else None
    response.destino_titulo = relacao.portaria_destino.titulo if relacao.portaria_destino else None
    return response




@router.post("", response_model=RelacaoResponse, status_code=201)
async def create_relacao_endpoint(
    relacao: RelacaoCreate,
    db: Session = Depends(get_db),
):
    """
    Cria relacionamento entre duas Portarias (authenticated - phase 2).
    
    Request Body:
    - portaria_origem_id: ID da Portaria de origem
    - portaria_destino_id: ID da Portaria de destino
    - tipo_relacao: Type (complementa, altera, revoga, regulamenta)
    - descricao: Descrição (optional)
    - escopo: Scope (total ou parcial, padrão = "total")
    
    Returns:
        Relacionamento criado
        
    Raises:
        400: Erro de validação
    """
    try:
        db_relacao = await create_relacao(db, relacao)
        response = RelacaoResponse.from_orm(db_relacao)
        response.origem_titulo = db_relacao.portaria_origem.titulo if db_relacao.portaria_origem else None
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))




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
    response = RelacaoResponse.from_orm(db_relacao)
    response.origem_titulo = db_relacao.portaria_origem.titulo if db_relacao.portaria_origem else None
    return response

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
