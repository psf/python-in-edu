from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import User

from multiselectfield import MultiSelectField

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

class Resource(models.Model):

    # core fields
    title = models.CharField(max_length=200)
    url = models.CharField(max_length=200)
    submitter = models.ForeignKey(User, on_delete=models.CASCADE)  # FIXME: probably want to orphan rather than delete
    status = models.CharField(max_length=3, choices=choices.ResourceStatusChoices.choices, default=choices.ResourceStatusChoices.PROPOSED)

    # required fields
    requires_signup = models.BooleanField(default=False)
    resource_type = models.CharField(max_length=2, choices=choices.ResourceTypeChoices.choices)
    audience = models.CharField(max_length=3, choices=choices.AudienceChoices.choices)
    devices = models.CharField(max_length=3, choices=choices.DeviceChoices.choices)
    language = models.CharField(max_length=50)
    requirements = models.CharField(max_length=200)
    license = models.CharField(max_length=200)

    # optional fields
    description = models.CharField(max_length=250, blank=True, null=True)
    attribution = models.CharField(max_length=250, blank=True, null=True)
    author_bio = models.CharField(max_length=250, blank=True, null=True)
    organization = models.CharField(max_length=250, blank=True, null=True)
    contact = models.CharField(max_length=250, blank=True, null=True)
    standards = models.CharField(max_length=250, blank=True, null=True)

    def __str__(self):
        return f"{self.title} (submitted by {self.submitter}) - {self.get_status_display()}"
