from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import HttpResponseForbidden
from .models import Announcement, Comment
from rooms.models import Room, RoomMembership
from notifications.models import Notification


@login_required
def create_announcement(request, room_id):
    """Teacher posts an announcement."""
    room = get_object_or_404(Room, pk=room_id)
    if room.teacher != request.user:
        return HttpResponseForbidden()

    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        body = request.POST.get('body', '').strip()
        is_pinned = request.POST.get('is_pinned') == 'on'

        if title and body:
            ann = Announcement.objects.create(
                room=room, author=request.user,
                title=title, body=body, is_pinned=is_pinned
            )
            # Notify students
            members = room.memberships.filter(status='approved')
            for m in members:
                Notification.objects.create(
                    user=m.student,
                    notification_type='announcement',
                    title='New Announcement',
                    message=f'{room.name}: {title}',
                    link=f'/rooms/{room.pk}/',
                )
            messages.success(request, 'Announcement posted!')
        else:
            messages.error(request, 'Title and body are required.')

    return redirect('room_detail', room_id=room.pk)


@login_required
def announcement_detail(request, room_id, announcement_id):
    """View an announcement with Q&A thread."""
    room = get_object_or_404(Room, pk=room_id)
    announcement = get_object_or_404(Announcement, pk=announcement_id, room=room)
    is_teacher = room.teacher == request.user

    # Check access
    if not is_teacher:
        is_member = RoomMembership.objects.filter(room=room, student=request.user, status='approved').exists()
        if not is_member:
            return HttpResponseForbidden()

    comments = announcement.comments.select_related('author')

    return render(request, 'announcements/announcement_detail.html', {
        'room': room,
        'announcement': announcement,
        'comments': comments,
        'is_teacher': is_teacher,
    })


@login_required
def add_comment(request, room_id, announcement_id):
    """Add a comment to an announcement (Q&A)."""
    room = get_object_or_404(Room, pk=room_id)
    announcement = get_object_or_404(Announcement, pk=announcement_id, room=room)

    if request.method == 'POST':
        body = request.POST.get('body', '').strip()
        if body:
            Comment.objects.create(
                announcement=announcement,
                author=request.user,
                body=body,
            )
            # Notify announcement author if commenter is different
            if request.user != announcement.author:
                Notification.objects.create(
                    user=announcement.author,
                    notification_type='comment',
                    title='New Comment',
                    message=f'{request.user.get_full_name() or request.user.username} commented on {announcement.title}',
                    link=f'/rooms/{room.pk}/announcements/{announcement.pk}/',
                )

    return redirect('announcement_detail', room_id=room.pk, announcement_id=announcement.pk)
