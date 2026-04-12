"""
tests/test_inventory.py
=======================
Pytest test suite covering models, serializers, views, and RBAC.
"""

import pytest
import json
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    from users.models import UserProfile
    user = User.objects.create_user(
        username="admin_bravin",
        password="securepass123",
        email="admin@teklini.co.ke",
        first_name="Bravin",
        last_name="Ouma",
    )
    UserProfile.objects.create(user=user, role=UserProfile.Role.ADMIN)
    return user


@pytest.fixture
def viewer_user(db):
    from users.models import UserProfile
    user = User.objects.create_user(
        username="viewer_user",
        password="viewerpass123",
        email="viewer@teklini.co.ke",
    )
    UserProfile.objects.create(user=user, role=UserProfile.Role.VIEWER)
    return user


@pytest.fixture
def auth_client(api_client, admin_user):
    token, _ = Token.objects.get_or_create(user=admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return api_client


@pytest.fixture
def category(db):
    from inventory.models import Category
    return Category.objects.create(name="Electronics", description="Tech products")


@pytest.fixture
def supplier(db):
    from inventory.models import Supplier
    return Supplier.objects.create(
        name="TechSource Ltd",
        contact_email="supply@techsource.co.ke",
        phone="+254700000000",
    )


@pytest.fixture
def product(db, category, supplier, admin_user):
    from inventory.models import Product
    return Product.objects.create(
        sku="ELC-001",
        name="Wireless Keyboard",
        category=category,
        supplier=supplier,
        price=3500.00,
        cost_price=2200.00,
        quantity=100,
        reorder_level=10,
        reorder_quantity=50,
        created_by=admin_user,
    )


# ─── Model Tests ──────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProductModel:

    def test_product_creation(self, product):
        assert product.sku == "ELC-001"
        assert product.quantity == 100
        assert product.status == "in_stock"

    def test_profit_margin_calculation(self, product):
        margin = product.profit_margin
        assert margin > 0
        expected = round(((3500 - 2200) / 3500) * 100, 2)
        assert margin == expected

    def test_auto_status_low_stock(self, product):
        product.quantity = 5
        product.save()
        assert product.status == "low_stock"

    def test_auto_status_out_of_stock(self, product):
        product.quantity = 0
        product.save()
        assert product.status == "out_of_stock"

    def test_auto_status_in_stock(self, product):
        product.quantity = 50
        product.save()
        assert product.status == "in_stock"


# ─── API Tests ────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCategoryAPI:

    def test_list_categories_authenticated(self, auth_client, category):
        response = auth_client.get("/api/v1/inventory/categories/")
        assert response.status_code == 200
        assert response.data["count"] >= 1

    def test_create_category_as_admin(self, auth_client):
        response = auth_client.post("/api/v1/inventory/categories/", {
            "name": "Furniture",
            "description": "Office furniture",
        })
        assert response.status_code == 201
        assert response.data["name"] == "Furniture"

    def test_create_category_as_viewer_denied(self, api_client, viewer_user):
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=viewer_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = api_client.post("/api/v1/inventory/categories/", {"name": "Blocked"})
        assert response.status_code == 403


@pytest.mark.django_db
class TestProductAPI:

    def test_list_products(self, auth_client, product):
        response = auth_client.get("/api/v1/inventory/products/")
        assert response.status_code == 200

    def test_product_detail(self, auth_client, product):
        response = auth_client.get(f"/api/v1/inventory/products/{product.id}/")
        assert response.status_code == 200
        assert response.data["sku"] == "ELC-001"

    def test_low_stock_endpoint(self, auth_client, product):
        product.quantity = 5
        product.save()
        response = auth_client.get("/api/v1/inventory/products/low-stock/")
        assert response.status_code == 200
        assert response.data["count"] >= 1

    def test_dashboard_stats(self, auth_client, product):
        response = auth_client.get("/api/v1/inventory/products/dashboard-stats/")
        assert response.status_code == 200
        assert "total_products" in response.data

    def test_stock_adjustment(self, auth_client, product):
        response = auth_client.post(
            f"/api/v1/inventory/products/{product.id}/adjust-stock/",
            {"quantity": 20, "movement_type": "in", "reason": "New delivery"},
        )
        assert response.status_code == 200
        assert response.data["new_quantity"] == 120


@pytest.mark.django_db
class TestOrderAPI:

    def test_create_order(self, auth_client, product):
        payload = {
            "customer_name": "Jane Wanjiku",
            "customer_email": "jane@example.com",
            "items": [
                {
                    "product": product.id,
                    "quantity": 2,
                    "unit_price": str(product.price),
                }
            ],
        }
        response = auth_client.post(
            "/api/v1/inventory/orders/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        assert response.status_code == 201
        assert response.data["customer_name"] == "Jane Wanjiku"
        assert "order_number" in response.data

    def test_unauthenticated_access_denied(self, api_client):
        response = api_client.get("/api/v1/inventory/products/")
        assert response.status_code == 401


# ─── Report Tests ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestReports:

    def test_stock_summary(self, auth_client, product):
        response = auth_client.get("/api/v1/reports/stock-summary/")
        assert response.status_code == 200
        assert "total_products" in response.data

    def test_low_stock_alerts(self, auth_client, product):
        product.quantity = 3
        product.save()
        response = auth_client.get("/api/v1/reports/low-stock-alerts/")
        assert response.status_code == 200
        assert response.data["alert_count"] >= 1

    def test_demand_forecast(self, auth_client):
        response = auth_client.get("/api/v1/reports/demand-forecast/")
        assert response.status_code == 200
        assert "forecasts" in response.data
