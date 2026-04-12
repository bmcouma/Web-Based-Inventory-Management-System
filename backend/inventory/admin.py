"""inventory/admin.py"""
from django.contrib import admin
from .models import Category, Supplier, Product, StockMovement, Order, OrderItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at"]
    search_fields = ["name"]


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ["name", "contact_email", "phone", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "contact_email"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["sku", "name", "category", "price", "quantity", "status"]
    list_filter = ["status", "category", "supplier"]
    search_fields = ["sku", "name"]
    readonly_fields = ["created_at", "updated_at", "profit_margin"]


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ["product", "movement_type", "quantity", "performed_by", "created_at"]
    list_filter = ["movement_type"]
    readonly_fields = ["created_at"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["subtotal"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "customer_name", "status", "total_amount", "created_at"]
    list_filter = ["status"]
    search_fields = ["order_number", "customer_name", "customer_email"]
    inlines = [OrderItemInline]
    readonly_fields = ["order_number", "total_amount", "created_at", "updated_at"]
