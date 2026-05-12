from rest_framework import serializers
from .models import Complaint
from security.utils import encryption_tool

class ComplaintSerializer(serializers.ModelSerializer):
    text_content = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Complaint
        fields = [
            'tracking_id', 'text_content', 'audio_file', 
            'evidence_image', 'status', 'created_at'
        ]
        read_only_fields = ['tracking_id', 'status', 'created_at']

    def create(self, validated_data):
        text_content = validated_data.pop('text_content', None)
        if text_content:
            validated_data['encrypted_text'] = encryption_tool.encrypt(text_content)
        return super().create(validated_data)

class ComplaintStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['tracking_id', 'status', 'created_at', 'updated_at']
        read_only_fields = ['tracking_id', 'created_at', 'updated_at']
