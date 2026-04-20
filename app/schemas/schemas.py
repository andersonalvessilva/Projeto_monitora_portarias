"""
Pydantic schemas for Monitora Portarias application.

Schemas for request/response validation and serialization.
"""

from datetime import date
from typing import Optional, List
from pydantic import BaseModel, Field


# ============= Portaria Schemas =============

class PortariaBase(BaseModel):
    """Base schema for Portaria with common fields."""
    id: int
    numero: int = Field(..., gt=0, description="Número ordinal(necessita ser positivo)")
    ano: int = Field(..., ge=1900, le=2100, description="Ano da publicação")
    titulo: str = Field(..., min_length=3, max_length=255, description="Subtítulo")
    descricao_completa: Optional[str] = Field(None, description="Descrição completa")
    data_publicacao: date = Field(..., description="Ano da publicação")
    link_externo: Optional[str] = Field(None, max_length=500, description="URL to Diário Oficial")
    # link_local: Optional[str] = Field(None, max_length=500, description="Rota do arquivo na base local (Opcional)")
    status: str = Field(default="ativa", description="Status: ativa, revogada, alterada, regulamentada")


class PortariaCreate(BaseModel):
    """Schema for creating a new Portaria."""
    numero: int = Field(..., gt=0, description="Número ordinal(necessita ser positivo)")
    ano: int = Field(..., ge=1900, le=2100, description="Ano da publicação")
    titulo: str = Field(..., min_length=3, max_length=255, description="Subtítulo")
    descricao_completa: Optional[str] = Field(None, description="Descrição completa")
    data_publicacao: date = Field(..., description="Ano da publicação")
    link_externo: Optional[str] = Field(None, max_length=500, description="URL to Diário Oficial")


class PortariaUpdate(BaseModel):
    """Schema for updating a Portaria."""
    titulo: Optional[str] = Field(None, min_length=3, max_length=255)
    descricao_completa: Optional[str] = None
    link_externo: Optional[str] = Field(None, max_length=500)
    link_local: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None


class PortariaSummary(BaseModel):
    """Schema for Portaria summary response (reduced fields for listings)."""
    id: int
    numero: int
    ano: int
    titulo: str
    data_publicacao: date
    status: str
    #relacoes_entrada: Optional[List[RelacaoSummary]] = []

    class Config:
        from_attributes = True


class PortariaResponse(PortariaBase):
    """Schema for Portaria response (with ID and relationships)."""
    #id: int
    #criada_em: date
    #atualizada_em: date
    relacoes_saida: Optional[List['RelacaoResponse']] = []
    relacoes_entrada: Optional[List['RelacaoResponse']] = []
    #artigos: Optional[List['ArtigoResponse']] = []

    class Config:
        from_attributes = True


# ============= Relacao Schemas =============

class RelacaoBase(BaseModel):
    """Base schema for Relacao with common fields."""
    portaria_origem_id: int = Field(..., description="Portaria de origem ID")
    portaria_destino_id: int = Field(..., description="Portaria de destino ID")
    tipo_relacao: str = Field(..., description="Tipo: complementa, altera, revoga, regulamenta")
    descricao: Optional[str] = Field(None, description="Descrição do relacionamento")
    escopo: str = Field(default="total", description="Escopo: total ou parcial")

class RelacaoUpdate(BaseModel):
    """Schema for updating a Relacao."""
    portaria_origem_id: Optional[int] = Field(None, description="Source ordinance ID")
    portaria_destino_id: Optional[int] = Field(None, description="Destination ordinance ID")
    tipo_relacao: Optional[str] = Field(None, description="Tipo: complementa, altera, revoga, regulamenta")
    descricao: Optional[str] = Field(None, description="Descrição do relacionamento")
    escopo: Optional[str] = Field(None, description="Escopo: total or parcial")


class RelacaoCreate(RelacaoBase):
    """Schema for creating a new Relacao."""
    pass


class RelacaoResponse(RelacaoBase):
    """Schema for Relacao response (with ID and timestamps)."""
    origem_titulo: Optional[str] = Field(None, description="Título da portaria de origem")
    destino_titulo: Optional[str] = Field(None, description="Título da portaria de destino")
    #data_relacao: date
    #criada_em: date

    class Config:
        from_attributes = True


class RelacaoSummary(BaseModel):
    """Schema for Relacao summary response (reduced fields)."""
    id: int
    tipo_relacao: str
    origem_titulo: Optional[str] = Field(None, description="Título da portaria de origem")
    destino_titulo: Optional[str] = Field(None, description="Título da portaria de destino")

    class Config:
        from_attributes = True


# ============= Artigo Schemas =============

class ArtigoBase(BaseModel):
    """Base schema for Artigo with common fields."""
    numero: str = Field(..., min_length=1, description="Artigo/provision number")
    texto: Optional[str] = Field(None, description="Texto do artigo")
    status: str = Field(default="valido", description="Status: válido, alterado, revogado")
    portaria_id: int = Field(..., description="ID da portaria")
    observacoes: Optional[str] = Field(None, description="Observações sobre o artigo")

class ArtigoUpdate(BaseModel):
    """Schema for updating an Artigo."""
    numero: Optional[str] = Field(None, min_length=1, description="Artigo/provision number")
    texto: Optional[str] = None
    status: Optional[str] = None
    portaria_id: Optional[int] = Field(None, description="ID da portaria")
    observacoes: Optional[str] = Field(None, description="Observações sobre o artigo")


class ArtigoCreate(ArtigoBase):
    """Schema for creating a new Artigo."""
    pass


class ArtigoResponse(ArtigoBase):
    """Schema for Artigo response (with ID and timestamp)."""
    id: int
    criado_em: date

    class Config:
        from_attributes = True


# Update forward references for nested models
PortariaResponse.model_rebuild()
RelacaoResponse.model_rebuild()
ArtigoResponse.model_rebuild()
