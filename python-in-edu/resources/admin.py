from django.contrib import admin

from .models import Profile, Resource, Author


admin.site.register(Profile)
admin.site.register(Resource)
admin.site.register(Author)