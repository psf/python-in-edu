from django.views import generic
from django.urls import reverse
from django.shortcuts import get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect
from .forms import CreateResourceForm


from .models import Profile, Resource, Author

class GettingStartedView(generic.TemplateView):
    template_name = 'misc/getting_started.html'


class ConnectView(generic.TemplateView):
    template_name = 'misc/connect.html'


class CodeOfConductView(generic.TemplateView):
    template_name = 'misc/code_of_conduct.html'


class AuthorListView(generic.ListView):
    model = Author
    template_name = 'authors/author_list.html'


class AuthorCreateView(generic.CreateView):
    model = Author
    fields = '__all__'
    template_name = 'authors/author_create.html'

    def get_success_url(self, instance):
        return reverse('author_list')

    def form_valid(self, form):
        instance = form.save()
        return HttpResponseRedirect(self.get_success_url(instance=instance))


class ResourceDetailView(generic.DetailView):
    model = Resource
    template_name = 'resources/resource_detail.html'


class ResourceListView(generic.ListView):
    model = Resource
    template_name = 'resources/resource_list.html'

    def get_context_data(self, **kwargs):
        # overrides default to get only accepted resources
        context = super().get_context_data(**kwargs)
        context['resource_list'] = Resource.objects.all()
        return context


class ResourceCreateView(LoginRequiredMixin, generic.CreateView):
    model = Resource
    form_class = CreateResourceForm
    template_name = 'resources/add_resource.html'

    def get_success_url(self, instance):
        return reverse('resource_detail', kwargs={'pk': instance.pk })

    def form_valid(self, form):
        unsaved_resource_instance = form.save(commit=False)
        unsaved_resource_instance.submitter = self.request.user
        unsaved_resource_instance.save()
        return HttpResponseRedirect(self.get_success_url(instance=unsaved_resource_instance))


class ResourceUpdateView(LoginRequiredMixin, generic.UpdateView):
    model = Resource
    fields = ['title', 'audience', 'devices', 'requires_signup', 'use_type',
    'description', 'author', 'license']
    template_name = 'resources/update_resource.html'

    def get_success_url(self):
        return reverse('resource_detail', kwargs={'pk': self.object.pk })


class ProfileDetailView(generic.DetailView):
    model = Profile
    template_name = 'resources/profile_detail.html'

    def get_object(self, queryset=None):
        username = self.kwargs.get('username', None)
        user = get_object_or_404(User, username=username)
        return user.profile


class ProfileUpdateView(LoginRequiredMixin, generic.UpdateView):
    model = Profile
    fields = ['organization', 'country', 'roles', 'populations', 'underrep', 'psf_member']
    template_name = 'resources/profile_update.html'

    def get_object(self, queryset=None):
        username = self.kwargs.get('username', None)
        user = get_object_or_404(User, username=username)
        return user.profile

    def get_success_url(self):
        return reverse('profile_detail', kwargs={'username': self.request.user.username })
