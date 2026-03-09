import string
import random
from django.db import models
from django.conf import settings


def generate_invite_code():
    """Generate a unique 8-character invite code with collision retry."""
    from django.db import connection
    chars = string.ascii_uppercase + string.digits
    for _ in range(10):
        code = ''.join(random.choices(chars, k=8))
        # Only check DB if tables exist (avoids error during migrations)
        if 'rooms_room' in connection.introspection.table_names():
            if not Room.objects.filter(invite_code=code).exists():
                return code
        else:
            return code
    return ''.join(random.choices(chars, k=8))


class Room(models.Model):
    """A classroom room created by a teacher."""
    COLOR_CHOICES = [
        ('#3A4B54', 'Slate Blue'),     # Deep slate
        ('#5C504A', 'Warm Taupe'),     # Muted taupe
        ('#485E5A', 'Sage Green'),     # Muted sage
        ('#605068', 'Dusky Plum'),     # Sophisticated plum
        ('#4A5468', 'Steel Blue'),     # Steel blue
        ('#684A4A', 'Rust Red'),       # Muted rust
        ('#52584C', 'Olive Drab'),     # Deep olive
        ('#4A5F68', 'Ocean Slate'),    # Dark teal/slate
        ('#68554A', 'Burnt Siena'),    # Muted copper
        ('#2D2D2D', 'Charcoal'),       # Almost black, deep charcoal
    ]

    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rooms_teaching')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    subject = models.CharField(max_length=100, blank=True)
    invite_code = models.CharField(max_length=8, unique=True, default=generate_invite_code)
    color_theme = models.CharField(max_length=7, choices=COLOR_CHOICES, default='#3A4B54')
    cover_image = models.ImageField(upload_to='room_covers/', blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.teacher.username})"


class RoomMembership(models.Model):
    """Student membership in a room."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('removed', 'Removed'),
    ]

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='memberships')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='room_memberships')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='approved', db_index=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['room', 'student']
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.student.username} in {self.room.name}"
