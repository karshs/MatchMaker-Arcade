# MatchMaker Arcade 

> Internal CRM Dashboard for professional matchmakers

A full-stack matchmaking CRM built for managing matrimonial client profiles, tracking customer journeys, discovering rule-based matches, and generating AI-powered compatibility insights.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + JavaScript + Tailwind CSS + Vite |
| Backend | Node.js + Express + JavaScript |
| Database | PostgreSQL via Neon DB (serverless) |
| AI | OpenAI GPT-4o |
| Auth | JWT (hardcoded admin credentials) |

## Project Structure

```
MatchMaker-Arcade/
├── client/    # React frontend (Vite + Tailwind)
└── server/    # Express API (JavaScript)
```

## Getting Started

### Prerequisites
- Node.js 18+
- A [Neon DB](https://neon.tech) account (free tier works)
- An Gemini API key 

### Backend Setup

```bash
cd server
cp .env.example .env
# Fill in your DATABASE_URL and other vars in .env
npm install
npm run dev
```

The API will start at `http://localhost:5000`

Health check: `GET /api/health`

## Features

- 🔐 Matchmaker login (JWT auth)
- 📋 Customer dashboard with search, filters, and sorting
- 👤 Detailed matrimonial profiles (50+ fields)
- 🗺️ Customer journey tracking with timeline
- 📝 Notes system (Call / Meeting / Follow Up / General)
- 💡 Rule-based match discovery with 100-point scoring
- 🤖 AI-generated compatibility insights (OpenAI)
- 📨 Mock match recommendation sending

## Default Credentials

```
Email:    admin@matchmaker.com
Password: password123
```
