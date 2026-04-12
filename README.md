# 📦 Inventory Management System

**Author:** Bravin Ouma · [Teklini Technologies](https://bmcouma.github.io/teklini-technologies-com/)  
**Stack:** Django 4.2 · Django REST Framework · React 18 · SQLite / PostgreSQL  
**Version:** 1.0.0 · **License:** MIT

---

## Overview

A full-stack, production-ready inventory management platform built for operational environments where accuracy, speed, and access control matter.

**Key capabilities:**

- 📊 Real-time dashboard with inventory KPIs and stock value
- 🔐 Role-based access control — Admin, Manager, Operator, Viewer
- 📦 Full product lifecycle management with auto stock-status tracking
- 🚚 Order processing with multi-item support and status workflows
- 📈 Reporting suite with sales trends, stock summaries, and low-stock alerts
- 🤖 AI-ready demand forecasting hook (rule-based velocity engine, ML-replaceable)
- 🏷️ Supplier and category management
- 📝 Immutable stock movement audit trail
- 🔒 Token authentication with rate throttling

---

## Architecture

```
inventory_management/
├── backend/                          # Django API
│   ├── core/                         # Settings, root URLs, WSGI
│   ├── inventory/                    # Products, Orders, Categories, Suppliers, Stock Movements
│   ├── users/                        # Auth, registration, RBAC permissions
│   ├── reports/                      # Stock summary, sales trends, AI forecasting
│   ├── tests/                        # pytest-django test suite
│   ├── manage.py
│   ├── pytest.ini
│   ├── requirements.txt
│   └── .env.example                  # Environment variable template
└── frontend/                         # React SPA
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx                   # Dashboard, Products, Orders, Reports, Login
        └── index.js
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- (Optional) PostgreSQL — SQLite used by default

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env            # Edit .env with your values

# Run migrations and seed data
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_data      # Optional: populate demo data

# Start the API server
python manage.py runserver
```

API is available at: `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm start
```

App is available at: `http://localhost:3000`

### One-Command Setup (Makefile)

```bash
make setup          # install + migrate + seed (backend)
make run            # start Django dev server
make frontend-run   # start React dev server
make test           # run full test suite
```

---

## API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/users/register/` | Create new account | Public |
| POST | `/api/v1/users/login/` | Obtain auth token | Public |
| POST | `/api/v1/users/logout/` | Invalidate token | Required |
| GET/PUT | `/api/v1/users/profile/` | View / update own profile | Required |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/inventory/products/` | List or create products |
| GET/PUT/PATCH/DELETE | `/api/v1/inventory/products/{id}/` | Product detail |
| GET | `/api/v1/inventory/products/low-stock/` | Products at or below reorder level |
| GET | `/api/v1/inventory/products/dashboard-stats/` | KPI aggregates |
| POST | `/api/v1/inventory/products/{id}/adjust-stock/` | Manual stock adjustment + movement log |
| GET/POST | `/api/v1/inventory/orders/` | List or create orders |
| POST | `/api/v1/inventory/orders/{id}/update-status/` | Advance order status |
| GET/POST | `/api/v1/inventory/categories/` | Category management |
| GET/POST | `/api/v1/inventory/suppliers/` | Supplier management |
| GET | `/api/v1/inventory/movements/` | Read-only stock movement audit log |

### Reports

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| GET | `/api/v1/reports/stock-summary/` | — | Inventory status breakdown + total value |
| GET | `/api/v1/reports/sales-trends/` | `period=monthly\|weekly`, `days=90` | Revenue & order trends |
| GET | `/api/v1/reports/low-stock-alerts/` | — | Products needing immediate restock |
| GET | `/api/v1/reports/demand-forecast/` | `days=30` | AI-assisted restock predictions |

All endpoints require `Authorization: Token <your-token>` (except register/login).

---

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full CRUD on all resources |
| **Manager** | Create / edit products and orders; read everything |
| **Operator** | View all; create orders |
| **Viewer** | Read-only across all resources |

Roles are enforced via `users/permissions.py` using custom DRF `BasePermission` classes: `IsAdminOrReadOnly`, `IsOperationalUser`, `IsSameUserOrAdmin`.

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | *(insecure placeholder)* | Django secret key — **change in production** |
| `DEBUG` | `True` | Set to `False` in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated list of allowed hosts |
| `DB_ENGINE` | `sqlite` | Use `postgresql` to switch databases |
| `DB_NAME` | `inventory_db` | PostgreSQL database name |
| `DB_USER` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | *(empty)* | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowed CORS origins |

---

## Testing

```bash
cd backend
pytest tests/ -v
```

The test suite uses `pytest-django` + `factory-boy` for realistic fixtures. Coverage includes inventory CRUD, stock adjustment logic, order workflows, and permission enforcement.

---

## AI Demand Forecasting

The `/api/v1/reports/demand-forecast/` endpoint uses a rule-based **sales velocity engine** that calculates daily sell-through rates and estimates days of stock remaining per product.

The engine is explicitly designed as a **drop-in hook** for an ML model:

```python
# reports/views.py — AI_HOOK
# Replace the rule-based block with:
forecast_engine.predict(product_id, horizon_days=30)
```

The response flags any product with < 14 days of projected stock as `restock_recommended: true`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API Framework | Django 4.2 + Django REST Framework 3.15 |
| Auth | DRF Token Authentication |
| Database | SQLite (dev) / PostgreSQL (production) |
| ORM Filtering | `django-filter` + DRF `SearchFilter` / `OrderingFilter` |
| CORS | `django-cors-headers` |
| Rate Limiting | DRF Throttling (100/day anon, 1000/day user) |
| Images | Pillow |
| Production Server | Gunicorn |
| Frontend | React 18 (Create React App) |
| Testing | pytest-django + factory-boy |

---

## Deployment Notes

1. Set `DEBUG=False` and a strong `SECRET_KEY` in `.env`
2. Switch `DB_ENGINE=postgresql` and configure DB credentials
3. Run `python manage.py collectstatic` for static file serving
4. Use **Gunicorn** as WSGI server (already in `requirements.txt`)
5. Serve via **Nginx** as reverse proxy (recommended)
6. Set `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` to your production domain
7. Build the React frontend: `npm run build` → serve the `build/` folder

---

## Project Status

| Feature | Status |
|---------|--------|
| Product CRUD + stock tracking | ✅ Complete |
| Order management + status workflow | ✅ Complete |
| Role-based access control | ✅ Complete |
| Stock movement audit trail | ✅ Complete |
| Reporting suite | ✅ Complete |
| AI forecasting hook | ✅ Rule-based (ML-ready) |
| React SPA (Dashboard, Products, Orders, Reports) | ✅ Complete |
| PostgreSQL production support | ✅ Ready |
| Gunicorn / deployment config | ✅ Included |
| ML model integration | 🔲 Future |
| Docker / docker-compose | 🔲 Future |
| M-Pesa / payment integration | 🔲 Future |

---

*Built by Bravin Ouma · [Teklini Technologies](https://bmcouma.github.io/teklini-technologies-com/)*
