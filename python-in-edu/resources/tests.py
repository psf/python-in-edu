import json

from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from django.core import mail

from .models import Profile, Resource, resource_updated
from . import choices


class BaseTestCase(TestCase):

    def create_users(self):
        self.user = User.objects.create(username="A", email="fake@example.com")
        self.user2 = User.objects.create(username="B", email="fake2@example.com")

    def create_resources(self):
        self.basic_resource_data = {
            "title": "A Title", "url": "www.example.com", "submitter": self.user,
            "status": choices.ResourceStatusChoices.PROPOSED,
            "resource_type": choices.ResourceTypeChoices.PLATFORM_APP,
            "audience": choices.AudienceChoices.K_THROUGH_12,
            "language": "English", "requirements": "none", "license": "none"
        }
        self.resource_a = Resource.objects.create(**self.basic_resource_data)
        self.resource_b = Resource.objects.create(**self.basic_resource_data)

    def setUp(self):
        self.create_users()
        self.create_resources()


class ResourceViewCase(BaseTestCase):

    def test_resource_list_contains_accepted_only(self):
        """The resource list contains only accepted resources."""
        self.resource_a.status = choices.ResourceStatusChoices.ACCEPTED
        self.resource_a.save()
        response = self.client.get(reverse('resource_list'))
        self.assertEqual(list(response.context['resource_list']), [self.resource_a])


class EmailTest(BaseTestCase):

    def test_send_email(self):
        """Staff users but not other users are notified when a new resource is created."""

        # Set user to staff
        self.user2.is_staff = True
        self.user2.save()

        # Create new resource
        resource_c = Resource.objects.create(**self.basic_resource_data)

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "A new resource has been proposed on Python In Education")
