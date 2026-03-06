from django.urls import path
from . import views

urlpatterns = [
    path('rooms/<int:room_id>/announcements/create/', views.create_announcement, name='create_announcement'),
    path('rooms/<int:room_id>/announcements/<int:announcement_id>/', views.announcement_detail, name='announcement_detail'),
    path('rooms/<int:room_id>/announcements/<int:announcement_id>/comment/', views.add_comment, name='add_comment'),
]
