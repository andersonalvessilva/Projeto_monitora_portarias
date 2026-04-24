"""
Operações CRUD para Monitora Portarias.

Funções para operações de Criar, Ler, Atualizar, Excluir em modelos.
"""

from fastapi import HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
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


# ============= CRUD de Portarias =============

async def create_portaria(db: Session, portaria: PortariaCreate) -> Portaria:
    """
    Cria uma nova portaria.
    
    Argumentos:
        db: Sessão do banco de dados
        portaria: Schema PortariaCreate
        
    Retorna:
        Instância de Portaria criada
        
    Levanta:
        sqlalchemy.exc.IntegrityError: Se numero+ano já existe
    """
    db_portaria = Portaria(**portaria.model_dump())
    db.add(db_portaria)
    db.commit()
    db.refresh(db_portaria)
    return db_portaria


async def get_portaria(db: Session, portaria_id: int) -> Optional[Portaria]:
    """
    Obtém uma portaria pelo ID.
    
    Argumentos:
        db: Sessão do banco de dados
        portaria_id: ID da portaria
        
    Retorna:
        Instância de Portaria ou None se não encontrada
    """
    return db.query(Portaria).options(
        joinedload(Portaria.relacoes_saida).joinedload(Relacao.portaria_destino),
        joinedload(Portaria.relacoes_entrada).joinedload(Relacao.portaria_origem)
    ).filter(Portaria.id == portaria_id).first()


async def list_portarias(
    db: Session,
    year: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Portaria]:
    """
    Lista portarias com filtros opcionais.
    
    Argumentos:
        db: Sessão do banco de dados
        year: Filtra pelo ano de publicação
        status: Filtra pelo status (ativa, revogada, alterada, regulamentada)
        skip: Número de registros a pular (paginação)
        limit: Número máximo de registros a retornar
        
    Retorna:
        Lista de instâncias de Portaria
    """
    query = db.query(Portaria).options(
        joinedload(Portaria.relacoes_saida).joinedload(Relacao.portaria_destino),
        joinedload(Portaria.relacoes_entrada).joinedload(Relacao.portaria_origem),
    ).order_by(Portaria.ano.desc(), Portaria.numero.desc())
    
    if year:
        query = query.filter(Portaria.ano == year)
    
    if status:
        query = query.filter(Portaria.status == status)
    
    return query.offset(skip).limit(limit).all()


async def search_portarias(db: Session, query_text: str, limit: int = 100) -> List[Portaria]:
    """
    Busca portarias por número, ano ou título.
    
    Argumentos:
        db: Sessão do banco de dados
        query_text: Consulta de busca
        limit: Número máximo de resultados
        
    Retorna:
        Lista de instâncias de Portaria correspondentes
    """
    # Tenta analisar como número/ano
    try:
        numero = int(query_text)
        return db.query(Portaria).filter(
            or_(
                Portaria.numero == numero, 
                Portaria.ano == numero)).limit(limit).all()
    except ValueError as e:
        print(f"Query '{query_text}' não é um número/ano: {e}")
        pass
    # Busca em titulo e descricao_completa
    search_term = f"%{query_text}%"
    query =  db.query(Portaria).filter( or_(
                Portaria.titulo.ilike(search_term),
                Portaria.descricao_completa.ilike(search_term),
            )
        ).limit(limit).all()
    if len(query) == 0:
        raise HTTPException(status_code=404, detail=f"Nenhuma Portarias encontrada com o seguinte parâmetro de consulta: '{query_text}'")
    else:
        return query


async def update_portaria(
    db: Session, portaria_id: int, portaria_update: PortariaUpdate
) -> Optional[Portaria]:
    """
    Atualiza uma portaria.
    
    Argumentos:
        db: Sessão do banco de dados
        portaria_id: ID da portaria para atualizar
        portaria_update: Schema PortariaUpdate com campos para atualizar
        
    Retorna:
        Instância de Portaria atualizada ou None se não encontrada
    """
    db_portaria = await get_portaria(db, portaria_id)
    
    if not db_portaria:
        return None
    
    # Atualiza apenas os campos fornecidos
    update_data = portaria_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_portaria, key, value)
    
    db.commit()
    db.refresh(db_portaria)
    return db_portaria


async def delete_portaria(db: Session, portaria_id: int) -> bool:
    """
    Exclui uma portaria (em cascata para relações e artigos).
    
    Argumentos:
        db: Sessão do banco de dados
        portaria_id: ID da portaria a ser excluída
        
    Retorna:
        True se excluída, False se não encontrada
    """
    db_portaria = await get_portaria(db, portaria_id)
    
    if not db_portaria:
        return False
    
    db.delete(db_portaria)
    db.commit()
    return True


# ============= CRUD de Relações =============

async def create_relacao(db: Session, relacao: RelacaoCreate) -> Relacao:
    """
    Cria um relacionamento entre Portarias.
    
    Argumentos:
        db: Sessão do banco de dados
        relacao: Schema RelacaoCreate

    Retorna:
        Instância de Relação criada

    Levanta:
        404: Portaria não encontrada (origem ou destino)
    """

    db_relacao = Relacao(**relacao.model_dump())

    portaria_origem = await get_portaria(db, relacao.portaria_origem_id)
    portaria_destino = await get_portaria(db, relacao.portaria_destino_id)
    
    if portaria_origem and portaria_destino:
        await update_portaria(db, portaria_destino.id, PortariaUpdate(status="alterada"))
        db.add(db_relacao)
        db.commit()
        db.refresh(db_relacao)
        return db_relacao
    else:
        raise HTTPException(status_code=404, 
                            detail=f"Portaria(s) não encontrada(s)")


