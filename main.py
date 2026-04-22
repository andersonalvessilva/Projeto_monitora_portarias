"""
Monitora Portarias - Entrypoint da aplicação principal.

FastAPI application for monitoring and visualizing relationships between
regulatory ordinances (portarias) from the Ministry of Health.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import init_db
from app.models.models import Portaria, Relacao, Artigo  # Import models to register with Base
from app.api import portarias, relacoes, artigos

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Monitora Portarias",
    description="Sistema de monitoramento e visualização de portarias do Ministério da Saúde",
    version="0.1.0",
)

# Configure CORS (phase 2: move to settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:5173"],  # TODO: Configure via environment variable
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(portarias.router)
app.include_router(relacoes.router)
app.include_router(artigos.router)


@app.on_event("startup")
async def startup():
    """Initialize database on startup."""
    init_db()
    print("Database initialized successfully")


@app.get("/")
def root():
    """Root endpoint - health check."""
    return {
        "message": "Monitora Portarias API",
        "version": "0.1.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}

