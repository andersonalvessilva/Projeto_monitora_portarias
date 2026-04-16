"""
SQLAlchemy models for Monitora Portarias application.

Models:
- Portaria: Regulatory ordinance
- Relacao: Relationship between ordinances
- Artigo: Article/provision within an ordinance
"""

from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Portaria(Base):
    """
    Regulatory ordinance from Ministry of Health.
    
    Represents a portaria (regulatory ordinance) with its metadata,
    publication details, and relationships with other ordinances.
    """
    __tablename__ = "portarias"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(Integer, nullable=False)
    ano = Column(Integer, nullable=False)
    titulo = Column(String(255), nullable=False)
    descricao_completa = Column(Text, nullable=True)
    data_publicacao = Column(Date, nullable=False)
    link_externo = Column(String(500), nullable=True, doc="URL to Diário Oficial")
    link_local = Column(String(500), nullable=True, doc="Local path to document")
    status = Column(
        String(20),
        default="ativa",
        nullable=False,
        doc="Status: ativa, revogada, alterada, regulamentada"
    )
    criada_em = Column(Date, default=date.today, nullable=False)
    atualizada_em = Column(Date, default=date.today, onupdate=date.today, nullable=False)

    # Relationships (bidirectional)
    relacoes_saida = relationship(
        "Relacao",
        foreign_keys="Relacao.portaria_origem_id",
        back_populates="portaria_origem",
        cascade="all, delete-orphan"
    )
    relacoes_entrada = relationship(
        "Relacao",
        foreign_keys="Relacao.portaria_destino_id",
        back_populates="portaria_destino",
        cascade="all, delete-orphan"
    )
    artigos = relationship("Artigo", back_populates="portaria", cascade="all, delete-orphan")

    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint('numero', 'ano', name='uq_portaria_numero_ano'),
        Index('idx_portaria_status', 'status'),
        Index('idx_portaria_data_publicacao', 'data_publicacao'),
        Index('idx_portaria_ano', 'ano'),
    )

    def __repr__(self):
        return f"<Portaria(id={self.id}, numero={self.numero}/{self.ano}, status={self.status})>"


class Relacao(Base):
    """
    Relationship between two ordinances.
    
    Represents how one ordinance complements, alters, revokes, or regulates another.
    """
    __tablename__ = "relacoes"

    id = Column(Integer, primary_key=True, index=True)
    portaria_origem_id = Column(Integer, ForeignKey("portarias.id"), nullable=False)
    portaria_destino_id = Column(Integer, ForeignKey("portarias.id"), nullable=False)
    tipo_relacao = Column(
        String(20),
        nullable=False,
        doc="Type: complementa, altera, revoga, regulamenta"
    )
    descricao = Column(Text, nullable=True)
    escopo = Column(
        String(20),
        default="total",
        nullable=False,
        doc="Scope: total (entire ordinance) or parcial (partial)"
    )
    data_relacao = Column(Date, default=date.today, nullable=False)
    criada_em = Column(Date, default=date.today, nullable=False)

    # Relationships
    portaria_origem = relationship(
        "Portaria",
        foreign_keys=[portaria_origem_id],
        back_populates="relacoes_saida"
    )
    portaria_destino = relationship(
        "Portaria",
        foreign_keys=[portaria_destino_id],
        back_populates="relacoes_entrada"
    )
    artigos_afetados = relationship(
        "Artigo",
        back_populates="relacao_alterou",
        cascade="all, delete-orphan"
    )

    # Indexes
    __table_args__ = (
        Index('idx_relacao_tipo', 'tipo_relacao'),
        Index('idx_relacao_origem', 'portaria_origem_id'),
        Index('idx_relacao_destino', 'portaria_destino_id'),
    )

    def __repr__(self):
        return f"<Relacao(id={self.id}, origem={self.portaria_origem_id}, destino={self.portaria_destino_id}, tipo={self.tipo_relacao})>"


class Artigo(Base):
    """
    Article or provision within an ordinance.
    
    Represents specific articles/provisions that can be altered or revoked
    by another ordinance.
    """
    __tablename__ = "artigos"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(50), nullable=False, doc="Artigo/número (e.g., '1', 'Art. 5, § 2')")
    texto = Column(Text, nullable=True)
    status = Column(
        String(20),
        default="valido",
        nullable=False,
        doc="Status: valido, alterado, revogado"
    )
    portaria_id = Column(Integer, ForeignKey("portarias.id"), nullable=False)
    relacao_alterou_id = Column(Integer, ForeignKey("relacoes.id"), nullable=True)
    observacoes = Column(Text, nullable=True, doc="Observations about exclusions or alterations")
    criado_em = Column(Date, default=date.today, nullable=False)

    # Relationships
    portaria = relationship("Portaria", back_populates="artigos")
    relacao_alterou = relationship(
        "Relacao",
        back_populates="artigos_afetados",
        foreign_keys=[relacao_alterou_id]
    )

    # Indexes
    __table_args__ = (
        Index('idx_artigo_numero', 'numero'),
        Index('idx_artigo_status', 'status'),
        Index('idx_artigo_portaria', 'portaria_id'),
    )

    def __repr__(self):
        return f"<Artigo(id={self.id}, numero={self.numero}, portaria_id={self.portaria_id}, status={self.status})>"
