
from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import *


@transaction.atomic
def checkout_user(*, user, delivery_address):
    if not isinstance(delivery_address, str) or not delivery_address.strip():
        raise ValidationError({
            "delivery_address": "Please enter your delivery address."
        })

    cart, _ = Cart.objects.get_or_create(user=user)
    cart = Cart.objects.select_for_update().get(
        pk=cart.pk,
        user=user,
    )

    cart_items = list(
        cart.items.select_related("product").order_by("product_id")
    )

    if not cart_items:
        raise ValidationError({"cart": "Your cart is empty."})

    products = {}
    total = Decimal("0.00")

    for item in cart_items:
        try:
            product = Product.objects.select_for_update().get(
                pk=item.product_id,
                is_active=True,
            )
        except Product.DoesNotExist:
            raise ValidationError({
                "product": f"{item.product.name} is not available."
            })

        if item.quantity < 1:
            raise ValidationError({
                "quantity": f"Invalid quantity for {product.name}."
            })

        if item.quantity > product.stock:
            raise ValidationError({
                "stock": (
                    f"Not enough stock for {product.name}. "
                    f"Available: {product.stock}."
                )
            })

        products[item.pk] = product
        total += product.price * item.quantity

    order = Order.objects.create(
        user=user,
        delivery_address=delivery_address.strip(),
        total_amount=total,
    )

    order_items = []

    for item in cart_items:
        product = products[item.pk]

        order_items.append(
            OrderItem(
                order=order,
                product=product,
                product_name=product.name,
                price=product.price,
                quantity=item.quantity,
            )
        )

        product.stock -= item.quantity
        product.save(update_fields=["stock"])

    OrderItem.objects.bulk_create(order_items)
    cart.items.all().delete()

    return order