async def get_relacao(db: Session, relacao_id: int) -> Optional[Relacao]:
    """
    Obtém um relacionamento pelo ID.
    
    Argumentos:
        db: Sessão do banco de dados
        relacao_id: ID do relacionamento a ser recuperado
        
    Retorna:
        Instância de Relacao ou None se não encontrada
    """
    return db.query(Relacao).options(joinedload(Relacao.portaria_origem), joinedload(Relacao.portaria_destino)).filter(Relacao.id == relacao_id).first()


async def get_relacoes_portaria(
    db: Session, portaria_id: int, direcao: str = "ambos"
) -> List[Relacao]:
    """
    Obtém relacionamentos para uma portaria.
    
    Argumentos:
        db: Sessão do banco de dados
        portaria_id: ID da portaria
        direcao: "saída" (saída), "entrada" (entrada), ou "ambos" (padrão)
        
    Retorna:
        Lista de instâncias de Relacao
    """
    query = db.query(Relacao).options(joinedload(Relacao.portaria_origem), joinedload(Relacao.portaria_destino))
    if direcao == "saida":
        relacoes = query.filter(Relacao.portaria_origem_id == portaria_id).all()
        for relacao in relacoes:
            relacao.origem_titulo = relacao.portaria_origem.titulo if relacao.portaria_origem else None
            relacao.destino_titulo = relacao.portaria_destino.titulo if relacao.portaria_destino else None
        return relacoes
    elif direcao == "entrada":
        relacoes = query.filter(Relacao.portaria_destino_id == portaria_id).all()
        for relacao in relacoes:
            relacao.origem_titulo = relacao.portaria_origem.titulo if relacao.portaria_origem else None
            relacao.destino_titulo = relacao.portaria_destino.titulo if relacao.portaria_destino else None
        return relacoes
    else:  # ambos
        relacoes = query.filter(
            or_(
                Relacao.portaria_origem_id == portaria_id,
                Relacao.portaria_destino_id == portaria_id,
            )
        ).all()
        for relacao in relacoes:
            relacao.origem_titulo = relacao.portaria_origem.titulo if relacao.portaria_origem else None
            relacao.destino_titulo = relacao.portaria_destino.titulo if relacao.portaria_destino else None

        return relacoes


async def list_relacoes(
    db: Session,
    tipo_relacao: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Relacao]:
    """
    Lista relacionamentos com filtros opcionais.
    
    Argumentos:
        db: Sessão do banco de dados
        tipo_relacao: Filtra pelo tipo de relacionamento
        skip: Número de registros a pular
        limit: Número máximo de registros
        
    Retorna:
        Lista das instâncias Relacao
    """
    query = db.query(Relacao).options(joinedload(Relacao.portaria_origem), joinedload(Relacao.portaria_destino))
    
    if tipo_relacao:
        query = query.filter(Relacao.tipo_relacao == tipo_relacao)
    
    return query.offset(skip).limit(limit).all()


async def delete_relacao(db: Session, relacao_id: int) -> bool:
    """
    Deleta o relacionamento.
    
    Argumentos:
        db: Sessão do banco de dados
        relacao_id: ID do relacionamento a ser excluído
        
    Retorna:
        True se excluído, False se não encontrado
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
    Atualiza um relacionamento.
    
    Argumentos:
        db: Sessão do banco de dados
        relacao_id: ID do relacionamento a ser atualizado
        relacao_update: Schema RelacaoUpdate com campos para atualizar
        
    Retorna:
        Instância de Relacao atualizada ou None se não encontrada
    """
    db_relacao = await get_relacao(db, relacao_id)
    
    if not db_relacao:
        return None
    
    # Atualiza apenas os campos fornecidos
    update_data = relacao_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_relacao, key, value)
    
    db.commit()
    db.refresh(db_relacao)
    return db_relacao


# ============= CRUD de Artigos =============

async def create_artigo(db: Session, artigo: ArtigoCreate) -> Artigo:
    """
    Cria um artigo/dispositivo.
    
    Argumentos:
        db: Sessão do banco de dados
        artigo: Schema ArtigoCreate
        
    Retorna:
        Instância de Artigo criada
    """
    db_artigo = Artigo(**artigo.model_dump())
    db.add(db_artigo)
    db.commit()
    db.refresh(db_artigo)
    return db_artigo


async def get_artigo(db: Session, artigo_id: int) -> Optional[Artigo]:
    """
    Obtém um artigo pelo ID.
    
    Argumentos:
        db: Sessão do banco de dados
        artigo_id: ID do artigo a ser recuperado
        
    Retorna:
        Instância de Artigo ou None se não encontrada
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
    Apaga um artigo.
    
    Argumentos:
        db: Database session
        artigo_id: Article ID to delete
        
    Retorna:
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
