# Monitoramento de Portarias

### Descrição

Sistema para exibição e controle de ações de Portarias do Ministério da Saúde que impactam o setor de monitoramento de saúde.
Cada nova portaria pode alterar, adicionar ou excluir parcialmente ou totalmente outra portaria.
Cada portaria possui número, ano de publicação, descrição resumida e links para consulta.

### Objetivo

Fornecer uma visão clara e interativa das relações entre portarias, permitindo identificar rapidamente complementos, alterações, revogações e regulamentações.
O sistema deve ajudar analistas e gestores a entender o impacto de mudanças normativas.

### Usuários

- Analista de monitoramento
- Técnico de regulamentação
- Gestor de políticas públicas
- Usuário externo com acesso restrito (consulta)

### Modelo de dados proposto

#### Portaria
- Identificador único interno
- Número da portaria
- Ano de publicação
- Título ou descrição resumida
- Descrição completa
- Data de publicação
- Link externo para o Diário Oficial
- Link local para cópia interna ou documento de referência
- Status atual (ativa, revogada, alterada, regulamentada)

#### Relação entre portarias
- Portaria origem
- Portaria destino
- Tipo de relação: complementa, altera, revoga, regulamenta
- Descrição da relação
- Artigos ou dispositivos afetados
- Escopo: total ou parcial
- Data da relação
- Cor visual sugerida para o tipo de relação

#### Artigo / dispositivo
- Número do artigo ou dispositivo
- Texto do artigo
- Status do artigo (válido, alterado, revogado)
- Portaria que alterou ou revogou
- Observações sobre exclusões parciais

### Métodos / Tipos de ligação

- Complementa ou adiciona (linha verde)
  - Quais portarias estão envolvidas?
  - O que é complementado ou adicionado?
- Altera ou modifica (linha laranja)
  - Quais portarias estão envolvidas?
  - O que é alterado?
- Revoga ou exclui (linha vermelha)
  - Quais portarias são revogadas?
  - Que artigos ou dispositivos são revogados/excluídos?
- Regulamenta (linha azul)
  - O que é regulamentado?
  - Qual é a portaria base?

### Requisitos funcionais

- O sistema deve ser acessado via web.
- Deve exibir uma visualização gráfica das interações entre portarias.
- Cada portaria deve ser representada como um nó e cada relação como uma aresta.
- As linhas devem usar cores para diferenciar os tipos de relação.
- Deve ser possível ver os links externos e locais de cada portaria.
- Deve registrar quais artigos/dispositivos foram revogados, alterados ou excluídos.
- As informações devem ser persistidas em banco de dados.
- Deve permitir busca por número, ano, texto e artigos.
- Deve permitir filtros por ano, tipo de relação, status e portaria.
- Consultas devem ser públicas; cadastro, alteração e exclusão de portaria devem ser feitos por usuários autenticados.

### Regras de negócio

- Uma portaria pode ter várias relações com outras portarias.
- Uma portaria pode revogar total ou parcialmente outra portaria.
- Em revogações parciais, os artigos ou dispositivos afetados devem ser detalhados.
- Em alterações, deve ser especificado o conteúdo alterado.
- Uma portaria totalmente revogada pode ficar inativa no histórico.
- As relações devem ser navegáveis em duas direções: entrada e saída.
- A visualização deve permitir identificar o impacto de uma portaria sobre outras.

### Interface e usabilidade

- Tela principal com diagrama interativo de portarias.
- Legenda de cores e símbolos para os tipos de relação.
- Painel lateral com detalhes da portaria selecionada.
- Exibição de relações de entrada e saída para a portaria selecionada.
- Possibilidade de expandir e colapsar grupos de portarias.
- Linha do tempo cronológica de publicações e alterações.
- Relatórios ou exportação de gráficos para PNG/PDF.

### Frontend / Stack Tecnológico

**Framework e UI:**
- **Vite**: desenvolvimento rápido com HMR e build otimizado.
- **React 19**: UI declarativa e componentes reutilizáveis.
- **TypeScript**: tipagem estática no frontend e maior segurança em API calls.
- **ESLint**: padrão de código e qualidade.

