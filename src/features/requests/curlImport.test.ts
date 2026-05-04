import { describe, expect, it } from 'vitest'
import { parseCurlCommand } from './curlImport'

describe('parseCurlCommand', () => {
  it('parses a minimal GET request from cURL', () => {
    const parsed = parseCurlCommand('curl https://api.example.com/health')

    expect(parsed.method).toBe('GET')
    expect(parsed.url).toBe('https://api.example.com/health')
    expect(parsed.headers).toEqual([])
    expect(parsed.body.mode).toBe('none')
    expect(parsed.warnings).toEqual([])
  })

  it('parses headers, query params, and json body from common flags', () => {
    const parsed = parseCurlCommand(
      'curl "https://api.example.com/users?active=true" -H "Content-Type: application/json" -H "X-Trace-Id: abc123" --data \'{"name":"Ada"}\'',
    )

    expect(parsed.method).toBe('POST')
    expect(parsed.queryParams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'active', value: 'true', enabled: true }),
      ]),
    )
    expect(parsed.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'Content-Type', value: 'application/json' }),
        expect.objectContaining({ key: 'X-Trace-Id', value: 'abc123' }),
      ]),
    )
    expect(parsed.body).toEqual(
      expect.objectContaining({
        mode: 'json',
        content: '{"name":"Ada"}',
        contentType: 'application/json',
      }),
    )
  })

  it('accepts explicit request method flags', () => {
    const parsed = parseCurlCommand(
      'curl --request PUT --url https://api.example.com/users/42 --data-raw "hello"',
    )

    expect(parsed.method).toBe('PUT')
    expect(parsed.body).toEqual(
      expect.objectContaining({
        mode: 'text',
        content: 'hello',
      }),
    )
  })

  it('treats short -d payloads as request bodies and infers POST', () => {
    const parsed = parseCurlCommand(
      'curl https://api.example.com/messages -H "Content-Type: application/json" -d \'{"text":"hello"}\'',
    )

    expect(parsed.method).toBe('POST')
    expect(parsed.body).toEqual(
      expect.objectContaining({
        mode: 'json',
        content: '{"text":"hello"}',
        contentType: 'application/json',
      }),
    )
  })

  it('warns for unsupported flags without blocking import', () => {
    const parsed = parseCurlCommand(
      'curl https://api.example.com/items --compressed --data "a=1"',
    )

    expect(parsed.method).toBe('POST')
    expect(parsed.warnings).toContain('Ignored unsupported cURL flag "--compressed".')
  })

  it('drops conditional headers that can force cached 304 responses', () => {
    const parsed = parseCurlCommand(
      'curl https://jsonplaceholder.typicode.com/todos/1 -H "If-None-Match: \\"abc\\""',
    )

    expect(parsed.headers).toEqual([])
    expect(parsed.warnings).toContain(
      'Ignored conditional header "If-None-Match" because it can force a cached response.',
    )
  })

  it('throws when no url is present', () => {
    expect(() => parseCurlCommand('curl -H "Accept: application/json"')).toThrow(
      'Could not find a request URL in the pasted cURL command.',
    )
  })
})
