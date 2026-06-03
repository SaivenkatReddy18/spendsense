from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from typing import List
from datetime import datetime, date
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=schemas.MonthlySummary)
def get_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    income = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "income",
        extract("month", models.Transaction.date) == month,
        extract("year", models.Transaction.date) == year
    ).scalar() or 0.0

    expenses = db.query(func.sum(models.Transaction.amount)).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.type == "expense",
        extract("month", models.Transaction.date) == month,
        extract("year", models.Transaction.date) == year
    ).scalar() or 0.0

    return {
        "month": month,
        "year": year,
        "total_income": income,
        "total_expenses": expenses,
        "net": income - expenses
    }


@router.get("/by-category", response_model=List[schemas.CategorySummary])
def get_by_category(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = db.query(
        models.Category.id,
        models.Category.name,
        models.Category.color,
        models.Category.type,
        func.sum(models.Transaction.amount).label("total")
    ).join(
        models.Transaction,
        models.Transaction.category_id == models.Category.id
    ).filter(
        models.Transaction.user_id == current_user.id,
        extract("month", models.Transaction.date) == month,
        extract("year", models.Transaction.date) == year
    ).group_by(
        models.Category.id,
        models.Category.name,
        models.Category.color,
        models.Category.type
    ).all()

    return [
        {
            "category_id": r.id,
            "category_name": r.name,
            "color": r.color,
            "type": str(r.type.value if hasattr(r.type, "value") else r.type),
            "total": float(r.total)
        }
        for r in results
    ]


@router.get("/trend", response_model=List[schemas.MonthTrend])
def get_trend(
    months: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    now = datetime.now()

    total = now.year * 12 + now.month - 1 - (months - 1)
    start_year = total // 12
    start_month = total % 12 + 1
    start_date = date(start_year, start_month, 1)

    rows = db.query(
        extract("year", models.Transaction.date).label("year"),
        extract("month", models.Transaction.date).label("month"),
        func.sum(
            case((models.Transaction.type == "income", models.Transaction.amount), else_=0)
        ).label("income"),
        func.sum(
            case((models.Transaction.type == "expense", models.Transaction.amount), else_=0)
        ).label("expenses")
    ).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= start_date
    ).group_by(
        extract("year", models.Transaction.date),
        extract("month", models.Transaction.date)
    ).all()

    data_map = {(int(r.year), int(r.month)): r for r in rows}

    result = []
    for i in range(months - 1, -1, -1):
        t = now.year * 12 + now.month - 1 - i
        y = t // 12
        m = t % 12 + 1
        label = datetime(y, m, 1).strftime("%b %Y")
        row = data_map.get((y, m))
        result.append({
            "month": m,
            "year": y,
            "label": label,
            "income": float(row.income) if row else 0.0,
            "expenses": float(row.expenses) if row else 0.0
        })

    return result