**Frontend implementado em:**
- `frontend/`

**Responsabilidades do frontend:**
- Consumir a API pública REST do backend (`/api/v1`).
- Exibir lista de portarias, filtros e busca.
- Mostrar painel detalhado da portaria selecionada.
- Preparar a visualização de relações com cores e contadores.
- Suporte a busca por número, ano e título.

**Configuração de ambiente frontend:**
- `VITE_API_BASE_URL` (opcional) aponta para a URL da API do backend.
- Default: `http://localhost:8000`.

**MVP do frontend:**
- Dashboard de portarias.
- Lista de portarias com seleção.
- Painel de detalhes com links e status.
- Pesquisa e filtros por ano/status.
- Visão inicial de relações de entrada/saída.

**Próxima fase front-end:**
- Gráfico de nós/arestas para as relações.
- Autenticação para criação/edição de portarias.
- Exportação de relatórios e impressão.

### Backend / Stack Tecnológico

**Framework e ORM:**
- **FastAPI**: Framework async moderno com validação automática via Pydantic, documentação Swagger nativa.
- **SQLAlchemy**: ORM flexível com suporte a múltiplos bancos de dados, relacionamentos complexos e session management.
- **Pydantic**: Validação de dados com schemas reutilizáveis para request/response.

**Banco de dados por ambiente:**
- **Dev/MVP** (branch `dev`): SQLite (`sqlite:///./portarias.db`) — sem dependências externas, ideal para prototipagem rápida.
- **Prod** (branch `prod`): PostgreSQL — suporte a full-text search, índices avançados, escalabilidade.

**Configuração:**
- `DATABASE_URL` definida via variável de ambiente `.env` conforme `ENVIRONMENT` (dev|prod).
- Carregamento de configuração via `python-dotenv` na startup da aplicação.

**Estrutura de pastas:**
```
app/
  __init__.py
  models/          # Definição de modelos SQLAlchemy (Portaria, Relacao, Artigo)
  schemas/         # Schemas Pydantic para validação (PortariaCreate, PortariaResponse, etc)
  crud/            # CRUD operations (create_portaria, get_portaria, list_portarias, etc)
  api/             # Rotas FastAPI (v1/portarias, v1/relacoes, v1/artigos)
  database.py      # Conexão e session management com banco de dados
frontend/
  frontend/        # Vite + React frontend
    package.json
    tsconfig.json
    src/
    public/
main.py            # Aplicação FastAPI principal
requirements.txt   # Dependências (FastAPI, SQLAlchemy, psycopg2-binary, alembic)
.env.example       # Exemplo de variáveis de ambiente para dev e prod
```

### Variáveis de Ambiente

Configurar `.env` no raiz do projeto com as seguintes variáveis:

```env
# .env (não fazer commit)
ENVIRONMENT=dev
DATABASE_URL=sqlite:///./portarias.db
```

Exemplo para produção (`.env` em prod):
```env
ENVIRONMENT=prod
DATABASE_URL=postgresql://username:password@localhost:5432/portarias_db
```

Ver [.env.example](.env.example) para todos os parâmetros disponíveis.

### Modelos ORM (SQLAlchemy)

#### Tabela: Portaria
```python
class Portaria(Base):
    __tablename__ = "portarias"
    
    id = Column(Integer, primary_key=True)
    numero = Column(Integer, nullable=False)
    ano = Column(Integer, nullable=False)
    titulo = Column(String(255), nullable=False)
    descricao_completa = Column(Text)
    data_publicacao = Column(DateTime, nullable=False)
    link_externo = Column(String(500))  # URL Diário Oficial
    link_local = Column(String(500))    # Caminho documento local
    status = Column(String(20), default="ativa")  # ativa, revogada, alterada, regulamentada
    criada_em = Column(DateTime, default=datetime.utcnow)
    atualizada_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    relacoes_saida = relationship("Relacao", foreign_keys="Relacao.portaria_origem_id")
    relacoes_entrada = relationship("Relacao", foreign_keys="Relacao.portaria_destino_id")
    artigos = relationship("Artigo", back_populates="portaria")
    
    # Índices
    __table_args__ = (
        UniqueConstraint('numero', 'ano', name='uq_portaria_numero_ano'),
        Index('idx_status', 'status'),
        Index('idx_data_publicacao', 'data_publicacao'),
    )
```

