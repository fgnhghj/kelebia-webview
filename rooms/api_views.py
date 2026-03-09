from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q, Exists, OuterRef
from django.shortcuts import get_object_or_404
from .models import Room, RoomMembership
from .serializers import RoomSerializer, RoomStudentSerializer, RoomCreateSerializer, RoomMembershipSerializer
from content.models import Section
from notifications.models import Notification


class RoomViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RoomCreateSerializer
        # Hide invite_code from students
        if hasattr(self.request, 'user') and self.request.user.is_student:
            return RoomStudentSerializer
        return RoomSerializer

    def get_queryset(self):
        user = self.request.user
        base = Room.objects.annotate(
            student_count=Count(
                'memberships', filter=Q(memberships__status='approved')
            ),
        ).select_related('teacher')
        if user.is_teacher:
            return base.filter(teacher=user, is_active=True)
        else:
            room_ids = RoomMembership.objects.filter(
                student=user, status='approved'
            ).values_list('room_id', flat=True)
            return base.filter(id__in=room_ids, is_active=True)

    def perform_create(self, serializer):
        room = serializer.save(teacher=self.request.user)
        Section.objects.create(room=room, title='General', order=0)

    @action(detail=False, methods=['post'])
    def join(self, request):
        """Join a room via invite code."""
        code = request.data.get('invite_code', '').upper().strip()
        if not code:
            return Response({'error': 'Invite code is required.'}, status=400)

        try:
            room = Room.objects.get(invite_code=code, is_active=True)
        except Room.DoesNotExist:
            return Response({'error': 'Invalid invite code.'}, status=404)

        if room.teacher == request.user:
            return Response({'room': RoomSerializer(room, context={'request': request}).data,
                             'message': 'You are the teacher of this room.'})

        membership, created = RoomMembership.objects.get_or_create(
            room=room, student=request.user,
            defaults={'status': 'approved'}
        )
        if created:
            Notification.objects.create(
                user=room.teacher,
                notification_type='room',
                title='New Student Joined',
                message=f'{request.user.get_full_name() or request.user.username} joined {room.name}',
                link=f'/rooms/{room.pk}/',
            )
        return Response({
            'room': RoomSerializer(room, context={'request': request}).data,
            'joined': created,
            'message': 'Joined successfully!' if created else 'Already a member.'
        })

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """List room members."""
        room = self.get_object()
        members = room.memberships.filter(status='approved').select_related('student')
        pending = room.memberships.filter(status='pending').select_related('student')
        return Response({
            'members': RoomMembershipSerializer(members, many=True).data,
            'pending': RoomMembershipSerializer(pending, many=True).data,
        })

    @action(detail=True, methods=['post'])
    def manage_member(self, request, pk=None):
        """Approve or remove members."""
        room = self.get_object()
        if room.teacher != request.user:
            return Response({'error': 'Only the teacher can manage members.'}, status=403)

        member_ids = request.data.get('member_ids', [])
        if 'member_id' in request.data and not member_ids:
            member_ids = [request.data.get('member_id')]

        action_type = request.data.get('action')  # 'approve' or 'remove'
        
        if not member_ids:
            return Response({'error': 'No members specified.'}, status=400)

        memberships = RoomMembership.objects.filter(pk__in=member_ids, room=room)

        if action_type == 'approve':
            count = memberships.update(status='approved')
        elif action_type == 'remove':
            count = memberships.update(status='removed')
        else:
            return Response({'error': 'Invalid action.'}, status=400)

        return Response({'status': action_type, 'count': count})

    def perform_destroy(self, instance):
        """Soft-delete room and clean up orphaned notifications."""
        room_link = f'/rooms/{instance.pk}/'
        Notification.objects.filter(link=room_link).delete()
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a room (students only)."""
        room = self.get_object()
        # C5: Teachers cannot leave their own room
        if room.teacher == request.user:
            return Response({'error': 'Teachers cannot leave their own room. Delete the room instead.'}, status=403)
        membership = get_object_or_404(RoomMembership, room=room, student=request.user)
        membership.delete()
        return Response({'status': 'left'})
