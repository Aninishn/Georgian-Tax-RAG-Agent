"""
FastAPI Backend for Georgian RAG Agent
"""

import os
import sys
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rag_agent import GeorgianRAGAgent
from knowledge_base import SOURCE_URL, SOURCE_NAME, KNOWLEDGE_BASE

app = FastAPI(
    title="Georgian RAG Agent API",
    description="RAG Agent for Georgian Tax and Customs information from infohub.rs.ge",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session-based agents (one agent per session)
agents: dict = {}


# ── Pydantic Models ───────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = "default"


class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]
    query: str
    timestamp: str
    tokens_used: Optional[int] = None
    session_id: str


class ResetRequest(BaseModel):
    session_id: Optional[str] = "default"


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_agent(session_id: str) -> GeorgianRAGAgent:
    if session_id not in agents:
        agents[session_id] = GeorgianRAGAgent()
    return agents[session_id]


# ── Routes ────────────────────────────────────────────────────────────────────

# @app.get("/")
# def root():
#     return {
#         "name": "Georgian RAG Agent",
#         "description": "Answers tax and customs questions in Georgian",
#         "source": SOURCE_URL,
#         "docs": "/docs",
#     }


from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
async def serve_frontend():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# 
@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/knowledge-base")
def knowledge_base():
    return {
        "total": len(KNOWLEDGE_BASE),
        "source": SOURCE_URL,
        "documents": [
            {"id": doc["id"], "title": doc["title"], "title_en": doc["title_en"]}
            for doc in KNOWLEDGE_BASE
        ],
    }


@app.post("/ask", response_model=QueryResponse)
def ask(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if len(request.query) > 2000:
        raise HTTPException(status_code=400, detail="Query too long (max 2000 characters)")

    agent = get_agent(request.session_id)

    try:
        response = agent.ask(request.query)
        return QueryResponse(
            answer=response.answer,
            sources=response.sources,
            query=response.query,
            timestamp=response.timestamp,
            tokens_used=response.tokens_used,
            session_id=request.session_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.post("/reset")
def reset_session(request: ResetRequest):
    if request.session_id in agents:
        agents[request.session_id].reset_conversation()
        return {"message": "Session reset successfully", "session_id": request.session_id}
    return {"message": "Session not found", "session_id": request.session_id}


@app.get("/suggested-questions")
def suggested_questions():
    return {
        "questions": [
            "საშემოსავლო გადასახადის განაკვეთი რამდენია?",
            "დღგ-ით რეგისტრაციის ვალდებულება როდის წარმოიშობა?",
            "მოგების გადასახადის ესტონური მოდელი რა არის?",
            "ქონების გადასახადი როგორ გამოითვლება?",
            "მცირე ბიზნესის სტატუსი რა პირობებია?",
            "ავტომობილის შემოტანაზე საბაჟო გადასახადი?",
            "ექსპორტზე დღგ-ის განაკვეთი?",
            "გადასახადის გადამხდელის უფლებები რა არის?",
            "ევროკავშირთან თავისუფალი ვაჭრობა?",
            "ფოსტით შემოტანილ საქონელზე ბაჟი?",
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