#### Tabela: Relacao
```python
class Relacao(Base):
    __tablename__ = "relacoes"
    
    id = Column(Integer, primary_key=True)
    portaria_origem_id = Column(Integer, ForeignKey("portarias.id"), nullable=False)
    portaria_destino_id = Column(Integer, ForeignKey("portarias.id"), nullable=False)
    tipo_relacao = Column(String(20), nullable=False)  # complementa, altera, revoga, regulamenta
    descricao = Column(Text)
    escopo = Column(String(20), default="total")  # total, parcial
    data_relacao = Column(DateTime, default=datetime.utcnow)
    criada_em = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    portaria_origem = relationship("Portaria", foreign_keys=[portaria_origem_id])
    portaria_destino = relationship("Portaria", foreign_keys=[portaria_destino_id])
    artigos_afetados = relationship("Artigo", back_populates="relacao_alterou")
```

#### Tabela: Artigo
```python
class Artigo(Base):
    __tablename__ = "artigos"
    
    id = Column(Integer, primary_key=True)
    numero = Column(String(50), nullable=False)
    texto = Column(Text)
    status = Column(String(20), default="valido")  # valido, alterado, revogado
    portaria_id = Column(Integer, ForeignKey("portarias.id"), nullable=False)
    portaria_alterou_id = Column(Integer, ForeignKey("relacoes.id"))
    observacoes = Column(Text)
    criado_em = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    portaria = relationship("Portaria", back_populates="artigos")
    relacao_alterou = relationship("Relacao", back_populates="artigos_afetados")
```

### Endpoints da API REST (MVP)

#### Portarias
- `GET /api/v1/portarias` — Listar portarias com filtros (ano, status, tipo_relacao)
- `GET /api/v1/portarias/{id}` — Detalhe de portaria + relações entrada/saída
- `GET /api/v1/portarias/{id}/relacoes` — Relações diretas da portaria
- `GET /api/v1/portarias/search?q=texto` — Busca por número, ano ou texto
- `POST /api/v1/portarias` — Criar portaria (autenticado, fase 2)
- `PUT /api/v1/portarias/{id}` — Atualizar portaria (autenticado, fase 2)
- `DELETE /api/v1/portarias/{id}` — Deletar portaria (autenticado, fase 2)

#### Relações
- `GET /api/v1/relacoes` — Listar relações com filtros
- `POST /api/v1/relacoes` — Criar relação (autenticado, fase 2)
- `DELETE /api/v1/relacoes/{id}` — Deletar relação (autenticado, fase 2)

#### Artigos
- `GET /api/v1/artigos` — Listar artigos
- `POST /api/v1/artigos` — Criar artigo (autenticado, fase 2)
- `DELETE /api/v1/artigos/{id}` — Deletar artigo (autenticado, fase 2)

### Schemas Pydantic (Validação)

