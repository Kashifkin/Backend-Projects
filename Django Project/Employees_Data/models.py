from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Employee(models.Model):
    user = models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True)
    employee_name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    age = models.PositiveIntegerField()
    image = models.ImageField(upload_to="employees/")
    Employees_Count = models.IntegerField(default=1)