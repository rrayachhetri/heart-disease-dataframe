"""
Doctors router — profile management and in-network listing.
NPI verification is stubbed for Phase 1; real API in Phase 2.
"""
import json
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.db.models import Doctor, User
from src.auth.routes import get_current_user

router = APIRouter(prefix="/doctors", tags=["doctors"])


class DoctorProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    npi_number: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    consultation_fee: Optional[float] = None
    accepted_insurance: Optional[List[str]] = None
    is_accepting_patients: Optional[bool] = None


class DoctorResponse(BaseModel):
    id: str
    user_id: str
    first_name: str
    last_name: str
    npi_number: Optional[str]
    specialty: Optional[str]
    bio: Optional[str]
    phone: Optional[str]
    consultation_fee: float
    accepted_insurance: List[str]
    is_npi_verified: bool
    is_accepting_patients: bool
    rating: float

    model_config = {"from_attributes": True}


def _to_response(doc: Doctor) -> DoctorResponse:
    return DoctorResponse(
        id=doc.id,
        user_id=doc.user_id,
        first_name=doc.first_name,
        last_name=doc.last_name,
        npi_number=doc.npi_number,
        specialty=doc.specialty,
        bio=doc.bio,
        phone=doc.phone,
        consultation_fee=doc.consultation_fee,
        accepted_insurance=doc.accepted_insurance_list,
        is_npi_verified=doc.is_npi_verified,
        is_accepting_patients=doc.is_accepting_patients,
        rating=doc.rating,
    )


@router.get("/me", response_model=DoctorResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")
    doc = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return _to_response(doc)


@router.put("/me", response_model=DoctorResponse)
def update_my_profile(
    body: DoctorProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")
    doc = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    update_data = body.model_dump(exclude_unset=True)
    if "accepted_insurance" in update_data:
        update_data["accepted_insurance"] = json.dumps(update_data["accepted_insurance"])

    # Phase 1 stub: if NPI provided, mark as verified (Phase 2 will call real NPI registry)
    if "npi_number" in update_data and update_data["npi_number"]:
        update_data["is_npi_verified"] = True  # stub — replace with real API call

    for field, value in update_data.items():
        setattr(doc, field, value)

    db.commit()
    db.refresh(doc)
    return _to_response(doc)


@router.get("", response_model=List[DoctorResponse])
def list_doctors(
    specialty: Optional[str] = None,
    insurance: Optional[str] = None,
    accepting_only: bool = True,
    db: Session = Depends(get_db),
):
    """
    List doctors, optionally filtered by specialty and insurance.
    Phase 1: returns all verified doctors matching filters.
    Phase 2: will integrate real in-network insurance verification.
    """
    query = db.query(Doctor)
    if accepting_only:
        query = query.filter(Doctor.is_accepting_patients.is_(True))
    if specialty:
        query = query.filter(Doctor.specialty.ilike(f"%{specialty}%"))
    if insurance:
        # Simple substring match on JSON field — Phase 2 will use proper indexing
        query = query.filter(Doctor.accepted_insurance.contains(insurance))

    return [_to_response(d) for d in query.all()]


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: str, db: Session = Depends(get_db)):
    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return _to_response(doc)
