"""reports/urls.py"""
from django.urls import path
from .views import (
    StockSummaryReport, SalesTrendReport,
    LowStockAlertReport, DemandForecastReport,
    ExportOrdersReport,
)

urlpatterns = [
    path("stock-summary/", StockSummaryReport.as_view(), name="stock-summary"),
    path("sales-trends/", SalesTrendReport.as_view(), name="sales-trends"),
    path("low-stock-alerts/", LowStockAlertReport.as_view(), name="low-stock-alerts"),
    path("demand-forecast/", DemandForecastReport.as_view(), name="demand-forecast"),
    path("export-orders/", ExportOrdersReport.as_view(), name="export-orders"),
]
