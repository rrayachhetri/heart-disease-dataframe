import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Java preview', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_API_BACKEND', 'java');
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('routes migrated endpoints to Java without sending either account token to Python', async () => {
    localStorage.setItem('access_token', 'python-token');
    localStorage.setItem('java_access_token', 'java-token');
    const { api } = await import('../api');
    const requests: { baseURL: string | undefined; authorization: unknown }[] = [];
    api.defaults.adapter = async (config) => {
      requests.push({ baseURL: config.baseURL, authorization: config.headers.Authorization });
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    };

    await api.post('/auth/login', {});
    await api.get('/doctors/me');
    await api.get('/analytics/datasets');
    await api.post('/predictions', {});
    await api.get('/local-doctors/search');

    expect(requests).toEqual([
      { baseURL: '/java-api', authorization: 'Bearer java-token' },
      { baseURL: '/java-api', authorization: 'Bearer java-token' },
      { baseURL: '/java-api', authorization: 'Bearer java-token' },
      { baseURL: '/api', authorization: undefined },
      { baseURL: '/api', authorization: undefined },
    ]);
  });

  it('keeps Java and Python sessions separate and restores Java login', async () => {
    localStorage.setItem('access_token', 'python-token');
    const { api } = await import('../api');
    const { login, refreshTokens } = await import('../authApi');
    const { getAccessToken, clearTokens } = await import('../config');
    api.defaults.adapter = async (config) => ({
      data: { access_token: 'java-token', refresh_token: 'java-refresh', token_type: 'bearer' },
      status: 200, statusText: 'OK', headers: {}, config,
    });

    await login({ email: 'test@example.com', password: 'password' });
    expect(getAccessToken()).toBe('java-token');
    expect(localStorage.getItem('access_token')).toBe('python-token');
    await refreshTokens();
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('access_token')).toBe('python-token');
  });

  it('blocks unsupported account operations and does not link Python doctor IDs', async () => {
    const { api } = await import('../api');
    const { forgotPassword } = await import('../authApi');
    const { requestAppointment, searchLocalDoctors } = await import('../doctorApi');
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: [{ npi: '123', registered_doctor_id: 'python-doctor' }],
    });

    await expect(forgotPassword('test@example.com', 'Test', 'User')).rejects.toThrow('not available');
    await expect(requestAppointment({
      provider_npi: '123', provider_name: 'Test', insurance: 'Plan',
    })).rejects.toThrow('not available');
    await expect(searchLocalDoctors('94105')).resolves.toEqual([
      { npi: '123', registered_doctor_id: null },
    ]);
    expect(get).toHaveBeenCalledOnce();
  });

  it('sends chat inline without Java credentials or a Python prediction ID', async () => {
    localStorage.setItem('java_access_token', 'java-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => ({ read: vi.fn().mockResolvedValue({ done: true }) }) },
    });
    vi.stubGlobal('fetch', fetchMock);
    const { askCardioSenseStream } = await import('../chatApi');
    await askCardioSenseStream('Explain', {
      id: 'old-python-id', probability: 0.3, prediction: 0, risk_level: 'low',
    }, null, { onToken: vi.fn() });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/chat/stream');
    expect(options.headers.Authorization).toBeUndefined();
    expect(JSON.parse(options.body)).toMatchObject({
      question: 'Explain', context: { probability: 0.3 },
    });
    expect(JSON.parse(options.body)).not.toHaveProperty('prediction_id');
  });
});
