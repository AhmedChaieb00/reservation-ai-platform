# Reservation AI Platform

Full-stack platform to book conference rooms and equipment, with an AI service
(chatbot, recommendations, demand prediction, anomaly detection, sentiment analysis).
Academic project at ITEAM University (2024-2025).

![CI](https://github.com/AhmedChaieb00/reservation-ai-platform/actions/workflows/ci.yml/badge.svg)

## Architecture

```
 Browser â”€â”€â–º frontend (React + TypeScript, Nginx :3000)
                 â”‚  /api/*
                 â–¼
            backend (Spring Boot 3, JWT, REST :8080) â”€â”€â–º MySQL 8
                 â”‚  /api/ai/*  (internal network only)
                 â–¼
            ai-service (Flask + scikit-learn, :5000) â”€â”€â–º MySQL 8 (read)
                 â””â”€â–º Groq LLM API (optional, for the chatbot)
```

| Module | Stack |
|---|---|
| `backend/` | Java 17, Spring Boot 3.2, Spring Security (JWT, role-based), Spring Data JPA, Validation, Actuator, scheduled notifications |
| `frontend/` | React 18, TypeScript, Vite, Tailwind CSS, Zustand, FullCalendar, Recharts, PWA |
| `ai-service/` | Python 3.11, Flask, scikit-learn, pandas, TextBlob, Groq SDK, Gunicorn |
| `database/` | MySQL schema + demo seed (`init.sql`) |
| `javafx-client/` | Optional JavaFX desktop client |
| `docs/` | Project report, slides, UML diagrams (PlantUML sources) |

## Features

- Authentication with JWT, roles `ADMIN` / `MANAGER` / `USER` (method-level `@PreAuthorize`)
- Rooms and equipment management, availability search, maintenance logs
- Reservations with **conflict detection**, capacity check, approval workflow (pending, confirmed, cancelled), recurrence fields
- Calendar view, dashboard, occupancy / peak-hours / user-activity reports
- In-app and e-mail notifications (scheduler runs every 5 minutes and daily)
- AI endpoints: room recommendation, usage prediction, anomaly detection, sentiment analysis, chatbot
  (LLM through Groq when `GROQ_API_KEY` is set, rule-based fallback otherwise)

## Run with Docker

Prerequisites: Docker with Compose v2.

```bash
cp .env.example .env        # then edit .env: every secret must be replaced
# generate strong values, for example:  openssl rand -base64 48
docker compose up --build
```

- App: http://localhost:3000
- API: http://localhost:8080/api/health

The compose file refuses to start if a required secret is missing: there are no default passwords or keys.
The AI service has no published port; only the backend can call it.

### Demo data

`database/init.sql` seeds demo accounts (`admin@iteam.tn`, `manager@iteam.tn`, `user1@iteam.tn`) that share a
**publicly known demo password** (`Admin@123`). Use them for local demos only.
To show the quick-login buttons on the login page, set `VITE_DEMO_MODE=true` in `.env` before building.
Never deploy this seed to a public environment without changing or deleting these accounts.

## Configuration

| Variable | Purpose |
|---|---|
| `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` | Database credentials (required) |
| `JWT_SECRET` | JWT signing key, at least 32 characters (required; the app refuses to start otherwise) |
| `AI_SECRET_KEY` | Flask secret key (required in compose) |
| `GROQ_API_KEY` | Enables the LLM chatbot (optional) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed browser origins (default `http://localhost:3000`) |
| `MAIL_*` | SMTP settings for e-mail notifications (optional, use an app password) |

## API overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| Rooms | `GET /api/rooms`, `GET /api/rooms/available`, `POST/PUT/DELETE /api/rooms/{id}` (admin/manager) |
| Reservations | `GET/POST /api/reservations`, `GET /api/reservations/calendar`, `PUT /api/reservations/{id}/confirm`, `DELETE /api/reservations/{id}` |
| Equipment | `/api/equipment`, `/api/equipment/{id}/report`, `/api/equipment/{id}/maintenance` |
| Reports | `/api/reports/dashboard`, `/occupancy`, `/peak-hours`, `/user-activity` |
| Notifications | `/api/notifications`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all` |
| AI (proxied) | `POST /api/ai/recommend`, `POST /api/ai/chat`, `GET /api/ai/predict`, `GET /api/ai/anomalies` |

## Development

```bash
# backend (needs a MySQL instance and the env vars above)
cd backend && mvn verify

# frontend
cd frontend && npm ci && npm run dev      # http://localhost:3000, proxies /api to :8080

# ai-service
cd ai-service && pip install -r requirements.txt pytest && pytest
```

CI (`.github/workflows/ci.yml`) builds and tests the three services and builds the Docker images.

## Security notes

- No secrets are stored in the repository; `.env` is git-ignored.
- CORS is restricted to configured origins; `/actuator` only exposes `health` and `info` publicly.
- Passwords are hashed with BCrypt (cost 12). Registration always creates a `USER` account.
- Known limitations / roadmap: refresh tokens and token revocation, rate limiting on `/api/auth/*`,
  integration tests with Testcontainers, Flyway migrations instead of a single `init.sql`.

## Authors

Ahmed Chaieb, ITEAM University.
