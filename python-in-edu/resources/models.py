from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import User

from . import choices


# Profile Models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)


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
