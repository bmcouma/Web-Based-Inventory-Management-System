"""
inventory/models.py
===================
Core models: Category, Supplier, Product, StockMovement, Order, OrderItem,
PurchaseOrder, PurchaseOrderItem.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    class StockStatus(models.TextChoices):
        IN_STOCK = "in_stock", "In Stock"
        LOW_STOCK = "low_stock", "Low Stock"
        OUT_OF_STOCK = "out_of_stock", "Out of Stock"
        DISCONTINUED = "discontinued", "Discontinued"

    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    barcode = models.CharField(max_length=100, blank=True, null=True, unique=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products")
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    quantity = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=10)
    reorder_quantity = models.PositiveIntegerField(default=50)
    status = models.CharField(max_length=20, choices=StockStatus.choices, default=StockStatus.IN_STOCK)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="created_products")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.sku} — {self.name}"

    @property
    def profit_margin(self):
        if self.cost_price > 0:
            return round(((self.price - self.cost_price) / self.price) * 100, 2)
        return 0

    def save(self, *args, **kwargs):
        # Auto-update stock status (skip if manually set to discontinued)
        if self.status != self.StockStatus.DISCONTINUED:
            if self.quantity == 0:
                self.status = self.StockStatus.OUT_OF_STOCK
            elif self.quantity <= self.reorder_level:
                self.status = self.StockStatus.LOW_STOCK
            else:
                self.status = self.StockStatus.IN_STOCK
        super().save(*args, **kwargs)


class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        IN = "in", "Stock In"
        OUT = "out", "Stock Out"
        ADJUSTMENT = "adjustment", "Adjustment"
        RETURN = "return", "Return"
        PURCHASE = "purchase", "Purchase Order Receive"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="movements")
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    quantity = models.IntegerField()
    reason = models.CharField(max_length=300, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type.upper()} | {self.product.sku} | Qty: {self.quantity}"


class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        RETURNED = "returned", "Returned"

    order_number = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.PENDING)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="orders")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.order_number} — {self.customer_name}"

    def calculate_total(self):
        total = sum(item.subtotal for item in self.items.all())
        self.total_amount = total
        self.save(update_fields=["total_amount"])
        return total


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ("order", "product")

    @property
    def subtotal(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"


# ─── Purchase Orders ──────────────────────────────────────────────────────────


class PurchaseOrder(models.Model):
    class POStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent to Supplier"
        RECEIVED = "received", "Received"
        CANCELLED = "cancelled", "Cancelled"

    po_number = models.CharField(max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="purchase_orders")
    status = models.CharField(max_length=20, choices=POStatus.choices, default=POStatus.DRAFT)
    notes = models.TextField(blank=True)
    expected_delivery = models.DateField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="purchase_orders")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"PO-{self.po_number} | {self.supplier.name} | {self.status}"

    @property
    def total_cost(self):
        return sum(item.line_total for item in self.items.all())

    def receive(self, performed_by):
        """
        Mark PO as received, update product quantities, and log stock movements.
        """
        if self.status == self.POStatus.RECEIVED:
            return
        for item in self.items.select_related("product").all():
            item.product.quantity += item.quantity_ordered
            item.product.save()
            StockMovement.objects.create(
                product=item.product,
                movement_type=StockMovement.MovementType.PURCHASE,
                quantity=item.quantity_ordered,
                reason=f"Received via PO {self.po_number}",
                reference=self.po_number,
                performed_by=performed_by,
            )
        self.status = self.POStatus.RECEIVED
        self.received_at = timezone.now()
        self.save(update_fields=["status", "received_at"])


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="po_items")
    quantity_ordered = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])

    @property
    def line_total(self):
        return self.unit_cost * self.quantity_ordered

    def __str__(self):
        return f"{self.product.sku} x{self.quantity_ordered} @ {self.unit_cost}"
