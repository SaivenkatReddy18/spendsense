from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/", response_model=schemas.TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    data: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if data.category_id:
        cat = db.query(models.Category).filter(
            models.Category.id == data.category_id,
            models.Category.user_id == current_user.id
        ).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")

    transaction = models.Transaction(
        user_id=current_user.id,
        category_id=data.category_id,
        amount=data.amount,
        description=data.description,
        date=data.date,
        type=data.type
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return db.query(models.Transaction).options(
        joinedload(models.Transaction.category)
    ).filter(models.Transaction.id == transaction.id).first()


@router.get("/", response_model=List[schemas.TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    category_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    type: Optional[str] = Query(None)
):
    query = db.query(models.Transaction).options(
        joinedload(models.Transaction.category)
    ).filter(models.Transaction.user_id == current_user.id)

    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)
    if type:
        query = query.filter(models.Transaction.type == type)

    return query.order_by(models.Transaction.date.desc()).all()


@router.put("/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: int,
    data: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if data.category_id is not None:
        cat = db.query(models.Category).filter(
            models.Category.id == data.category_id,
            models.Category.user_id == current_user.id
        ).first()
        if not cat:
            raise HTTPException(status_code=404, detail="Category not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(transaction, key, value)

    db.commit()

    return db.query(models.Transaction).options(
        joinedload(models.Transaction.category)
    ).filter(models.Transaction.id == transaction_id).first()


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(transaction)
    db.commit()