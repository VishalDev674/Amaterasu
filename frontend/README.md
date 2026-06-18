# 🎨 Amaterasu Frontend

This is the React frontend for **Amaterasu**, built using Vite, React 19, and `@xyflow/react` (React Flow). It presents the interactive concept canvas, telemetry dashboard, and command console.

## ⚡ Features

- **Concept Canvas**: Fully interactive map visualizing files and relationships using Custom Node Types (`ConceptNode` & `FileNode`).
- **Telemetry cards**: Quick stats reflecting code structures (number of files, active trace, RAG cache health, throughput).
- **Narrative panel**: Self-scrolling panel showing the SSE-streamed AI architectural story.
- **Command console**: Input field for triggering codebase analysis, questions, and execution flow tracing.

## 🚀 Running Independently

If you want to run the frontend separately from the backend:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will run at [http://localhost:5173](http://localhost:5173) and attempt to query the backend at [http://localhost:3001/api](http://localhost:3001/api).

For details on configuration and running the full system, please see the [root README.md](../README.md).
