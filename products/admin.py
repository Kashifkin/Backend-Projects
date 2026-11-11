
from django.contrib import admin
from .models import *


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "price",
        "stock",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active", "created_at")
    search_fields = ("name", "description")
    list_editable = ("price", "stock", "is_active")
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "phone_number")
    search_fields = ("user__username", "user__email", "phone_number")


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    autocomplete_fields = ("product",)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("created_at",)
    inlines = (CartItemInline,)


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "product", "quantity")
    list_select_related = ("cart", "product")
    search_fields = ("product__name", "cart__user__username")


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = (
        "product",
        "product_name",
        "price",
        "quantity",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "total_amount",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = (
        "user__username",
        "user__email",
        "delivery_address",
    )
    readonly_fields = (
        "user",
        "delivery_address",
        "total_amount",
        "created_at",
    )
    list_select_related = ("user",)
    inlines = (OrderItemInline,)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "product_name",
        "price",
        "quantity",
    )
    list_select_related = ("order", "product")
    search_fields = (
        "product_name",
        "order__user__username",
    )
    readonly_fields = (
        "order",
        "product",
        "product_name",
        "price",
        "quantity",
    )
