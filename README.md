# 🔥 Amaterasu (v2.0) — Codebase Intelligence Engine

Amaterasu is a premium, high-fidelity codebase visualization and intelligence engine designed to parse JavaScript, TypeScript, and Python repositories, construct interactive dependency concept maps, and stream AI-powered architectural narratives.

Built with an **Obsidian & Ember** dark theme, it offers a real-time visual canvas coupled with instant LLM reasoning to help developers understand codebases at a glance.

---

## ✨ Key Features

- 🔮 **Interactive Concept Canvas**: Powered by React Flow (`@xyflow/react`), rendering files and dependencies on a dynamic 2D canvas with custom styling, animated paths, and smooth zoom controls.
- 🗂️ **Automated Architectural Clustering**: Classifies codebase files into logical functional layers (e.g., *Authentication*, *API Routing*, *Database*, *State Management*, *Telemetry*, *UI Components*, *Utilities*) using structural parsing.
- 📡 **SSE Streaming Narrative**: Leverages the Groq SDK with `llama-3.1-8b-instant` to stream real-time, low-latency architectural explanations (SSE) directly into the UI.
- ⚡ **Lightweight Vector Store**: Implements a zero-dependency, in-memory TF-IDF vector retrieval engine to surface relevant files and construct token-efficient context for RAG.
- 🔀 **Execution Flow Tracing**: Visualizes execution routes (e.g., *User Login*, *API Requests*, *Data Queries*) across file nodes by illuminating active dependency paths on the canvas.

---

## 🏗️ Architecture

```
                  ┌────────────────────────────────────────┐
                  │          React Frontend (Vite)         │
                  │  (React Flow Canvas, Telemetry Grid)   │
                  └───────────────────┬────────────────────┘
                                      │  (Fetch & SSE Stream)
                                      ▼
                  ┌────────────────────────────────────────┐
                  │        Express Backend Service         │
                  └───────────────────┬────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
  ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
  │    AST Parser     │     │  Vector Store     │     │     Groq SDK      │
  │ (Acorn & Walk JS) │     │ (In-Memory TF-IDF)│     │  (Llama-3.1 SSE)  │
  └───────────────────┘     └───────────────────┘     └───────────────────┘
```

### Technical Stack
* **Frontend**: React 19, Vite, `@xyflow/react` (React Flow), Lucide React.
* **Backend**: Node.js, Express, `groq-sdk`, `acorn` & `acorn-walk` (AST parsing).

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* Git installed on your system

### Installation

Clone the repository and install all dependencies for both frontend and backend using the root helper script:

```bash
# Install all dependencies (frontend & backend)
npm run install:all
```

### Configuration

Create a `.env` file in the `backend` directory (you can copy `.env.example` to start):

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

> 💡 **Note**: If no `GROQ_API_KEY` is provided, Amaterasu will run in **Mock Mode** using pre-configured mock narratives and statistics.

### Running the Application

Launch both the backend and frontend dev servers concurrently using:

```bash
npm run dev
```

* **Frontend**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## 🛠️ Usage Guide

1. **Analyze a Codebase**: Enter the absolute local path to a repository or a public Git HTTPS URL in the bottom-right command bar and press Enter.
2. **Explore the Concept Canvas**: Drag clusters, select file nodes to view properties, and use the zoom/minimap controls to inspect relationships.
3. **Generate Architectural Narratives**: Click the **Story** button or type specific questions about the codebase structure (e.g., *"How does authentication work?"*) in the input bar.
4. **Trace Execution Flows**: Open the **Trace** dropdown, choose a workflow (e.g., *User Login*), and watch the active file nodes and dependencies light up on the canvas.
