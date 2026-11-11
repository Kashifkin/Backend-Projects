from decimal import Decimal
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import *
from .serializers import *
from .permission import IsAdminOrReadOnly
from .services import checkout_user


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Product.objects.all()

      
        if not (
            self.request.user.is_authenticated
            and self.request.user.is_staff
        ):
            queryset = queryset.filter(is_active=True)

        return queryset.order_by("id")


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Product.objects.all()

       
        if not (
            self.request.user.is_authenticated
            and self.request.user.is_staff
        ):
            queryset = queryset.filter(is_active=True)

        return queryset



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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_reference = serializer.validated_data.get("product")
        quantity = serializer.validated_data.get("quantity", 1)

        if quantity < 1:
            raise ValidationError({
                "quantity": "Quantity must be at least 1."
            })

      
        try:
            product_id = getattr(product_reference, "pk", product_reference)

            product = Product.objects.get(
                pk=product_id,
                is_active=True,
            )
        except (Product.DoesNotExist, TypeError, ValueError):
            raise ValidationError({
                "product": "Product does not exist or is inactive."
            })

        with transaction.atomic():
            cart, _ = Cart.objects.get_or_create(
                user=request.user
            )

        
            product = Product.objects.select_for_update().get(
                pk=product.pk
            )

            item = CartItem.objects.select_for_update().filter(
                cart=cart,
                product=product,
            ).first()

            new_quantity = quantity

            if item:
                new_quantity += item.quantity

            if new_quantity > product.stock:
                raise ValidationError({
                    "quantity": (
                        f"Only {product.stock} units are available."
                    )
                })

            if item:
                item.quantity = new_quantity
                item.save(update_fields=["quantity"])
            else:
                item = CartItem.objects.create(
                    cart=cart,
                    product=product,
                    quantity=new_quantity,
                )

        output_serializer = self.get_serializer(item)

        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class UpdateCartItemView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return (
            CartItem.objects
            .filter(cart__user=self.request.user)
            .select_related("product", "cart")
        )

    def perform_update(self, serializer):
        quantity = serializer.validated_data.get(
            "quantity",
            serializer.instance.quantity,
        )

        if quantity < 1:
            raise ValidationError({
                "quantity": "Quantity must be at least 1."
            })

        with transaction.atomic():
            product = Product.objects.select_for_update().get(
                pk=serializer.instance.product_id
            )

            if not product.is_active:
                raise ValidationError({
                    "product": "This product is no longer available."
                })

            if quantity > product.stock:
                raise ValidationError({
                    "quantity": (
                        f"Only {product.stock} units are available."
                    )
                })

            serializer.save()





class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order = checkout_user(
            user=request.user,
            delivery_address=request.data.get("delivery_address", ""),
        )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )





class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .prefetch_related("items")
            .order_by("-created_at")
        )



class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
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

        allowed_statuses = {
            "pending",
            "processing",
            "shipped",
            "delivered",
        }

        if new_status not in allowed_statuses:
            raise ValidationError({
                "status": (
                    "Invalid status. Choose pending, processing, "
                    "shipped, or delivered."
                )
            })

        order.status = new_status
        order.save(update_fields=["status"])

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_200_OK,
        )
