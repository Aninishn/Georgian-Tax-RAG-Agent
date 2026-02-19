"""
Vector Store - Simple keyword-based retrieval
For production, replace with ChromaDB, Pinecone, or pgvector
"""

import re
from typing import List
from dataclasses import dataclass


@dataclass
class SearchResult:
    id: str
    title: str
    content: str
    url: str
    relevance_score: float


class SimpleVectorStore:
    """
    Lightweight keyword-based retrieval store.
    No external dependencies needed.
    Replace with a real vector DB for production use.
    """

    def __init__(self, documents: List[dict]):
        self.documents = documents

    def search(self, query: str, top_k: int = 3) -> List[SearchResult]:
        query_terms = self._tokenize(query.lower())
        scored = []

        for doc in self.documents:
            content_lower = (doc["content"] + " " + doc["title"]).lower()
            score = 0.0

            for term in query_terms:
                if term in content_lower:
                    score += content_lower.count(term) * 0.1
                    if term in doc["title"].lower():
                        score += 0.5

            if score > 0:
                scored.append(
                    SearchResult(
                        id=doc["id"],
                        title=doc["title"],
                        content=self._smart_trim(doc["content"]),
                        url=doc["url"],
                        relevance_score=min(score, 1.0),
                    )
                )

        scored.sort(key=lambda x: x.relevance_score, reverse=True)

        # If no matches, return top documents as fallback
        if not scored:
            return self._fallback(top_k)

        return scored[:top_k]

    def _fallback(self, top_k: int) -> List[SearchResult]:
        return [
            SearchResult(
                id=doc["id"],
                title=doc["title"],
                content=self._smart_trim(doc["content"]),
                url=doc["url"],
                relevance_score=0.1,
            )
            for doc in self.documents[:top_k]
        ]

    def _tokenize(self, text: str) -> List[str]:
        tokens = re.findall(r'\w+', text)
        return [t for t in tokens if len(t) > 2]


    def _smart_trim(self, text: str, limit: int = 1200) -> str:
        trimmed = text[:limit]
        last_period = trimmed.rfind(".")
        if last_period != -1:
            return trimmed[:last_period + 1]
        return trimmed