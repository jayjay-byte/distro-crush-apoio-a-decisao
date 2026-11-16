"""Autenticação simples do protótipo: senha com bcrypt e token JWT (8 h)."""

import os
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User

# Valor padrão só para desenvolvimento; em outro ambiente, defina a variável.
# HS256 pede chave de pelo menos 32 bytes.
SECRET_KEY = os.environ.get(
    "DISTRO_CRUSH_SECRET_KEY", "dev-inseguro-troque-em-producao-distro-crush-2026"
)
ALGORITHM = "HS256"
EXPIRACAO = timedelta(hours=8)

# auto_error=False: a falta de token vira 401 (e não 403) em qualquer versão do FastAPI.
_bearer = HTTPBearer(auto_error=False)


def hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode(), bcrypt.gensalt()).decode()


def autenticar(db: Session, login: str, senha: str) -> User | None:
    """Devolve o usuário se login e senha conferirem; senão, None."""
    user = db.scalar(select(User).where(User.login == login))
    if user is None or not bcrypt.checkpw(senha.encode(), user.senha_hash.encode()):
        return None
    return user


def criar_token(user: User, agora: datetime | None = None) -> tuple[str, datetime]:
    """Token JWT com `sub` = id do usuário. Devolve o token e a data de expiração."""
    expira_em = (agora or datetime.now(UTC)) + EXPIRACAO
    token = jwt.encode({"sub": str(user.id), "exp": expira_em}, SECRET_KEY, algorithm=ALGORITHM)
    return token, expira_em


def _nao_autorizado(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_usuario_atual(
    credenciais: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Dependência das rotas protegidas: exige `Authorization: Bearer <token>`."""
    if credenciais is None:
        raise _nao_autorizado("Não autenticado")
    try:
        payload = jwt.decode(credenciais.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise _nao_autorizado("Token inválido ou expirado")
    user = db.get(User, user_id)
    if user is None:
        raise _nao_autorizado("Token inválido ou expirado")
    return user
