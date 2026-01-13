# Blissy Bakes Backend

This directory contains the Python FastAPI backend for Blissy Bakes, including database models, API routers, and database migrations.

## 📂 Structure

```
/backend
  /app
    /routers        # API route handlers (auth, orders, customers, products, inventory, analytics)
    /models.py      # SQLAlchemy database models
    /schemas.py     # Pydantic request/response schemas
    /database.py    # Database connection configuration
    /main.py        # FastAPI application entry point
  /supabase
    /migrations     # SQL migrations for Database Schema
    /seed.sql       # Initial data for testing
```

## 🚀 Getting Started (Local Development)

### Prerequisites

1. **Python 3.9+** installed
2. **PostgreSQL Database** (local Supabase or remote)
3. **Environment Variables**: Create a `.env` file in the `backend` directory:
   ```
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:54322/postgres
   SECRET_KEY=your-secret-key-here
   ```

### Running Backend

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start the FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   The API will be available at `http://localhost:8000`

3. **Database Setup**:
   - If using local Supabase: Run `supabase start` and `supabase db reset`
   - If using remote database: Ensure `DATABASE_URL` in `.env` points to your database

## 🛠 API Endpoints

All business logic is handled via Python FastAPI endpoints to ensure security and data integrity.

### Available Endpoints:

- **Auth**: `/auth/login` - Authenticate staff members using phone number and PIN
- **Orders**: `/orders` - Get orders, `/orders/create` - Create new order (with inventory deduction)
- **Customers**: `/customers` - Get/search customers
- **Products**: `/products` - Get products by category
- **Inventory**: `/inventory` - Get inventory items, `/inventory/restock` - Restock items
- **Analytics**: `/analytics/dashboard-stats` - Get dashboard statistics, `/analytics/export-daily` - Export daily reports

### API Documentation:

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📦 Database

The application uses PostgreSQL with SQLAlchemy ORM. Database schema is defined in:
- `supabase/migrations/001_init_schema.sql` - SQL migration
- `app/models.py` - SQLAlchemy models

Tables are automatically created on startup if they don't exist (development mode).

## 🔑 Environment Variables

Required in `.env` file:

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key for authentication

## 🛡 Security Note

- Frontend connects to Python backend at `http://localhost:8000`
- All write operations go through authenticated API endpoints
- JWT tokens are used for authentication
- Database operations use parameterized queries to prevent SQL injection
