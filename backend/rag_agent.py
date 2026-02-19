"""
Georgian RAG Agent
Answers tax & customs questions in Georgian, citing infohub.rs.ge
Uses Groq (free) instead of Anthropic
"""

import os
import time
import logging
from typing import List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime

from groq import Groq
from knowledge_base import KNOWLEDGE_BASE, SOURCE_URL, SOURCE_NAME
from vector_store import SimpleVectorStore, SearchResult

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@dataclass
class RAGResponse:
    answer: str
    sources: List[dict]
    query: str
    timestamp: str
    tokens_used: Optional[int] = None


class GeorgianRAGAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.client = Groq(api_key=api_key or os.environ.get("GROQ_API_KEY"))
        self.vector_store = SimpleVectorStore(KNOWLEDGE_BASE)
        self.conversation_history = []
        logger.info("Georgian RAG Agent initialized successfully")

    def retrieve(self, query: str, top_k: int = 3) -> List[SearchResult]:
        results = self.vector_store.search(query, top_k=top_k)
        logger.info(f"Retrieved {len(results)} documents for query: {query[:50]}...")
        return results

    def build_context(self, results: List[SearchResult]) -> str:
        parts = []
        for i, r in enumerate(results, 1):
            parts.append(f"[დოკუმენტი {i}: {r.title}]\n{r.content}")
        return "\n\n---\n\n".join(parts)

    def generate_answer(self, query: str, context: str) -> Tuple[str, int]:
        system_prompt = f"""შენ ხარ საქართველოს შემოსავლების სამსახურის ასისტენტი, რომელიც სპეციალიზირდება საგადასახადო და საბაჟო კითხვებზე.

შენ ᲧᲝᲕᲔᲚᲗᲕᲘᲡ:
1. პასუხობ ქართულ ენაზე
2. იყენებ მოწოდებულ დოკუმენტებს პასუხის საფუძვლად
3. ხარ ზუსტი, პროფესიონალური და გამოსადეგი
4. თუ ინფორმაცია არ არის დოკუმენტებში, ამბობ ამას პირდაპირ

პასუხის ბოლოში ᲧᲝᲕᲔᲚᲗᲕᲘᲡ დაამატე:
---
📚 **წყარო:** [{SOURCE_NAME}]({SOURCE_URL})

ხელმისაწვდომი კონტექსტი:
{context}"""

        messages = [{"role": "system", "content": system_prompt}] + \
                   self.conversation_history + \
                   [{"role": "user", "content": query}]

        # Retry logic for Groq rate limits
        for attempt in range(3):
            try:
                response = self.client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    max_tokens=2000,
                    messages=messages,
                )
                break
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt < 2:
                    time.sleep(2)
                else:
                    raise e

        answer = response.choices[0].message.content
        tokens = response.usage.total_tokens

        self.conversation_history.append({"role": "user", "content": query})
        self.conversation_history.append({"role": "assistant", "content": answer})

        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]

        return answer, tokens

    def ask(self, query: str) -> RAGResponse:
        logger.info(f"Processing query: {query[:80]}...")
        results = self.retrieve(query)
        context = self.build_context(results)
        answer, tokens = self.generate_answer(query, context)

        sources = [
            {"title": r.title, "url": r.url, "relevance": round(r.relevance_score, 3)}
            for r in results
        ]

        return RAGResponse(
            answer=answer,
            sources=sources,
            query=query,
            timestamp=datetime.now().isoformat(),
            tokens_used=tokens,
        )

    def reset_conversation(self):
        self.conversation_history = []
        logger.info("Conversation history cleared")