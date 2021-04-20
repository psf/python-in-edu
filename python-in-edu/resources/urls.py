from django.urls import path

from . import views


urlpatterns = [
    path('profile/<str:username>', views.ProfileDetailView.as_view(), name='profile_detail'),
    path('profile/<str:username>/udpate', views.ProfileUpdateView.as_view(), name='profile_update'),
    path('resource/list', views.ResourceListView.as_view(), name='resource_list'),
    path('resource/new', views.ResourceCreateView.as_view(), name='resource_create'),
    # FIXME: below should probably be a slug
    path('resources/<int:pk>', views.ResourceDetailView.as_view(), name='resource_detail'),
    path('resources/<int:pk>/update/', views.ResourceUpdateView.as_view(), name='resource_update'),
    path('getting-started', views.GettingStartedView.as_view(), name='getting_started'),
    path('connect', views.ConnectView.as_view(), name='connect'),
    path('code-of-conduct', views.CodeOfConductView.as_view(), name='code_of_conduct'),

]