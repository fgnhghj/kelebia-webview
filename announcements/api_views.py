from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Announcement, Comment
from .serializers import AnnouncementSerializer, AnnouncementListSerializer, CommentSerializer
from rooms.models import Room, RoomMembership
from rooms.permissions import is_room_member_or_teacher, IsRoomTeacherOrReadOnly
from notifications.models import Notification


class AnnouncementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsRoomTeacherOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return AnnouncementListSerializer
        return AnnouncementSerializer

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            return Announcement.objects.filter(room_id=room_id).select_related('author')
        # For detail views (update/delete/pin), return announcements the user can access
        user = self.request.user
        if getattr(user, 'role', '') == 'teacher':
            return Announcement.objects.filter(room__teacher=user).select_related('author')
        return Announcement.objects.filter(
            room__memberships__student=user,
            room__memberships__status='approved'
        ).select_related('author')

    def perform_create(self, serializer):
        announcement = serializer.save(author=self.request.user)
        room = announcement.room
        members = RoomMembership.objects.filter(room=room, status='approved')
        notifications = [
            Notification(
                user=m.student,
                notification_type='announcement',
                title='Nouvelle annonce',
                message=f'"{announcement.title}" dans {room.name}',
                link=f'/rooms/{room.pk}/',
            )
            for m in members
        ]
        Notification.objects.bulk_create(notifications)


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']  # no PUT/PATCH

    def destroy(self, request, *args, **kwargs):
        """Only the comment author can delete it."""
        comment = self.get_object()
        if comment.author != request.user:
            return Response({'error': 'You can only delete your own comments.'}, status=403)
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        announcement_id = self.request.query_params.get('announcement')
        if announcement_id:
            # Verify the user is a member of the announcement's room
            try:
                announcement = Announcement.objects.select_related('room').get(pk=announcement_id)
            except Announcement.DoesNotExist:
                return Comment.objects.none()
            if not is_room_member_or_teacher(self.request.user, announcement.room):
                return Comment.objects.none()
            return Comment.objects.filter(announcement_id=announcement_id).select_related('author')
        return Comment.objects.none()

    def perform_create(self, serializer):
        # C7: Use get_object_or_404 instead of bare .get() to avoid 500 crash
        announcement = get_object_or_404(Announcement, pk=self.request.data.get('announcement'))

        # Verify user is a member of the room
        if not is_room_member_or_teacher(self.request.user, announcement.room):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You are not a member of this room.")

        comment = serializer.save(author=self.request.user, announcement=announcement)
        if announcement.author != self.request.user:
            Notification.objects.create(
                user=announcement.author,
                notification_type='comment',
                title='Nouveau commentaire',
                message=f'{self.request.user.get_full_name() or self.request.user.username} a commenté sur "{announcement.title}"',
                link=f'/rooms/{announcement.room.pk}/',
            )
