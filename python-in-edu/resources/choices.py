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


class UserRoleChoices(models.TextChoices):
    STUDENT = 'STD', _('Student')
    PS_EDUCATOR_SCHOOL = 'PES', _('Primary/Secondary Educator (school setting)')
    PS_EDUCATOR_OO_SCHOOL = 'PEO', _('Primary/Secondary Educator (out of school setting)')
    TEACHING_FACULTY = 'TF', _('Teaching Faculty (post-secondary)')
    ADULT_EDU_BOOTCAMP_ETC = 'AEB', _('Adult Educator or Trainer (bootcamp, industry)')
    ADULT_EDU_COACHING_ETC = 'AEC', _('Adult Educator or Trainer (teacher PD, coaching)')
    CURRICULUM_DEVELOPER = 'CUR', _('Curriculum or Product Developer')
    EDUCATION_VOLUNTEER = 'VOL', _('Education Volunteer')
    RESEARCHER = 'RES', _('Researcher')
    MENTOR = 'MNT', _('Mentor')
    INDUSTRY_PROF = 'INP', _('Industry Professional (Tech/Software/CS)')
    EDUCATION_DEVELOPER = 'EDV', _('Educational program developer')
    PARENT = 'PRT', _('Parent supporting education')
    OTHER = 'OTH', _('Other')


class PopulationChoices(models.TextChoices):
    PRIMARY = 'PRI', _('Primary')
    SECONDAY = 'SEC', _('Secondary ')
    COLLEGE = 'COL', _('College/University')
    ADULT = 'ADU', _('Adult/Professional')
    OTHER = 'OTH', _('Other')
    NONE = 'NON', _('None')










