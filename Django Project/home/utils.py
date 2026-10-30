from home.utils import *
import time
from django.core.mail import send_mail
from django.conf import settings


def run_function():
    print("Function Starting")
    time.sleep(10)
    print("Function Execute")
    
    
    
def send_email_to_client():
    subject = "This Email is from Django"
    message = "This is a test Message"
    from_email = settings.EMAIL_HOST_USER
    recipient_list = ["kashif22king@gmail.com"]
    
    send_mail(subject,message,from_email,recipient_list)