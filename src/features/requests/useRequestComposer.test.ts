import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultRequest, type RequestRecord } from '../../domain/models'
import { useRequestComposer } from './useRequestComposer'

const { mockGet, mockPut } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPut: vi.fn(),
}))

vi.mock('../../lib/storage/db', () => ({
  database: {
    requests: {
      get: mockGet,
      put: mockPut,
    },
  },
  isIndexedDbAvailable: () => true,
}))

function createLoadedRequest(): RequestRecord {
  return {
    ...createDefaultRequest(),
    id: 'req_import',
    auth: {
      type: 'bearer',
      config: {
        token: 'stale-token',
      },
    },
  }
}

describe('useRequestComposer importCurlRequest', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPut.mockReset()
  })

  it('clears existing auth when applying imported curl data', async () => {
    const existingRequest = createLoadedRequest()
    const storedRequest = { ...existingRequest }

    mockGet.mockImplementation(async () => storedRequest)
    mockPut.mockResolvedValue(undefined)

    const { result } = renderHook(() => useRequestComposer(existingRequest.id))

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })

    act(() => {
      result.current.importCurlRequest({
        method: 'GET',
        url: 'https://api.example.com/users',
        queryParams: [],
        headers: [],
        body: {
          mode: 'none',
          content: '',
          contentType: 'text/plain',
          formData: [],
        },
        warnings: [],
      })
    })

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalled()
    })

    const savedRequest = mockPut.mock.calls.at(-1)?.[0] as RequestRecord
    expect(savedRequest.auth).toEqual({
      type: 'none',
      config: {},
    })
  })
})

describe('useRequestComposer setName', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockPut.mockReset()
  })

  it('does not persist empty or whitespace-only names', async () => {
    const existingRequest = createLoadedRequest()
    mockGet.mockImplementation(async () => existingRequest)
    mockPut.mockResolvedValue(undefined)

    const { result } = renderHook(() => useRequestComposer(existingRequest.id))

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })

    const putCountAfterLoad = mockPut.mock.calls.length

    act(() => {
      result.current.setName('')
      result.current.setName('   ')
      result.current.setName('\t')
    })

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })

    expect(mockPut.mock.calls.length).toBe(putCountAfterLoad)
    expect(result.current.state.status).toBe('ready')
    if (result.current.state.status === 'ready') {
      expect(result.current.state.request.name).toBe(existingRequest.name)
    }
  })

  it('trims and saves a non-empty name', async () => {
    const existingRequest = createLoadedRequest()
    mockGet.mockImplementation(async () => existingRequest)
    mockPut.mockResolvedValue(undefined)

    const { result } = renderHook(() => useRequestComposer(existingRequest.id))

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })

    act(() => {
      result.current.setName('  Renamed  ')
    })

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalled()
    })

    const savedRequest = mockPut.mock.calls.at(-1)?.[0] as RequestRecord
    expect(savedRequest.name).toBe('Renamed')
  })
})
