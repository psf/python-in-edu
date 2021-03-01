from django.urls import path

from . import views


urlpatterns = [
    path('profiles', views.ProfileListView.as_view(), name='profile_list'),
    path('profile/<str:username>', views.ProfileDetailView.as_view(), name='profile_detail'),
    path('resource/list', views.ResourceListView.as_view(), name='resource_list'),
    path('resource/new', views.ResourceCreateView.as_view(), name='resource_create'),
    # FIXME: below should probably be a slug
    path('resources/<int:pk>', views.ResourceDetailView.as_view(), name='resource_detail'),
    path('resources/<int:pk>/update/', views.ResourceUpdateView.as_view(), name='resource_update'),
]