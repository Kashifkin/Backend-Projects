from django.shortcuts import get_object_or_404, redirect,render
from django.views.decorators.http import require_POST
from Employees_Data.models import Employee
from django.contrib.auth import authenticate, login , logout
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .utils import send_email_to_client

def home(request):
    
    students = [
    {
        "id": 1,
        "name": "Ali",
        "age": 20,
        "course": "BS English",
        "city": "Islamabad"
    },
    {
        "id": 2,
        "name": "Sara",
        "age": 21,
        "course": "Computer Science",
        "city": "Lahore"
    },
    {
        "id": 3,
        "name": "Ahmed",
        "age": 22,
        "course": "Software Engineering",
        "city": "Peshawar"
    },
    {
        "id": 4,
        "name": "Ayesha",
        "age": 17,
        "course": "Psychology",
        "city": "Karachi"
    },
    {
        "id": 5,
        "name": "Usman",
        "age": 17,
        "course": "Data Science",
        "city": "Rawalpindi"
    }
]
    return render(request, "index.html",context={"Students":students})


def about(request):
    return render(request,"about.html")

def contact(request):
    return render(request,"home.html")


@login_required(login_url="login")
def Employees(request):
    if request.method == "POST":
        data = request.POST

        Employee_Name = data.get("Employee_name")
        Department = data.get("department")
        Age = data.get("age")
        Image = request.FILES.get("image")

        Employee.objects.create(
            employee_name=Employee_Name,
            department=Department,
            age=Age,
            image=Image
        )

        return redirect("/Employees/")

    Emp = Employee.objects.all()
    context = {"Employees": Emp}

    return render(request, "Employees.html", context)



@login_required(login_url="login")
def delete_employee(request, employee_id):
    employee = get_object_or_404(Employee, id=employee_id)
    employee.delete()
    return redirect("/Employees/")


@login_required(login_url="login")
def update_employee(request, employee_id):
    employee = get_object_or_404(Employee, id=employee_id)

    if request.method == "POST":
        employee.employee_name = request.POST.get("Employee_name")
        employee.department = request.POST.get("department")
        employee.age = request.POST.get("age")

        if request.FILES.get("image"):
            employee.image = request.FILES.get("image")

        employee.save()
        return redirect("/Employees/")

    return render(request, "update_employees.html", {"employee": employee})






def login_page(request):
    if request.method == "POST":
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")

        # Find registered user by email
        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            messages.error(request, "Email is not registered.")
            return redirect("login")

        # Check the password
        user = authenticate(
            request,
            username=user_obj.username,
            password=password
        )

        if user is not None:
            login(request, user)

            # Remember me: keep session after browser closes
            if request.POST.get("remember_me"):
                request.session.set_expiry(1209600)
            else:
                request.session.set_expiry(0)

            return redirect("/Employees/")  # Replace with your actual URL name

        messages.error(request, "Incorrect password.")
        return redirect("login")

    return render(request, "login.html")



def register_page(request):
    if request.method == "POST":
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        # Check required fields
        if not all([
            first_name, last_name, username,
            email, password, confirm_password
        ]):
            messages.error(request, "Please fill in all fields.")
            return redirect("register")

        # Check password confirmation
        if password != confirm_password:
            messages.error(request, "Passwords do not match.")
            return redirect("register")

        # Check duplicate username
        if User.objects.filter(username__iexact=username).exists():
            messages.error(request, "This username is already taken.")
            return redirect("register")

        # Check duplicate email
        if User.objects.filter(email__iexact=email).exists():
            messages.error(
                request,
                "This email is already registered. Please use another email."
            )
            return redirect("register")

        # Create the account with separate username and email
        User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        messages.success(
            request,
            "Registration successful! Please log in."
        )
        return redirect("login")

    return render(request, "register.html")



def logout_page(request):
    logout(request)
    return redirect("login")


def send_email(request):
    send_email_to_client()
    return redirect("/")
    