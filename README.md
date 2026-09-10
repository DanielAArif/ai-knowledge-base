# Knowledge Base - LLM + RAG

Knowledge Base is a web-based application that enables users to upload documents and interact with their content through an AI-powered question-answering system using Large Language Models (LLM) and Retrieval-Augmented Generation (RAG). The system processes uploaded documents, converts their content into semantic vector representations, retrieves relevant information based on user queries, and generates context-aware answers using an LLM.

## Overview

This project was developed to implement an end-to-end document-based question-answering system by combining web application development, natural language processing, semantic search, and generative AI.

The system uses a Retrieval-Augmented Generation approach to provide answers based on information contained within the user's uploaded documents. A vector database is used to retrieve relevant document chunks, while a reranking model improves the relevance of the retrieved context before it is passed to the LLM.

## Features

* Upload and manage knowledge documents.
* Process and extract text from uploaded documents.
* Automatically split documents into meaningful text chunks.
* Semantic document retrieval using vector embeddings.
* Rerank retrieved document chunks based on query relevance.
* Ask questions about uploaded documents through an interactive chat interface.
* Generate context-aware answers using Google Gemini.
* Manage chat sessions and conversation history.
* JWT-based user authentication.
* Persistent document and conversation data storage.

## Technology Stack

* React.js
* Tailwind CSS
* FastAPI
* Python
* MySQL
* SQLAlchemy
* ChromaDB
* Google Gemini
* Sentence Transformers
* Cross-Encoder
* JWT

## Getting Started

Clone the repository and install the required dependencies.

```bash
git clone https://github.com/your-username/knowledge-base-rag.git
cd knowledge-base-rag
```

### Backend

Create and activate a Python virtual environment:

```bash
cd backend

python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Linux/macOS:

```bash
source venv/bin/activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables in `.env`:

```env
DATABASE_URL=mysql+pymysql://username:password@localhost/knowledge_base
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

The API documentation is available through Swagger UI:

```text
http://localhost:8000/docs
```

### Frontend

Install the required dependencies:

```bash
cd frontend
npm install
```

Run the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

All frontend dependencies are managed through the `package.json` file.

## Screenshots

Add application screenshots here.

| Login                      | Dashboard                          |
| -------------------------- | ---------------------------------- |
| ![Login](frontend/src/assets/login.png) | ![Dashboard](frontend/src/assets/dashboard-w.png)![Dashboard](frontend/src/assets/dashboard-b.png) |

| Document Management                | Chat                     |
| ---------------------------------- | ------------------------ |
| ![Documents](assets/documents.png) | ![Chat](assets/chat.png) |

## Author

**Daniel Abdillah Arif & Muhammad Khadziq**

LinkedIn: http://www.linkedin.com/in/daniel-abdillah-538a76418 </br> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; https://www.linkedin.com/in/muhammad-khadziq/

## License

This project is intended for educational, research, and portfolio purposes.
