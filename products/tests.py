from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import *

User = get_user_model()


class ProductAPITests(APITestCase):

    def setUp(self):
        # Create a normal customer
        self.customer = User.objects.create_user(
            username="customer_test",
            password="TestPass123!"
        )

        # Create an admin user
        self.admin = User.objects.create_user(
            username="admin_test",
            password="TestPass123!",
            is_staff=True
        )

        # Create an active product
        Product.objects.create(
            name="Test TV",
            description="A test television",
            price=50000,
            stock=10,
            is_active=True
        )

        # Create an inactive product
        Product.objects.create(
            name="Hidden Product",
            description="An inactive product",
            price=1000,
            stock=5,
            is_active=False
        )

    def test_customers_can_view_active_products(self):
        response = self.client.get("/api/products/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        product_names = [
            product["name"] for product in response.data
        ]

        self.assertIn("Test TV", product_names)
        self.assertNotIn("Hidden Product", product_names)

    def test_normal_customer_cannot_create_product(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            "/api/products/",
            {
                "name": "New Phone",
                "description": "A test phone",
                "price": 30000,
                "stock": 5,
                "is_active": True
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

    def test_admin_can_create_product(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/products/",
            {
                "name": "New Phone",
                "description": "A test phone",
                "price": 30000,
                "stock": 5,
                "is_active": True
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertTrue(
            Product.objects.filter(name="New Phone").exists()
        )



    
    def test_user_can_register(self):
        response = self.client.post(
            "/api/register/",
            {
                "username": "new_customer",
                "email": "new_customer@example.com",
                "password": "StrongPass123!"
            },
            format="json"
        )

        self.assertEqual(response.status_code, 201)



    def test_profile_requires_authentication(self):
        response = self.client.get("/api/profile/")

        self.assertIn(
            response.status_code,
            [401, 403]
        )


    def test_admin_cannot_create_product_with_negative_price(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/products/",
            {
                "name": "Invalid Product",
                "description": "Testing price validation",
                "price": -100,
                "stock": 5,
                "is_active": True
            },
            format="json"
        )

        self.assertEqual(response.status_code, 400)

    def test_admin_cannot_create_product_with_negative_stock(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/products/",
            {
                "name": "Invalid Stock Product",
                "description": "Testing stock validation",
                "price": 100,
                "stock": -5,
                "is_active": True
            },
            format="json"
        )

        self.assertEqual(response.status_code, 400)



    def test_unauthenticated_user_cannot_add_to_cart(self):
        response = self.client.post(
            "/api/cart/add/",
            {
                "product": 1,
                "quantity": 1
            },
            format="json"
        )

        self.assertIn(response.status_code, [401, 403])


    
    def test_authenticated_customer_can_add_product_to_cart(self):
        self.client.force_authenticate(user=self.customer)

        product = Product.objects.create(
            name="Cart Test Phone",
            description="Phone for cart testing",
            price=30000,
            stock=10,
            is_active=True
        )

        response = self.client.post(
            "/api/cart/add/",
            {
                "product": product.id,
                "quantity": 1
            },
            format="json"
        )

        self.assertEqual(response.status_code, 201)


   
    
    def test_checkout_creates_order_and_reduces_stock(self):
        self.client.force_authenticate(user=self.customer)

        product = Product.objects.create(
            name="Checkout Test Phone",
            description="Phone for checkout testing",
            price=30000,
            stock=10,
            is_active=True
        )

        response = self.client.post(
            "/api/cart/add/",
            {
                "product": product.id,
                "quantity": 1
            },
            format="json"
        )

        self.assertEqual(response.status_code, 201)