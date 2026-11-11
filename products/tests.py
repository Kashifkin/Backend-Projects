
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import *

User = get_user_model()


class ProductAPITests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username="customer_test",
            password="TestPass123!",
        )

        self.admin = User.objects.create_user(
            username="admin_test",
            password="TestPass123!",
            is_staff=True,
        )

        self.product = Product.objects.create(
            name="Test TV",
            description="A test television",
            price=Decimal("50000.00"),
            stock=10,
            is_active=True,
        )

        self.inactive_product = Product.objects.create(
            name="Hidden Product",
            description="An inactive product",
            price=Decimal("1000.00"),
            stock=5,
            is_active=False,
        )

    def test_customers_can_view_active_products(self):
        response = self.client.get("/api/products/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        product_names = [item["name"] for item in response.data]
        self.assertIn("Test TV", product_names)
        self.assertNotIn("Hidden Product", product_names)

    def test_normal_customer_cannot_create_product(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            "/api/products/",
            {
                "name": "New Phone",
                "description": "A test phone",
                "price": "30000.00",
                "stock": 5,
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_unauthenticated_user_cannot_create_product(self):
        response = self.client.post(
            "/api/products/",
            {
                "name": "New Phone",
                "price": "30000.00",
                "stock": 5,
            },
            format="json",
        )

        self.assertIn(response.status_code, [401, 403])

    def test_admin_can_create_product(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/products/",
            {
                "name": "New Phone",
                "description": "A test phone",
                "price": "30000.00",
                "stock": 5,
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertTrue(
            Product.objects.filter(name="New Phone").exists()
        )

    def test_admin_cannot_create_product_with_negative_price(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/products/",
            {
                "name": "Invalid Product",
                "price": "-100.00",
                "stock": 5,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_create_product_with_negative_stock(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            "/api/products/",
            {
                "name": "Invalid Stock Product",
                "price": "100.00",
                "stock": -5,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_can_register(self):
        response = self.client.post(
            "/api/register/",
            {
                "username": "new_customer",
                "email": "new_customer@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username="new_customer").exists()
        )

    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(
            username="existing_user",
            email="existing@example.com",
            password="TestPass123!",
        )

        response = self.client.post(
            "/api/register/",
            {
                "username": "another_user",
                "email": "EXISTING@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_requires_authentication(self):
        response = self.client.get("/api/profile/")
        self.assertIn(response.status_code, [401, 403])

    def test_unauthenticated_user_cannot_add_to_cart(self):
        response = self.client.post(
            "/api/cart/add/",
            {"product": self.product.pk, "quantity": 1},
            format="json",
        )

        self.assertIn(response.status_code, [401, 403])

    def test_authenticated_customer_can_add_product_to_cart(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            "/api/cart/add/",
            {"product": self.product.pk, "quantity": 1},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            CartItem.objects.filter(
                cart__user=self.customer,
                product=self.product,
                quantity=1,
            ).exists()
        )

    def test_inactive_product_cannot_be_added_to_cart(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            "/api/cart/add/",
            {"product": self.inactive_product.pk, "quantity": 1},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cart_add_rejects_quantity_above_stock(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            "/api/cart/add/",
            {"product": self.product.pk, "quantity": 11},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_creates_order_and_reduces_stock(self):
        self.client.force_authenticate(user=self.customer)

        self.client.post(
            "/api/cart/add/",
            {"product": self.product.pk, "quantity": 2},
            format="json",
        )

        response = self.client.post(
            "/api/checkout/",
            {"delivery_address": "Test Street, Rawalpindi"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)

        order = Order.objects.get(user=self.customer)
        self.assertEqual(order.total_amount, Decimal("100000.00"))
        self.assertEqual(order.delivery_address, "Test Street, Rawalpindi")

        self.assertTrue(
            OrderItem.objects.filter(
                order=order,
                product_name="Test TV",
                price=Decimal("50000.00"),
                quantity=2,
            ).exists()
        )

        self.assertFalse(
            CartItem.objects.filter(cart__user=self.customer).exists()
        )

    def test_checkout_rejects_empty_cart(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            "/api/checkout/",
            {"delivery_address": "Test Street"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.filter(user=self.customer).exists())

    def test_checkout_rejects_missing_delivery_address(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            "/api/checkout/",
            {"delivery_address": "   "},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_customer_can_only_view_own_orders(self):
        other_customer = User.objects.create_user(
            username="other_customer",
            password="TestPass123!",
        )

        Order.objects.create(
            user=other_customer,
            delivery_address="Other address",
            total_amount=Decimal("100.00"),
        )

        self.client.force_authenticate(user=self.customer)

        response = self.client.get("/api/orders/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
