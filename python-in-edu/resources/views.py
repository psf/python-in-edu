from django.views import generic
from django.urls import reverse
from django.shortcuts import get_object_or_404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect


from .models import Profile, Resource
from . import choices


class GettingStartedView(generic.TemplateView):
    template_name = "misc/getting_started.html"


class ConnectView(generic.TemplateView):
    template_name = "misc/connect.html"


class CodeOfConductView(generic.TemplateView):
    template_name = "misc/code_of_conduct.html"


class ResourceDetailView(generic.DetailView):
    model = Resource
    template_name = "resources/resource_detail.html"


class ResourceListView(generic.ListView):
    model = Resource
    template_name = "resources/resource_list.html"

    def get_context_data(self, **kwargs):
        # overrides default to get only accepted resources
        context = super().get_context_data(**kwargs)
        context["resource_list"] = Resource.objects.filter(
            status=choices.ResourceStatusChoices.ACCEPTED
        )
        return context


class ResourceCreateView(LoginRequiredMixin, generic.CreateView):
    model = Resource
    fields = [
        "title",
        "url1",
        "url_description1",
        "url2",
        "url_description2",
        "url3",
        "url_description3",
        "resource_type",
        "audience",
        "devices",
        "requires_signup",
        "use_type",
        "python_related",
        "description",
        "attribution",
        "language",
        "license",
        "contact",
    ]
    template_name = "resources/add_resource.html"

    def get_success_url(self, instance):
        return reverse("resource_detail", kwargs={"pk": instance.pk})

    def form_valid(self, form):
        unsaved_resource_instance = form.save(commit=False)
        unsaved_resource_instance.submitter = self.request.user
        unsaved_resource_instance.save()
        return HttpResponseRedirect(
            self.get_success_url(instance=unsaved_resource_instance)
        )


class ResourceUpdateView(LoginRequiredMixin, generic.UpdateView):
    model = Resource
    fields = [
        "title",
        "url1",
        "url_description1",
        "url2",
        "url_description2",
        "url3",
        "url_description3",
        "resource_type",
        "audience",
        "devices",
        "requires_signup",
        "use_type",
        "python_related",
        "description",
        "attribution",
        "language",
        "license",
        "contact",
    ]
    template_name = "resources/update_resource.html"

    def get_success_url(self):
        return reverse("resource_detail", kwargs={"pk": self.object.pk})


class ProfileDetailView(generic.DetailView):
    model = Profile
    template_name = "resources/profile_detail.html"

    def get_object(self, queryset=None):
        username = self.kwargs.get("username", None)
        user = get_object_or_404(User, username=username)
        return user.profile


class ProfileUpdateView(LoginRequiredMixin, generic.UpdateView):
    model = Profile
    fields = [
        "organization",
        "country",
        "roles",
        "populations",
        "underrep",
        "psf_member",
    ]
    template_name = "resources/profile_update.html"

    def get_object(self, queryset=None):
        username = self.kwargs.get("username", None)
        user = get_object_or_404(User, username=username)
        return user.profile

    def get_success_url(self):
        return reverse(
            "profile_detail", kwargs={"username": self.request.user.username}
        )
