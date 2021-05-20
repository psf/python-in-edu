from django.contrib import admin

from .models import (
    Profile,
    Resource,
    Author,
    ProfilePopulation,
    ProfileRole,
    ResourceLanguages,
    ResourceUseType,
    ResourceAudience,
    ResourceType,
    SignupChoice,
    ResourceStatus,
    Device
)


admin.site.register(Profile)
admin.site.register(Resource)
admin.site.register(Author)
admin.site.register(ProfilePopulation)
admin.site.register(ProfileRole)
admin.site.register(ResourceLanguages)
admin.site.register(ResourceUseType)
admin.site.register(ResourceAudience)
admin.site.register(ResourceType)
admin.site.register(SignupChoice)
admin.site.register(ResourceStatus)
admin.site.register(Device)