from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

# --- Auth ---
class LoginRequest(BaseModel):
    phoneNumber: str
    pin: str

class LoginResponse(BaseModel):
    token: str
    user: dict

# --- Staff Management ---
class StaffResponse(BaseModel):
    id: str
    fullName: str
    phoneNumber: str
    role: str
    isActive: bool
    createdAt: Optional[str] = None
    class Config:
        from_attributes = True

class StaffCreateRequest(BaseModel):
    fullName: str
    phoneNumber: str
    role: str = "employee"  # "admin" or "employee"
    pin: Optional[str] = None  # Defaults to "1234" if not provided

class StaffUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    phoneNumber: Optional[str] = None
    role: Optional[str] = None
    isActive: Optional[bool] = None
    pin: Optional[str] = None  # For PIN change

# --- Shared ---
class CustomerBase(BaseModel):
    fullName: str
    phoneNumber: str
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: UUID
    class Config:
        from_attributes = True

class CustomerView(BaseModel):
    id: UUID
    name: str
    phone: str
    totalSpent: float
    visits: int
    lastVisit: str
    favoriteItems: List[str] = []
    loyaltyPoints: int = 0
    
    class Config:
        from_attributes = True

# --- Orders ---
class OrderItemRequest(BaseModel):
    id: UUID # Product ID
    quantity: int
    price: float

class CreateOrderRequest(BaseModel):
    customer: CustomerBase
    items: List[OrderItemRequest]
    paymentMethod: str
    staffId: Optional[UUID] = None
    notes: Optional[str] = None
    totalAmount: float

class OrderResponse(BaseModel):
    success: bool
    orderId: UUID
    orderNumber: Optional[str] = None  # Sequential order number like BB001

class UpdateOrderRequest(BaseModel):
    customer: CustomerBase
    items: List[OrderItemRequest]
    paymentMethod: str
    staffId: Optional[UUID] = None
    notes: Optional[str] = None
    totalAmount: float

class OrderItemView(BaseModel):
    id: str
    productId: str
    name: str
    quantity: int
    price: float
    image: str

class OrderView(BaseModel):
    id: UUID
    order_number: Optional[str] = None  # Sequential order number like BB001
    created_at: datetime
    total_amount: float
    payment_method: str
    status: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    staff_name: Optional[str] = None
    items_summary: str = ""
    items: List[OrderItemView] = []
    
    class Config:
        from_attributes = True

# --- Analytics ---
class DailyReportRequest(BaseModel):
    date: str # YYYY-MM-DD

class HourlyData(BaseModel):
    hour: str
    orders: int
    sales: float

class DashboardStatsResponse(BaseModel):
    totalSales: float
    orderCount: int
    avgOrderValue: float
    lowStockItems: int
    topSellingProduct: Optional[str]
    hourlyData: Optional[List[HourlyData]] = None

# --- Products ---
class ProductResponse(BaseModel):
    id: str
    name: str
    price: float
    category: str
    image: str
    stock: int
    isAvailable: bool

# --- Inventory ---
class InventoryItemResponse(BaseModel):
    id: str
    productId: str
    name: str
    category: str
    stock: int
    unit: str
    minStock: int
    lastRestock: str

class InventoryUpdateRequest(BaseModel):
    newStock: int

# --- Expenses ---
class ExpenseResponse(BaseModel):
    id: str
    title: str
    amount: float
    category: str
    date: str
    notes: Optional[str] = None

class ExpenseCreateRequest(BaseModel):
    title: str
    amount: float
    category: str
    date: str
    description: Optional[str] = None
    loggedBy: Optional[UUID] = None

# --- Offers ---
class OfferResponse(BaseModel):
    id: str
    title: str
    description: str
    type: str
    value: str
    validUntil: str
    isActive: bool
    code: Optional[str] = None

class OfferCreateRequest(BaseModel):
    title: str
    code: Optional[str] = None
    type: str  # "percent" or "fixed"
    discountValue: float
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    isActive: bool = True

# --- Bulk Orders ---
class BulkOrderResponse(BaseModel):
    id: str
    customer: str
    eventType: str
    date: str
    items: str
    total: float
    advance: float
    status: str

class BulkOrderCreateRequest(BaseModel):
    customer: str
    eventType: str
    deliveryDate: str
    items: str
    total: float
    advance: float
    customerId: Optional[UUID] = None

# --- Product Management ---
class ProductCreateRequest(BaseModel):
    name: str
    price: float
    category: str
    image: Optional[str] = None
    sku: Optional[str] = None
    stock: int = 0
    minStock: int = 5
    isAvailable: bool = True

class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    isAvailable: Optional[bool] = None

# --- Inventory Management ---
class InventoryCreateRequest(BaseModel):
    productId: str
    stock: int
    minStock: int = 5