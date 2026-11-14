# Django E-Commerce Backend API

A RESTful e-commerce backend built with Django and Django REST Framework. This project provides product management, user authentication, shopping cart functionality, checkout processing, and order management, with a focus on security, maintainability, and reliable business logic.

## Features

- **Product Management:** Browse active products and manage products with appropriate permissions.
- **User Authentication:** User registration, login, and JWT-based authentication.
- **Role-Based Access Control:** Restrict administrative operations to authorized users.
- **Shopping Cart:** Add products to the cart and manage cart items.
- **Checkout System:** Process orders with stock validation, inventory updates, and cart clearing.
- **Order Management:** Allow customers to view their orders and administrators to manage orders.
- **Service Layer:** Separate business logic from API views using a dedicated `services.py` module.
- **Database Optimization:** Database indexes, constraints, and query optimization.
- **API Documentation:** Interactive Swagger/OpenAPI documentation using `drf-spectacular`.
- **Automated Testing:** Django test suite covering API behavior, authentication, permissions, cart operations, and checkout.
- **Continuous Integration:** GitHub Actions workflow for automated checks and tests.
- **Environment Configuration:** Manage configuration and secrets through environment variables.
- **Cloud Media Storage:** Cloudinary integration for uploaded media.
- **Error Monitoring:** Sentry integration for application error monitoring.
- **Deployment Preparation:** Production configuration and a build script for deployment without Docker.

## Technology Stack

- Python
- Django
- Django REST Framework
- PostgreSQL
- SQLite for local development when configured
- Simple JWT
- drf-spectacular
- python-decouple
- Cloudinary
- Sentry SDK
- Gunicorn
- WhiteNoise
- GitHub Actions

## Project Structure

```text
Backend Project/
├── .github/
│   └── workflows/
│       └── django.yml
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── products/
│   ├── migrations/
│   ├── admin.py
│   ├── models.py
│   ├── permission.py
│   ├── serializers.py
│   ├── services.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
├── .env
├── .gitignore
├── build.sh
├── manage.py
└── requirements.txt
```

## Requirements

- Python compatible with the installed Django version
- pip
- PostgreSQL for PostgreSQL-based development
- Git

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Kashifkin/Backend-Projects.git
cd Backend-Projects
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

On macOS or Linux:

```bash
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root, alongside `manage.py`.

Example configuration for local PostgreSQL:

```dotenv
SECRET_KEY=replace-with-a-secure-secret
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=postgres
DB_NAME=Backend_DB
DB_USER=postgres
DB_PASSWORD=your-local-postgres-password
DB_HOST=localhost
DB_PORT=5432

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

Adjust the database settings to match your local PostgreSQL installation. Supply third-party credentials only if you use those integrations.

Never commit your `.env` file, passwords, API secrets, or production credentials to version control.

### 5. Apply database migrations

```bash
python manage.py migrate
```

### 6. Create an administrator account

```bash
python manage.py createsuperuser
```

Follow the prompts to create the account.

### 7. Start the development server

```bash
python manage.py runserver
```

The local API will be available at:

`http://127.0.0.1:8000/`

## API Documentation

When the development server is running, access the API documentation at:

- **Swagger UI:** `http://127.0.0.1:8000/api/docs/`
- **OpenAPI schema:** `http://127.0.0.1:8000/api/schema/`

These paths depend on the URL configuration in `config/urls.py`.

## API Endpoints

The following table summarizes the main endpoints implemented in the project.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products/` | List available products |
| POST | `/api/register/` | Register a user |
| GET | `/api/profile/` | Retrieve the authenticated user's profile |
| GET | `/api/cart/` | View the shopping cart |
| POST | `/api/cart/add/` | Add a product to the cart |
| GET | `/api/cart-items/` | Retrieve cart items |
| POST | `/api/checkout/` | Create an order from the cart |
| GET | `/api/orders/` | View the authenticated user's orders |
| GET | `/api/admin/orders/` | Access administrative order management |
| PATCH | `/api/admin/orders/<id>/status/` | Update an order's status |

Authentication and permissions vary by endpoint. Refer to the project's URL configuration and Swagger documentation for the exact request and response formats.

## Authentication

The API uses JSON Web Tokens through Simple JWT.

Clients must obtain an access token using the authentication endpoint configured in the project and include it in protected requests:

```http
Authorization: Bearer <access_token>
```

Registration, login, and token refresh paths should be confirmed from the project's URL configuration.

## Checkout Workflow

The checkout business logic is separated into `products/services.py`.

The checkout process is designed to:

1. Retrieve the customer's cart.
2. Validate product availability and stock.
3. Create the order and associated order items.
4. Decrease product inventory.
5. Clear the customer's cart.
6. Use database transactions to maintain consistency if an operation fails.

The checkout endpoint requires authentication.

## Testing

Run the complete Django test suite:

```bash
python manage.py test
```

Run Django's system checks:

```bash
python manage.py check
```

The test suite covers important application behavior, including product visibility, user registration, permissions, cart functionality, checkout, stock handling, and order access.

GitHub Actions is configured to run automated checks and tests on supported pushes and pull requests.

## Security Considerations

- Store secrets in environment variables rather than source code.
- Keep `DEBUG=False` in production.
- Configure `ALLOWED_HOSTS` for the actual deployment domain.
- Configure CORS and CSRF trusted origins for the intended frontend.
- Enable secure cookies and HTTPS-related settings in production.
- Use a strong, unique production `SECRET_KEY`.
- Restrict administrative endpoints to authorized users.
- Avoid exposing database credentials, Sentry configuration details, or Cloudinary secrets.
- Keep dependencies updated and review security advisories.

## Deployment

The project includes deployment preparation for a Python hosting platform using Gunicorn, WhiteNoise, environment variables, and PostgreSQL.

The `build.sh` script is intended to install dependencies, collect static files, and apply database migrations during deployment.

Deployment requires a compatible hosting provider, a configured production database, production environment variables, and a valid application start command.

Cloudinary and Sentry require valid credentials to use their respective hosted services. No public production deployment URL is currently documented.

## Current Limitations

- No publicly deployed API URL is documented.
- Production hosting and database provisioning remain separate from local development.
- Existing local database records and media files must be migrated to their production destinations when deploying.
- Payment gateway integration is not listed as an implemented feature.
- Frontend development is outside the scope of this backend repository.

## Repository

GitHub: https://github.com/Kashifkin/Backend-Projects

## License

No license has been specified. Unless a license is added to the repository, the project's reuse and redistribution permissions remain subject to applicable copyright law.
