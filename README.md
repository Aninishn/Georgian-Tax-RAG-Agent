# 🇬🇪 Georgian Tax RAG Agent

Answers Georgian tax and customs questions in **Georgian language**, always citing:

> **საინფორმაციო-მეთოდოლოგიური ჰაბი** — https://infohub.rs.ge/ka  
> Information and Methodological Hub (Tax and Customs Administration)

---

## 📁 Project Structure

```
georgian-tax-rag-agent/
│
├── backend/
│   ├── main.py            ← FastAPI server (API endpoints)
│   ├── rag_agent.py       ← RAG logic + Groq integration
│   ├── vector_store.py    ← Document retrieval engine
│   ├── knowledge_base.py  ← Tax/customs documents from infohub.rs.ge
│   ├── requirements.txt   ← Python dependencies
│   └── .env.example       ← Environment variable template
│
├── frontend/
│   └── index.html         ← Georgian web UI
│
├── README.md
└── docker-compose.yml
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set your API key
```bash
export GROQ_API_KEY=gsk_your-groq-key-here
```

### 3. Start the backend
```bash
python backend/main.py
# API running at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 4. Open the frontend
```bash
open frontend/index.html
# or serve it:
python -m http.server 3000 --directory frontend
```

---

## 🐳 Docker

```bash
echo "GROQ_API_KEY=gsk_your-groq-key-here" > .env
docker-compose up -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ask` | Ask a question, get Georgian answer |
| POST | `/reset` | Clear conversation history |
| GET | `/knowledge-base` | List all documents |
| GET | `/suggested-questions` | Get example questions |
| GET | `/health` | Health check |

### Example request:
```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "საშემოსავლო გადასახადის განაკვეთი რამდენია?"}'
```

---

## 📚 Knowledge Base Topics

- საშემოსავლო გადასახადი (Income Tax)
- დღგ — Value Added Tax
- მოგების გადასახადი (Corporate Tax - Estonian Model)
- ქონების გადასახადი (Property Tax)
- მცირე ბიზნესის რეჟიმი (Small Business)
- საბაჟო პროცედურები (Customs)
- თავისუფალი ვაჭრობა / DCFTA (Free Trade)
- ფიზიკური პირების შემოტანა (Individual Imports)

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | API key from https://console.groq.com/keys|
