"""
core/urls.py
============
Root URL configuration for the Inventory Management System API.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/inventory/", include("inventory.urls")),
    path("api/v1/users/", include("users.urls")),
    path("api/v1/reports/", include("reports.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
