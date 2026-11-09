from rest_framework import serializers
from django.contrib.auth.models import User
from .models import *


class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "stock",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Product name cannot be empty.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Price must be greater than zero.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Stock cannot be negative.")
        return value

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True,min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]

    def validate_email(self, value):
        value = value.strip().lower()

        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "This email address is already registered."
            )

        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )
    
class CustomerProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomerProfile
        fields = ["user", "phone_number", "address"]
        read_only_fields = ["user"]
        
        
class CartItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(source="product.name",read_only=True)
    product_price = serializers.DecimalField(source="product.price",max_digits=10,decimal_places=2,read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "quantity"
        ]
        read_only_fields = ["id"]
        
        
class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "created_at", "items"]
        
        



class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "price",
            "quantity",
        ]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "delivery_address",
            "total_amount",
            "status",
            "created_at",
            "items",
        ]
        read_only_fields = [
            "id",
            "total_amount",
            "status",
            "created_at",
            "items",
        ]

    