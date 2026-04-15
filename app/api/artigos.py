"""
API routes for Artigos endpoints.

GET endpoints for listing articles (public).
POST, DELETE endpoints for management (authenticated - phase 2).
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.schemas import ArtigoCreate, ArtigoResponse
from app.crud.crud import (
    create_artigo,
    get_artigos_portaria,
    delete_artigo,
)

router = APIRouter(prefix="/api/v1/artigos", tags=["artigos"])


@router.get("", response_model=List[ArtigoResponse])
async def list_artigos_endpoint(
    db: Session = Depends(get_db),
    portaria_id: int = Query(None, description="Filter by ordinance ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    List articles/provisions.
    
    Query Parameters:
    - portaria_id: Filter articles from a specific ordinance
    - skip: Pagination offset
    - limit: Pagination limit
    
    Returns:
        List of articles
    """
    if portaria_id:
        artigos = await get_artigos_portaria(db, portaria_id)
        return artigos[:limit]
    else:
        # Return empty for now - full list would need pagination in DB
        return []


@router.post("", response_model=ArtigoResponse, status_code=201)
async def create_artigo_endpoint(
    artigo: ArtigoCreate,
    db: Session = Depends(get_db),
):
    """
    Create an article/provision (authenticated - phase 2).
    
    Request Body:
    - numero: Article/provision number
    - portaria_id: Parent ordinance ID
    - texto: Article text (optional)
    - status: Status (default "valido")
    - observacoes: Observations (optional)
    
    Returns:
        Created article
        
    Raises:
        400: Validation error
    """
    db_artigo = await create_artigo(db, artigo)
    return db_artigo


@router.delete("/{artigo_id}", status_code=204)
async def delete_artigo_endpoint(
    artigo_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete an article (authenticated - phase 2).
    
    Path Parameters:
    - artigo_id: Article ID to delete
    
    Raises:
        404: Article not found
    """
    success = await delete_artigo(db, artigo_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Artigo {artigo_id} not found")
    
    return None
