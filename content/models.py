from django.db import models
from django.conf import settings
from django.utils import timezone
from .validators import validate_upload_file


class Section(models.Model):
    """A section within a room for organizing content (e.g. Week 1, Chapter 3)."""
    room = models.ForeignKey('rooms.Room', on_delete=models.CASCADE, related_name='sections')
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.title} — {self.room.name}"


class Content(models.Model):
    """Course content uploaded by a teacher (lectures, resources, etc.)."""
    TYPE_CHOICES = [
        ('lecture', 'Lecture'),
        ('tp', 'Practical Work (TP)'),
        ('exam', 'Exam'),
        ('resource', 'Resource'),
        ('link', 'External Link'),
    ]

    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='contents', null=True, blank=True)
    room = models.ForeignKey('rooms.Room', on_delete=models.CASCADE, related_name='contents')
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    content_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='resource')
    file = models.FileField(upload_to='content/%Y/%m/', blank=True, null=True, validators=[validate_upload_file])
    link = models.URLField(blank=True)
    is_pinned = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_pinned', 'order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def file_extension(self):
        if self.file:
            try:
                return self.file.name.split('.')[-1].lower()
            except Exception:
                return None
        return None

    @property
    def file_size_display(self):
        if self.file:
            try:
                size = self.file.size
                if size < 1024:
                    return f"{size} B"
                elif size < 1024 * 1024:
                    return f"{size / 1024:.1f} KB"
                else:
                    return f"{size / (1024 * 1024):.1f} MB"
            except Exception:
                return None
        return None


class Assignment(models.Model):
    """An assignment created by a teacher for students to submit."""
    room = models.ForeignKey('rooms.Room', on_delete=models.CASCADE, related_name='assignments')
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name='assignments')
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='assignments/%Y/%m/', blank=True, null=True, validators=[validate_upload_file])
    deadline = models.DateTimeField(null=True, blank=True)
    max_grade = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    allow_late = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — {self.room.name}"

    @property
    def is_past_deadline(self):
        if self.deadline:
            return timezone.now() > self.deadline
        return False

    @property
    def submissions_count(self):
        return self.submissions.count()

    @property
    def graded_count(self):
        return self.submissions.filter(grade__isnull=False).count()

    @property
    def unsubmitted_count(self):
        total_students = self.room.memberships.filter(status='approved').count()
        return total_students - self.submissions_count


class Submission(models.Model):
    """A student's submission for an assignment."""
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
        ('returned', 'Returned'),
    ]

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submissions')
    comment = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')

    class Meta:
        unique_together = ['assignment', 'student']
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.username} — {self.assignment.title}"

    @property
    def is_late(self):
        if self.assignment.deadline:
            return self.submitted_at > self.assignment.deadline
        return False


class SubmissionFile(models.Model):
    """A file attached to a student's submission."""
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='submissions/%Y/%m/', validators=[validate_upload_file])
    filename = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.filename or self.file.name

    def save(self, *args, **kwargs):
        if self.file and not self.filename:
            self.filename = self.file.name
        super().save(*args, **kwargs)


class Grade(models.Model):
    """Grade and feedback for a submission."""
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name='grade')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='grades_given')
    graded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.submission.student.username}: {self.score}/{self.submission.assignment.max_grade}"
