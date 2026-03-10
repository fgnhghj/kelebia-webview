from rest_framework import serializers
from .models import Section, Content, Assignment, Submission, Grade, SubmissionFile
from accounts.serializers import UserSerializer


class ContentSerializer(serializers.ModelSerializer):
    file_extension = serializers.CharField(read_only=True)
    file_size_display = serializers.CharField(read_only=True)

    class Meta:
        model = Content
        fields = ['id', 'section', 'room', 'title', 'description',
                  'content_type', 'file', 'link', 'is_pinned', 'order',
                  'file_extension', 'file_size_display', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        content_type = attrs.get('content_type', 'resource')
        file = attrs.get('file')
        link = attrs.get('link', '')
        if content_type == 'link' and not link:
            raise serializers.ValidationError({'link': 'A URL is required for link-type content.'})
        if content_type != 'link' and not file and not link:
            raise serializers.ValidationError({'file': 'A file or link is required.'})
        return attrs


class SectionSerializer(serializers.ModelSerializer):
    contents = ContentSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'room', 'title', 'order', 'contents', 'created_at']
        read_only_fields = ['id', 'created_at']


class GradeSerializer(serializers.ModelSerializer):
    graded_by = UserSerializer(read_only=True)

    class Meta:
        model = Grade
        fields = ['id', 'score', 'feedback', 'graded_by', 'graded_at']
        read_only_fields = ['id', 'graded_by', 'graded_at']


class SubmissionFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubmissionFile
        fields = ['id', 'file', 'filename']


class SubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    grade = GradeSerializer(read_only=True)
    files = SubmissionFileSerializer(many=True, read_only=True)
    is_late = serializers.BooleanField(read_only=True)

    class Meta:
        model = Submission
        fields = ['id', 'assignment', 'student', 'files', 'comment',
                  'submitted_at', 'status', 'grade', 'is_late']
        read_only_fields = ['id', 'student', 'submitted_at', 'status']


class AssignmentSerializer(serializers.ModelSerializer):
    submissions_count = serializers.IntegerField(read_only=True)
    graded_count = serializers.IntegerField(read_only=True)
    unsubmitted_count = serializers.IntegerField(read_only=True)
    is_past_deadline = serializers.BooleanField(read_only=True)
    my_submission = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = ['id', 'room', 'section', 'title', 'description', 'file',
                  'deadline', 'max_grade', 'allow_late', 'allow_resubmission', 'submissions_count',
                  'graded_count', 'unsubmitted_count', 'is_past_deadline', 'my_submission',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_my_submission(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_student:
            sub = obj.submissions.filter(student=request.user).first()
            if sub:
                return SubmissionSerializer(sub).data
        return None
