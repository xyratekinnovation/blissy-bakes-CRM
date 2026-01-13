from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from ..database import get_db
from ..models import Expense, AppUser
from ..schemas import ExpenseResponse, ExpenseCreateRequest
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.get("", response_model=List[ExpenseResponse])
async def get_expenses(
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Expense).order_by(Expense.date.desc(), Expense.created_at.desc())
    
    if category and category != "All":
        stmt = stmt.where(Expense.category == category)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            stmt = stmt.where(Expense.date >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
            stmt = stmt.where(Expense.date <= end)
        except ValueError:
            pass
    
    result = await db.execute(stmt)
    expenses = result.scalars().all()
    
    return [
        ExpenseResponse(
            id=str(exp.id),
            title=exp.description or "Expense",
            amount=float(exp.amount),
            category=exp.category,
            date=exp.date.strftime("%Y-%m-%d"),
            notes=exp.description
        )
        for exp in expenses
    ]

@router.post("", response_model=ExpenseResponse)
async def create_expense(
    expense_data: ExpenseCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    expense_date = datetime.strptime(expense_data.date, "%Y-%m-%d").date() if expense_data.date else date.today()
    
    new_expense = Expense(
        date=expense_date,
        category=expense_data.category,
        amount=expense_data.amount,
        description=expense_data.description or expense_data.title,
        logged_by=expense_data.loggedBy
    )
    
    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)
    
    return ExpenseResponse(
        id=str(new_expense.id),
        title=expense_data.title,
        amount=float(new_expense.amount),
        category=new_expense.category,
        date=new_expense.date.strftime("%Y-%m-%d"),
        notes=new_expense.description
    )

@router.delete("/{expense_id}")
async def delete_expense(expense_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalars().first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    await db.delete(expense)
    await db.commit()
    
    return {"success": True, "message": "Expense deleted successfully"}

@router.get("/stats")
async def get_expense_stats(db: AsyncSession = Depends(get_db)):
    today = date.today()
    start_of_month = date(today.year, today.month, 1)
    
    # Total this month
    month_total = await db.execute(
        select(func.sum(Expense.amount)).where(Expense.date >= start_of_month)
    )
    month_total_amount = month_total.scalar() or 0.0
    
    # Today's expenses
    today_total = await db.execute(
        select(func.sum(Expense.amount)).where(Expense.date == today)
    )
    today_total_amount = today_total.scalar() or 0.0
    
    # By category
    category_totals = await db.execute(
        select(Expense.category, func.sum(Expense.amount).label("total"))
        .where(Expense.date >= start_of_month)
        .group_by(Expense.category)
    )
    categories = {row[0]: float(row[1]) for row in category_totals.all()}
    
    return {
        "monthTotal": float(month_total_amount),
        "todayTotal": float(today_total_amount),
        "byCategory": categories
    }
