# ◈ TekLedger: Intelligent Inventory & Supply Chain Management

[![Version](https://img.shields.io/badge/Version-1.0.0--MVP-blue.svg)](https://github.com/teklini/inventory-management)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB)](https://reactjs.org/)

**TekLedger** is a premium, enterprise-grade Inventory Management System designed by **Teklini Technologies**. It transforms manual stock tracking into a high-fidelity, data-driven operation with real-time analytics, automated supply chain workflows, and intelligent demand forecasting.

---

## 💎 Exclusive Features

### 📊 **Intelligence Hub (Reports)**
*   **Predictive Demand Forecasting**: Proprietary velocity-based algorithms that predict restock dates and reorder quantities.
*   **Live Revenue Tracking**: Dynamic 6-month revenue trends and order volume analysis using Recharts.
*   **Low-Stock Intelligence**: Instant dashboard alerts and automated email triggers when stock hits critical thresholds.

### 🔄 **Operations & Supply Chain**
*   **Unified Product Catalog**: Manage high-resolution inventory items with SKU patterns, categories, and barcodes.
*   **Purchase Order Lifecycle**: End-to-end procurement workflow (Draft → Sent → Received) with automatic inventory adjustment upon receipt.
*   **Customer Order Management**: Digital order processing with real-time status tracking (Pending → Shipped → Delivered).

### 🛡️ **Security & Compliance**
*   **Role-Based Access Control (RBAC)**: Secure access levels for Admin, Manager, and Viewer roles.
*   **Immutable Audit Trail**: Automatic logging of every unit movement with reason-tracking and timestamping.
*   **Token-Based API Security**: Robust DRF authentication ensuring all data is protected at the edge.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Django & Django REST Framework |
| **Frontend** | React (Hooks, Context API, Vanilla CSS) |
| **Data Viz** | Recharts (High-fidelity Charts) |
| **Database** | SQLite (Seed-ready, Production-ready for PG) |
| **Security** | Token Authentication & RBAC |

---

## 🚀 Deployment Guide

### 1. Project Initialization
```bash
# Clone the repository
git clone https://github.com/teklini/inventory-management.git
cd inventory-management
```

### 2. Backend Orchestration
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
# (Note: Local db.sqlite3 is already pre-seeded with 6 months of historical data)
python manage.py runserver
```

### 3. Frontend Execution
```bash
cd ../frontend
npm install
npm start
```

---

## 🔐 Executive Credentials (Demo)

| Role | Username | Password |
| :--- | :--- | :--- |
| **Global Admin** | `admin` | `admin1234` |
| **Stock Manager** | `manager` | `manager1234` |

---

## 🏛️ Project Architecture

```text
├── backend/
│   ├── core/           # System configuration & Security
│   ├── inventory/      # Products, Orders, & Stock Logic
│   ├── users/          # RBAC & Profiles
│   └── reports/        # Analytics & ML Hooks
└── frontend/
    ├── src/
    │   ├── App.jsx     # High-Fidelity SPA Logic
    │   └── assets/     # Design Tokens
    └── public/
```

---

## 👨‍💻 Developed by Teklini Technologies
**Bravin Ouma** — Principal AI Coding Assistant at Antigravity.
*Delivered with visual excellence and 100% human-clean standards.*

---
© 2026 Teklini Technologies. Licensed under MIT.
