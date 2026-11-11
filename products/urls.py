
from django.urls import path
from .views import *


urlpatterns = [
    path("products/", ProductListCreateView.as_view(), name="product-list-create"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product-detail"),
    path("register/", Register.as_view(), name="register"),
    path("profile/", CustomerProfileView.as_view(), name="customer-profile"),
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/add/", AddToCartView.as_view(), name="AddCart"),
    path("cart/items/<int:pk>/", UpdateCartItemView.as_view(), name="cart-item-detail"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("orders/", OrderListView.as_view(), name="orders"),
    path("admin/orders/",AdminOrderListView.as_view(),name="admin-orders"),
    path("admin/orders/<int:pk>/status/",AdminOrderStatusUpdateView.as_view(),name="admin-order-status-update"),
]
