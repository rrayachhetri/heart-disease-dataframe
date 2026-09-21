"""
Local doctor directory router — real providers by ZIP/specialty from the
public CMS NPI Registry, plus a request-to-book flow for patients.

No universal API exists for real-time insurance-network verification or
direct appointment booking against arbitrary providers, so:
 - insurance is shown as self-reported / best-effort for patients to confirm.
 - "booking" records patient intent; the patient follows up by phone.
"""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from httpx import HTTPError
from pydantic import BaseModel, field_serializer
from sqlalchemy.orm import Session

from src.auth.routes import get_current_user
from src.db.database import get_db
from src.db.models import AppointmentRequest, Doctor, User
from src.services.local_doctor_search import search_local_providers

router = APIRouter(prefix="/local-doctors", tags=["local-doctors"])


def _as_utc_iso(value: datetime) -> str:
    """All stored timestamps are UTC wall-clock values; make that explicit on the wire
    so browsers don't reinterpret a naive ISO string as local time."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def _to_naive_utc(value: datetime) -> datetime:
    """Browsers send ISO strings with a 'Z'/offset suffix, which Pydantic parses as
    timezone-aware. Storage assumes naive UTC, so normalize here."""
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


class LocalProviderResponse(BaseModel):
    npi: str
    first_name: Optional[str]
    last_name: Optional[str]
    credential: Optional[str]
    organization_name: Optional[str]
    specialty: Optional[str]
    phone: Optional[str]
    address_line: Optional[str]
    city: Optional[str]
    state: Optional[str]
    postal_code: Optional[str]
    registered_doctor_id: Optional[str] = None


class AppointmentRequestCreate(BaseModel):
    provider_npi: str
    provider_name: str
    provider_phone: Optional[str] = None
    specialty: Optional[str] = None
    insurance: str
    preferred_time: Optional[datetime] = None
    notes: Optional[str] = None


class AppointmentRequestResponse(BaseModel):
    id: str
    provider_npi: str
    provider_name: str
    provider_phone: Optional[str]
    specialty: Optional[str]
    insurance: str
    preferred_time: Optional[datetime]
    notes: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("preferred_time")
    def _serialize_preferred_time(self, value: Optional[datetime]) -> Optional[str]:
        return _as_utc_iso(value) if value else None

    @field_serializer("created_at")
    def _serialize_created_at(self, value: datetime) -> str:
        return _as_utc_iso(value)


@router.get("/search", response_model=List[LocalProviderResponse])
async def search_providers(
    postal_code: str,
    specialty: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    if not postal_code.strip():
        raise HTTPException(status_code=422, detail="postal_code is required")
    try:
        providers = await search_local_providers(postal_code.strip(), specialty, limit)
    except HTTPError as exc:
        raise HTTPException(status_code=502, detail="Local doctor directory is unavailable right now") from exc

    npis = [p.npi for p in providers if p.npi]
    registered_by_npi: dict[str, str] = {}
    if npis:
        registered_doctors = (
            db.query(Doctor)
            .filter(Doctor.npi_number.in_(npis), Doctor.is_accepting_patients.is_(True))
            .all()
        )
        registered_by_npi = {doc.npi_number: doc.id for doc in registered_doctors if doc.npi_number}

    return [
        LocalProviderResponse(
            **provider.__dict__,
            registered_doctor_id=registered_by_npi.get(provider.npi),
        )
        for provider in providers
    ]


@router.post("/requests", response_model=AppointmentRequestResponse, status_code=status.HTTP_201_CREATED)
def create_appointment_request(
    body: AppointmentRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can request appointments")
    if not body.insurance.strip():
        raise HTTPException(status_code=422, detail="insurance is required")

    request = AppointmentRequest(
        patient_id=current_user.id,
        provider_npi=body.provider_npi,
        provider_name=body.provider_name,
        provider_phone=body.provider_phone,
        specialty=body.specialty,
        insurance=body.insurance.strip(),
        preferred_time=_to_naive_utc(body.preferred_time) if body.preferred_time else None,
        notes=body.notes,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.get("/requests/me", response_model=List[AppointmentRequestResponse])
def list_my_appointment_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can view their appointment requests")
    return (
        db.query(AppointmentRequest)
        .filter(AppointmentRequest.patient_id == current_user.id)
        .order_by(AppointmentRequest.created_at.desc())
        .all()
    )
