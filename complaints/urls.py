from django.urls import path
from .views import (
    ComplaintCreateView,
    ComplaintStatusView,
    ComplaintStatusByIdView,
    ComplaintMineListView,
    ComplaintMineDetailView,
)

urlpatterns = [
    path('submit/', ComplaintCreateView.as_view(), name='complaint-submit'),
    path('mine/', ComplaintMineListView.as_view(), name='complaint-mine'),
    path('mine/<int:pk>/', ComplaintMineDetailView.as_view(), name='complaint-mine-detail'),
    path('status/<str:tracking_id>/', ComplaintStatusView.as_view(), name='complaint-status'),
    path('detail/<int:pk>/', ComplaintStatusByIdView.as_view(), name='complaint-detail'),
]
