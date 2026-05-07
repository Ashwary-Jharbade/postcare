import { describe, expect, it, vi, beforeEach } from 'vitest'
import { chatCompletion, validateApiKey, getStoredApiKey, storeApiKey, clearApiKey } from './cerebrasClient'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock localStorage
const storage = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
})

beforeEach(() => {
  mockFetch.mockReset()
  storage.clear()
})

describe('cerebrasClient', () => {
  describe('chatCompletion', () => {
    it('sends correct request shape to Cerebras API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          choices: [{ message: { role: 'assistant', content: 'Hello!' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      })

      const result = await chatCompletion('test-key', [{ role: 'user', content: 'Hi' }])

      expect(mockFetch).toHaveBeenCalledOnce()
      const call = mockFetch.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }]
      const url = call[0]
      const options = call[1]
      expect(url).toBe('https://api.cerebras.ai/v1/chat/completions')
      expect(options.method).toBe('POST')
      expect(options.headers['Authorization']).toBe('Bearer test-key')
      expect(options.headers['Content-Type']).toBe('application/json')

      const body = JSON.parse(options.body as string)
      expect(body.model).toBe('llama3.1-8b')
      expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }])
      expect(body.temperature).toBe(0.7)
      expect(body.max_completion_tokens).toBe(2048)

      expect(result.choices[0]?.message.content).toBe('Hello!')
    })

    it('throws on 401 with descriptive message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid key',
      })

      await expect(chatCompletion('bad-key', [{ role: 'user', content: 'Hi' }]))
        .rejects.toThrow('Invalid Cerebras API key')
    })

    it('throws on 429 with rate limit message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => '',
      })

      await expect(chatCompletion('key', [{ role: 'user', content: 'Hi' }]))
        .rejects.toThrow('Rate limit exceeded')
    })

    it('throws on other errors with status code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'server error body',
      })

      await expect(chatCompletion('key', [{ role: 'user', content: 'Hi' }]))
        .rejects.toThrow('Cerebras API error (500)')
    })

    it('uses custom model and temperature', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-456',
          choices: [{ message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
        }),
      })

      await chatCompletion('key', [{ role: 'user', content: 'test' }], {
        model: 'gpt-oss-120b',
        temperature: 0.2,
        maxTokens: 100,
      })

      const call = mockFetch.mock.calls[0] as [string, RequestInit]
      const body = JSON.parse(call[1].body as string)
      expect(body.model).toBe('gpt-oss-120b')
      expect(body.temperature).toBe(0.2)
      expect(body.max_completion_tokens).toBe(100)
    })
  })

  describe('validateApiKey', () => {
    it('returns true for valid key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test',
          choices: [{ message: { role: 'assistant', content: 'pong' }, finish_reason: 'stop' }],
        }),
      })

      const result = await validateApiKey('valid-key')
      expect(result).toBe(true)
    })

    it('returns false for invalid key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'bad key',
      })

      const result = await validateApiKey('bad-key')
      expect(result).toBe(false)
    })
  })

  describe('API key storage', () => {
    it('stores and retrieves key', () => {
      expect(getStoredApiKey()).toBeNull()
      storeApiKey('my-secret-key')
      expect(getStoredApiKey()).toBe('my-secret-key')
    })

    it('clears stored key', () => {
      storeApiKey('key-to-remove')
      expect(getStoredApiKey()).toBe('key-to-remove')
      clearApiKey()
      expect(getStoredApiKey()).toBeNull()
    })
  })
})
