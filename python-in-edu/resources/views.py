from django.views import generic


from .models import Profile, Resource



class IndexView(generic.TemplateView):
    template_name = 'resources/index.html'


class ResourceDetailView(generic.DetailView):
    model = Resource
    template_name = 'resources/resource_detail.html'


class ResourceListView(generic.ListView):
    model = Resource
    template_name = 'resources/resource_list.html'


class ProfileDetailView(generic.DetailView):
    model = Profile
    template_name = 'resources/profile_detail.html'


class ProfileListView(generic.ListView):
    model = Profile
    template_name = 'resources/profile_list.html'

