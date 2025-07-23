from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    class Config:
        orm_mode = True

class AccountBase(BaseModel):
    account_type: str = "checking"

class AccountCreate(AccountBase):
    pass

class AccountOut(AccountBase):
    id: int
    balance: float
    created_at: datetime.datetime
    class Config:
        orm_mode = True

class TransactionBase(BaseModel):
    type: str
    amount: float
    description: Optional[str] = ""

class TransactionCreate(TransactionBase):
    pass

class TransactionOut(TransactionBase):
    id: int
    timestamp: datetime.datetime
    balance_after: float
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None 