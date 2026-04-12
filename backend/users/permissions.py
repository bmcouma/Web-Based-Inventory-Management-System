"""
users/permissions.py
====================
Custom DRF permission classes enforcing role-based access control.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    """
    Allows full access to admin users.
    All other authenticated users get read-only access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        profile = getattr(request.user, "profile", None)
        return profile and profile.is_admin


class IsOperationalUser(BasePermission):
    """
    Allows write access to admin and manager roles.
    Operators and viewers get read-only access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        profile = getattr(request.user, "profile", None)
        return profile and profile.is_manager_or_above


class IsSameUserOrAdmin(BasePermission):
    """
    Allows users to modify only their own profile,
    unless they are an admin.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        profile = getattr(request.user, "profile", None)
        if profile and profile.is_admin:
            return True
        return obj.user == request.user
