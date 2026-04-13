"""
inventory/signals.py
====================
Post-save signal: sends low-stock email alerts to admin users
when a product's status changes to low_stock or out_of_stock.
Requires EMAIL_HOST configured in .env; defaults to console backend (dev-safe).
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User


@receiver(post_save, sender="inventory.Product")
def low_stock_alert(sender, instance, created, **kwargs):
    """Fire an email alert when stock drops to low or zero."""
    if created:
        return  # skip on initial creation

    if instance.status not in ("low_stock", "out_of_stock"):
        return

    admin_emails = list(
        User.objects.filter(is_superuser=True).values_list("email", flat=True)
    )
    # also include users with admin profile role
    try:
        from users.models import UserProfile
        role_emails = list(
            UserProfile.objects.filter(role="admin")
            .select_related("user")
            .values_list("user__email", flat=True)
        )
        admin_emails = list(set(admin_emails + role_emails))
    except Exception:
        pass

    admin_emails = [e for e in admin_emails if e]
    if not admin_emails:
        return

    status_label = "LOW STOCK" if instance.status == "low_stock" else "OUT OF STOCK"
    subject = f"[Inventory Alert] {status_label}: {instance.name}"
    message = (
        f"Product Alert — {status_label}\n\n"
        f"SKU       : {instance.sku}\n"
        f"Product   : {instance.name}\n"
        f"Current Qty: {instance.quantity}\n"
        f"Reorder Level: {instance.reorder_level}\n"
        f"Status    : {instance.status}\n\n"
        f"Please review and raise a Purchase Order if required.\n"
        f"— Inventory Management System | Teklini Technologies"
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@teklini.co.ke"),
            recipient_list=admin_emails,
            fail_silently=True,
        )
    except Exception:
        pass  # never crash the app due to email failure
