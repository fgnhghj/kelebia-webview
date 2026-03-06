from django.db import models
from django.conf import settings


class Notification(models.Model):
    """In-app notification for a user."""
    TYPE_CHOICES = [
        ('content', 'New Content'),
        ('assignment', 'New Assignment'),
        ('submission', 'New Submission'),
        ('grade', 'Grade Posted'),
        ('announcement', 'New Announcement'),
        ('comment', 'New Comment'),
        ('deadline', 'Deadline Reminder'),
        ('room', 'Room Update'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='room')
    title = models.CharField(max_length=300)
    message = models.TextField()
    link = models.CharField(max_length=500, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} → {self.user.username}"
