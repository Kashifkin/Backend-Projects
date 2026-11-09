
from decimal import Decimal

from django.contrib.auth.models import User
from django.db import transaction

from rest_framework import generics, status
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import *
from .serializers import *
from .permission import *


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]


class Register(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class CustomerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CustomerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile, _ = CustomerProfile.objects.get_or_create(
            user=self.request.user
        )
        return profile


class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        cart, _ = Cart.objects.get_or_create(
            user=self.request.user
        )
        return cart


class AddToCartView(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        product_id = serializer.validated_data.get("product")
        quantity = serializer.validated_data.get("quantity", 1)

        if quantity < 1:
            raise ValidationError({
                "quantity": "Quantity must be at least 1."
            })

        try:
            product = Product.objects.get(
                id=product_id.id,
                is_active=True
            )
        except (Product.DoesNotExist, AttributeError, ValueError, TypeError):
            raise ValidationError({
                "product": "Product does not exist or is inactive."
            })

        cart, _ = Cart.objects.get_or_create(
            user=self.request.user
        )

        item = CartItem.objects.filter(
            cart=cart,
            product=product
        ).first()

        if item:
            quantity += item.quantity

        if quantity > product.stock:
            raise ValidationError({
                "quantity": f"Only {product.stock} units are available."
            })

        if item:
            item.quantity = quantity
            item.save(update_fields=["quantity"])
        else:
            item = CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity
            )

        serializer.instance = item


class UpdateCartItemView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return CartItem.objects.filter(
            cart__user=self.request.user
        )

    def perform_update(self, serializer):
        quantity = serializer.validated_data.get(
            "quantity",
            serializer.instance.quantity
        )

        if quantity < 1:
            raise ValidationError({
                "quantity": "Quantity must be at least 1."
            })

        product = serializer.instance.product

        if quantity > product.stock:
            raise ValidationError({
                "quantity": f"Only {product.stock} units are available."
            })

        serializer.save()


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        address = request.data.get("delivery_address", "").strip()

        if not address:
            raise ValidationError({
                "delivery_address": "Please enter your delivery address."
            })

        with transaction.atomic():
            Cart.objects.get_or_create(user=request.user)

            cart = Cart.objects.select_for_update().get(
                user=request.user
            )

            cart_items = list(
                cart.items.select_related("product")
            )

            if not cart_items:
                raise ValidationError({
                    "cart": "Your cart is empty."
                })

            products = {}
            total = Decimal("0.00")

            for item in cart_items:
                try:
                    product = Product.objects.select_for_update().get(
                        id=item.product_id,
                        is_active=True
                    )
                except Product.DoesNotExist:
                    raise ValidationError({
                        "product": f"{item.product.name} is not available."
                    })

                if item.quantity < 1 or item.quantity > product.stock:
                    raise ValidationError({
                        "stock": f"Not enough stock for {product.name}."
                    })

                products[item.id] = product
                total += product.price * item.quantity

            order = Order.objects.create(
                user=request.user,
                delivery_address=address,
                total_amount=total
            )

            for item in cart_items:
                product = products[item.id]

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    price=product.price,
                    quantity=item.quantity
                )

                product.stock -= item.quantity
                product.save(update_fields=["stock"])

            cart.items.all().delete()

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )


class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects
            .filter(user=request.user)
            .prefetch_related("items")
            .order_by("-created_at")
        )

        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Only staff members can manage all orders."
            )

        return (
            Order.objects
            .select_related("user")
            .prefetch_related("items")
            .order_by("-created_at")
        )


class AdminOrderStatusUpdateView(generics.UpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["patch", "head", "options"]

    def get_queryset(self):
        return Order.objects.all()

    def patch(self, request, *args, **kwargs):
        order = self.get_object()
        new_status = request.data.get("status")

        allowed_statuses = [
            "pending",
            "processing",
            "shipped",
            "delivered",
        ]

        if new_status not in allowed_statuses:
            raise ValidationError({
                "status": (
                    "Invalid status. Choose pending, processing, "
                    "shipped, or delivered."
                )
            })

        order.status = new_status
        order.save(update_fields=["status"])

        return Response(OrderSerializer(order).data)
