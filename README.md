# SpendSense — Personal Finance Tracker

A full-stack personal finance tracker with JWT auth, analytics dashboard, and interactive charts.

**Live app → [spendsense-jade.vercel.app](https://spendsense-jade.vercel.app)**

![SpendSense Dashboard](dashboard.png)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Tailwind CSS, Recharts, Lucide |
| Backend | FastAPI, SQLAlchemy, Python |
| Database | PostgreSQL (Neon) |
| Auth | JWT (python-jose, bcrypt) |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Features

- **Auth** — register, login, JWT-protected routes
- **Transactions** — add, edit, delete income and expense transactions
- **Categories** — custom categories with color labels
- **Dashboard** — monthly income vs expenses stat cards, 6-month trend line chart, spending by category donut chart, recent transactions
- **Filters** — filter transactions by type and category
- **Month picker** — switch between months on the dashboard

---

## Running Locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (local or a free Neon instance at [neon.tech](https://neon.tech))

### 1. Clone the repo

```bash
git clone https://github.com/SaivenkatReddy18/spendsense.git
cd spendsense
```

### 2. Backend

```bash
python -m venv venv

# Windows
.\venv\Scripts\Activate

# Mac/Linux
source venv/bin/activate

cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/spendsense
SECRET_KEY=your-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Create the database in PostgreSQL:

```sql
CREATE DATABASE spendsense;
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000` — Swagger docs at `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user |
| GET/POST | `/categories/` | List or create categories |
| DELETE | `/categories/{id}` | Delete category |
| GET/POST | `/transactions/` | List (with filters) or create |
| PUT | `/transactions/{id}` | Update transaction |
| DELETE | `/transactions/{id}` | Delete transaction |
| GET | `/analytics/summary` | Monthly income/expense totals |
| GET | `/analytics/by-category` | Spending grouped by category |
| GET | `/analytics/trend` | 6-month income vs expense trend |

---

## Database Schema

```
users        — id, name, email, hashed_password, created_at
categories   — id, user_id, name, type, color
transactions — id, user_id, category_id, amount, description, date, type
budgets      — id, user_id, category_id, amount, month, year
```

---

## Project Structure

```
spendsense/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + CORS
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # JWT + password hashing
│   │   ├── database.py      # DB connection + session
│   │   ├── config.py        # Environment settings
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── categories.py
│   │       ├── transactions.py
│   │       └── analytics.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/             # Axios instance + interceptors
        ├── context/         # Auth context + state
        ├── components/      # Layout, Modal, PrivateRoute
        └── pages/           # Dashboard, Transactions, Login, Register
```

---

## Author

**Sai Venkat Reddy Seri** — [GitHub](https://github.com/SaivenkatReddy18) · [Portfolio](https://SaivenkatReddy18.github.io)
