from django.contrib import admin
from .models import Room, RoomMembership


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'teacher', 'subject', 'invite_code', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'teacher__username', 'subject']


@admin.register(RoomMembership)
class RoomMembershipAdmin(admin.ModelAdmin):
    list_display = ['room', 'student', 'status', 'joined_at']
    list_filter = ['status']
