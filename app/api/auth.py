from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any

router = APIRouter(tags=["auth"])

@router.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    # Validação simples para testes locais baseada na sua imagem
    if form_data.username == "admin" and form_data.password == "sesa@2026":
        return {
            "access_token": "mocked-jwt-token-para-testes",
            "token_type": "bearer",
            "username": form_data.username
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Usuário ou senha incorretos."
    )