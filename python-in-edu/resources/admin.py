from django.contrib import admin

from .models import (
    Profile,
    Resource,
    Author,
    ProfilePopulation,
    ProfileRole,
    ResourceLanguage,
    ResourceUseType,
    ResourceAudience,
    ResourceType,
    SignupChoice,
    ResourceStatus,
    Device,
    Organization
)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'organization',
        'country',
        'populations',
        'psf_member'
    ]
    list_filter = [
        'user',
        'organization',
        'country',
        'populations',
        'psf_member'
    ]

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = [
        'name'
    ]

@admin.register(ProfilePopulation)
class ProfilePopulationAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'active',
        'underrepresented'
    ]
    list_filter = [
        'name',
        'active',
        'underrepresented'
    ]

@admin.register(ProfileRole)
class ProfileRoleAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'active'
    ]
    list_filter = [
        'name',
        'active'
    ]


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = [
        'title',
        'submitter',
        'status',
        'description'
    ]
    list_filter = [
        'submitter',
        'status'
    ]

@admin.register(ResourceLanguage)
class ResourceLanguageAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'description',
        'active'
    ]
    list_filter = [
        'name',
        'active'
    ]


@admin.register(ResourceUseType)
class ResourceUseTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'description',
        'active'
    ]
    list_filter = [
        'active'
    ]


@admin.register(ResourceAudience)
class ResourceAudienceAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'description',
        'active'
    ]
    list_filter = [
        'active'
    ]


@admin.register(ResourceType)
class ResourceTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'description',
        'active'
    ]
    list_filter = [
        'active'
    ]


@admin.register(SignupChoice)
class SignupChoiceAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'description',
        'active'
    ]
    list_filter = [
        'active'
    ]


@admin.register(ResourceStatus)
class ResourceStatusAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'description',
        'active',
        'sequence'
    ]
    list_filter = [
        'active'
    ]


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'active'
    ]
    list_filter = [
        'active'
    ]


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = [
        'name',
        'description',
        'active'
    ]
    list_filter = [
        'active'
    ]
