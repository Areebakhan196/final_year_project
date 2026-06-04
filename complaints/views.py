import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .models import Complaint
from .serializers import (
    ComplaintSerializer,
    ComplaintStatusSerializer,
    ComplaintMineSerializer,
)

logger = logging.getLogger('complaints')


def _save_complaint_evidences(complaint, request):
    from .models import ComplaintEvidence

    for file in request.FILES.getlist('evidence_images'):
        ComplaintEvidence.objects.create(complaint=complaint, file=file)
    for file in request.FILES.getlist('evidence_files'):
        ComplaintEvidence.objects.create(complaint=complaint, file=file)


class ComplaintCreateView(generics.CreateAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def post(self, request, *args, **kwargs):
        logger.info("New complaint submission attempt.")
        if not request.FILES.getlist('evidence_images'):
            return Response(
                {"error": "At least one evidence image is mandatory."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().post(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.perform_create(serializer)
        output = self.get_serializer(instance)
        response = Response(output.data, status=status.HTTP_201_CREATED)

        if instance.audio_file:
            try:
                from .audio_processing import process_audio
                process_audio(instance.audio_file.path)
            except Exception as exc:
                logger.warning(
                    "Complaint #%s saved; optional audio processing skipped: %s",
                    instance.pk,
                    exc,
                )

        logger.info(
            "Complaint submitted successfully. id=%s tracking_id=%s",
            instance.pk,
            instance.tracking_id,
        )
        return response

    def perform_create(self, serializer):
        user = self.request.user
        extra = {}
        if user.is_authenticated:
            extra['submitted_by'] = user
            try:
                extra['tracking_id'] = user.student_profile.unique_student_id
            except Exception:
                pass
        instance = serializer.save(**extra)
        _save_complaint_evidences(instance, self.request)
        return instance


class ComplaintMineListView(generics.ListAPIView):
    """All complaints filed by the logged-in student (new row per submission)."""
    serializer_class = ComplaintMineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Complaint.objects.filter(submitted_by=self.request.user).order_by('-created_at')


class ComplaintMineDetailView(generics.RetrieveAPIView):
    """Single complaint for the logged-in student (by internal id)."""
    serializer_class = ComplaintStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        return Complaint.objects.filter(submitted_by=self.request.user)


class ComplaintStatusView(generics.RetrieveAPIView):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintStatusSerializer
    lookup_field = 'tracking_id'

    def get_object(self):
        tracking_id = self.kwargs.get('tracking_id')
        qs = Complaint.objects.filter(tracking_id=tracking_id).order_by('-created_at')
        user = self.request.user
        if user.is_authenticated:
            qs = qs.filter(submitted_by=user)
        instance = qs.first()
        if not instance:
            from rest_framework.exceptions import NotFound
            raise NotFound('Complaint not found.')
        return instance


class ComplaintStatusByIdView(generics.RetrieveAPIView):
    """Status lookup by internal complaint id (anonymous or authenticated)."""
    queryset = Complaint.objects.all()
    serializer_class = ComplaintStatusSerializer
    lookup_field = 'pk'

    def get_object(self):
        instance = super().get_object()
        user = self.request.user
        if (
            user.is_authenticated
            and instance.submitted_by_id
            and instance.submitted_by_id != user.id
        ):
            from rest_framework.exceptions import NotFound
            raise NotFound('Complaint not found.')
        return instance
