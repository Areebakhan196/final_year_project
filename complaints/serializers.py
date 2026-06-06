import os

from rest_framework import serializers
from .models import Complaint, ComplaintEvidence
from security.utils import encryption_tool
from core.media_urls import resolve_media_url


class ComplaintEvidenceSerializer(serializers.ModelSerializer):
    """Always expose absolute Cloudinary HTTPS URLs on `file` for the React apps."""
    file = serializers.SerializerMethodField()
    file_type = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintEvidence
        fields = ['id', 'file', 'file_type', 'uploaded_at']

    def get_file(self, obj):
        if not obj.file:
            return None
        return resolve_media_url(obj.file)

    def get_file_type(self, obj):
        if not obj.file or not obj.file.name:
            return 'document'
        name = obj.file.name.lower()
        ext = os.path.splitext(name)[1]
        from core.media_urls import IMAGE_EXTENSIONS, RAW_EXTENSIONS, resolve_media_url
        if ext in IMAGE_EXTENSIONS:
            return 'image'
        if ext in RAW_EXTENSIONS or '/evidence/documents/' in name:
            return 'document'
        url = (resolve_media_url(obj.file) or '').split('?')[0].lower()
        if url.endswith('.pdf') or any(url.endswith(f'.{d}') for d in ('doc', 'docx', 'txt')):
            return 'document'
        if url.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp')):
            return 'image'
        return 'image'

class ComplaintSerializer(serializers.ModelSerializer):
    text_content = serializers.CharField(write_only=True, required=False)
    evidences = ComplaintEvidenceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'tracking_id', 'text_content', 'audio_file',
            'evidences', 'status', 'admin_remarks', 'created_at',
        ]
        read_only_fields = ['id', 'tracking_id', 'status', 'admin_remarks', 'created_at', 'evidences']

    def create(self, validated_data):
        text_content = validated_data.pop('text_content', None)
        if text_content:
            validated_data['encrypted_text'] = encryption_tool.encrypt(text_content)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        text_content = validated_data.pop('text_content', None)
        if text_content:
            instance.encrypted_text = encryption_tool.encrypt(text_content)
        # Reset status back to PENDING when updating
        instance.status = 'PENDING'
        return super().update(instance, validated_data)

class ComplaintMineSerializer(serializers.ModelSerializer):
    """Student portal: list of own complaints."""

    class Meta:
        model = Complaint
        fields = ['id', 'tracking_id', 'status', 'admin_remarks', 'created_at', 'updated_at']
        read_only_fields = fields


class ComplaintStatusSerializer(serializers.ModelSerializer):
    """Used by the admin management endpoints and status tracking."""
    evidences = ComplaintEvidenceSerializer(many=True, read_only=True)
    student_id = serializers.SerializerMethodField()
    audio_file = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id',
            'tracking_id',
            'student_id',
            'status',
            'admin_remarks',
            'created_at',
            'updated_at',
            'audio_file',
            'evidences',
        ]
        read_only_fields = ['id', 'tracking_id', 'student_id', 'created_at', 'updated_at', 'audio_file', 'evidences']

    def get_audio_file(self, obj):
        if not obj.audio_file:
            return None
        return resolve_media_url(obj.audio_file)

    def get_student_id(self, obj):
        if not obj.submitted_by_id:
            return None
        try:
            return obj.submitted_by.student_profile.unique_student_id
        except Exception:
            return None
