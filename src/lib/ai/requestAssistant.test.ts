import { describe, expect, it } from 'vitest'
import { createDefaultRequest } from '../../domain/models'
import { generateAiSuggestions } from './requestAssistant'

describe('request assistant suggestions', () => {
  it('returns redacted snapshot and edge-case suggestions', () => {
    const request = createDefaultRequest()
    request.method = 'GET'
    request.body.mode = 'json'
    request.body.content = '{"name":"demo"}'
    request.headers = [{ id: '1', key: 'Authorization', value: 'Bearer abc', enabled: true }]

    const result = generateAiSuggestions(request)

    expect(result.redactedRequest.headers[0]?.value).toBe('[REDACTED]')
    expect(result.suggestions.length).toBeGreaterThan(0)
    expect(result.suggestions.some((s) => s.category === 'edge-case')).toBe(true)
  })
})
