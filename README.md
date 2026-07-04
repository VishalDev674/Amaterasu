# 🔥 Amaterasu — Codebase Intelligence Engine

Amaterasu is a premium, high-fidelity codebase visualization and intelligence engine designed to parse JavaScript, TypeScript, Python, Go, Rust, Java, C#, and other programming languages. It constructs interactive dependency concept maps, compares source files side-by-side, streams AI-powered architectural narratives, and generates interactive quizzes to test codebase comprehension.

Built with an **Obsidian & Ember** dark theme, it offers a real-time visual canvas coupled with instant LLM reasoning to help developers understand codebases at a glance.

---

## ✨ Key Features

- 🔮 **Interactive Concept Canvas**: Driven by React Flow (`@xyflow/react`), rendering files and dependencies on a dynamic 2D canvas with custom styling, animated paths, and smooth zoom controls.
- 🗂️ **Automated Architectural Clustering**: Classifies codebase files into logical functional layers (e.g., *Authentication*, *API Routing*, *Database*, *State Management*, *Telemetry*, *UI Components*, *Utilities*) using structural parsing.
- 🔄 **Adaptive Views (Graph vs. Step View)**:
  - **Graph View**: Visualizes nodes and edges representing files and dependency connections on a coordinate map.
  - **Step View**: Renders functional domains in a structured sequential workflow grid connected by animated curves and arrows, showing file sizes and contents.
- ⚖️ **Side-by-Side File Comparison**: Select and compare any two repository files. Computes line counts, function/class totals, lists shared and unique exports, and prompts AI for an insightful comparative analysis.
- 🧠 **Interactive Codebase Quizzes**: Generates dynamically tailored multiple-choice quizzes using Groq API (or offline fallback) with:
  - **Beginner Mode**: Conceptual questions testing architecture, directory layouts, and pattern structures.
  - **Advanced Mode**: Detailed implementation questions querying functions, classes, and code-level design decisions.
- 📡 **SSE Streaming Narrative**: Streams real-time architectural explanations (Server-Sent Events) from `llama-3.1-8b-instant` using the Groq SDK directly into the UI.
- ⚡ **Lightweight Vector Store**: Zero-dependency, in-memory TF-IDF semantic vector retrieval engine for surfacing files and constructing context-aware inputs for RAG.
- 🔀 **Execution Flow Tracing**: Highlights execution paths (e.g., *User Login*, *API Requests*, *Data Queries*) across file nodes by illuminating active dependency relationships.
- 🎛️ **Dual-Pane Interface with Resize Dividers**: Includes vertical and horizontal resize bars to seamlessly balance the canvas, code viewer, and AI narrative panes.

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

---

## 📂 File Registry & Structure

### Frontend (`/frontend`)
* [App.jsx](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/App.jsx) — Main app wrapper containing UI state, drag-and-resize dividers, layout structures, and panel controls.
* **Canvas Components (`/components/canvas`)**:
  * [ConceptCanvas.jsx](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/components/canvas/ConceptCanvas.jsx) — Layout and configuration for React Flow canvas. Manages graph coordinates, background dots, controls, and view toggles.
  * [StepwiseView.jsx](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/components/canvas/StepwiseView.jsx) — Sequential workflow rendering of codebase domains, grouping files by cluster in a grid layout.
  * [ConceptNode.jsx](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/components/canvas/ConceptNode.jsx) — Custom React Flow component representing architectural clusters.
  * [FileNode.jsx](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/components/canvas/FileNode.jsx) — Custom React Flow component representing codebase source files.
* **Dashboard Components (`/components/dashboard`)**:
  * [CommandBar.jsx](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/components/dashboard/CommandBar.jsx) — Prompt input console, path submission, and buttons to trigger quizzes, comparisons, or narratives.
  * [CodeViewer.jsx](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/components/dashboard/CodeViewer.jsx) — Interactive pane with code syntax highlighting and inspector.
  * [ComparePanel.jsx](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/components/dashboard/ComparePanel.jsx) — UI component to pick two files, check statistics, and view their comparison analysis.
  * [NarrativePanel.jsx](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/components/dashboard/NarrativePanel.jsx) — Streams architectural narratives, displaying chat bubbles and rich markdown formatting.
  * [QuizModal.jsx](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/components/dashboard/QuizModal.jsx) — Renders the interactive quiz interface (Beginner/Advanced), progress tracker, and correct/incorrect answer breakdowns.
* **Styling**:
  * [index.css](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/frontend/src/index.css) — Custom variables, dark Obsidian palette, flex layout guidelines, and CSS animations.

### Backend (`/backend`)
* [server.js](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/backend/server.js) — Main Express server routing endpoints for AST analysis, comparison, quiz generation, search queries, telemetry metrics, and SSE narrative streaming.
* **Core Services (`/backend/services`)**:
  * [astParser.js](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/backend/services/astParser.js) — Language detection and source file analysis. Utilizes Acorn for JavaScript/TypeScript and falls back to semantic regex token extraction for Go, Rust, Python, Java, Kotlin, etc.
  * [conceptMapper.js](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/backend/services/conceptMapper.js) — Classifies parsed file signatures into functional domain clusters and computes layout nodes/edges.
  * [groqService.js](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/backend/services/groqService.js) — Handles API connections with Groq and builds RAG contexts for system instructions.
  * [vectorStore.js](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/backend/services/vectorStore.js) — Zero-dependency, in-memory TF-IDF index. Enables quick semantic code searches.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **Git** installed on your system

### Installation

Clone the repository and install all dependencies for both frontend and backend using the root helper script defined in [package.json](file:///c:/Users/Vishal%20Kumar/Desktop/Amaterasu/package.json):

```bash
# Install all dependencies (frontend & backend)
npm run install:all
```

### Configuration

Create a `.env` file in the `backend` directory (you can copy `.env.example` to start):

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

> 💡 **Note**: If no `GROQ_API_KEY` is provided, Amaterasu will run in **Mock Mode** using pre-configured mock narratives, statistics, comparisons, and quizzes.

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
2. **Explore the Concept Canvas**: Toggle between the **Graph** view to inspect network layers and dependency lines, or the **Steps** view to review the codebase's logical sequence block by block.
3. **Compare Files Side-by-Side**: Click the **Compare** icon in the console, choose two files, and read their AI comparison analysis alongside their function, class, and export statistics.
4. **Generate Architectural Narratives**: Click the **Story** button or type specific questions about the codebase structure (e.g., *"How does database routing function?"*) in the input bar.
5. **Take a Codebase Quiz**: Click the **Quiz** buttons in the console to test your understanding. Try *Beginner* mode for high-level structure or *Advanced* mode for detailed code logic.
6. **Trace Execution Flows**: Open the **Trace** dropdown, choose a workflow (e.g., *User Login*), and watch the active file nodes and dependencies light up on the canvas.
