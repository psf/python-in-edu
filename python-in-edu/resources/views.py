from django.views import generic
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

from .models import Profile, Resource


class ResourceDetailView(generic.DetailView):
    model = Resource
    template_name = 'resources/resource_detail.html'


class ResourceListView(generic.ListView):
    model = Resource
    template_name = 'resources/resource_list.html'


class ProfileDetailView(generic.DetailView):
    model = Profile
    template_name = 'resources/profile_detail.html'

    def get_object(self, queryset=None):
        username = self.kwargs.get('username', None)
        user = get_object_or_404(User, username=username)
        return user.profile


class ProfileListView(generic.ListView):
    model = Profile
    template_name = 'resources/profile_list.html'

