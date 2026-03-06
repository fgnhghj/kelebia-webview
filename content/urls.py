from django.urls import path
from . import views

urlpatterns = [
    path('rooms/<int:room_id>/content/upload/', views.upload_content, name='upload_content'),
    path('rooms/<int:room_id>/content/<int:content_id>/delete/', views.delete_content, name='delete_content'),
    path('rooms/<int:room_id>/assignments/create/', views.create_assignment, name='create_assignment'),
    path('rooms/<int:room_id>/assignments/<int:assignment_id>/', views.assignment_detail, name='assignment_detail'),
    path('rooms/<int:room_id>/assignments/<int:assignment_id>/grade/<int:submission_id>/', views.grade_submission, name='grade_submission'),
    path('rooms/<int:room_id>/assignments/<int:assignment_id>/download-all/', views.download_all_submissions, name='download_all_submissions'),
]
