from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AppVersionConfig


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Classroom', {'fields': ('role', 'avatar', 'email_verified', 'is_2fa_enabled', 'totp_secret')}),
    )


@admin.register(AppVersionConfig)
class AppVersionConfigAdmin(admin.ModelAdmin):
    list_display = ['min_version', 'is_locked', 'update_url', 'updated_at']
    fieldsets = (
        (None, {
            'fields': ('is_locked', 'min_version', 'lock_message', 'update_url'),
            'description': 'Toggle "Is locked" to force all users on older app versions to update.',
        }),
    )

    def has_add_permission(self, request):
        # Singleton — only one record allowed
        return not AppVersionConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
