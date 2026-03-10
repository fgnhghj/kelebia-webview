import csv
import logging
import threading

logger = logging.getLogger(__name__)
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action, api_view, permission_classes as perm_classes
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from django.db.models import Max
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
from .models import Section, Content, Assignment, Submission, Grade, SubmissionFile
from .serializers import (SectionSerializer, ContentSerializer,
                          AssignmentSerializer, SubmissionSerializer, GradeSerializer)
from rooms.models import Room, RoomMembership
from rooms.permissions import is_room_member_or_teacher, IsRoomTeacherOrReadOnly
from notifications.models import Notification
from accounts.emails import notify_room_members, notify_teacher


class SectionViewSet(viewsets.ModelViewSet):
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated, IsRoomTeacherOrReadOnly]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            return Section.objects.filter(room_id=room_id).select_related('room').prefetch_related('contents')
        # For detail views (update/delete), return sections the user can access
        user = self.request.user
        if getattr(user, 'role', '') == 'teacher':
            return Section.objects.filter(room__teacher=user).select_related('room').prefetch_related('contents')
        return Section.objects.filter(
            room__memberships__student=user,
            room__memberships__status='approved'
        ).select_related('room').prefetch_related('contents')

    def perform_create(self, serializer):
        room = get_object_or_404(Room, pk=self.request.data.get('room'))
        # M4: Use Max aggregate to avoid race condition with concurrent section creation
        max_order = room.sections.aggregate(Max('order'))['order__max']
        next_order = (max_order or 0) + 1
        serializer.save(room=room, order=next_order)


class ContentViewSet(viewsets.ModelViewSet):
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated, IsRoomTeacherOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            return Content.objects.filter(room_id=room_id).select_related('room', 'section')
        # For detail views (update/delete), return content the user can access
        user = self.request.user
        if getattr(user, 'role', '') == 'teacher':
            return Content.objects.filter(room__teacher=user).select_related('room', 'section')
        return Content.objects.filter(
            room__memberships__student=user,
            room__memberships__status='approved'
        ).select_related('room', 'section')

    def perform_create(self, serializer):
        content = serializer.save()
        room = content.room

        # Collect members once — used for both TP assignment notifs and content notifs
        members = list(RoomMembership.objects.filter(room=room, status='approved').select_related('student'))

        # Auto-create assignment when TP content is uploaded
        if content.content_type == 'tp':
            deadline = timezone.now() + timedelta(weeks=1)
            auto_assignment = Assignment.objects.create(
                room=room,
                section=content.section,
                title=f"TP: {content.title}",
                description=f"Devoir auto-créé pour le TP \"{content.title}\"",
                deadline=deadline,
                max_grade=20,
                allow_late=False,
            )
            # Notify students about the auto-created assignment
            assign_notifications = [
                Notification(
                    user=m.student,
                    notification_type='assignment',
                    title='Nouveau devoir',
                    message=f'Nouveau devoir "{auto_assignment.title}" dans {room.name}',
                    link=f'/rooms/{room.pk}/',
                )
                for m in members
            ]
            if assign_notifications:
                Notification.objects.bulk_create(assign_notifications)

        # Notify students about the new content
        content_notifications = [
            Notification(
                user=m.student,
                notification_type='content',
                title='Nouveau contenu',
                message=f'Nouveau contenu "{content.title}" dans {room.name}',
                link=f'/rooms/{room.pk}/',
            )
            for m in members
        ]
        if content_notifications:
            Notification.objects.bulk_create(content_notifications)
        try:
            threading.Thread(
                target=notify_room_members,
                args=(room, f'Nouveau contenu dans {room.name}',
                      f'Le professeur a publié "{content.title}" dans {room.name}.'),
                daemon=True,
            ).start()
        except Exception as e:
            logger.warning(f'Failed to start email notification thread: {e}')


