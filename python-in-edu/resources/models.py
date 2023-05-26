from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.urls import reverse

from multiselectfield import MultiSelectField

from mysite.settings import DEFAULT_FROM_EMAIL, SEND_MAIL
from . import choices


# Profile Models


class Profile(models.Model):

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    organization = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    roles = MultiSelectField(choices=choices.UserRoleChoices.choices)
    populations = MultiSelectField(choices=choices.PopulationChoices.choices)
    underrep = models.BooleanField(default=False)
    psf_member = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username}"


def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)


# Resource Models

#class Link(models.Model):



class Resource(models.Model):
        #Required and optional fields
    url1 = models.URLField(max_length=200, help_text="You must link at least one resource.")
    url_description1 = models.CharField(max_length=50, blank=True, null=True, help_text="Use this field, if you are including multiple urls")
    # resource = models.ForeignKey('Resource', on_delete=models.CASCADE, related_name='links')
    url2 = models.URLField(max_length=200, blank=True, null=True, help_text="Optional additional url related to the same resource")
    url_description2 = models.CharField(max_length=50, blank=True, null=True, help_text="Use this field, if you are including multiple urls")
    # resource = models.ForeignKey('Resource', on_delete=models.CASCADE, related_name='links')
    url3 = models.URLField(max_length=200, blank=True, null=True,  help_text="Optional additional url related to the same resource")
    url_description3 = models.CharField(max_length=50, blank=True, null=True, help_text="Use this field, if you are including multiple urls")
    # resource = models.ForeignKey('Resource', on_delete=models.CASCADE, related_name='links')

    # core fields
    title = models.CharField(max_length=200, help_text="What is the name of the resource")
    submitter = models.ForeignKey(User, on_delete=models.CASCADE)  # FIXME: probably want to orphan rather than delete
    status = models.CharField(max_length=3, choices=choices.ResourceStatusChoices.choices, default=choices.ResourceStatusChoices.PROPOSED)

    # required fields
    requires_signup = models.CharField(max_length=3,choices=choices.SignUpChoices.choices, help_text="Are users required to create an account or provide their email address to access this resource?")
    resource_type = MultiSelectField(max_length=30,choices=choices.ResourceTypeChoices.choices, help_text="Select all that apply.")
    audience = MultiSelectField(max_length=30,choices=choices.AudienceChoices.choices, help_text="Select 'not specific' for resources for any or all audiences.")
    devices = MultiSelectField(max_length=30,choices=choices.DeviceChoices.choices, help_text="Which devices are compatible with this resource")
    description = models.CharField(max_length=500, help_text="Add a description of this resource. (max 500 characters)")
    attribution = models.CharField(max_length=250, help_text="What person or organization created this resource?")
    use_type = models.CharField(max_length=3, choices=choices.UseTypeChoices.choices, help_text="Select the use type that best describes this resource.", default=choices.PythonChoices.UNKNOWN)
    python_related = models.CharField(max_length=2, choices=choices.PythonChoices.choices, help_text="Select the option that best describes this resource.", default=choices.PythonChoices.UNKNOWN)

    # optional fields
    
    #author_bio = models.CharField(max_length=250, blank=True, null=True)
    #organization = models.CharField(max_length=250, blank=True, null=True)
    contact = models.CharField(max_length=250, blank=True, null=True, help_text="Not for display, What is the best way to reach you if we have questions about this submission?")
    #standards = models.CharField(max_length=250, blank=True, null=True)
    language = models.CharField(max_length=50, blank=True, null=True, help_text="What language/s are the written materials available in?")
    #requirements = models.CharField(max_length=200, blank=True, null=True)
    license = models.CharField(max_length=200, blank=True, null=True, help_text="What is the copyright license type? Type 'unknown' if the license type is not available.")

    def __str__(self):
        return f"{self.title} (submitted by {self.submitter}) - {self.get_status_display()}"


def resource_updated(sender, instance, created, **kwargs):

    if created and SEND_MAIL:
        staff_emails = [user.email for user in User.objects.all() if user.is_staff and user.email]
        subj = "A new resource has been proposed on Python In Education"
        url = "http://education.python.org" + reverse('admin:resources_resource_change', args=[instance.pk])
        msg = f"A new resource with title '{instance.title}' has been proposed. Visit to approve: {url}"
        send_mail(subj, msg, DEFAULT_FROM_EMAIL, staff_emails, fail_silently=False)


post_save.connect(resource_updated, sender=Resource)