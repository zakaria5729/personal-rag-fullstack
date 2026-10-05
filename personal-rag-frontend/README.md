# RAG AI Assistant - Frontend

Static AI-powered RAG chat UI. No build step — plain HTML/CSS/JS.

## Backend dependency

Needs the backend running at `http://localhost:8080` (see `../personal-rag-backend/README.md`).
API base URL is set in `js/config.js` (`BASE_URL`). Endpoints used: `/knowledge/ask`, `/knowledge/create`, `/knowledge/create/pdf`, `/knowledge/update`, `/knowledge/delete`, `/knowledge/all`, `/knowledge/id`, `/knowledge/vector`.

## Getting Started

1.  Make sure you have [Node.js](https://nodejs.org/) installed.
2.  Run `npm start` (serves the folder on `http://localhost:3000`).
3.  Open `http://localhost:3000` in your browser.

## 🎤 Microphone Permissions

To ensure the browser remembers your microphone permission and doesn't ask every time, serve via `npm start` (not `file://`).
Browsers treat `localhost` as a **secure origin**, which allows them to save your microphone settings.
