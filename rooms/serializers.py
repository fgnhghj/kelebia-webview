from rest_framework import serializers
from .models import Room, RoomMembership
from accounts.serializers import UserSerializer


class RoomSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    student_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'name', 'description', 'subject', 'invite_code',
                  'color_theme', 'cover_image', 'is_active', 'is_archived', 'teacher',
                  'student_count', 'is_member', 'created_at', 'updated_at']
        read_only_fields = ['id', 'invite_code', 'teacher', 'created_at', 'updated_at']

    def get_student_count(self, obj):
        if hasattr(obj, 'student_count'):
            return obj.student_count
        return obj.memberships.filter(status='approved').count()

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if obj.teacher == request.user:
                return True
            return RoomMembership.objects.filter(
                room=obj, student=request.user, status='approved'
            ).exists()
        return False


class RoomStudentSerializer(serializers.ModelSerializer):
    """Serializer for students — hides invite_code."""
    teacher = UserSerializer(read_only=True)
    student_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'name', 'description', 'subject',
                  'color_theme', 'cover_image', 'is_active', 'is_archived', 'teacher',
                  'student_count', 'is_member', 'created_at', 'updated_at']
        read_only_fields = ['id', 'teacher', 'created_at', 'updated_at']

    def get_student_count(self, obj):
        if hasattr(obj, 'student_count'):
            return obj.student_count
        return obj.memberships.filter(status='approved').count()

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if obj.teacher == request.user:
                return True
            return RoomMembership.objects.filter(
                room=obj, student=request.user, status='approved'
            ).exists()
        return False


class RoomCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'description', 'subject', 'color_theme', 'cover_image']
        read_only_fields = ['id']


class RoomMembershipSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)

    class Meta:
        model = RoomMembership
        fields = ['id', 'student', 'status', 'joined_at']
        read_only_fields = ['id', 'student', 'joined_at']
