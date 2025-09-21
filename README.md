# GoopUI

GoopUI is a lightweight progressive web application for chatting with local [Ollama](https://ollama.com) models. It includes a FastAPI backend that proxies requests to the Ollama HTTP API and a React frontend with PWA support so you can install it on desktop and mobile devices.

## Prerequisites

- Python 3.11+
- Node.js 18+
- An Ollama instance running locally (defaults to `http://localhost:11434`)

## Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # adjust values if necessary
uvicorn app.main:app --reload --port 8000
```

Environment variables:

- `OLLAMA_URL` – base URL of the Ollama API (defaults to `http://localhost:11434`)
- `CORS_ALLOW_ORIGINS` – comma separated origins allowed to hit the backend (defaults to `http://localhost:5173,http://localhost:3000`)

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env  # points the UI to the backend API
npm run dev
```

The development server runs on `http://localhost:5173`. The React app is configured with [`vite-plugin-pwa`](https://vite-plugin-pwa.netlify.app/) so running `npm run build` will generate the service worker and manifest; the dev server also registers the service worker for rapid feedback.

## Connecting frontend and backend

1. Start the backend (`uvicorn app.main:app --reload --port 8000`).
2. Start the frontend (`npm run dev`).
3. Visit `http://localhost:5173` in your browser. Select a model, optionally adjust the system prompt, and start chatting.

Ensure Ollama is serving the requested model locally. The backend simply proxies to the Ollama API and surfaces any errors it encounters.

The frontend stores conversation history in the browser's local storage so you can return to previous chats anytime on the same device. Use the sidebar to start fresh conversations, reopen past threads, delete individual chats, or clear the entire history.

## Testing

```bash
cd frontend
npm test
```

## Project structure

```
backend/
  app/
    main.py         # FastAPI application with Ollama proxy endpoints
  requirements.txt  # Backend dependencies
frontend/
  src/              # React application code
  public/           # Static assets and PWA icons
README.md           # Project overview and setup instructions
```
