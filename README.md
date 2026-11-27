# AI Customer Support Agent

A full-stack AI-powered customer support chat application with JWT authentication, user-scoped chat history in MongoDB, and Docker support.

## Live Demo
- **Frontend:** _(Add link after deployment)_
- **Backend API:** _(Add link after deployment)_

## Tech Stack
- **Frontend:** React (Vite), Axios/Fetch
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas (Mongoose)
- **Authentication:** JWT + bcrypt
- **AI Provider:** OpenRouter.ai / Hugging Face
- **DevOps:** Docker & Docker Compose

## Project Structure
- `client/` — React frontend
- `server/` — Node.js + Express REST API
- `docs/` — Architecture & design notes
- `docker-compose.yml` — Multi-container local setup

## Environment Variables
Copy the example files and fill in your credentials:
- `server/.env.example` → `server/.env`
- `client/.env.example` → `client/.env`

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
- [Architecture Notes](./docs/main_architecture.md)

