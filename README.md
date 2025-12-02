# WevN

**WevN** is a multi-tenant knowledge discovery and visualization platform that integrates **semantic search**, **interactive graph visualization**, and **AI-assisted reasoning**. It helps organizations explore and connect ideas across domains through an adaptive, RAG-based (Retrieval-Augmented Generation) architecture.

---

## 🚀 Features

- **Semantic Search:** Context-aware retrieval using embeddings from ChromaDB.  
- **Interactive Visualization:** Real-time knowledge graph rendered with React Force Graph.  
- **LLM Integration:** RAG pipeline with `deepseek-r1:7b` via Ollama for domain-specific responses.  
- **Multi-Tenant Design:** Secure, isolated knowledge bases per organization.  
- **Node Automation:** Automatic summarization and node creation from conversations.  

---

## 🧱 Tech Stack

**Frontend**
- React 18+, Vite, TailwindCSS
- React Force Graph, React Markdown

**Backend**
- FastAPI, LangChain, ChromaDB, SQLite
- Sentence Transformers (`all-mpnet-base-v2`)
- Ollama for local LLM inference

**Other**
- JWT Authentication, Google OAuth
- Docker (optional)

---

## ⚙️ Setup

### Prerequisites
- Node.js ≥ 16  
- Python ≥ 3.8  
- Ollama installed and model `deepseek-r1:7b` pulled

---

### Frontend

```bash
git clone https://github.com/WevN-org/WevN.git
cd WevN/frontend
npm install
npm run dev
```

### Backend

```bash
cd ../backend/server
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 2
```

### 📂 Structure

```
WevN/
├── backend/
│   └── server/
│       ├── main.py
│       ├── requirements.txt
│       └── ...
├── frontend/
│   ├── src/
│   └── ...
└── README.md
```

