import { describe, expect, it } from 'vitest'
import { createDefaultRequest } from '../../domain/models'
import { redactHeaders, redactRequestForAi, redactSensitiveValue } from './redaction'

describe('redaction safeguards', () => {
  it('redacts auth tokens from free text', () => {
    const redacted = redactSensitiveValue('Bearer abcdefghijklmnop')
    expect(redacted).toBe('Bearer [REDACTED]')
  })

  it('redacts sensitive headers by key', () => {
    const headers = redactHeaders([
      { key: 'Authorization', value: 'Bearer token' },
      { key: 'x-request-id', value: 'req-1' },
    ])

    expect(headers).toEqual([
      { key: 'Authorization', value: '[REDACTED]' },
      { key: 'x-request-id', value: 'req-1' },
    ])
  })

  it('returns sanitized request snapshot for ai analysis', () => {
    const request = createDefaultRequest()
    request.headers = [
      { id: '1', key: 'Authorization', value: 'Bearer abc', enabled: true },
    ]
    request.body.content = '{"token":"secret-token"}'

    const snapshot = redactRequestForAi(request)

    expect(snapshot.headers[0]?.value).toBe('[REDACTED]')
    expect(snapshot.body).toContain('[REDACTED]')
  })
})
