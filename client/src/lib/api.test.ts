import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, setCsrfToken } from './api';

function mockFetch(
  status: number,
  body: unknown,
  headers: Record<string, string> = { 'content-type': 'application/json' },
) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
    json: async () => body,
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  setCsrfToken(null);
});

describe('api client', () => {
  it('sends credentials and prefixes /api', async () => {
    const fetchMock = mockFetch(200, { ok: true });
    await api.get('/auth/me');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('attaches the CSRF header on mutations', async () => {
    setCsrfToken('tok123');
    const fetchMock = mockFetch(200, { ok: true });
    await api.post('/communities/x/join');
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>)['x-csrf-token']).toBe('tok123');
  });

  it('throws ApiError carrying the server message and status', async () => {
    mockFetch(403, { error: 'Invalid or missing CSRF token.' });
    await expect(api.post('/communities/x/join')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: 'Invalid or missing CSRF token.',
    });
  });

  it('falls back to a generic message when none provided', async () => {
    mockFetch(500, null);
    const err = (await api.get('/feed').catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toContain('500');
  });
});
