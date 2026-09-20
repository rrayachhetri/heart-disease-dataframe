def _register_payload(email: str = 'alice@example.com') -> dict:
    return {
        'email': email,
        'password': 'StrongPass123',
        'role': 'patient',
        'first_name': 'Alice',
        'last_name': 'Walker',
    }


def test_register_and_login_success(client):
    reg = client.post('/api/auth/register', json=_register_payload())
    assert reg.status_code == 201

    login = client.post(
        '/api/auth/login',
        json={'email': 'alice@example.com', 'password': 'StrongPass123'},
    )
    assert login.status_code == 200
    body = login.json()
    assert 'access_token' in body
    assert 'refresh_token' in body


def test_me_requires_auth_and_returns_profile(client):
    client.post('/api/auth/register', json=_register_payload('patient1@example.com'))
    login = client.post(
        '/api/auth/login',
        json={'email': 'patient1@example.com', 'password': 'StrongPass123'},
    )
    token = login.json()['access_token']

    unauthorized = client.get('/api/auth/me')
    assert unauthorized.status_code == 401

    me = client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert me.status_code == 200
    me_json = me.json()
    assert me_json['email'] == 'patient1@example.com'
    assert me_json['first_name'] == 'Alice'
    assert me_json['last_name'] == 'Walker'


def test_forgot_and_reset_password_flow(client):
    client.post('/api/auth/register', json=_register_payload('resetme@example.com'))

    forgot = client.post(
        '/api/auth/forgot-password',
        json={
            'email': 'resetme@example.com',
            'first_name': 'Alice',
            'last_name': 'Walker',
        },
    )
    assert forgot.status_code == 200
    forgot_body = forgot.json()
    assert 'generated' in forgot_body['message'].lower()
    assert forgot_body['dev_reset_token']

    reset = client.post(
        '/api/auth/reset-password',
        json={
            'token': forgot_body['dev_reset_token'],
            'new_password': 'NewStrongPass123',
        },
    )
    assert reset.status_code == 200

    old_login = client.post(
        '/api/auth/login',
        json={'email': 'resetme@example.com', 'password': 'StrongPass123'},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        '/api/auth/login',
        json={'email': 'resetme@example.com', 'password': 'NewStrongPass123'},
    )
    assert new_login.status_code == 200
