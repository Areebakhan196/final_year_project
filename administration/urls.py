from django.urls import path
from .views import AdminComplaintListView, AdminComplaintDetailView, AdminComplaintStatusUpdateView

urlpatterns = [
    path('complaints/', AdminComplaintListView.as_view(), name='admin-complaint-list'),
    path('complaints/<str:tracking_id>/', AdminComplaintDetailView.as_view(), name='admin-complaint-detail'),
    path('complaints/<str:tracking_id>/update/', AdminComplaintStatusUpdateView.as_view(), name='admin-complaint-update'),
]
