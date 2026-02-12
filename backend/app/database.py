from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

# Format: postgresql+asyncpg://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback for local development if not set, though this will likely fail without real creds
if not DATABASE_URL:
    print("WARNING: DATABASE_URL not found in .env, using default.")
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres"

db_info = DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'UNKNOWN'
print(f"Connecting to DB: {db_info}")

# Required when using pgbouncer (transaction/statement pool mode): disable prepared
# statements and use NullPool so we don't get DuplicatePreparedStatementError.
engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    poolclass=NullPool,
    connect_args={
        "server_settings": {
            "application_name": "blissy_bakes_backend"
        },
        # Disable asyncpg prepared statement cache (pgbouncer incompatible with it)
        "statement_cache_size": 0,
    },
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
