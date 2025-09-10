# WevN

**WevN** is a domain-specific adaptive data visualization and learning platform designed to enhance user engagement through interactive and personalized experiences. It leverages advanced AI tools and scalable backend architecture to offer intelligent data exploration and analysis.

---

## 🚀 Features

* **Adaptive Data Visualization**: Dynamically adjusts visualizations based on user preferences and data context.
* **Interactive Learning Modules**: Engages users with interactive tutorials and AI-assisted learning paths.
* **AI-Powered Backend**: Utilizes FastAPI, Langchain, and ChromaDB for efficient data processing and intelligent recommendations.
* **Responsive Design**: Optimized for desktop and mobile devices, ensuring seamless access across platforms.
* **Modular Architecture**: Easily extendable components for future scalability and feature additions.

---

## 🛠️ Technologies Used

### Frontend

* React.js
* Vite
* Tailwind CSS
* ESLint

### Backend

* **FastAPI** – for high-performance asynchronous API services
* **Langchain** – for conversational AI and language processing workflows
* **ChromaDB** – for embedding-based vector storage and retrieval
* Python 3.8+
* Docker (optional, for containerization)

### Database

* PostgreSQL/MySQL (or other, based on deployment setup)

---

## 📦 Installation

### Prerequisites

Ensure the following tools are installed:

* Node.js (v16 or higher)
* Python (v3.8 or higher)
* Docker (optional)

### Frontend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/WevN-org/WevN.git
   cd WevN/frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd ../backend/server
   ```

2. Create and activate a virtual environment:

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

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI server:

   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8000 --workers 2 --http httptools
   ```

---

## 🧪 Testing

You can add and run tests using your preferred test framework, such as `pytest`, once test files are set up in the backend directory.

---

## 📂 Project Structure

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
├── README.md
└── ...
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

For inquiries or contributions:

* GitHub: [https://github.com/WevN-org/WevN](https://github.com/WevN-org/WevN)
* Email: [contact@wevn.org](mailto:contact@wevn.org)

---

Let me know if you want to include setup for environment variables, Docker instructions, or specific API endpoints!

   ```

---

## 🧪 Testing

You can add and run tests using your preferred test framework, such as `pytest`, once test files are set up in the backend directory.

---

## 📂 Project Structure

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
├── README.md
└── ...
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

For inquiries or contributions:

* GitHub: [https://github.com/WevN-org/WevN](https://github.com/WevN-org/WevN)
* Email: [contact@wevn.org](mailto:contact@wevn.org)

---

Let me know if you want to include setup for environment variables, Docker instructions, or specific API endpoints!
