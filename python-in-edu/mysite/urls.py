"""mysite URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin, staticfiles
from django.contrib.staticfiles.storage import staticfiles_storage
from django.urls import include, path
from django.views.generic import RedirectView

from .views import IndexView

urlpatterns = [
    path('', IndexView.as_view(), name='index'),
    path('accounts/', include('django_registration.backends.activation.urls')),
    path('accounts/', include(('django.contrib.auth.urls'))),
    path('resources/', include('resources.urls')),
    path('admin/', admin.site.urls),
    path('forum/', RedirectView.as_view(url="https://discuss.python.org/c/education/31")),
    path('favicon.ico', RedirectView.as_view(url=staticfiles_storage.url('favicon.ico')))
]
