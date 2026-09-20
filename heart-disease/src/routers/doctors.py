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
from src.services.insurance import match_insurance, valid_npi

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


class InsuranceVerificationResponse(BaseModel):
    doctor_id: str
    insurance: str
    in_network: bool
    matched_plan: Optional[str]
    verification_source: str
    note: str


class DoctorRecommendationResponse(DoctorResponse):
    insurance_match: InsuranceVerificationResponse


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

    if "npi_number" in update_data and update_data["npi_number"]:
        if not valid_npi(update_data["npi_number"]):
            raise HTTPException(status_code=422, detail="NPI must contain exactly 10 digits")
        update_data["is_npi_verified"] = True
    elif "npi_number" in update_data:
        update_data["is_npi_verified"] = False

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
    """
    query = db.query(Doctor)
    if accepting_only:
        query = query.filter(Doctor.is_accepting_patients.is_(True))
    if specialty:
        query = query.filter(Doctor.specialty.ilike(f"%{specialty}%"))

    doctors = query.all()
    if insurance:
        doctors = [
            doctor for doctor in doctors
            if match_insurance(insurance, doctor.accepted_insurance_list).verified
        ]

    return [_to_response(d) for d in doctors]


@router.get("/recommendations", response_model=List[DoctorRecommendationResponse])
def recommend_doctors(
    insurance: str,
    specialty: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Return accepting doctors whose declared payer network matches exactly."""
    if not insurance.strip():
        raise HTTPException(status_code=422, detail="insurance is required")

    query = db.query(Doctor).filter(Doctor.is_accepting_patients.is_(True))
    if specialty:
        query = query.filter(Doctor.specialty.ilike(f"%{specialty}%"))

    recommendations = []
    for doctor in query.all():
        match = match_insurance(insurance, doctor.accepted_insurance_list)
        if match.verified:
            recommendations.append(
                DoctorRecommendationResponse(
                    **_to_response(doctor).model_dump(),
                    insurance_match=InsuranceVerificationResponse(
                        doctor_id=doctor.id,
                        insurance=insurance,
                        in_network=True,
                        matched_plan=match.matched_plan,
                        verification_source=match.source,
                        note="Matched against the insurance plans declared in the doctor profile.",
                    ),
                )
            )
    return recommendations


@router.get("/{doctor_id}/insurance", response_model=InsuranceVerificationResponse)
def verify_doctor_insurance(
    doctor_id: str,
    insurance: str,
    db: Session = Depends(get_db),
):
    """Check whether a payer matches one doctor's declared accepted plans."""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if not insurance.strip():
        raise HTTPException(status_code=422, detail="insurance is required")

    match = match_insurance(insurance, doctor.accepted_insurance_list)
    return InsuranceVerificationResponse(
        doctor_id=doctor.id,
        insurance=insurance,
        in_network=match.verified,
        matched_plan=match.matched_plan,
        verification_source=match.source,
        note=(
            "Matched against the insurance plans declared in the doctor profile."
            if match.verified
            else "No exact declared-plan match was found; confirm coverage with the payer before booking."
        ),
    )


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: str, db: Session = Depends(get_db)):
    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return _to_response(doc)
