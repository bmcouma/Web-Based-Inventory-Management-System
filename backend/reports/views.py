"""
reports/views.py
Inventory analytics: stock summaries, sales trends, and demand forecasting.
"""

import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from datetime import timedelta

from inventory.models import Product, Order, OrderItem


class StockSummaryReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Aggregate current warehouse stock levels."""
        total = Product.objects.count()
        in_stock = Product.objects.filter(status="in_stock").count()
        low_stock = Product.objects.filter(status="low_stock").count()
        out_of_stock = Product.objects.filter(status="out_of_stock").count()
        discontinued = Product.objects.filter(status="discontinued").count()
        total_value = Product.objects.aggregate(
            val=Sum(F("quantity") * F("cost_price"))
        )["val"] or 0

        return Response({
            "total_products": total,
            "in_stock": in_stock,
            "low_stock": low_stock,
            "out_of_stock": out_of_stock,
            "discontinued": discontinued,
            "total_inventory_value_kes": float(total_value),
            "generated_at": timezone.now().isoformat(),
        })


class SalesTrendReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Analyze sales volume and revenue over time."""
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
        """List products requiring immediate replenishment."""
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
    Intelligent demand forecasting engine.
    Structured for future ML model integration.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Calculate forecasted demand based on sales velocity."""
        days = int(request.query_params.get("days", 30))
        since = timezone.now() - timedelta(days=days)

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
                "avg_daily_sales": round(daily_velocity, 2),
                "remaining_stock_days": round(days_of_stock, 1) if days_of_stock != float("inf") else "N/A",
                "recommendation": "REORDER_NOW" if days_of_stock < 14 else "STABLE",
                # MODEL_HOOK: Integrate ML inference here
            })

        return Response({
            "analysis_window_days": days,
            "forecasts": forecasts,
            "engine": "Standard Statistical (ML Hook Ready)",
        })


class ExportOrdersReport(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Export full order history to CSV."""
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="orders_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "Order #", "Customer", "Email", "Status",
            "Total (KES)", "Items Count", "Created At",
        ])
        for order in Order.objects.prefetch_related("items").all():
            writer.writerow([
                order.order_number,
                order.customer_name,
                order.customer_email,
                order.status,
                order.total_amount,
                order.items.count(),
                order.created_at.strftime("%Y-%m-%d %H:%M"),
            ])
        return response
