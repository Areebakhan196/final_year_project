from rest_framework import generics, permissions
from complaints.models import Complaint
from complaints.serializers import ComplaintStatusSerializer
from rest_framework.response import Response
from security.utils import encryption_tool

class AdminComplaintListView(generics.ListAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintStatusSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminComplaintDetailView(generics.RetrieveUpdateAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintStatusSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'tracking_id'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        data = self.get_serializer(instance).data
        # Decrypt text for admin review
        data['decrypted_text'] = encryption_tool.decrypt(instance.encrypted_text)
        return Response(data)

class AdminComplaintStatusUpdateView(generics.UpdateAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintStatusSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'tracking_id'

    def perform_update(self, serializer):
        # Additional logic can be added here (e.g., notification system)
        serializer.save()
