from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship, declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    accounts = relationship('Account', back_populates='owner')

class Account(Base):
    __tablename__ = 'accounts'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    account_type = Column(String, default='checking')  # checking, savings, etc.
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    owner = relationship('User', back_populates='accounts')
    transactions = relationship('Transaction', back_populates='account')

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey('accounts.id'))
    type = Column(String)  # deposit, withdraw, transfer
    amount = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    description = Column(String, default='')
    balance_after = Column(Float)
    account = relationship('Account', back_populates='transactions') 