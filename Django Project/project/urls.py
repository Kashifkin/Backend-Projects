"""
URL configuration for project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
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


from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from home.views import *
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib.auth import views as auth_views

urlpatterns = [
    path("", home),
    path("about/", about),
    path("contact/", contact),
    path("Employees/", Employees),
    path("admin/", admin.site.urls),
    path("Employees/delete/<int:employee_id>/",delete_employee,name="delete_employee",
),
    path("Employees/update/<int:employee_id>/",update_employee,name="update_employee",),
    path("register/", register_page, name="register"),
    path("login/", login_page, name="login"),
    path("logout/", logout_page, name="logout"),


]

# Serve uploaded images during development
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )

urlpatterns += staticfiles_urlpatterns()
