"""
users/signals.py
================
Auto-create and auto-save UserProfile whenever a User instance is
created or saved. This prevents the common IntegrityError caused by
accessing user.profile before it exists.
"""

from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    profile = getattr(instance, "profile", None)
    if profile:
        profile.save()
