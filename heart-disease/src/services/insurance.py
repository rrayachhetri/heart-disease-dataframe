"""Insurance and provider-directory rules for Phase 2 doctor references."""

from __future__ import annotations

import re
from dataclasses import dataclass


def normalize_payer(value: str) -> str:
    """Normalize payer names for deterministic, case-insensitive matching."""
    return re.sub(r"[^a-z0-9]", "", value.casefold())


def valid_npi(value: str | None) -> bool:
    """Validate the NPI shape before any external registry verification."""
    return bool(value and re.fullmatch(r"\d{10}", value))


@dataclass(frozen=True)
class InsuranceMatch:
    requested: str
    matched_plan: str | None
    verified: bool
    source: str


def match_insurance(requested: str, accepted_plans: list[str]) -> InsuranceMatch:
    requested_key = normalize_payer(requested)
    matched_plan = next(
        (plan for plan in accepted_plans if normalize_payer(plan) == requested_key),
        None,
    )
    return InsuranceMatch(
        requested=requested,
        matched_plan=matched_plan,
        verified=matched_plan is not None,
        source="doctor_declared_network",
    )