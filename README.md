# Inventory Management System (Upgraded MVP)

A full-stack, market-ready Inventory Management System built with Django and React. Upgraded with modern UI, robust data visualization, and comprehensive stock-management workflows.

## 🌟 Key Features

- **📊 Advanced Analytics**: Real-time sales trends and stock breakdown using Recharts.
- **📦 Full CRUD Management**: Manage Products, Categories, Suppliers, Orders, and Purchase Orders.
- **🛡️ Audit Trail**: Automatic logging of every stock movement (ins, outs, adjustments, returns).
- **🚀 Purchase Order Workflow**: Automatic inventory replenishment when POs are marked as received.
- **📈 Demand Forecasting**: Built-in velocity-based forecasting to predict reorder dates.
- **📧 Low-Stock Alerts**: Automated email notifications (signals) when units fall below reorder levels.
- **📱 Responsive Design**: Modern sidebar, toast notifications, and modals optimized for all screen sizes.
- **📑 CSV Export**: Export your entire product catalog and order history for offline analysis.

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data --clear
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Admin Access
Use the following demo credentials:
- **Username**: `admin`
- **Password**: `admin1234`

## 🛠️ Tech Stack

- **Backend**: Django, Django REST Framework, SQLite (Development).
- **Frontend**: React, Recharts, Vanilla CSS.
- **Architecture**: REST API with Token Authentication.

## 📂 Project Structure

- `/backend`: Django project including `inventory`, `core`, and `reports` apps.
- `/frontend`: React SPA with functional components and hooks.
- `/docs`: Visual walkthroughs and API documentation.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed by **Bravin Ouma** — Teklini Technologies.
