import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDefaultRequest } from '../../domain/models'
import { executeRequest } from './requestExecution'

describe('executeRequest simulations', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses fetch when simulation mode is off', async () => {
    const request = {
      ...createDefaultRequest(),
      method: 'GET' as const,
      url: 'https://example.com/test',
    }

    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      statusText: 'OK',
      url: 'https://example.com/test',
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => '{"ok":true}',
    })

    vi.stubGlobal('fetch', fetchMock)

    const response = await executeRequest(request)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    expect(response.bodyFormat).toBe('json')
  })

  it('throws simulated network failure without calling fetch', async () => {
    const request = {
      ...createDefaultRequest(),
      method: 'GET' as const,
      url: 'https://example.com/test',
    }

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      executeRequest(request, undefined, {
        simulation: {
          mode: 'network-error',
          delayMs: 1,
        },
      }),
    ).rejects.toThrow('Simulated network failure')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns simulated HTTP error response with forced status', async () => {
    const request = {
      ...createDefaultRequest(),
      method: 'GET' as const,
      url: 'https://example.com/test',
    }

    const response = await executeRequest(request, undefined, {
      simulation: {
        mode: 'http-error',
        delayMs: 0,
        forcedStatus: 503,
      },
    })

    expect(response.status).toBe(503)
    expect(response.ok).toBe(false)
    expect(response.headers).toEqual(
      expect.arrayContaining([{ key: 'x-postcare-simulation', value: 'http-error' }]),
    )
  })

  it('returns malformed JSON payload in malformed-json mode', async () => {
    const request = {
      ...createDefaultRequest(),
      method: 'GET' as const,
      url: 'https://example.com/test',
    }

    const response = await executeRequest(request, undefined, {
      simulation: {
        mode: 'malformed-json',
      },
    })

    expect(response.status).toBe(200)
    expect(response.bodyFormat).toBe('text')
    expect(response.body).toContain('items')
  })

  it('sends form-data body as FormData payload', async () => {
    const request = {
      ...createDefaultRequest(),
      method: 'POST' as const,
      url: 'https://example.com/upload',
      body: {
        mode: 'form-data' as const,
        content: '',
        contentType: 'multipart/form-data',
        formData: [{ id: 'fd_1', key: 'name', value: 'demo', enabled: true }],
      },
    }

    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      statusText: 'OK',
      url: 'https://example.com/upload',
      headers: new Headers(),
      text: async () => 'ok',
    })
    vi.stubGlobal('fetch', fetchMock)

    await executeRequest(request)

    const fetchCallArgs = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(fetchCallArgs.body).toBeInstanceOf(FormData)
  })

  it('sends raw body content and applies raw content type', async () => {
    const request = {
      ...createDefaultRequest(),
      method: 'POST' as const,
      url: 'https://example.com/raw',
      body: {
        mode: 'raw' as const,
        contentType: 'application/xml',
        formData: [],
        content: '<a>1</a>',
      },
    }

    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      statusText: 'OK',
      url: 'https://example.com/raw',
      headers: new Headers(),
      text: async () => 'ok',
    })
    vi.stubGlobal('fetch', fetchMock)

    await executeRequest(request)

    const fetchCallArgs = fetchMock.mock.calls[0]?.[1] as RequestInit
    const headers = fetchCallArgs.headers as Headers
    expect(fetchCallArgs.body).toBe('<a>1</a>')
    expect(headers.get('Content-Type')).toBe('application/xml')
  })
})
