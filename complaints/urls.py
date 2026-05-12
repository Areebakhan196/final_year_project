from django.urls import path
from .views import ComplaintCreateView, ComplaintStatusView

urlpatterns = [
    path('submit/', ComplaintCreateView.as_view(), name='complaint-submit'),
    path('status/<str:tracking_id>/', ComplaintStatusView.as_view(), name='complaint-status'),
]
