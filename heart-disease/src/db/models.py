"""
SQLAlchemy ORM models for CardioSense.
Tables: users, patients, doctors, predictions
"""
import uuid
import json
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, Boolean,
    DateTime, ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship

from src.db.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum("patient", "doctor", "admin", name="user_role"), nullable=False, default="patient")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient_profile = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(String, nullable=True)          # ISO date string
    insurance_id = Column(String, nullable=True)
    insurance_provider = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="patient_profile")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    npi_number = Column(String, nullable=True, index=True)  # National Provider Identifier
    specialty = Column(String, nullable=True)               # e.g. "Cardiology"
    bio = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    consultation_fee = Column(Float, default=75.0)          # USD
    accepted_insurance = Column(Text, default="[]")         # JSON list of insurance providers
    is_npi_verified = Column(Boolean, default=False)        # Phase 2: real NPI lookup
    is_accepting_patients = Column(Boolean, default=True)
    rating = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="doctor_profile")

    @property
    def accepted_insurance_list(self):
        return json.loads(self.accepted_insurance or "[]")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # null = anonymous
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)   # "low" | "moderate" | "high"
    prediction = Column(Integer, nullable=False)  # 0 | 1
    features_json = Column(Text, nullable=False)  # serialised input features
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")
