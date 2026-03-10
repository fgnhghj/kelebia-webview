"""
Management command: send_deadline_reminders

Finds assignments with deadlines in the next 24 hours and creates
in-app 'deadline' notifications for enrolled students who haven't submitted yet.

Usage:
  python manage.py send_deadline_reminders

Recommended: run via cron every hour.
  0 * * * * cd /path/to/project && python manage.py send_deadline_reminders
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from content.models import Assignment
from rooms.models import RoomMembership
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Send deadline reminder notifications for assignments due within 24 hours'

    def handle(self, *args, **options):
        now = timezone.now()
        window_end = now + timedelta(hours=24)

        # Find assignments with deadlines in the next 24 hours
        upcoming = Assignment.objects.filter(
            deadline__gt=now,
            deadline__lte=window_end,
            room__is_active=True,
        ).select_related('room')

        total_created = 0

        for assignment in upcoming:
            # Get approved students who haven't submitted
            members = RoomMembership.objects.filter(
                room=assignment.room, status='approved'
            ).select_related('student')

            submitted_ids = set(
                assignment.submissions.values_list('student_id', flat=True)
            )

            notifications = []
            for m in members:
                if m.student_id in submitted_ids:
                    continue
                # Don't duplicate: check if a deadline notification already exists
                # for this assignment in the last 24h
                exists = Notification.objects.filter(
                    user=m.student,
                    notification_type='deadline',
                    link=f'/rooms/{assignment.room.pk}/',
                    message__contains=assignment.title,
                    created_at__gte=now - timedelta(hours=24),
                ).exists()
                if exists:
                    continue

                hours_left = int((assignment.deadline - now).total_seconds() / 3600)
                notifications.append(Notification(
                    user=m.student,
                    notification_type='deadline',
                    title='Rappel de date limite',
                    message=f'"{assignment.title}" est dû dans {hours_left}h — {assignment.room.name}',
                    link=f'/rooms/{assignment.room.pk}/',
                ))

            if notifications:
                Notification.objects.bulk_create(notifications)
                total_created += len(notifications)

        self.stdout.write(self.style.SUCCESS(
            f'Created {total_created} deadline reminder(s) for {upcoming.count()} assignment(s).'
        ))
