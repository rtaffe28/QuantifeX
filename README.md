# QuantifeX

**QuantifeX** is a full-stack CRUD platform for **quantitative analysis** — combining a Django REST backend with JWT authentication, a React + Chakra UI frontend, and a PostgreSQL database.

---

## 🧠 Overview

QuantifeX provides a foundation for managing, visualizing, and analyzing quantitative data.  
The stack includes:

- **Backend:** Django + Django REST Framework + JWT Auth  
- **Frontend:** React + Chakra UI  
- **Database:** PostgreSQL (via Docker)

---

## ⚙️ Backend Setup

```bash
# Navigate to the backend
cd backend

# Run the development server
python manage.py runserver
```

---

## 💻 Frontend Setup

```bash
# Navigate to the frontend
cd frontend/quantifex_fe

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

---

## 🗄️ Database Setup

```bash
# Start the database container
docker compose up db
```

### Apply Migrations

```bash
cd backend

python manage.py makemigrations
python manage.py migrate
```

---

## 📁 Project Structure

```
QuantifeX/
├── backend/                    # Django backend API with JWT auth
├── frontend/quantifex_fe       # React + Chakra UI frontend
├── docker-compose.yml # DB service
└── README.md
```

---

## 🧪 Tests

### Backend (pytest)

```bash
cd backend
../venv/bin/python -m pytest          # full suite
../venv/bin/python -m pytest -k auth  # filter by name
```

Uses an in-memory SQLite override and mocks `yfinance` everywhere — no network
calls, no Postgres needed.

### Frontend (Vitest + React Testing Library)

```bash
cd frontend/quantifex_fe
pnpm test            # one-shot
pnpm test:watch      # watch mode
```

Vitest runs in jsdom with Chakra + Router providers; API services are mocked
per test via `vi.mock`.

End-to-end Playwright specs continue to live in `frontend/quantifex_fe/tests/e2e/`
and run via `pnpm test:e2e`.

---
