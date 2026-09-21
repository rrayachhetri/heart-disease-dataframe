"""Tests for the local (NPI registry) doctor directory and request-to-book flow."""
from src.services.local_doctor_search import LocalProvider


def _patient_token(client, email: str = 'local-patient@example.com') -> str:
    client.post('/api/auth/register', json={
        'email': email,
        'password': 'StrongPass123',
        'role': 'patient',
        'first_name': 'Pat',
        'last_name': 'Patient',
    })
    login = client.post('/api/auth/login', json={'email': email, 'password': 'StrongPass123'})
    return login.json()['access_token']


def _doctor_token(client, email: str = 'local-doctor@example.com') -> str:
    client.post('/api/auth/register', json={
        'email': email,
        'password': 'StrongPass123',
        'role': 'doctor',
        'first_name': 'Jane',
        'last_name': 'Heart',
    })
    login = client.post('/api/auth/login', json={'email': email, 'password': 'StrongPass123'})
    return login.json()['access_token']


def _fake_provider() -> LocalProvider:
    return LocalProvider(
        npi='1234567890',
        first_name='Alex',
        last_name='Rivera',
        credential='MD',
        organization_name=None,
        specialty='Cardiology',
        phone='555-010-1234',
        address_line='100 Main St',
        city='San Francisco',
        state='CA',
        postal_code='94105',
    )


def test_search_providers_returns_real_directory_results(client, monkeypatch):
    async def fake_search(postal_code, specialty=None, limit=20):
        assert postal_code == '94105'
        assert specialty == 'Cardiology'
        return [_fake_provider()]

    monkeypatch.setattr('src.routers.local_doctors.search_local_providers', fake_search)

    response = client.get('/api/local-doctors/search', params={'postal_code': '94105', 'specialty': 'Cardiology'})
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]['npi'] == '1234567890'
    assert body[0]['specialty'] == 'Cardiology'
    assert body[0]['phone'] == '555-010-1234'
    assert body[0]['registered_doctor_id'] is None


def test_search_providers_links_to_registered_in_app_doctor_by_npi(client, monkeypatch):
    doctor_token = _doctor_token(client, 'matched-doctor@example.com')
    profile = client.put(
        '/api/doctors/me',
        headers={'Authorization': f'Bearer {doctor_token}'},
        json={'npi_number': '1234567890'},
    )
    doctor_id = profile.json()['id']

    async def fake_search(postal_code, specialty=None, limit=20):
        return [_fake_provider()]

    monkeypatch.setattr('src.routers.local_doctors.search_local_providers', fake_search)

    response = client.get('/api/local-doctors/search', params={'postal_code': '94105'})
    assert response.status_code == 200
    assert response.json()[0]['registered_doctor_id'] == doctor_id


def test_search_providers_requires_postal_code(client, monkeypatch):
    async def fake_search(postal_code, specialty=None, limit=20):
        return []

    monkeypatch.setattr('src.routers.local_doctors.search_local_providers', fake_search)

    response = client.get('/api/local-doctors/search', params={'postal_code': '  '})
    assert response.status_code == 422


def test_patient_can_create_and_list_appointment_request(client):
    token = _patient_token(client)
    headers = {'Authorization': f'Bearer {token}'}

    created = client.post(
        '/api/local-doctors/requests',
        headers=headers,
        json={
            'provider_npi': '1234567890',
            'provider_name': 'Dr. Alex Rivera',
            'provider_phone': '555-010-1234',
            'specialty': 'Cardiology',
            'insurance': 'Blue Cross',
            'notes': 'Prefers morning appointments.',
        },
    )
    assert created.status_code == 201
    assert created.json()['status'] == 'pending_contact'

    listed = client.get('/api/local-doctors/requests/me', headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]['provider_name'] == 'Dr. Alex Rivera'


def test_only_patients_can_create_appointment_requests(client):
    token = _doctor_token(client)
    headers = {'Authorization': f'Bearer {token}'}

    response = client.post(
        '/api/local-doctors/requests',
        headers=headers,
        json={
            'provider_npi': '1234567890',
            'provider_name': 'Dr. Alex Rivera',
            'insurance': 'Blue Cross',
        },
    )
    assert response.status_code == 403
