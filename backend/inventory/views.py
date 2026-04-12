"""
inventory/views.py
==================
DRF ViewSets with RBAC, filtering, and custom actions.
"""

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, F, Q
from django.utils import timezone

from .models import Category, Supplier, Product, StockMovement, Order
from .serializers import (
    CategorySerializer, SupplierSerializer,
    ProductListSerializer, ProductDetailSerializer,
    StockMovementSerializer, OrderSerializer,
)
from users.permissions import IsAdminOrReadOnly, IsOperationalUser


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["is_active"]
    search_fields = ["name", "contact_email"]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related("category", "supplier").all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "supplier", "status"]
    search_fields = ["sku", "name", "description"]
    ordering_fields = ["name", "price", "quantity", "updated_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        """Return all products at or below their reorder level."""
        products = self.queryset.filter(
            Q(status="low_stock") | Q(status="out_of_stock")
        )
        serializer = ProductListSerializer(products, many=True)
        return Response({
            "count": products.count(),
            "results": serializer.data,
        })

    @action(detail=False, methods=["get"], url_path="dashboard-stats")
    def dashboard_stats(self, request):
        """Aggregate stats for the inventory dashboard."""
        total_products = Product.objects.count()
        low_stock_count = Product.objects.filter(
            Q(status="low_stock") | Q(status="out_of_stock")
        ).count()
        total_value = Product.objects.aggregate(
            value=Sum(F("quantity") * F("cost_price"))
        )["value"] or 0
        top_categories = (
            Category.objects.annotate(count=Count("products"))
            .order_by("-count")[:5]
            .values("name", "count")
        )
        return Response({
            "total_products": total_products,
            "low_stock_count": low_stock_count,
            "total_inventory_value_kes": float(total_value),
            "top_categories": list(top_categories),
        })

    @action(detail=True, methods=["post"], url_path="adjust-stock")
    def adjust_stock(self, request, pk=None):
        """Manually adjust stock quantity and record the movement."""
        product = self.get_object()
        qty = int(request.data.get("quantity", 0))
        movement_type = request.data.get("movement_type", "adjustment")
        reason = request.data.get("reason", "Manual adjustment")

        if movement_type in ("out", "adjustment") and abs(qty) > product.quantity:
            return Response(
                {"error": "Adjustment exceeds available stock."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        delta = qty if movement_type == "in" else -abs(qty)
        product.quantity = max(0, product.quantity + delta)
        product.save()

        StockMovement.objects.create(
            product=product,
            movement_type=movement_type,
            quantity=qty,
            reason=reason,
            performed_by=request.user,
        )
        return Response({"message": "Stock updated.", "new_quantity": product.quantity})


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.select_related("product", "performed_by").all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["product", "movement_type"]
    ordering_fields = ["created_at"]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.prefetch_related("items__product").all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status"]
    search_fields = ["order_number", "customer_name", "customer_email"]
    ordering_fields = ["created_at", "total_amount"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="update-status")
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")
        valid = [choice[0] for choice in Order.OrderStatus.choices]
        if new_status not in valid:
            return Response(
                {"error": f"Invalid status. Choose from: {valid}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = new_status
        order.save(update_fields=["status"])
        return Response({"message": f"Order status updated to '{new_status}'."})