class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsRoomTeacherOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            return Assignment.objects.filter(room_id=room_id).select_related('room', 'section')
        # For detail views (update/delete/export_grades), return assignments the user can access
        user = self.request.user
        if getattr(user, 'role', '') == 'teacher':
            return Assignment.objects.filter(room__teacher=user).select_related('room', 'section')
        return Assignment.objects.filter(
            room__memberships__student=user,
            room__memberships__status='approved'
        ).select_related('room', 'section')

    def perform_create(self, serializer):
        assignment = serializer.save()
        room = assignment.room
        members = RoomMembership.objects.filter(room=room, status='approved').select_related('student')
        notifications = [
            Notification(
                user=m.student,
                notification_type='assignment',
                title='Nouveau devoir',
                message=f'Nouveau devoir "{assignment.title}" dans {room.name}',
                link=f'/rooms/{room.pk}/',
            )
            for m in members
        ]
        if notifications:
            Notification.objects.bulk_create(notifications)
        try:
            threading.Thread(
                target=notify_room_members,
                args=(room, f'Nouveau devoir dans {room.name}',
                      f'Le professeur a publié le devoir "{assignment.title}" dans {room.name}.'),
                daemon=True,
            ).start()
        except Exception as e:
            logger.warning(f'Failed to start email notification thread: {e}')

    @action(detail=True, methods=['get'])
    def export_grades(self, request, pk=None):
        """Export grades for an assignment as CSV (teacher only)."""
        assignment = self.get_object()
        if assignment.room.teacher != request.user:
            return Response(
                {'detail': 'Only the room teacher can export grades.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="grades_{assignment.title}.csv"'
        writer = csv.writer(response)
        writer.writerow(['Student', 'Email', 'Submitted At', 'Late', 'Score', 'Max Grade', 'Feedback', 'Status'])
        submissions = assignment.submissions.select_related('student', 'grade').all()
        for sub in submissions:
            grade = getattr(sub, 'grade', None)
            writer.writerow([
                sub.student.get_full_name() or sub.student.username,
                sub.student.email,
                sub.submitted_at.strftime('%Y-%m-%d %H:%M') if sub.submitted_at else '',
                'Yes' if sub.is_late else 'No',
                grade.score if grade else '',
                assignment.max_grade,
                grade.feedback if grade else '',
                sub.status,
            ])
        return response


class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            # C2: Verify user is a member/teacher of the assignment's room
            try:
                assignment = Assignment.objects.select_related('room').get(pk=assignment_id)
            except Assignment.DoesNotExist:
                return Submission.objects.none()
            if not is_room_member_or_teacher(user, assignment.room):
                return Submission.objects.none()
            qs = Submission.objects.filter(assignment_id=assignment_id)
            if user.is_student:
                qs = qs.filter(student=user)
            return qs.select_related('student', 'grade')
        # For detail actions — allow access to own submissions or teacher's room submissions
        if user.is_student:
            return Submission.objects.filter(student=user).select_related('student', 'grade')
        # Teachers: only submissions for rooms they own
        return Submission.objects.filter(
            assignment__room__teacher=user
        ).select_related('student', 'grade')

    def perform_create(self, serializer):
        assignment = get_object_or_404(Assignment, pk=self.request.data.get('assignment'))

        # C4: Verify student is a member of this assignment's room
        if not is_room_member_or_teacher(self.request.user, assignment.room):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not a member of this room.")

        # M3: Enforce allow_late — reject submissions after deadline if not allowed
        if assignment.is_past_deadline and not assignment.allow_late:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("La date limite est passée et les soumissions tardives ne sont pas autorisées.")

        # C5: Handle duplicate submission gracefully
        try:
            submission = serializer.save(student=self.request.user, assignment=assignment)
        except IntegrityError:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "You have already submitted this assignment."})

        # C4: Store original filename from the upload, not the storage path
        files = self.request.FILES.getlist('files')
        for f in files:
            SubmissionFile.objects.create(submission=submission, file=f, filename=f.name)

        Notification.objects.create(
            user=assignment.room.teacher,
            notification_type='submission',
            title='Nouvelle soumission',
            message=f'{self.request.user.get_full_name()} a soumis "{assignment.title}"',
            link=f'/rooms/{assignment.room.pk}/',
        )
        try:
            threading.Thread(
                target=notify_teacher,
                args=(assignment.room, 'Nouvelle soumission',
                      f'{self.request.user.get_full_name()} a soumis le devoir "{assignment.title}".'),
                daemon=True,
            ).start()
        except Exception as e:
            logger.warning(f'Failed to start email notification thread: {e}')

    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """Grade a submission (teacher only)."""
        submission = self.get_object()

        # C3: Verify the requesting user is the teacher of this room
        if submission.assignment.room.teacher != request.user:
            return Response(
                {'detail': 'Only the room teacher can grade submissions.'},
                status=status.HTTP_403_FORBIDDEN
            )

        score = request.data.get('score')
        feedback = request.data.get('feedback', '')
        grade, _ = Grade.objects.update_or_create(
            submission=submission,
            defaults={'score': score, 'feedback': feedback, 'graded_by': request.user}
        )
        submission.status = 'graded'
        submission.save(update_fields=['status'])
        Notification.objects.create(
            user=submission.student,
            notification_type='grade',
            title='Note publiée',
            message=f'Vous avez reçu {score}/{submission.assignment.max_grade} pour "{submission.assignment.title}"',
            link=f'/rooms/{submission.assignment.room.pk}/',
        )
        return Response(GradeSerializer(grade).data)


@api_view(['GET'])
@perm_classes([IsAuthenticated])
def student_grades_overview(request):
    """Return all graded submissions for the current student, grouped by room.
    Teachers receive an empty list (the Grades page is student-oriented).
    """
    user = request.user
    # H6: Return empty list for teachers instead of 403 so the Grades page doesn't crash
    if not user.is_student:
        return Response([])

    submissions = (
        Submission.objects
        .filter(student=user, grade__isnull=False)
        .select_related('assignment__room', 'grade')
        .order_by('assignment__room__name', '-grade__graded_at')
    )

    rooms_map = {}
    for sub in submissions:
        room = sub.assignment.room
        if room.id not in rooms_map:
            rooms_map[room.id] = {
                'room_id': room.id,
                'room_name': room.name,
                'room_color': room.color_theme,
                'grades': [],
            }
        rooms_map[room.id]['grades'].append({
            'assignment_id': sub.assignment.id,
            'assignment_title': sub.assignment.title,
            'score': float(sub.grade.score),
            'max_grade': float(sub.assignment.max_grade),
            'feedback': sub.grade.feedback or '',
            'graded_at': sub.grade.graded_at.isoformat() if sub.grade.graded_at else None,
        })

    # Compute averages
    result = []
    for room_data in rooms_map.values():
        grades = room_data['grades']
        total_score = sum(g['score'] for g in grades)
        total_max = sum(g['max_grade'] for g in grades)
        room_data['average'] = round((total_score / total_max) * 100, 1) if total_max > 0 else 0
        room_data['total_score'] = total_score
        room_data['total_max'] = total_max
        result.append(room_data)

    return Response(result)
