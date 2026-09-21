"""
Local doctor directory — queries the public CMS NPI Registry (NPPES) API
to find real providers by postal code and specialty. This is a read-only,
free, no-key-required government API; no insurance network data is
available from it, so results are presented as self-reported/best-effort
and patients are expected to confirm coverage directly with the office.

Docs: https://npiregistry.cms.hhs.gov/api-page
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import httpx

NPI_REGISTRY_URL = "https://npiregistry.cms.hhs.gov/api/"


@dataclass(frozen=True)
class LocalProvider:
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


def _primary_taxonomy(taxonomies: list[dict]) -> Optional[str]:
    if not taxonomies:
        return None
    primary = next((t for t in taxonomies if t.get("primary")), taxonomies[0])
    return primary.get("desc")


def _primary_address(addresses: list[dict]) -> dict:
    if not addresses:
        return {}
    return next(
        (a for a in addresses if a.get("address_purpose") == "LOCATION"),
        addresses[0],
    )


def _to_provider(result: dict) -> LocalProvider:
    basic = result.get("basic", {})
    address = _primary_address(result.get("addresses", []))
    return LocalProvider(
        npi=result.get("number", ""),
        first_name=basic.get("first_name"),
        last_name=basic.get("last_name"),
        credential=basic.get("credential"),
        organization_name=basic.get("organization_name"),
        specialty=_primary_taxonomy(result.get("taxonomies", [])),
        phone=address.get("telephone_number"),
        address_line=address.get("address_1"),
        city=address.get("city"),
        state=address.get("state"),
        postal_code=address.get("postal_code"),
    )


async def search_local_providers(
    postal_code: str,
    specialty: Optional[str] = None,
    limit: int = 20,
) -> list[LocalProvider]:
    """Search real, local providers from the public NPI Registry by ZIP/postal code."""
    params: dict[str, str | int] = {
        "version": "2.1",
        "enumeration_type": "NPI-1",
        "postal_code": postal_code,
        "limit": max(1, min(limit, 50)),
    }
    if specialty:
        params["taxonomy_description"] = specialty

    async with httpx.AsyncClient(timeout=10.0) as http_client:
        response = await http_client.get(NPI_REGISTRY_URL, params=params)
        response.raise_for_status()
        payload = response.json()

    results = payload.get("results", []) or []
    return [_to_provider(result) for result in results]
