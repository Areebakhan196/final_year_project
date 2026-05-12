import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .models import Complaint
from .serializers import ComplaintSerializer, ComplaintStatusSerializer

logger = logging.getLogger('complaints')

class ComplaintCreateView(generics.CreateAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def post(self, request, *args, **kwargs):
        logger.info("New complaint submission attempt.")
        return super().post(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        instance = Complaint.objects.get(tracking_id=response.data.get('tracking_id'))
        
        # Trigger audio processing if file exists
        if instance.audio_file:
            from .audio_processing import process_audio
            process_audio(instance.audio_file.path)
            
        logger.info(f"Complaint submitted successfully. Tracking ID: {response.data.get('tracking_id')}")
        return response

class ComplaintStatusView(generics.RetrieveAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintStatusSerializer
    lookup_field = 'tracking_id'

    def retrieve(self, request, *args, **kwargs):
        tracking_id = self.kwargs.get('tracking_id')
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            logger.warning(f"Failed status check for Tracking ID: {tracking_id}")
            return Response(
                {"error": "Complaint not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
