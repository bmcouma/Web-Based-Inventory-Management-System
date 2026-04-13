"""
inventory/urls.py
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, SupplierViewSet, ProductViewSet,
    StockMovementViewSet, OrderViewSet, PurchaseOrderViewSet,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("products", ProductViewSet, basename="product")
router.register("movements", StockMovementViewSet, basename="movement")
router.register("orders", OrderViewSet, basename="order")
router.register("purchase-orders", PurchaseOrderViewSet, basename="purchase-order")

urlpatterns = [
    path("", include(router.urls)),
]
