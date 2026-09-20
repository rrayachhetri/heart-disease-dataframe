def test_health_endpoints_report_ok(client):
    res_public = client.get('/health')
    res_api = client.get('/api/health')

    assert res_public.status_code == 200
    assert res_api.status_code == 200
    assert res_public.json()['status'] == 'ok'
    assert res_api.json()['status'] == 'ok'
