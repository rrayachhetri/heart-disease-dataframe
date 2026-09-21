from datetime import datetime, timedelta


def _doctor_payload(email: str = 'doctor@example.com') -> dict:
    return {
        'email': email,
        'password': 'StrongPass123',
        'role': 'doctor',
        'first_name': 'Jane',
        'last_name': 'Heart',
    }


def _doctor_token(client, email: str = 'doctor@example.com') -> str:
    client.post('/api/auth/register', json=_doctor_payload(email))
    login = client.post(
        '/api/auth/login',
        json={'email': email, 'password': 'StrongPass123'},
    )
    return login.json()['access_token']


def _patient_token(client, email: str = 'patient@example.com') -> str:
    client.post('/api/auth/register', json={
        'email': email,
        'password': 'StrongPass123',
        'role': 'patient',
        'first_name': 'Pat',
        'last_name': 'Patient',
    })
    login = client.post('/api/auth/login', json={'email': email, 'password': 'StrongPass123'})
    return login.json()['access_token']


def test_doctor_profile_requires_valid_npi_and_normalizes_insurance(client):
    token = _doctor_token(client)
    headers = {'Authorization': f'Bearer {token}'}

    invalid = client.put(
        '/api/doctors/me',
        headers=headers,
        json={'npi_number': '1234'},
    )
    assert invalid.status_code == 422

    updated = client.put(
        '/api/doctors/me',
        headers=headers,
        json={
            'npi_number': '1234567890',
            'specialty': 'Cardiology',
            'accepted_insurance': ['Blue Cross', 'Aetna'],
        },
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body['is_npi_verified'] is True
    assert body['accepted_insurance'] == ['Blue Cross', 'Aetna']


def test_recommendations_match_payer_case_and_format(client):
    token = _doctor_token(client, 'recommend@example.com')
    headers = {'Authorization': f'Bearer {token}'}
    client.put(
        '/api/doctors/me',
        headers=headers,
        json={
            'npi_number': '1234567890',
            'specialty': 'Cardiology',
            'accepted_insurance': ['Blue Cross'],
        },
    )

    recommendations = client.get(
        '/api/doctors/recommendations',
        params={'insurance': 'blue-cross', 'specialty': 'cardio'},
    )
    assert recommendations.status_code == 200
    body = recommendations.json()
    assert len(body) == 1
    assert body[0]['insurance_match']['in_network'] is True
    assert body[0]['insurance_match']['matched_plan'] == 'Blue Cross'

    verification = client.get(
        f"/api/doctors/{body[0]['id']}/insurance",
        params={'insurance': 'Aetna'},
    )
    assert verification.status_code == 200
    assert verification.json()['in_network'] is False
    assert verification.json()['matched_plan'] is None


def test_patient_can_book_available_in_network_doctor_slot_once(client):
    doctor_token = _doctor_token(client, 'booking-doctor@example.com')
    doctor_headers = {'Authorization': f'Bearer {doctor_token}'}
    profile = client.put(
        '/api/doctors/me',
        headers=doctor_headers,
        json={'accepted_insurance': ['Blue Cross']},
    )
    doctor_id = profile.json()['id']
    starts_at = datetime.utcnow() + timedelta(days=2)
    slot = client.post(
        '/api/doctors/me/slots',
        headers=doctor_headers,
        json={
            'starts_at': starts_at.isoformat(),
            'ends_at': (starts_at + timedelta(minutes=30)).isoformat(),
        },
    )
    assert slot.status_code == 201

    patient_headers = {'Authorization': f'Bearer {_patient_token(client)}'}
    booking = client.post(
        f'/api/doctors/{doctor_id}/bookings',
        headers=patient_headers,
        json={'slot_id': slot.json()['id'], 'insurance': 'blue-cross'},
    )
    assert booking.status_code == 201
    assert booking.json()['status'] == 'confirmed'

    duplicate = client.post(
        f'/api/doctors/{doctor_id}/bookings',
        headers=patient_headers,
        json={'slot_id': slot.json()['id'], 'insurance': 'Blue Cross'},
    )
    assert duplicate.status_code == 409
