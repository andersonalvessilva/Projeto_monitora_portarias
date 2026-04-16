"""
CRUD operations for Monitora Portarias application.

Functions for Create, Read, Update, Delete operations on models.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.models import Portaria, Relacao, Artigo
from app.schemas.schemas import (
    PortariaCreate,
    PortariaUpdate,
    RelacaoCreate,
    RelacaoUpdate,
    ArtigoCreate,
    ArtigoUpdate,
)


# ============= Portaria CRUD =============

async def create_portaria(db: Session, portaria: PortariaCreate) -> Portaria:
    """
    Create a new ordinance.
    
    Args:
        db: Database session
        portaria: PortariaCreate schema
        
    Returns:
        Created Portaria instance
        
    Raises:
        sqlalchemy.exc.IntegrityError: If numero+ano already exists
    """
    db_portaria = Portaria(**portaria.model_dump())
    db.add(db_portaria)
    db.commit()
    db.refresh(db_portaria)
    return db_portaria


async def get_portaria(db: Session, portaria_id: int) -> Optional[Portaria]:
    """
    Get ordinance by ID.
    
    Args:
        db: Database session
        portaria_id: Ordinance ID
        
    Returns:
        Portaria instance or None if not found
    """
    return db.query(Portaria).filter(Portaria.id == portaria_id).first()


async def list_portarias(
    db: Session,
    year: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Portaria]:
    """
    List ordinances with optional filters.
    
    Args:
        db: Database session
        year: Filter by publication year
        status: Filter by status (ativa, revogada, alterada, regulamentada)
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        
    Returns:
        List of Portaria instances
    """
    query = db.query(Portaria)
    
    if year:
        query = query.filter(Portaria.ano == year)
    
    if status:
        query = query.filter(Portaria.status == status)
    
    return query.offset(skip).limit(limit).all()


async def search_portarias(db: Session, query_text: str, limit: int = 100) -> List[Portaria]:
    """
    Search ordinances by number, year, or title.
    
    Args:
        db: Database session
        query_text: Search query
        limit: Maximum number of results
        
    Returns:
        List of matching Portaria instances
    """
    # Try parsing as number/year
    try:
        numero = int(query_text)
        return db.query(Portaria).filter(Portaria.numero == numero).limit(limit).all()
    except ValueError:
        pass
    
    # Search in titulo and descricao_completa
    search_term = f"%{query_text}%"
    return (
        db.query(Portaria)
        .filter(
            or_(
                Portaria.titulo.ilike(search_term),
                Portaria.descricao_completa.ilike(search_term),
            )
        )
        .limit(limit)
        .all()
    )


async def update_portaria(
    db: Session, portaria_id: int, portaria_update: PortariaUpdate
) -> Optional[Portaria]:
    """
    Update an ordinance.
    
    Args:
        db: Database session
        portaria_id: Ordinance ID to update
        portaria_update: PortariaUpdate schema with fields to update
        
    Returns:
        Updated Portaria instance or None if not found
    """
    db_portaria = await get_portaria(db, portaria_id)
    
    if not db_portaria:
        return None
    
    # Update only provided fields
    update_data = portaria_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_portaria, key, value)
    
    db.commit()
    db.refresh(db_portaria)
    return db_portaria


async def delete_portaria(db: Session, portaria_id: int) -> bool:
    """
    Delete an ordinance (cascades to relacoes and artigos).
    
    Args:
        db: Database session
        portaria_id: Ordinance ID to delete
        
    Returns:
        True if deleted, False if not found
    """
    db_portaria = await get_portaria(db, portaria_id)
    
    if not db_portaria:
        return False
    
    db.delete(db_portaria)
    db.commit()
    return True


# ============= Relacao CRUD =============

async def create_relacao(db: Session, relacao: RelacaoCreate) -> Relacao:
    """
    Create a relationship between ordinances.
    
    Args:
        db: Database session
        relacao: RelacaoCreate schema
        
    Returns:
        Created Relacao instance
    """
    db_relacao = Relacao(**relacao.model_dump())
    db.add(db_relacao)
    db.commit()
    db.refresh(db_relacao)
    return db_relacao


async def get_relacao(db: Session, relacao_id: int) -> Optional[Relacao]:
    """
    Get a relationship by ID.
    
    Args:
        db: Database session
        relacao_id: Relationship ID to retrieve
        
    Returns:
        Relacao instance or None if not found
    """
    return db.query(Relacao).filter(Relacao.id == relacao_id).first()


async def get_relacoes_portaria(
    db: Session, portaria_id: int, direcao: str = "both"
) -> List[Relacao]:
    """
    Get relationships for an ordinance.
    
    Args:
        db: Database session
        portaria_id: Ordinance ID
        direcao: "saida" (outgoing), "entrada" (incoming), or "both" (default)
        
    Returns:
        List of Relacao instances
    """
    if direcao == "saida":
        return db.query(Relacao).filter(Relacao.portaria_origem_id == portaria_id).all()
    elif direcao == "entrada":
        return db.query(Relacao).filter(Relacao.portaria_destino_id == portaria_id).all()
    else:  # both
        return db.query(Relacao).filter(
            or_(
                Relacao.portaria_origem_id == portaria_id,
                Relacao.portaria_destino_id == portaria_id,
            )
        ).all()


async def list_relacoes(
    db: Session,
    tipo_relacao: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Relacao]:
    """
    List relationships with optional filters.
    
    Args:
        db: Database session
        tipo_relacao: Filter by relationship type
        skip: Number of records to skip
        limit: Maximum number of records
        
    Retorna:
        Lista das instâncias Relacao
    """
    query = db.query(Relacao)
    
    if tipo_relacao:
        query = query.filter(Relacao.tipo_relacao == tipo_relacao)
    
    return query.offset(skip).limit(limit).all()


async def delete_relacao(db: Session, relacao_id: int) -> bool:
    """
    Deleta o relacionamento.
    
    Args:
        db: Database session
        relacao_id: Relationship ID to delete
        
    Returns:
        True if deleted, False if not found
    """
    db_relacao = db.query(Relacao).filter(Relacao.id == relacao_id).first()
    
    if not db_relacao:
        return False
    
    db.delete(db_relacao)
    db.commit()
    return True


async def update_relacao(
    db: Session, relacao_id: int, relacao_update: RelacaoUpdate
) -> Optional[Relacao]:
    """
    Update a relationship.
    
    Args:
        db: Database session
        relacao_id: Relationship ID to update
        relacao_update: RelacaoUpdate schema with fields to update
        
    Returns:
        Updated Relacao instance or None if not found
    """
    db_relacao = await get_relacao(db, relacao_id)
    
    if not db_relacao:
        return None
    
    # Update only provided fields
    update_data = relacao_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_relacao, key, value)
    
    db.commit()
    db.refresh(db_relacao)
    return db_relacao


# ============= Artigo CRUD =============

async def create_artigo(db: Session, artigo: ArtigoCreate) -> Artigo:
    """
    Create an article/provision.
    
    Args:
        db: Database session
        artigo: ArtigoCreate schema
        
    Returns:
        Created Artigo instance
    """
    db_artigo = Artigo(**artigo.model_dump())
    db.add(db_artigo)
    db.commit()
    db.refresh(db_artigo)
    return db_artigo


async def get_artigo(db: Session, artigo_id: int) -> Optional[Artigo]:
    """
    Get an article by ID.
    
    Args:
        db: Database session
        artigo_id: Article ID to retrieve
        
    Returns:
        Artigo instance or None if not found
    """
    return db.query(Artigo).filter(Artigo.id == artigo_id).first()


async def get_artigos_portaria(db: Session, portaria_id: int) -> List[Artigo]:
    """
    Get all articles from an ordinance.
    
    Args:
        db: Database session
        portaria_id: Ordinance ID
        
    Returns:
        List of Artigo instances
    """
    return db.query(Artigo).filter(Artigo.portaria_id == portaria_id).all()


async def delete_artigo(db: Session, artigo_id: int) -> bool:
    """
    Delete an article.
    
    Args:
        db: Database session
        artigo_id: Article ID to delete
        
    Returns:
        True if deleted, False if not found
    """
    db_artigo = db.query(Artigo).filter(Artigo.id == artigo_id).first()
    
    if not db_artigo:
        return False
    
    db.delete(db_artigo)
    db.commit()
    return True


async def update_artigo(
    db: Session, artigo_id: int, artigo_update: ArtigoUpdate
) -> Optional[Artigo]:
    """
    Update an article.
    
    Args:
        db: Database session
        artigo_id: Article ID to update
        artigo_update: ArtigoUpdate schema with fields to update
        
    Returns:
        Updated Artigo instance or None if not found
    """
    db_artigo = await get_artigo(db, artigo_id)
    
    if not db_artigo:
        return None
    
    # Update only provided fields
    update_data = artigo_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_artigo, key, value)
    
    db.commit()
    db.refresh(db_artigo)
    return db_artigo
