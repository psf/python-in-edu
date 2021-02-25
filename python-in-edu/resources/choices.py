from django.utils.translation import gettext_lazy as _
from django.db import models


class ResourceTypeChoices(models.TextChoices):
    PLATFORM_APP = 'PA', _('Platform or App')
    CURRICULUM = 'CU', _('Curriculum')
    TUTORIAL_COURSE = 'TC', _('Tutorial or Course')
    BOOK = 'BK', _('Book')
    WORKED_EXAMPLE = 'WE', _('Worked Example')
    DOCUMENTATION = 'DC', _('Documentation')
    OTHER = 'OT', _('Other')


class AudienceChoices(models.TextChoices):
    K_THROUGH_12 = 'K12', _('K-12')
    HIGHER_ED = 'HIE', _('Higher Education')
    PROFESSIONAL_TRAINING = 'PFT', _('Professional Training')
    NOT_SPECIFIC = 'NSP', _('Not Specific')
    OTHER = 'OTH', _('Other')


class DeviceChoices(models.TextChoices):
    DESKTOP_OR = 'DOL', _('Desktop or Laptop Computer')
    CHROMEBOOK_OR = 'CON', _('Chromebook or Other Netbook')
    IPAD = 'IPD', _('iPad')
    ANDROID_TABLET = 'ATB', _('Android Tablet')
    IPHONE = 'IPH', _('iPhone')
    ANDROID_PHONE = 'APH', _('Android Phone')
    RASPBERRY_PI = 'RSP', _('Raspberry Pi')
    MICROCONTROLLERS = 'MCC', _('Microcontroller(s)')
    OTHER = 'OTH', _('Other')
