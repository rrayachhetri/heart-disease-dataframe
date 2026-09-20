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
