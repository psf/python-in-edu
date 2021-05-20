from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.urls import reverse

from multiselectfield import MultiSelectField

from mysite.settings import DEFAULT_FROM_EMAIL
from . import choices

# Profile Models
class Organization(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name}-{self.description}'


class ProfileRole(models.Model):
    name = models.CharField(max_length=100)
    active = models.BooleanField(default=True)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.name}'


class ProfilePopulation(models.Model):
    name = models.CharField(max_length=100)
    active = models.BooleanField(default=True)
    underrepresented = models.BooleanField(default=False)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.name}'


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    organization = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    roles = models.ForeignKey(ProfileRole, on_delete=models.PROTECT)
    populations = models.ForeignKey(ProfilePopulation, on_delete=models.PROTECT)
    psf_member = models.BooleanField(default=False) #TODO couldn't this be automatically defined with data from PSF?

    def __str__(self):
        return f"{self.user.username}"


def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)


# Resource Models

class Author(models.Model):
    name = models.CharField(max_length=100)
    biography = models.TextField(blank=True, null=True)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Device(models.Model):
    name = models.CharField(max_length=100)
    active = models.BooleanField(default=True)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.name}'


class ResourceStatus(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name}'


class SignupChoice(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name}'


class ResourceType(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name}'


class ResourceAudience(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name}'


class ResourceUseType(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name}'


class ResourceLanguages(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name}'


class Resource(models.Model):
    # #Required and optional fields
    # url1 = models.CharField(max_length=200, help_text="You must link at least one resource.")
    # url_description1 = models.CharField(max_length=50, blank=True, null=True, help_text="Use this field, if you are including multiple urls")
    # # resource = models.ForeignKey('Resource', on_delete=models.CASCADE, related_name='links')
    # url2 = models.CharField(max_length=200, blank=True, null=True, help_text="Optional additional url related to the same resource")
    # url_description2 = models.CharField(max_length=50, blank=True, null=True, help_text="Use this field, if you are including multiple urls")
    # # resource = models.ForeignKey('Resource', on_delete=models.CASCADE, related_name='links')
    # url3 = models.CharField(max_length=200, blank=True, null=True,  help_text="Optional additional url related to the same resource")
    # url_description3 = models.CharField(max_length=50, blank=True, null=True, help_text="Use this field, if you are including multiple urls")
    # # resource = models.ForeignKey('Resource', on_delete=models.CASCADE, related_name='links')

    # core fields
    title = models.CharField(max_length=200, help_text="What is the name of the resource")
    submitter = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    status = models.ForeignKey(ResourceStatus, on_delete=models.PROTECT) #TODO Create logic to identify the default status in the ResourceStatus model

    # required fields
    requires_signup = models.ForeignKey(SignupChoice, on_delete=models.PROTECT, help_text="Are users required to create an account or provide their email address to access this resource?")
    resource_types = models.ManyToManyField(ResourceType, help_text="Select all that apply.", limit_choices_to={'active': True})
    audience = models.ManyToManyField(ResourceAudience, help_text="Select 'not specific' for resources for any or all audiences.", limit_choices_to={'active': True})
    devices = models.ManyToManyField(Device, help_text="Which devices are compatible with this resource", limit_choices_to={'active': True})
    description = models.CharField(max_length=500, help_text="Add a description of this resource. (max 500 characters)")
    author = models.ManyToManyField(Author)
    use_type = models.ManyToManyField(ResourceUseType, help_text="Select the use type that best describes this resource.", limit_choices_to={'active': True})

    # optional fields
    languages = models.ManyToManyField(ResourceLanguages, help_text="Choose the languages that your resource focuses on.", limit_choices_to={'active': True})

    #organization = models.CharField(max_length=250, blank=True, null=True)
    # TODO replace the contact field with contact information against the Profile model
    # contact = models.CharField(max_length=250, blank=True, null=True, help_text="Not for display, What is the best way to reach you if we have questions about this submission?")
    #standards = models.CharField(max_length=250, blank=True, null=True)
    language = models.CharField(max_length=50, blank=True, null=True, help_text="What language/s are the written materials available in?")
    #requirements = models.CharField(max_length=200, blank=True, null=True)
    license = models.CharField(max_length=200, blank=True, null=True, help_text="What is the copyright license type? Type 'unknown' if the license type is not available.")

    def __str__(self):
        return f"{self.title} (submitted by {self.submitter}) - {self.status.name}"


class ResourceURL(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='url_resource')
    url = models.URLField(max_length=200)
    description = models.TextField()
    creation_timestamp = models.DateTimeField(auto_now_add=True)
    update_timestamp = models.DateTimeField(auto_now=True)




def resource_updated(sender, instance, created, **kwargs):

    if created:
        staff_emails = [user.email for user in User.objects.all() if user.is_staff and user.email]
        subj = "A new resource has been proposed on Python In Education"
        url = "http://education.python.org" + reverse('admin:resources_resource_change', args=[instance.pk])
        msg = f"A new resource with title '{instance.title}' has been proposed. Visit to approve: {url}"
        send_mail(subj, msg, DEFAULT_FROM_EMAIL, staff_emails, fail_silently=False)


post_save.connect(resource_updated, sender=Resource)