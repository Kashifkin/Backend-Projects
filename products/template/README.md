# Northstar E-commerce Frontend

React + Vite storefront designed to connect to your existing Django REST Framework API.

## Run it

1. Extract this folder.
2. Open a terminal in this folder.
3. Run:

```bash
npm install
npm run dev
```

4. Open the local URL printed by Vite.

## Django API expectations

By default, this app uses `http://127.0.0.1:8000/api`. Override it by creating `.env`:

```env
VITE_API_BASE=http://127.0.0.1:8000/api
```

Expected endpoints:
- `GET /api/products/`
- `POST /api/register/` with `{ "username", "email", "password" }`
- `POST /api/token/` with `{ "username", "password" }`
- `GET /api/cart/`
- `POST /api/cart/add/` with `{ "product": id, "quantity": 1 }`
- `PATCH /api/cart/items/:id/` with `{ "quantity": number }`
- `DELETE /api/cart/items/:id/`

The last two cart-item routes require the `UpdateCartItemView` and URL pattern to be added to your Django project as discussed.

## Important backend setup

If frontend requests fail due to CORS, install `django-cors-headers`, add `corsheaders` to `INSTALLED_APPS`, add `corsheaders.middleware.CorsMiddleware` near the top of `MIDDLEWARE`, and configure a development origin such as `CORS_ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]`.

This frontend uses the existing SimpleJWT token endpoint and stores the access token in browser localStorage for this learning project. For production, review authentication storage and security practices.

If the API is not running or product loading fails, the storefront displays sample preview products. Preview products cannot be added to the server cart.
