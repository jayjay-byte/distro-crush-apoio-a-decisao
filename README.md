# Distro Crush

Sistema de Apoio à Decisão (SAD) que recomenda distribuições Linux a partir do perfil do usuário.

O usuário responde a um questionário sobre uso, hardware e preferências. O sistema ranqueia as distribuições por um índice multicritério (soma ponderada com pesos ROC) e apresenta os resultados organizados em grupos.

Projeto desenvolvido para a disciplina de Sistemas de Apoio à Decisão do curso de Sistemas de Informação da UFBA.

**Acesse:** https://distro-crush-apoio-a-decisao.vercel.app/#/login

## Tecnologias

- **Frontend:** React, Vite, TypeScript e Tailwind CSS
- **Backend:** Python, FastAPI e SQLAlchemy
- **Banco de dados:** SQLite
- **Deploy:** Vercel

## Estrutura

```
backend/    API em FastAPI, modelo de decisão e seed do banco
frontend/   Interface em React
dados/      Planilha com os dados das distribuições
docs/       Documentação do projeto
```

## Como rodar localmente

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows (no Linux/macOS: source .venv/bin/activate)
pip install -r requirements-dev.txt
python scripts/seed.py
uvicorn app.main:app --reload
```

A API fica em `http://localhost:8000` e a documentação em `http://localhost:8000/docs`.

### Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. O Vite encaminha as chamadas `/api` para o backend.

## Autora

Jaiana Santana
