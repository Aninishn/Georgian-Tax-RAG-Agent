# 🇬🇪 საგადასახადო RAG აგენტი — Georgian Tax RAG Agent

ქართულ ენაზე საგადასახადო და საბაჟო კითხვებზე პასუხის გამცემი AI აგენტი, რომელიც ყოველთვის ციტირებს:

> **საინფორმაციო-მეთოდოლოგიური ჰაბი** — https://infohub.rs.ge/ka  
> Information and Methodological Hub (Tax and Customs Administration)

🌐 **Demo:** https://aninishn.github.io/Georgian-Tax-RAG-Agent  
📁 **GitHub:** https://github.com/Aninishn/Georgian-Tax-RAG-Agent

---

## 📁 Project Structure

```
Georgian-Tax-RAG-Agent/
│
├── backend/
│   ├── main.py            ← FastAPI server (API endpoints)
│   ├── rag_agent.py       ← RAG logic + Groq (Llama 3.3 70B) integration
│   ├── vector_store.py    ← Document retrieval engine
│   ├── knowledge_base.py  ← Tax/customs documents from infohub.rs.ge
│   ├── requirements.txt   ← Python dependencies
│   └── .env.example       ← Environment variable template
│
├── frontend/
│   ├── index.html         ← Georgian web UI
│   ├── style.css          ← All styles
│   └── app.js             ← JavaScript logic
│
├── README.md
└── docker-compose.yml
```

---

## 🚀 Quick Start

### 1. Get a free Groq API key
Go to → https://console.groq.com/keys → Create API Key

### 2. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Set your API key permanently
```bash
echo 'export GROQ_API_KEY=gsk_your-key-here' >> ~/.zshrc && source ~/.zshrc
```

### 4. Start the backend
```bash
cd backend
uvicorn main:app --host 127.0.0.1 --port 8000
# API running at https://georgian-tax-rag-agent.onrender.com
# Docs at https://georgian-tax-rag-agent.onrender.com/docs
```

### 5. Open the frontend
Open `frontend/index.html` in your browser or use Live Server in VS Code.

---

## ☁️ Deployment (Free)

**Backend → Render.com**
1. Connect GitHub repo on https://render.com
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port 8000`
5. Add environment variable: `GROQ_API_KEY`

**Frontend → GitHub Pages**
1. Go to repo Settings → Pages
2. Source: main branch → / (root)

**Keep server alive for free → UptimeRobot**
- Monitor URL: `https://georgian-tax-rag-agent.onrender.com/health`
- Interval: 5 minutes
- Sign up at https://uptimerobot.com

---

## 🐳 Docker

```bash
echo "GROQ_API_KEY=gsk_your-key-here" > .env
docker-compose up -d
# Frontend: https://aninishn.github.io/Georgian-Tax-RAG-Agent
# Backend:  https://georgian-tax-rag-agent.onrender.com
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
curl -X POST https://georgian-tax-rag-agent.onrender.com/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "საშემოსავლო გადასახადის განაკვეთი რამდენია?"}'
```

---

## 📚 Knowledge Base Topics

- საშემოსავლო გადასახადი (Income Tax) — 20%
- დღგ (Value Added Tax) — 18%
- მოგების გადასახადი — Estonian Model (გაუნაწილებელი მოგება არ იბეგრება)
- ქონების გადასახადი (Property Tax)
- მცირე ბიზნესის სპეციალური რეჟიმი (Micro/Small Business)
- საბაჟო პროცედურები (Customs Procedures)
- DCFTA — თავისუფალი ვაჭრობა ევროკავშირთან
- ფიზიკური პირების მიერ საქონლის შემოტანა (Individual Imports)
- გადასახადის გადამხდელის უფლებები და ვალდებულებები

---

## 🤖 Tech Stack

| Component | Technology |
|-----------|-----------|
| AI Model | Llama 3.3 70B via Groq (free) |
| Backend | FastAPI + Python |
| Frontend | HTML + CSS + JavaScript |
| Retrieval | Custom keyword-based vector store |
| Backend Hosting | Render.com (free tier) |
| Frontend Hosting | GitHub Pages (free) |
| Uptime Monitoring | UptimeRobot (free) |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Free API key from https://console.groq.com/keys |

---

## ⚠️ Free Tier Limits

- **Groq:** ~100,000 tokens/day — resets at midnight UTC (3:00 AM Georgian time)
- **Render:** Server sleeps after 15 min inactivity — solved with UptimeRobot