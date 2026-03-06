from django.contrib import admin
from .models import Announcement, Comment


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'room', 'author', 'is_pinned', 'created_at']
    list_filter = ['is_pinned']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['announcement', 'author', 'created_at']
