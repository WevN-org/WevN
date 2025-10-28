# WevN

WevN is a secure, multi-tenant visual knowledge discovery platform designed for organizations. [cite_start]It addresses the critical gap of traditional search mechanisms by providing a unified system for visual exploration across multiple organizational domains[cite: 8, 10]. [cite_start]It allows users to discover hidden connections between concepts [cite: 14][cite_start], perform semantic operations that understand contextual meaning [cite: 12][cite_start], and interact with an AI assistant capable of reasoning from secure, isolated knowledge bases[cite: 16, 78].

---

## 🚀 Features

* [cite_start]**Interactive Graph Visualization**: Visualize complex concept relationships as an interactive graph, not a static list[cite: 13, 92]. [cite_start]Powered by `react-force-graph-2d`[cite: 87, 107].
* [cite_start]**RAG-Based AI Assistant**: A chatbot that provides context-aware, factually-grounded answers[cite: 295]. [cite_start]It leverages Retrieval-Augmented Generation (RAG) to synthesize information from your specific knowledge base and conversation history[cite: 78, 84, 307].
* [cite_start]**Multi-Tenant Architecture**: Provides secure, isolated knowledge bases for different organizational units or domains, ensuring data privacy and separation[cite: 15, 95, 556].
* [cite_start]**Semantic Search**: AI-powered retrieval based on meaning and context, not just keywords[cite: 94]. [cite_start]Uses `SentenceTransformers` [cite: 115] [cite_start]and `ChromaDB` [cite: 112] [cite_start]to find conceptually similar nodes[cite: 330].
* [cite_start]**Domain Context Switching**: Seamlessly switch between different knowledge domains (e.g., medical, legal, technical) from a unified interface[cite: 11, 93].
* [cite_start]**Automated Knowledge Discovery**: Features semantic linking to automatically build relationships between nodes based on vector distance[cite: 325, 327].
* [cite_start]**Conversation-to-Node**: Can automatically summarize an AI chat conversation and save it as a new, structured knowledge node[cite: 301, 348, 349].

---

## 🛠️ Technologies Used

### Frontend

* [cite_start]**React.js** [cite: 118]
* [cite_start]**React Force Graph** [cite: 107, 128] (for 2D graph visualization)
* **Vite**
* **Tailwind CSS**
* [cite_start]**react-markdown** [cite: 366] (for rendering rich LLM responses)
* [cite_start]**Jest** [cite: 137] (for frontend testing)
* ESLint

### Backend

* [cite_start]**FastAPI** [cite: 110, 127] (for high-performance, asynchronous API services)
* [cite_start]**LangChain** [cite: 105, 129] [cite_start](for RAG pipelines, LLM orchestration, and managing conversational memory [cite: 342])
* [cite_start]**Sentence Transformers** [cite: 115] [cite_start](using `all-mpnet-base-v2` for generating embeddings [cite: 323])
* [cite_start]**Ollama** [cite: 303] [cite_start](for local LLM integration, tested with `deepseek-r1:7b` [cite: 303])
* [cite_start]Python 3.8+ [cite: 125]
* [cite_start]**pytest** [cite: 137] (for backend testing)
* [cite_start]Docker [cite: 140] (for containerization)

### Database

* [cite_start]**ChromaDB** [cite: 112, 131] [cite_start](Primary vector database for knowledge nodes, embeddings, and metadata [cite: 132])
* [cite_start]**SQLite** [cite: 262, 343] (Used for storing persistent, session-specific chat history)
* [cite_start]**PostgreSQL** (Listed as an optional extension for managing user accounts and multi-tenant isolation [cite: 133])

---

## 📦 Installation

### Prerequisites

Ensure the following tools are installed:

* Node.js (v16 or higher)
* [cite_start]Python (v3.8 or higher) [cite: 125]
* [cite_start]Docker (optional) [cite: 140]

### Frontend Setup

1.  Clone the repository:
    ```bash
    git clone [https://github.com/WevN-org/WevN.git](https://github.com/WevN-org/WevN.git)
    cd WevN/frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd ../backend/server
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    ```
    * On Windows:
        ```bash
        .\venv\Scripts\activate
        ```
    * On macOS/Linux:
        ```bash
        source venv/bin/activate
        ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run the FastAPI server:
    ```bash
    uvicorn server:app --host 0.0.0.0 --port 8000 --workers 2 --http httptools
    ```

---

## 🧪 Testing

[cite_start]The project uses `pytest` [cite: 137] [cite_start]for backend API and logic testing, and `Jest` [cite: 137] for frontend component testing and regression checks.

---

## 📂 Project Structure