```python
# Portaria Schemas
class PortariaBase(BaseModel):
    numero: int = Field(..., gt=0)
    ano: int = Field(..., ge=1900)
    titulo: str = Field(..., min_length=3, max_length=255)
    descricao_completa: Optional[str] = None
    data_publicacao: datetime
    link_externo: Optional[str] = None
    link_local: Optional[str] = None
    status: str = Field(default="ativa")  # Enum: ativa, revogada, alterada, regulamentada

class PortariaCreate(PortariaBase):
    pass

class PortariaUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao_completa: Optional[str] = None
    link_externo: Optional[str] = None
    link_local: Optional[str] = None
    status: Optional[str] = None

class PortariaResponse(PortariaBase):
    id: int
    criada_em: datetime
    atualizada_em: datetime
    relacoes_saida: Optional[List['RelacaoResponse']] = []
    relacoes_entrada: Optional[List['RelacaoResponse']] = []
    artigos: Optional[List['ArtigoResponse']] = []
    
    class Config:
        from_attributes = True

# Relacao Schemas
class RelacaoBase(BaseModel):
    portaria_origem_id: int
    portaria_destino_id: int
    tipo_relacao: str  # Enum: complementa, altera, revoga, regulamenta
    descricao: Optional[str] = None
    escopo: str = Field(default="total")  # total, parcial

class RelacaoCreate(RelacaoBase):
    pass

class RelacaoResponse(RelacaoBase):
    id: int
    data_relacao: datetime
    criada_em: datetime
    
    class Config:
        from_attributes = True

# Artigo Schemas
class ArtigoBase(BaseModel):
    numero: str = Field(..., min_length=1)
    texto: Optional[str] = None
    status: str = Field(default="valido")
    portaria_id: int
    observacoes: Optional[str] = None

class ArtigoCreate(ArtigoBase):
    pass

class ArtigoResponse(ArtigoBase):
    id: int
    criado_em: datetime
    
    class Config:
        from_attributes = True
```

### CRUD Operations (Camada de Lógica)

Implementar funções em `app/crud.py`:

```python
# Portarias
async def create_portaria(db: Session, portaria: PortariaCreate) -> Portaria:
    ...

async def get_portaria(db: Session, portaria_id: int) -> Optional[Portaria]:
    ...

async def list_portarias(db: Session, year: Optional[int] = None, status: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Portaria]:
    ...

async def update_portaria(db: Session, portaria_id: int, portaria: PortariaUpdate) -> Optional[Portaria]:
    ...

async def delete_portaria(db: Session, portaria_id: int) -> bool:
    ...

async def search_portarias(db: Session, query: str) -> List[Portaria]:
    ...

# Relações
async def create_relacao(db: Session, relacao: RelacaoCreate) -> Relacao:
    ...

async def get_relacoes_portaria(db: Session, portaria_id: int) -> List[Relacao]:
    ...

# Artigos
async def create_artigo(db: Session, artigo: ArtigoCreate) -> Artigo:
    ...
```

### Tratamento de Erros HTTP

- **400 Bad Request**: Validação falhou (número inválido, ano < 1900, campos obrigatórios)
- **404 Not Found**: Portaria, relação ou artigo não encontrado
- **409 Conflict**: Violação de constraint (ex: portaria com número+ano duplicados)
- **500 Internal Server Error**: Erro de banco de dados ou aplicação

### Migrations com Alembic (Fase 2)

Usar `alembic` para controle de versão do schema do banco de dados:
- Suporte a SQLite e PostgreSQL simultaneamente
- Versionamento e histórico de mudanças
- Rollback de migrations se necessário

```bash
alembic init alembic
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

### Persistência e arquitetura

- **Banco de dados**: SQLAlchemy abstrai diferenças entre SQLite (dev) e PostgreSQL (prod).
- **Migrations**: Alembic para versionamento de schema (fase 2).
- **Importação de dados**: CSV/planilha será suportada via endpoint POST batch em fase posterior.
- **Consultas públicas**: GET endpoints sem autenticação.
- **Modificações autenticadas**: POST, PUT, DELETE requerem autenticação (implementar em fase 2).

> Nota: para decisões arquiteturais mais detalhadas, consulte o documento `AGENTE_ARQUITETURA.md`.

### Funcionalidades extras

- Notificações de novas portarias e alterações relevantes.
- Análise de impacto para mostrar portarias dependentes de uma mudança.
- Anotações internas em portarias e relações.
- Histórico de versões e auditoria de alterações.
- Exportação de relatórios de dependência e impacto.

### Priorização do MVP

1. Cadastro de portaria com links externos e locais.
2. Cadastro de relações entre portarias.
3. Visualização gráfica básica das relações.
4. Busca e filtros simples.
5. Registro de artigos revogados/alterados.

### Próximas fases

- Filtros avançados e análise de impacto.
- Histórico de versões e auditoria.
- Notificações e alertas.
- Exportação de relatórios e gráficos.
- Suporte a múltiplos usuários e perfis de acesso.
