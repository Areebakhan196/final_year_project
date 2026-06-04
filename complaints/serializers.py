from rest_framework import serializers
from .models import Complaint, ComplaintEvidence
from security.utils import encryption_tool

class ComplaintEvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintEvidence
        fields = ['id', 'file', 'uploaded_at']

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

    def get_student_id(self, obj):
        if not obj.submitted_by_id:
            return None
        try:
            return obj.submitted_by.student_profile.unique_student_id
        except Exception:
            return None
