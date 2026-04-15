"""
API routes for Portarias endpoints.

GET endpoints for listing and searching ordinances (public).
POST, PUT, DELETE endpoints for management (authenticated - phase 2).
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Portaria
from app.schemas.schemas import PortariaCreate, PortariaUpdate, PortariaResponse, RelacaoResponse
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
    year: Optional[int] = Query(None, description="Filter by publication year"),
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum records to return"),
):
    """
    List all ordinances with optional filters.
    
    Query Parameters:
    - year: Filter by publication year
    - status: Filter by status (ativa, revogada, alterada, regulamentada)
    - skip: Pagination offset (default 0)
    - limit: Pagination limit (default 100, max 1000)
    
    Returns:
        List of ordinances
    """
    portarias = await list_portarias(db, year=year, status=status, skip=skip, limit=limit)
    return portarias


@router.get("/search", response_model=List[PortariaResponse])
async def search_portarias_endpoint(
    q: str = Query(..., min_length=1, description="Search query (number, year, or title)"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    Search ordinances by number, year, or title.
    
    Query Parameters:
    - q: Search term (required)
    - limit: Maximum results (default 100)
    
    Returns:
        List of matching ordinances
    """
    portarias = await search_portarias(db, q, limit=limit)
    return portarias


@router.get("/{portaria_id}", response_model=PortariaResponse)
async def get_portaria_endpoint(
    portaria_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
):
    """
    Get ordinance by ID with full details and relationships.
    
    Path Parameters:
    - portaria_id: Ordinance ID
    
    Returns:
        Ordinance details
        
    Raises:
        404: Ordinance not found
    """
    portaria = await get_portaria(db, portaria_id)
    
    if not portaria:
        raise HTTPException(status_code=404, detail=f"Portaria {portaria_id} not found")
    
    return portaria


@router.get("/{portaria_id}/relacoes", response_model=List[RelacaoResponse])
async def get_portaria_relacoes(
    portaria_id: int = Path(..., gt=0),
    direcao: str = Query("both", regex="^(saida|entrada|both)$"),
    db: Session = Depends(get_db),
):
    """
    Get relationships for an ordinance.
    
    Path Parameters:
    - portaria_id: Ordinance ID
    
    Query Parameters:
    - direcao: "saida" (outgoing), "entrada" (incoming), or "both"
    
    Returns:
        List of relationships
        
    Raises:
        404: Ordinance not found
    """
    portaria = await get_portaria(db, portaria_id)
    
    if not portaria:
        raise HTTPException(status_code=404, detail=f"Portaria {portaria_id} not found")
    
    relacoes = await get_relacoes_portaria(db, portaria_id, direcao=direcao)
    return relacoes


@router.post("", response_model=PortariaResponse, status_code=201)
async def create_portaria_endpoint(
    portaria: PortariaCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new ordinance (authenticated - phase 2).
    
    Request Body:
    - numero: Ordinance number (positive integer)
    - ano: Publication year
    - titulo: Title or short description
    - data_publicacao: Publication date
    - descricao_completa: Full description (optional)
    - link_externo: URL to Diário Oficial (optional)
    - link_local: Local document path (optional)
    - status: Status (default "ativa")
    
    Returns:
        Created ordinance
        
    Raises:
        400: Validation error
        409: Ordinance with same numero+ano already exists
    """
    try:
        db_portaria = await create_portaria(db, portaria)
        return db_portaria
    except Exception as e:
        if "uq_portaria_numero_ano" in str(e):
            raise HTTPException(
                status_code=409,
                detail=f"Portaria {portaria.numero}/{portaria.ano} already exists"
            )
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{portaria_id}", response_model=PortariaResponse)
async def update_portaria_endpoint(
    portaria_id: int,
    portaria_update: PortariaUpdate,
    db: Session = Depends(get_db),
):
    """
    Update an ordinance (authenticated - phase 2).
    
    Path Parameters:
    - portaria_id: Ordinance ID to update
    
    Request Body:
    - All fields are optional; only provided fields are updated
    
    Returns:
        Updated ordinance
        
    Raises:
        404: Ordinance not found
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
    Delete an ordinance (authenticated - phase 2).
    
    Path Parameters:
    - portaria_id: Ordinance ID to delete
    
    Raises:
        404: Ordinance not found
    """
    success = await delete_portaria(db, portaria_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Portaria {portaria_id} not found")
    
    return None
