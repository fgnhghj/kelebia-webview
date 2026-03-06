from django.contrib import admin
from .models import Section, Content, Assignment, Submission, Grade, SubmissionFile


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'room', 'order']


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ['title', 'room', 'content_type', 'is_pinned', 'created_at']
    list_filter = ['content_type', 'is_pinned']


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'room', 'deadline', 'max_grade', 'created_at']
    list_filter = ['deadline']


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['student', 'assignment', 'status', 'submitted_at']
    list_filter = ['status']


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['submission', 'score', 'graded_by', 'graded_at']


@admin.register(SubmissionFile)
class SubmissionFileAdmin(admin.ModelAdmin):
    list_display = ['filename', 'submission', 'file']
    search_fields = ['filename']
