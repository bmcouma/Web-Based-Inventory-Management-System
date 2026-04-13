"""
inventory/serializers.py
========================
DRF serializers for all inventory models including Purchase Orders.
"""

import csv
from rest_framework import serializers
from .models import (
    Category, Supplier, Product, StockMovement,
    Order, OrderItem, PurchaseOrder, PurchaseOrderItem,
)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "description", "product_count", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_product_count(self, obj):
        return obj.products.count()


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "contact_email", "phone", "address", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "sku", "name", "category", "category_name", "supplier", "supplier_name",
            "price", "quantity", "status", "reorder_level", "barcode", "image", "updated_at",
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    profit_margin = serializers.FloatField(read_only=True)

    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "status"]

    def validate_sku(self, value):
        qs = Product.objects.filter(sku=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A product with this SKU already exists.")
        return value.upper()

    def validate_barcode(self, value):
        if not value:
            return value
        qs = Product.objects.filter(barcode=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A product with this barcode already exists.")
        return value


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    performed_by_name = serializers.CharField(source="performed_by.get_full_name", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id", "product", "product_name", "product_sku", "movement_type", "quantity",
            "reason", "reference", "performed_by", "performed_by_name", "created_at",
        ]
        read_only_fields = ["id", "performed_by", "created_at"]

    def validate_quantity(self, value):
        if value == 0:
            raise serializers.ValidationError("Quantity cannot be zero.")
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "quantity", "unit_price", "subtotal"]

    def validate(self, data):
        product = data.get("product")
        quantity = data.get("quantity", 0)
        if product and product.quantity < quantity:
            raise serializers.ValidationError(
                f"Insufficient stock. Available: {product.quantity}, Requested: {quantity}."
            )
        return data


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "customer_name", "customer_email",
            "status", "total_amount", "notes", "items", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "order_number", "total_amount", "created_at", "updated_at"]

    def create(self, validated_data):
        import uuid
        items_data = validated_data.pop("items")
        order = Order.objects.create(
            order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
            **validated_data,
        )
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        order.calculate_total()
        return order


# ─── Purchase Orders ──────────────────────────────────────────────────────────

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    line_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            "id", "product", "product_name", "product_sku",
            "quantity_ordered", "unit_cost", "line_total",
        ]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    total_cost = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id", "po_number", "supplier", "supplier_name", "status",
            "notes", "expected_delivery", "received_at",
            "total_cost", "items", "created_at",
        ]
        read_only_fields = ["id", "po_number", "received_at", "created_at"]

    def create(self, validated_data):
        import uuid
        items_data = validated_data.pop("items")
        po = PurchaseOrder.objects.create(
            po_number=f"PO-{uuid.uuid4().hex[:8].upper()}",
            **validated_data,
        )
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, **item_data)
        return po
