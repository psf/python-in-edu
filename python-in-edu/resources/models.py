from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)


class Resource(models.Model):
    title = models.CharField(max_length=200)
    submitter = models.ForeignKey(User, on_delete=models.CASCADE)  # FIXME: probably want to orphan rather than delete
    url = models.CharField(max_length=200)
