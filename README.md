# AI Mentor

An AI-powered mentorship platform for junior developers. The AI acts as a Senior Developer — assigning real projects, reviewing your GitHub Pull Requests, and giving professional code feedback automatically using Google Gemini.

## How It Works

1. Log in with GitHub
2. Request a project (choose your skill level)
3. Complete milestone tasks by pushing code to GitHub and opening a PR
4. Submit the PR link in the dashboard
5. The AI reviews your code and either merges it or asks for fixes

## Stack

**Backend** — Django, PostgreSQL, Celery, Redis, Google Gemini API  
**Frontend** — Next.js, TypeScript, Tailwind CSS

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp .env.example .env        
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Required Environment Variables

```
DATABASE_URL
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_ACCESS_TOKEN
GITHUB_WEBHOOK_SECRET
GEMINI_API_KEY
ENCRYPTION_KEY
```

## GitHub OAuth Setup

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL to `http://localhost:8000/api/v1/auth/github/callback/`
4. Copy Client ID and Secret to your `.env`

## API Docs

Available at `http://localhost:8000/api/docs/` after running the backend.
