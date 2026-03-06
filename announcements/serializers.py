from rest_framework import serializers
from .models import Announcement, Comment
from accounts.serializers import UserSerializer


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'announcement', 'author', 'body', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'room', 'author', 'title', 'body', 'is_pinned',
                  'comment_count', 'comments', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class AnnouncementListSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'room', 'author', 'title', 'body', 'is_pinned',
                  'comment_count', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']
