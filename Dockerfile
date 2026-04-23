# syntax=docker/dockerfile:1
FROM python:3.14-alpine

WORKDIR /app

# Dependências do sistema para build e bibliotecas comuns
RUN apk add --no-cache gcc musl-dev libffi-dev openssl-dev cargo

# Copiar arquivos de requisitos primeiro para aproveitar cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Porta padrão para FastAPI ou outra aplicação Python web
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
