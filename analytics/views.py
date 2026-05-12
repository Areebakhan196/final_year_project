from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count
from complaints.models import Complaint

class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        total_complaints = Complaint.objects.count()
        status_breakdown = Complaint.objects.values('status').annotate(count=Count('status'))
        
        # Simple daily trend (anonymized)
        daily_stats = Complaint.objects.extra(select={'day': 'date(created_at)'}).values('day').annotate(count=Count('id')).order_by('day')

        data = {
            "total_complaints": total_complaints,
            "status_breakdown": {item['status']: item['count'] for item in status_breakdown},
            "daily_trend": list(daily_stats)
        }
        return Response(data)
