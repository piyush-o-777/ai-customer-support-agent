# AI Customer Support Agent

A full-stack AI-powered customer support chat application with JWT authentication, real-time streaming responses, user-scoped chat history in MongoDB, and Docker support.

## Features
- **Stateless JWT Auth:** Signup, login, logout, session restore (`/auth/me`), bcrypt password hashing, and rate limiting.
- **Live Streaming AI Chat:** Real-time SSE word-by-word responses with Markdown rendering and OpenAI-compatible AI provider support (Gemini, Hugging Face, Groq, OpenRouter).
- **Chat History Management:** Persistent MongoDB conversations with auto-titling, live search, date filters (`All`, `Today`, `7d`, `30d`), and single/bulk delete.
- **Cross-Tab Consistency:** Syncs auth sessions, active conversations, messages, deletions, and theme mode across browser tabs.
- **Modern Accessible UI:** Material UI with Dark/Light themes, `Full`/`Medium`/`Mobile` width switcher, skeleton loaders, animated AI status, top-center toasts, copy and read-aloud, voice-to-text, and keyboard/screen-reader accessibility.
- **Logging & Docker:** Structured HTTP/error logging and multi-stage Docker + Docker Compose setup.

## Live Demo
- **Live App:** https://ai-customer-support-agent-95279737503.us-central1.run.app

## Tech Stack
- **Frontend:** React, Vite, TypeScript (`.tsx`), Material UI, Axios
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT + bcrypt
- **AI Provider:** OpenAI-compatible API (Google Gemini / Hugging Face / Groq / OpenRouter)
- **DevOps:** Docker, Docker Compose & Google Cloud Run

## Project Structure
- `client/`: React + TypeScript frontend
- `server/`: Node.js + Express + TypeScript REST/SSE API
- `docs/`: Architecture & design notes
- `Dockerfile`: Unified production container for Cloud Run
- `docker-compose.yml`: Multi-container local setup

## Environment Variables
Copy the example files and fill in your credentials:
- `server/.env.example` to `server/.env`
- `client/.env.example` to `client/.env`

## Running with Docker (Recommended)
```bash
docker compose up --build
```

## Running Locally (Without Docker)
### 1. Backend
```bash
cd server
npm install
npm run dev
```

### 2. Frontend
```bash
cd client
npm install
npm run dev
```

## Documentation
- [Auth Architecture](./docs/auth/architecture.md)
- [Chat Architecture](./docs/chat/architecture.md)
