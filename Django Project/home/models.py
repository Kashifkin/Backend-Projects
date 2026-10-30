from django.db import models

class Person(models.Model):
    name = models.CharField(max_length=100)
    age = models.PositiveIntegerField()
    email = models.EmailField(null=True,blank=True)
    address = models.TextField(null=True,blank=True)
    
    
    
class Car(models.Model):
    name = models.CharField(max_length=100)
    speed = models.IntegerField(default=50)
    
    
    
    def __str__(self):
        return self.name