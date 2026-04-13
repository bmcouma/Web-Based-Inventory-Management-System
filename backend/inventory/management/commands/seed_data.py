"""
inventory/management/commands/seed_data.py
==========================================
Populates the database with realistic, high-quality demo data for a professional MVP showcase.
Upgraded to include 10 items per category as requested for a rich "out-of-the-box" experience.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from inventory.models import Category, Supplier, Product, Order, OrderItem, PurchaseOrder, PurchaseOrderItem
from users.models import UserProfile
import uuid
import random

class Command(BaseCommand):
    help = "Seed the database with 10+ items per entity for a premium MVP showcase."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Clear existing data before seeding.")

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Cleaning up existing data...")
            PurchaseOrder.objects.all().delete()
            Order.objects.all().delete()
            Product.objects.all().delete()
            Supplier.objects.all().delete()
            Category.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        self.stdout.write("Starting creative seeding process...")
        with transaction.atomic():
            self._create_users()
            categories = self._create_categories()
            suppliers = self._create_suppliers()
            products = self._create_products(categories, suppliers)
            self._create_orders(products)
            self._create_purchase_orders(products, suppliers)

        self.stdout.write(self.style.SUCCESS("\nDone! Demo data seeded successfully with 10 items per module!"))

    def _create_users(self):
        users = [
            ("admin", "admin1234", "Bravin", "Ouma", "admin@teklini.co.ke", UserProfile.Role.ADMIN),
            ("manager", "manager1234", "Alice", "Wanjiku", "manager@teklini.co.ke", UserProfile.Role.MANAGER),
            ("viewer", "viewer1234", "James", "Otieno", "viewer@teklini.co.ke", UserProfile.Role.VIEWER),
        ]
        for username, password, first, last, email, role in users:
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(username=username, password=password, first_name=first, last_name=last, email=email)
                UserProfile.objects.update_or_create(user=user, defaults={"role": role})

    def _create_categories(self):
        cats_data = [
            ("Electronics", "Laptops, monitors, and modern computing hardware."),
            ("Office Supplies", "Daily essentials: paper, ink, and stationery."),
            ("Furniture", "Ergonomic chairs, desks, and storage solutions."),
            ("Networking", "Routers, switches, and infrastructure cabling."),
            ("Software", "SaaS subscriptions and enterprise licenses."),
            ("Wearables", "Smartwatches, trackers, and health tech."),
            ("Peripherals", "Keyboard, mice, and desk accessories."),
            ("Infrastructure", "Server racks, cooling, and power management."),
            ("Security", "CCTV systems, smart locks, and sensors."),
            ("Media", "Cameras, microphones, and studio gear.")
        ]
        cats = [Category.objects.get_or_create(name=n, defaults={"description": d})[0] for n, d in cats_data]
        self.stdout.write(f"  + Created {len(cats)} categories")
        return cats

    def _create_suppliers(self):
        sups_data = [
            ("TechSource Global", "logistics@techsource.com", "+254700000001"),
            ("OfficeWorld Kenya", "sales@officeworld.co.ke", "+254700000002"),
            ("NetGear Distributors", "net@distro.co.ke", "+254700000003"),
            ("CloudScale Systems", "partners@cloudscale.com", "+254700000004"),
            ("SecureSafe Solutions", "orders@securesafe.co.ke", "+254700000005"),
            ("WoodCraft Interiors", "info@woodcraft.co.ke", "+254700000006"),
            ("Universal Media", "hello@universalmedia.com", "+254700000007"),
            ("PeripheralPro Ltd", "pro@peripheral.co.ke", "+254700000008"),
            ("GlobalConnect Solutions", "sales@gconnect.com", "+254700000009"),
            ("Prime Fulfillment", "ops@primefulfill.co.ke", "+254700000010")
        ]
        sups = [Supplier.objects.get_or_create(name=n, defaults={"contact_email": e, "phone": p})[0] for n, e, p in sups_data]
        self.stdout.write(f"  + Created {len(sups)} suppliers")
        return sups

    def _create_products(self, cats, sups):
        admin = User.objects.get(username="admin")
        products_data = [
            ("ELC-001", "MacBook Pro 14\"", cats[0], sups[0], 280000, 240000, 12, 5),
            ("OFF-001", "A4 Paper Ream (Box of 5)", cats[1], sups[1], 3500, 2800, 100, 20),
            ("FRN-001", "Herman Miller Aeron", cats[2], sups[5], 145000, 110000, 8, 2),
            ("NET-001", "Cisco 24-Port Switch", cats[3], sups[2], 45000, 32000, 15, 4),
            ("SFT-001", "Adobe Creative Cloud (Annual)", cats[4], sups[3], 72000, 68000, 50, 5),
            ("WRE-001", "Apple Watch Ultra 2", cats[5], sups[0], 115000, 95000, 20, 3),
            ("PER-001", "Logitech MX Master 3S", cats[6], sups[7], 14500, 9500, 45, 10),
            ("INF-001", "APC Smart-UPS 1500VA", cats[7], sups[8], 65000, 48000, 10, 2),
            ("SEC-001", "Ubiquiti G5 Bullet Cam", cats[8], sups[4], 28000, 19500, 30, 8),
            ("MED-001", "Sony A7 IV Body", cats[9], sups[6], 320000, 275000, 5, 2)
        ]
        products = []
        for sku, name, cat, sup, price, cost, qty, reorder in products_data:
            p, _ = Product.objects.get_or_create(sku=sku, defaults={
                "name": name, "category": cat, "supplier": sup,
                "price": price, "cost_price": cost, "quantity": qty,
                "reorder_level": reorder, "created_by": admin
            })
            products.append(p)
        self.stdout.write(f"  + Created {len(products)} products")
        return products

    def _create_orders(self, products):
        admin = User.objects.get(username="admin")
        customers = [
            ("John Doe", "john@example.com"), ("Jane Smith", "jane@company.ke"),
            ("Sam Kiprotich", "sam@tech.co.ke"), ("Alice Njoroge", "alice@biz.com"),
            ("Peter Otieno", "p.otieno@logistics.ke"), ("Amina Juma", "amina@creative.ke"),
            ("Chris Evans", "c.evans@marvel.com"), ("Stark Industries", "tony@stark.com"),
            ("Bruce Wayne", "bruce@wayne.corp"), ("Dianna Prince", "dianna@amazon.com")
        ]
        for i, (name, email) in enumerate(customers):
            order = Order.objects.create(
                order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
                customer_name=name, customer_email=email,
                status=random.choice(["pending", "confirmed", "processing", "shipped", "delivered"]),
                created_by=admin
            )
            item_count = random.randint(1, 3)
            selected_products = random.sample(products, item_count)
            for prod in selected_products:
                qty = random.randint(1, 2)
                OrderItem.objects.create(order=order, product=prod, quantity=qty, unit_price=prod.price)
            order.calculate_total()
        self.stdout.write(f"  + Created {len(customers)} orders")

    def _create_purchase_orders(self, products, sups):
        admin = User.objects.get(username="admin")
        for i in range(10):
            sup = random.choice(sups)
            po = PurchaseOrder.objects.create(
                po_number=f"PO-{uuid.uuid4().hex[:8].upper()}",
                supplier=sup, status=random.choice(["draft", "sent", "received"]),
                created_by=admin, notes=f"Standard replenish for {sup.name}"
            )
            # Select 1-3 products from this supplier or random for demo
            sup_products = [p for p in products if p.supplier == sup]
            selected = sup_products if sup_products else random.sample(products, 2)
            for prod in selected:
                qty = random.randint(10, 50)
                PurchaseOrderItem.objects.create(purchase_order=po, product=prod, quantity_ordered=qty, unit_cost=prod.cost_price)
        self.stdout.write(f"  + Created 10 purchase orders")
