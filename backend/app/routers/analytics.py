from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import joinedload
from ..database import get_db
from ..models import Order, OrderItem, Product, Inventory, Customer
from ..schemas import DailyReportRequest, DashboardStatsResponse, HourlyData
from datetime import datetime, time, timedelta
from openpyxl import Workbook
from typing import Optional
import io

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    period: Optional[str] = Query("today", description="Period: today, week, month"),
    date: Optional[str] = Query(None, description="For period=today: YYYY-MM-DD in user's timezone (default: server date)"),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now()
    # Use provided date for "today" so KPIs match user's local date (avoids timezone issues)
    if period == "today" and date:
        try:
            user_date = datetime.strptime(date.strip()[:10], "%Y-%m-%d").date()
            start_date = datetime.combine(user_date, time.min)
            end_date = datetime.combine(user_date, time.max)
        except ValueError:
            start_date = datetime.combine(now.date(), time.min)
            end_date = datetime.combine(now.date(), time.max)
    elif period == "today":
        start_date = datetime.combine(now.date(), time.min)
        end_date = datetime.combine(now.date(), time.max)
    elif period == "week":
        start_date = now - timedelta(days=7)
        end_date = now
    elif period == "month":
        start_date = now - timedelta(days=30)
        end_date = now
    else:
        start_date = datetime.combine(now.date(), time.min)
        end_date = datetime.combine(now.date(), time.max)
    
    # 1. Total Sales
    sales_query = select(func.sum(Order.total_amount)).where(
        and_(Order.created_at >= start_date, Order.created_at <= end_date)
    )
    sales_result = await db.execute(sales_query)
    total_sales = sales_result.scalar() or 0.0

    # 2. Order Count
    count_query = select(func.count(Order.id)).where(
         and_(Order.created_at >= start_date, Order.created_at <= end_date)
    )
    count_result = await db.execute(count_query)
    order_count = count_result.scalar() or 0

    # 3. Average Order Value
    avg_order = float(total_sales / order_count) if order_count > 0 else 0.0

    # 4. Low Stock Items
    low_stock_query = select(func.count(Inventory.id)).where(
        Inventory.stock_quantity <= Inventory.low_stock_threshold
    )
    low_stock_result = await db.execute(low_stock_query)
    low_stock_items = low_stock_result.scalar() or 0

    # 5. Top Selling Product
    top_product_query = (
        select(Product.name, func.sum(OrderItem.quantity).label("total_sold"))
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(and_(Order.created_at >= start_date, Order.created_at <= end_date))
        .group_by(Product.name)
        .order_by(desc("total_sold"))
        .limit(1)
    )
    top_product_result = await db.execute(top_product_query)
    top_product_row = top_product_result.first()
    top_selling_product = top_product_row[0] if top_product_row else None

    # 6. Hourly Data (for peak hours chart)
    hourly_data = []
    if period == "today":
        # Get orders grouped by hour for today
        from sqlalchemy import extract
        hourly_query = (
            select(
                extract('hour', Order.created_at).label('hour'),
                func.count(Order.id).label('order_count'),
                func.sum(Order.total_amount).label('total_sales')
            )
            .where(and_(Order.created_at >= start_date, Order.created_at <= end_date))
            .group_by(extract('hour', Order.created_at))
            .order_by(extract('hour', Order.created_at))
        )
        hourly_result = await db.execute(hourly_query)
        hourly_rows = hourly_result.all()
        
        # Create a map of hour -> data
        hourly_map = {}
        for row in hourly_rows:
            hour = int(row.hour)
            hourly_map[hour] = {
                'orders': row.order_count or 0,
                'sales': float(row.total_sales or 0)
            }
        
        # Generate data for all hours (9 AM to 11:30 PM / 12 AM)
        # Show hours from 9 AM (9) to 11 PM (23), and include 12 AM (0) if needed
        for h in range(9, 24):  # 9 AM to 11 PM
            if h == 12:
                hour_label = "12PM"
            elif h < 12:
                hour_label = f"{h}AM"
            else:
                hour_label = f"{h - 12}PM"
            
            hourly_data.append({
                "hour": hour_label,
                "orders": hourly_map.get(h, {}).get('orders', 0),
                "sales": hourly_map.get(h, {}).get('sales', 0.0)
            })
        
        # Add 12 AM (midnight) if shop is open until 11:30 PM
        hourly_data.append({
            "hour": "12AM",
            "orders": hourly_map.get(0, {}).get('orders', 0),
            "sales": hourly_map.get(0, {}).get('sales', 0.0)
        })
    else:
        # For week/month, show daily data instead
        from sqlalchemy import extract
        daily_query = (
            select(
                extract('day', Order.created_at).label('day'),
                func.count(Order.id).label('order_count'),
                func.sum(Order.total_amount).label('total_sales')
            )
            .where(and_(Order.created_at >= start_date, Order.created_at <= end_date))
            .group_by(extract('day', Order.created_at))
            .order_by(extract('day', Order.created_at))
        )
        daily_result = await db.execute(daily_query)
        daily_rows = daily_result.all()
        
        # For week/month, we'll show daily breakdown
        # But for now, let's just show empty hourly data
        hourly_data = []

    return {
        "totalSales": float(total_sales),
        "orderCount": order_count,
        "avgOrderValue": avg_order,
        "lowStockItems": low_stock_items,
        "topSellingProduct": top_selling_product or "N/A",
        "hourlyData": hourly_data
    }

@router.post("/export-daily")
async def export_daily_report(request: DailyReportRequest, db: AsyncSession = Depends(get_db)):
    try:
        target_date = datetime.strptime(request.date, "%Y-%m-%d").date()
    except ValueError:
        target_date = datetime.now().date()
        
    start_of_day = datetime.combine(target_date, time.min)
    end_of_day = datetime.combine(target_date, time.max)

    query = select(Order).where(
        and_(Order.created_at >= start_of_day, Order.created_at <= end_of_day)
    )
    result = await db.execute(query)
    orders = result.scalars().all()
    
    # Create Excel using openpyxl directly (No Pandas)
    wb = Workbook()
    ws = wb.active
    ws.title = "Daily Sales"
    
    # Headers
    headers = ["Order ID", "Time", "Amount", "Payment", "Status"]
    ws.append(headers)
    
    # Rows
    for o in orders:
        ws.append([
            str(o.id),
            o.created_at.strftime("%H:%M:%S"),
            float(o.total_amount),
            o.payment_method,
            o.status
        ])
    
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="daily_report_{request.date}.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
