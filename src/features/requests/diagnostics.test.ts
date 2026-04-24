import { describe, expect, it } from 'vitest'
import { createDefaultRequest, type ResponseRecord } from '../../domain/models'
import {
  buildErrorDiagnostic,
  buildSuccessDiagnostic,
  categorizeExecutionError,
} from './diagnostics'

describe('execution diagnostics', () => {
  it('builds success diagnostics with response metadata', () => {
    const request = createDefaultRequest()
    const response: ResponseRecord = {
      status: 200,
      ok: true,
      statusText: 'OK',
      durationMs: 42,
      url: request.url,
      headers: [],
      body: '{"ok":true}',
      bodyFormat: 'json',
    }

    const diagnostic = buildSuccessDiagnostic('trace_1', request, response, undefined, {
      simulation: { mode: 'off' },
    })

    expect(diagnostic.traceId).toBe('trace_1')
    expect(diagnostic.responseStatus).toBe(200)
    expect(diagnostic.responseBytes).toBeGreaterThan(0)
    expect(diagnostic.jsonParseOk).toBe(true)
    expect(diagnostic.severity).toBe('info')
  })

  it('categorizes timeout and network errors', () => {
    expect(categorizeExecutionError('Simulated timeout')).toBe('timeout')
    expect(categorizeExecutionError('Network request failed')).toBe('network')
    expect(categorizeExecutionError('Something went wrong')).toBe('request')
  })

  it('builds error diagnostics with category', () => {
    const request = createDefaultRequest()
    const diagnostic = buildErrorDiagnostic('trace_2', request, 'Failed to fetch', undefined, {
      simulation: { mode: 'network-error' },
    })

    expect(diagnostic.severity).toBe('error')
    expect(diagnostic.errorCategory).toBe('network')
    expect(diagnostic.simulationMode).toBe('network-error')
  })
})
