from django.urls import path
from . import views

urlpatterns = [
    path('rooms/create/', views.create_room, name='create_room'),
    path('rooms/<int:room_id>/', views.room_detail, name='room_detail'),
    path('rooms/<int:room_id>/edit/', views.edit_room, name='edit_room'),
    path('rooms/<int:room_id>/members/', views.manage_members, name='manage_members'),
    path('rooms/<int:room_id>/sections/add/', views.add_section, name='add_section'),
    path('join/', views.join_room, name='join_room'),
]
