from django.urls import path
from .views import AdminComplaintListView, AdminComplaintDetailView, AdminComplaintStatusUpdateView

urlpatterns = [
    path('complaints/', AdminComplaintListView.as_view(), name='admin-complaint-list'),
    path('complaints/<int:pk>/', AdminComplaintDetailView.as_view(), name='admin-complaint-detail'),
    path('complaints/<int:pk>/update/', AdminComplaintStatusUpdateView.as_view(), name='admin-complaint-update'),
]
