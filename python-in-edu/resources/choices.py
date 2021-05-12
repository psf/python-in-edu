from django.utils.translation import gettext_lazy as _
from django.db import models


class ResourceStatusChoices(models.TextChoices):
    PROPOSED = 'PR', _('Proposed')
    ACCEPTED = 'AC', _('Accepted')
    REJECTED = 'RJ', _('Rejected')
    WITHDRAWN = 'WD', _('Withdrawn')


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


class UseTypeChoices(models.TextChoices):
    OPEN_SOURCE_PROJECT = 'OSP', _('Open Source Project - accepts contributions')
    OPEN_EDUCATION_RESOURCE = 'OER', _('Open Education Resource - ok to distribute and/or revise/remix')
    FREE_RESOURCE = 'FRE', _('Free Resource - free to use')
    FREEMIUM = 'IUM', _('Freemium - significant portion of resource free to use')
    PAID = 'PAI', _('Paid - costs money to access this resource')
    UNKOWN = 'UNK', _('Bleh')

class PythonChoices(models.TextChoices):
    PYTHON_SPECIFIC = 'PS', _('Python Specific - part or all of resource is Python specific')
    LANGUAGE_AGNOSTIC = 'LA', _('Language Agnostic - can be used with any programming language')
    UNKNOWN = 'UN',_('Unkown')
    
class SignUpChoices(models.TextChoices):
    CREATE_ACCOUNT = 'CA', _('Must create an account')
    PROVIDE_EMAIL = 'PE', _('Must provide email address')
    NO_REQUIREMENT = 'NR',_('No sign up requirement')







