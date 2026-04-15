# Monitora Portarias - Guia de Desenvolvimento

## Visão Geral

Sistema web para monitoramento e visualização de relações entre portarias do Ministério da Saúde.

## Stack Tecnológico

- **Backend**: FastAPI + SQLAlchemy ORM
- **Database**: 
  - SQLite (desenvolvimento/MVP)
  - PostgreSQL (produção)
- **Validação**: Pydantic v2
- **Async**: Python 3.8+

## Instalação

### 1. Clone o repositório
```bash
git clone <repo>
cd MonitoraPortarias
```

### 2. Crie um virtual environment
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Configure o .env
```bash
cp .env.example .env
# Edite .env conforme necessário (para dev, usar SQLite)
```

## Rodando a Aplicação

### Development (SQLite)
```bash
# Na branch dev, com ENVIRONMENT=dev no .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

A API estará disponível em `http://localhost:8000`

Documentação interativa (Swagger): `http://localhost:8000/docs`
ReDoc: `http://localhost:8000/redoc`

### Produção (PostgreSQL)
```bash
# Na branch prod, com ENVIRONMENT=prod e DATABASE_URL do PostgreSQL no .env
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Estrutura do Projeto

```
MonitoraPortarias/
├── app/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py         # SQLAlchemy models (Portaria, Relacao, Artigo)
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── schemas.py        # Pydantic schemas (validação request/response)
│   ├── crud/
│   │   ├── __init__.py
│   │   └── crud.py           # CRUD operations
│   ├── api/
│   │   ├── __init__.py
│   │   ├── portarias.py      # Endpoints para portarias
│   │   ├── relacoes.py       # Endpoints para relações
│   │   └── artigos.py        # Endpoints para artigos
│   └── database.py           # Configuração SQLAlchemy
├── main.py                    # FastAPI app entry point
├── requirements.txt           # Dependências Python
├── .env.example              # Exemplo de variáveis de ambiente
├── .env                      # Variáveis de ambiente (dev)
├── .gitignore
└── SPECS.md                  # Especificações do projeto
```

## Endpoints da API (MVP)

### Portarias
- `GET /api/v1/portarias` — Listar portarias com filtros
- `GET /api/v1/portarias/{id}` — Detalhe de portaria
- `GET /api/v1/portarias/search?q=termo` — Buscar por texto/número
- `GET /api/v1/portarias/{id}/relacoes` — Relações de uma portaria
- `POST /api/v1/portarias` — Criar portaria (autenticado, fase 2)
- `PUT /api/v1/portarias/{id}` — Atualizar portaria (autenticado, fase 2)
- `DELETE /api/v1/portarias/{id}` — Deletar portaria (autenticado, fase 2)

### Relações
- `GET /api/v1/relacoes` — Listar relações
- `POST /api/v1/relacoes` — Criar relação (autenticado, fase 2)
- `DELETE /api/v1/relacoes/{id}` — Deletar relação (autenticado, fase 2)

### Artigos
- `GET /api/v1/artigos?portaria_id=x` — Listar artigos
- `POST /api/v1/artigos` — Criar artigo (autenticado, fase 2)
- `DELETE /api/v1/artigos/{id}` — Deletar artigo (autenticado, fase 2)

## Modelo de Dados

### Portaria
- `numero`: Número da portaria (obrigatório, > 0)
- `ano`: Ano de publicação (obrigatório, >= 1900)
- `titulo`: Título ou descrição resumida
- `descricao_completa`: Descrição completa (opcional)
- `data_publicacao`: Data de publicação
- `link_externo`: URL para Diário Oficial (opcional)
- `link_local`: Caminho do documento local (opcional)
- `status`: ativa | revogada | alterada | regulamentada (default: ativa)

### Relacao
- `portaria_origem_id`: ID da portaria que origina a relação
- `portaria_destino_id`: ID da portaria que é afetada
- `tipo_relacao`: complementa | altera | revoga | regulamenta
- `descricao`: Descrição da relação (opcional)
- `escopo`: total | parcial (default: total)

### Artigo
- `numero`: Número do artigo
- `texto`: Texto do artigo (opcional)
- `status`: valido | alterado | revogado (default: valido)
- `portaria_id`: ID da portaria que contém o artigo
- `observacoes`: Observações sobre o artigo (opcional)

## Banco de Dados

### Development (SQLite)
O banco é criado automaticamente em `./portarias.db` na primeira execução.

```bash
# Limpar banco (desenvolvimento)
python -c "from app.database import drop_db; drop_db()"
```

### Produção (PostgreSQL)
Configure `DATABASE_URL` com as credenciais do PostgreSQL:
```
DATABASE_URL=postgresql://username:password@localhost:5432/portarias_db
```

## Migrations (Fase 2)

Usar Alembic para versionamento de schema:
```bash
alembic init alembic
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

## Autenticação (Fase 2)

Endpoints de POST, PUT, DELETE serão protegidos com autenticação JWT.

## Próximas Fases

1. **Fase 2**:
   - Autenticação JWT
   - Autorização por roles
   - CORS configurável
   - Importação CSV/planilha

2. **Fase 3**:
   - Análise de impacto
   - Histórico de versões
   - Notificações
   - Exportação de relatórios

## Troubleshooting

### Erro de importação `app.models`
Verifique se `__init__.py` está em cada pasta do `app/`.

### SQLite locked error
Feche outras conexões ao banco. No dev, você pode apagar `portarias.db` e deixar recriado.

### Port 8000 em uso
Use outra porta:
```bash
uvicorn main:app --reload --port 8001
```

## Referências

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [SPECS.md](SPECS.md) - Especificações detalhadas do projeto
- [AGENTE_BACKEND.md](AGENTE_BACKEND.md) - Diretrizes arquiteturais
