# RAG AI Assistant - Frontend

Static AI-powered RAG chat UI. No build step — plain HTML/CSS/JS.

## Backend dependency

Needs the backend running at `http://localhost:8080` (see `../personal-rag-backend/README.md`).
API base URL is set in `js/config.js` (`BASE_URL`). Endpoints used: `/knowledge/ask`, `/knowledge/create`, `/knowledge/create/pdf`, `/knowledge/update`, `/knowledge/delete`, `/knowledge/all`, `/knowledge/id`, `/knowledge/vector`.

## Getting Started

1.  Make sure you have [Node.js](https://nodejs.org/) installed.
2.  Run `npm start` (serves the folder on `http://localhost:3000`).
3.  Open `http://localhost:3000` in your browser.

## Usage examples

### 1. Ask a question (chat)

1.  Type a question in the input box, e.g. `What does RAG stand for?`, and hit send.
2.  Watch the status chips (`analyzing-query` → `retrieving-info` → `reranking-info` → `generating-response`) while the answer streams in.
3.  Use the stop button to cancel a running answer, `New Query` to start a fresh session, or the mic button to dictate instead of typing. Answers can be read aloud.
4.  Past sessions appear in the sidebar; you can rename (update query) or delete them.

### 2. Ingest knowledge

Click `Ingest Knowledge` (sidebar) and pick a tab:

- TEXT tab: paste plain text, e.g. `RAG stands for Retrieval-Augmented Generation.`, then `Ingest Knowledge`.
- URL tab: enter a page URL, e.g. `https://example.com/article` — the backend scrapes and ingests it.
- PDF tab: click or drag-and-drop a `.pdf` file, then ingest.

A toast confirms success; the item appears in Knowledge Management.

### 3. Manage knowledge

Click your avatar / `Ingest Knowledge` footer area to open the `Knowledge Management` view:

- Browse ingested items (`Load More` pages through history).
- Click an item to see its full content (copy button included).
- Open `Knowledge Vector Content Chunks` to inspect the stored embedding chunks.
- Update an item's text or delete items you no longer need.

## 🎤 Microphone Permissions

To ensure the browser remembers your microphone permission and doesn't ask every time, serve via `npm start` (not `file://`).
Browsers treat `localhost` as a **secure origin**, which allows them to save your microphone settings.
