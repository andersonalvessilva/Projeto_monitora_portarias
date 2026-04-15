"""
Pydantic schemas for Monitora Portarias application.

Schemas for request/response validation and serialization.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ============= Portaria Schemas =============

class PortariaBase(BaseModel):
    """Base schema for Portaria with common fields."""
    numero: int = Field(..., gt=0, description="Ordinance number (must be positive)")
    ano: int = Field(..., ge=1900, le=2100, description="Publication year")
    titulo: str = Field(..., min_length=3, max_length=255, description="Title or short description")
    descricao_completa: Optional[str] = Field(None, description="Full description")
    data_publicacao: datetime = Field(..., description="Publication date")
    link_externo: Optional[str] = Field(None, max_length=500, description="URL to Diário Oficial")
    link_local: Optional[str] = Field(None, max_length=500, description="Local document path")
    status: str = Field(default="ativa", description="Status: ativa, revogada, alterada, regulamentada")


class PortariaCreate(PortariaBase):
    """Schema for creating a new Portaria."""
    pass


class PortariaUpdate(BaseModel):
    """Schema for updating a Portaria."""
    titulo: Optional[str] = Field(None, min_length=3, max_length=255)
    descricao_completa: Optional[str] = None
    link_externo: Optional[str] = Field(None, max_length=500)
    link_local: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None


class PortariaResponse(PortariaBase):
    """Schema for Portaria response (with ID and relationships)."""
    id: int
    criada_em: datetime
    atualizada_em: datetime
    relacoes_saida: Optional[List['RelacaoResponse']] = []
    relacoes_entrada: Optional[List['RelacaoResponse']] = []
    artigos: Optional[List['ArtigoResponse']] = []

    class Config:
        from_attributes = True


# ============= Relacao Schemas =============

class RelacaoBase(BaseModel):
    """Base schema for Relacao with common fields."""
    portaria_origem_id: int = Field(..., description="Source ordinance ID")
    portaria_destino_id: int = Field(..., description="Destination ordinance ID")
    tipo_relacao: str = Field(..., description="Type: complementa, altera, revoga, regulamenta")
    descricao: Optional[str] = Field(None, description="Description of the relationship")
    escopo: str = Field(default="total", description="Scope: total or parcial")


class RelacaoCreate(RelacaoBase):
    """Schema for creating a new Relacao."""
    pass


class RelacaoResponse(RelacaoBase):
    """Schema for Relacao response (with ID and timestamps)."""
    id: int
    data_relacao: datetime
    criada_em: datetime

    class Config:
        from_attributes = True


# ============= Artigo Schemas =============

class ArtigoBase(BaseModel):
    """Base schema for Artigo with common fields."""
    numero: str = Field(..., min_length=1, description="Article/provision number")
    texto: Optional[str] = Field(None, description="Article text")
    status: str = Field(default="valido", description="Status: valido, alterado, revogado")
    portaria_id: int = Field(..., description="Parent ordinance ID")
    observacoes: Optional[str] = Field(None, description="Observations about the article")


class ArtigoCreate(ArtigoBase):
    """Schema for creating a new Artigo."""
    pass


class ArtigoResponse(ArtigoBase):
    """Schema for Artigo response (with ID and timestamp)."""
    id: int
    criado_em: datetime

    class Config:
        from_attributes = True


# Update forward references for nested models
PortariaResponse.model_rebuild()
RelacaoResponse.model_rebuild()
ArtigoResponse.model_rebuild()
