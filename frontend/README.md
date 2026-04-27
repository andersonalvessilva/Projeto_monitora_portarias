# Frontend - Monitora Portarias

Este diretório contém a aplicação frontend em **Vite + React + TypeScript**.

## Como executar

```bash
cd frontend/frontend
npm install
npm run dev
```

O frontend consome a API backend em `http://localhost:8000/api/v1` por padrão.
Se a API estiver rodando em outro endereço, use a variável de ambiente:

```bash
export VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

## Scripts úteis

- `npm run dev` — inicia o servidor de desenvolvimento do Vite.
- `npm run build` — gera o build de produção.
- `npm run preview` — pré-visualiza o build de produção.
- `npm run lint` — roda o ESLint.

## Estrutura inicial

- `src/App.tsx` — UI principal do dashboard.
- `src/api.ts` — integração com os endpoints de portarias.
- `src/types.ts` — tipos TypeScript para portarias e relações.
- `src/App.css` — estilização inicial.

## Próximos passos

- Implementar gráfico de visualização de relacionamentos.
- Criar páginas de detalhe e edição de portarias.
- Adicionar autenticação para POST/PUT/DELETE.
