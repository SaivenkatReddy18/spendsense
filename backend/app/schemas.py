from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, Literal, List


# --- User ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str


# --- Category ---
class CategoryCreate(BaseModel):
    name: str
    type: Literal["income", "expense"]
    color: str = "#6366f1"


class CategoryResponse(BaseModel):
    id: int
    name: str
    type: str
    color: str

    model_config = {"from_attributes": True}


# --- Transaction ---
class TransactionCreate(BaseModel):
    category_id: Optional[int] = None
    amount: float
    description: str = ""
    date: date
    type: Literal["income", "expense"]


class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[date] = None
    type: Optional[Literal["income", "expense"]] = None


class TransactionResponse(BaseModel):
    id: int
    category_id: Optional[int] = None
    amount: float
    description: str
    date: date
    type: str
    category: Optional[CategoryResponse] = None

    model_config = {"from_attributes": True}


# --- Analytics ---
class MonthlySummary(BaseModel):
    month: int
    year: int
    total_income: float
    total_expenses: float
    net: float


class CategorySummary(BaseModel):
    category_id: int
    category_name: str
    color: str
    type: str
    total: float


class MonthTrend(BaseModel):
    month: int
    year: int
    label: str
    income: float
    expenses: float