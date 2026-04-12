"""
reports/views.py
================
Reporting endpoints: stock summary, sales trends, low-stock alerts,
and AI-assisted demand forecasting hooks.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, Q, Avg
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from datetime import timedelta

from inventory.models import Product, Order, OrderItem, StockMovement


class StockSummaryReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = Product.objects.count()
        in_stock = Product.objects.filter(status="in_stock").count()
        low_stock = Product.objects.filter(status="low_stock").count()
        out_of_stock = Product.objects.filter(status="out_of_stock").count()
        total_value = Product.objects.aggregate(
            val=Sum(F("quantity") * F("cost_price"))
        )["val"] or 0

        return Response({
            "total_products": total,
            "in_stock": in_stock,
            "low_stock": low_stock,
            "out_of_stock": out_of_stock,
            "total_inventory_value_kes": float(total_value),
            "generated_at": timezone.now().isoformat(),
        })


class SalesTrendReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get("period", "monthly")
        days = int(request.query_params.get("days", 90))
        since = timezone.now() - timedelta(days=days)

        qs = Order.objects.filter(
            created_at__gte=since,
            status__in=["delivered", "shipped"],
        )

        if period == "weekly":
            trend = (
                qs.annotate(period=TruncWeek("created_at"))
                .values("period")
                .annotate(order_count=Count("id"), revenue=Sum("total_amount"))
                .order_by("period")
            )
        else:
            trend = (
                qs.annotate(period=TruncMonth("created_at"))
                .values("period")
                .annotate(order_count=Count("id"), revenue=Sum("total_amount"))
                .order_by("period")
            )

        return Response({
            "period": period,
            "days_range": days,
            "trend": list(trend),
        })


class LowStockAlertReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(
            Q(status="low_stock") | Q(status="out_of_stock")
        ).select_related("supplier").values(
            "id", "sku", "name", "quantity", "reorder_level",
            "reorder_quantity", "status", "supplier__name",
        )
        return Response({
            "alert_count": products.count(),
            "products": list(products),
        })


class DemandForecastReport(APIView):
    """
    AI-Assisted Demand Forecasting — Rule-Based Engine
    ---------------------------------------------------
    Provides restocking recommendations based on historical sales velocity.
    Hook is structured for future replacement with an ML/AI model.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        since = timezone.now() - timedelta(days=days)

        # Aggregate units sold per product in the window
        sold_data = (
            OrderItem.objects.filter(
                order__created_at__gte=since,
                order__status__in=["delivered", "shipped"],
            )
            .values("product__id", "product__name", "product__sku", "product__quantity")
            .annotate(total_sold=Sum("quantity"))
            .order_by("-total_sold")
        )

        forecasts = []
        for item in sold_data:
            daily_velocity = item["total_sold"] / days
            days_of_stock = (
                item["product__quantity"] / daily_velocity
                if daily_velocity > 0
                else float("inf")
            )
            forecasts.append({
                "product_id": item["product__id"],
                "sku": item["product__sku"],
                "name": item["product__name"],
                "current_stock": item["product__quantity"],
                "units_sold_in_period": item["total_sold"],
                "daily_sales_velocity": round(daily_velocity, 2),
                "estimated_days_of_stock": round(days_of_stock, 1) if days_of_stock != float("inf") else "N/A",
                "restock_recommended": days_of_stock < 14,
                # AI_HOOK: Replace this block with ML model inference
                # forecast_engine.predict(product_id, horizon_days=30)
            })

        return Response({
            "analysis_window_days": days,
            "forecasts": forecasts,
            "note": "Rule-based engine. AI model integration hook is in place.",
        })
