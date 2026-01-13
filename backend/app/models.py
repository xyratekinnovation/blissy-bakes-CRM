from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, DECIMAL, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base

class AppUser(Base):
    __tablename__ = "app_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    full_name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, nullable=False)
    pin_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    full_name = Column(String, nullable=False)
    phone_number = Column(String, unique=True, nullable=True)
    email = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    total_orders = Column(Integer, default=0)
    total_spent = Column(DECIMAL(10, 2), default=0.00)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)

    orders = relationship("Order", back_populates="customer")

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    sku = Column(String, unique=True, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    category = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)

    inventory = relationship("Inventory", back_populates="product", uselist=False)

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), unique=True)
    stock_quantity = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=5)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    tenant_id = Column(UUID(as_uuid=True), nullable=True)

    product = relationship("Product", back_populates="inventory")

class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String, unique=True, nullable=True)  # Sequential order number like BB001
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    staff_id = Column(UUID(as_uuid=True), ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    payment_method = Column(String, nullable=False)
    status = Column(String, default="completed", nullable=False)
    notes = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    staff = relationship("AppUser")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"))
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)

    order = relationship("Order", back_populates="items")
    product = relationship("Product") # Unidirectional link to product

class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_date = Column(Date, unique=True, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    total_sales = Column(DECIMAL(10, 2))
    total_orders = Column(Integer)
    file_url = Column(String)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)

class BulkOrder(Base):
    __tablename__ = "bulk_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    delivery_date = Column(DateTime(timezone=True), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending", nullable=False)
    quote_amount = Column(DECIMAL(10, 2), nullable=True)
    advance_paid = Column(DECIMAL(10, 2), default=0.00)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    date = Column(Date, nullable=False, server_default=func.current_date())
    category = Column(String, nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    description = Column(Text, nullable=True)
    logged_by = Column(UUID(as_uuid=True), ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)

class Offer(Base):
    __tablename__ = "offers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=True)
    discount_type = Column(String, nullable=True)
    discount_value = Column(DECIMAL(10, 2), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    tenant_id = Column(UUID(as_uuid=True), nullable=True)