"""
inventory/management/commands/seed_data.py
==========================================
Populates the database with realistic demo data for development and MVP showcase.

Usage:
    python manage.py seed_data
    python manage.py seed_data --clear   # wipe existing data first
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from inventory.models import Category, Supplier, Product, Order, OrderItem
from users.models import UserProfile


class Command(BaseCommand):
    help = "Seed the database with demo data for MVP showcase."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing data...")
            Order.objects.all().delete()
            Product.objects.all().delete()
            Supplier.objects.all().delete()
            Category.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        self.stdout.write("Seeding demo data...")
        with transaction.atomic():
            self._create_users()
            categories = self._create_categories()
            suppliers = self._create_suppliers()
            products = self._create_products(categories, suppliers)
            self._create_orders(products)

        self.stdout.write(self.style.SUCCESS(
            "\nDemo data seeded successfully!\n"
            "  Admin login  : admin / admin1234\n"
            "  Manager login: manager / manager1234\n"
            "  Viewer login : viewer / viewer1234\n"
        ))

    def _create_users(self):
        users = [
            ("admin", "admin1234", "Bravin", "Ouma", "admin@teklini.co.ke", UserProfile.Role.ADMIN),
            ("manager", "manager1234", "Alice", "Wanjiku", "manager@teklini.co.ke", UserProfile.Role.MANAGER),
            ("viewer", "viewer1234", "James", "Otieno", "viewer@teklini.co.ke", UserProfile.Role.VIEWER),
        ]
        for username, password, first, last, email, role in users:
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username, password=password,
                    first_name=first, last_name=last, email=email,
                )
                UserProfile.objects.update_or_create(user=user, defaults={"role": role})
                self.stdout.write(f"  Created user: {username}")

    def _create_categories(self):
        cats = [
            ("Electronics", "Computers, phones, accessories"),
            ("Office Supplies", "Stationery, printing, desk equipment"),
            ("Furniture", "Chairs, desks, shelving"),
            ("Networking", "Cables, routers, switches"),
            ("Software", "Licences and subscriptions"),
        ]
        result = {}
        for name, desc in cats:
            cat, _ = Category.objects.get_or_create(name=name, defaults={"description": desc})
            result[name] = cat
        self.stdout.write(f"  Created {len(cats)} categories")
        return result

    def _create_suppliers(self):
        sups = [
            ("TechSource Kenya", "supply@techsource.co.ke", "+254700111222"),
            ("OfficeWorld Ltd", "orders@officeworld.co.ke", "+254700333444"),
            ("NetGear Distributors", "sales@netgear.co.ke", "+254700555666"),
        ]
        result = {}
        for name, email, phone in sups:
            sup, _ = Supplier.objects.get_or_create(
                contact_email=email, defaults={"name": name, "phone": phone}
            )
            result[name] = sup
        self.stdout.write(f"  Created {len(sups)} suppliers")
        return result

    def _create_products(self, cats, sups):
        admin = User.objects.get(username="admin")
        products_data = [
            ("ELC-001", "Wireless Keyboard", cats["Electronics"], sups["TechSource Kenya"], 2500, 1600, 80, 10),
            ("ELC-002", "USB-C Monitor 24\"", cats["Electronics"], sups["TechSource Kenya"], 28000, 19000, 15, 3),
            ("ELC-003", "Noise-Cancelling Headphones", cats["Electronics"], sups["TechSource Kenya"], 8500, 5500, 40, 8),
            ("ELC-004", "Laptop Stand — Aluminium", cats["Electronics"], sups["TechSource Kenya"], 3200, 2000, 60, 10),
            ("NET-001", "Gigabit Switch 8-Port", cats["Networking"], sups["NetGear Distributors"], 4500, 2900, 25, 5),
            ("NET-002", "CAT6 Cable 50m Roll", cats["Networking"], sups["NetGear Distributors"], 1800, 1100, 30, 10),
            ("OFF-001", "A4 Paper Ream 80gsm", cats["Office Supplies"], sups["OfficeWorld Ltd"], 650, 420, 200, 50),
            ("OFF-002", "Whiteboard Markers (12pk)", cats["Office Supplies"], sups["OfficeWorld Ltd"], 480, 280, 8, 20),
            ("FRN-001", "Ergonomic Office Chair", cats["Furniture"], sups["OfficeWorld Ltd"], 18500, 12000, 4, 2),
            ("FRN-002", "Standing Desk — Height Adjustable", cats["Furniture"], sups["OfficeWorld Ltd"], 32000, 22000, 2, 1),
        ]
        products = []
        for sku, name, cat, sup, price, cost, qty, reorder in products_data:
            p, _ = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    "name": name, "category": cat, "supplier": sup,
                    "price": price, "cost_price": cost,
                    "quantity": qty, "reorder_level": reorder,
                    "created_by": admin,
                },
            )
            products.append(p)
        self.stdout.write(f"  Created {len(products_data)} products")
        return products

    def _create_orders(self, products):
        import uuid
        admin = User.objects.get(username="admin")
        orders_data = [
            ("Jane Wanjiku", "jane@homeview.co.ke", "delivered", [(products[0], 2), (products[3], 1)]),
            ("Peter Kamau", "peter@company.co.ke", "shipped", [(products[2], 1), (products[4], 2)]),
            ("Amina Hassan", "amina@firm.co.ke", "pending", [(products[6], 10), (products[7], 5)]),
        ]
        for customer, email, status, items in orders_data:
            order = Order.objects.create(
                order_number=f"ORD-{uuid.uuid4().hex[:8].upper()}",
                customer_name=customer,
                customer_email=email,
                status=status,
                created_by=admin,
            )
            for product, qty in items:
                OrderItem.objects.create(
                    order=order, product=product,
                    quantity=qty, unit_price=product.price,
                )
            order.calculate_total()
        self.stdout.write(f"  Created {len(orders_data)} sample orders")
