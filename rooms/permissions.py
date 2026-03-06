"""Shared room permissions used by content and announcements apps."""
from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Room, RoomMembership


def is_room_member_or_teacher(user, room):
    """Check if the user is the room's teacher or an approved member."""
    if room.teacher == user:
        return True
    return RoomMembership.objects.filter(
        room=room, student=user, status='approved'
    ).exists()


class IsRoomTeacherOrReadOnly(BasePermission):
    """Only the room's teacher can create/update/delete. Members can read."""

    def has_permission(self, request, view):
        room_id = request.data.get('room') or request.query_params.get('room')
        if room_id:
            try:
                room = Room.objects.get(pk=room_id)
            except Room.DoesNotExist:
                return False
            if not is_room_member_or_teacher(request.user, room):
                return False
            if request.method not in SAFE_METHODS:
                return room.teacher == request.user
        return True

    def has_object_permission(self, request, view, obj):
        room = getattr(obj, 'room', None)
        if not room:
            return False
        if not is_room_member_or_teacher(request.user, room):
            return False
        if request.method in SAFE_METHODS:
            return True
        return room.teacher == request.user
