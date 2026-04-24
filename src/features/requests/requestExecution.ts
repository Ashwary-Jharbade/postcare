import { type KeyValueEntry, type RequestRecord, type ResponseRecord, type EnvironmentRecord } from '../../domain/models'
import { substituteVariables, substituteFieldVariables } from '../../lib/variables/substitution'

export type SimulationMode =
  | 'off'
  | 'network-error'
  | 'timeout'
  | 'http-error'
  | 'malformed-json'
  | 'empty-body'
  | 'large-payload'

export interface ExecutionSimulationConfig {
  mode: SimulationMode
  delayMs?: number
  forcedStatus?: number
}

export interface ExecuteRequestOptions {
  simulation?: ExecutionSimulationConfig
}

function buildUrl(baseUrl: string, queryParams: KeyValueEntry[], environment?: EnvironmentRecord): string {
  // Substitute variables in URL
  const substUrl = substituteVariables(baseUrl, environment)
  
  // Substitute variables in query params
  const { entries: substQueryParams } = substituteFieldVariables(queryParams, environment)

  const url = new URL(substUrl.value)

  substQueryParams
    .filter((entry) => entry.enabled && entry.key.trim().length > 0)
    .forEach((entry) => {
      url.searchParams.set(entry.key, entry.value)
    })

  return url.toString()
}

function buildHeaders(request: RequestRecord, environment?: EnvironmentRecord): Headers {
  const headers = new Headers()

  // Substitute variables in headers
  const { entries: substHeaders } = substituteFieldVariables(request.headers, environment)

  substHeaders
    .filter((entry) => entry.enabled && entry.key.trim().length > 0)
    .forEach((entry) => {
      headers.set(entry.key, entry.value)
    })

  if (request.auth.type === 'apiKey') {
    const keyName = request.auth.config.keyName?.trim()
    let keyValue = request.auth.config.keyValue ?? ''

    // Substitute variables in auth config
    const substKeyValue = substituteVariables(keyValue, environment)
    keyValue = substKeyValue.value

    if (keyName) {
      headers.set(keyName, keyValue)
    }
  }

  if (request.auth.type === 'bearer') {
    let token = request.auth.config.token?.trim() ?? ''

    // Substitute variables in auth token
    const substToken = substituteVariables(token, environment)
    token = substToken.value

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  if (request.auth.type === 'basic') {
    const username = request.auth.config.username ?? ''
    const password = request.auth.config.password ?? ''
    const encoded = btoa(`${username}:${password}`)
    headers.set('Authorization', `Basic ${encoded}`)
  }

  if (request.body.mode === 'json' && request.body.content.trim() && !headers.has('Content-Type')) {
    headers.set('Content-Type', request.body.contentType || 'application/json')
  }

  if (request.body.mode === 'text' && request.body.content.trim() && !headers.has('Content-Type')) {
    headers.set('Content-Type', request.body.contentType || 'text/plain;charset=UTF-8')
  }

  if (request.body.mode === 'raw' && request.body.content.trim()) {
    const substitutedContentType = substituteVariables(request.body.contentType, environment).value
    if (substitutedContentType && !headers.has('Content-Type')) {
      headers.set('Content-Type', substitutedContentType)
    }
  }

  if (request.body.mode === 'form-data') {
    headers.delete('Content-Type')
  }

  return headers
}

function buildBody(request: RequestRecord, environment?: EnvironmentRecord): BodyInit | undefined {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return undefined
  }

  if (request.body.mode === 'none') {
    return undefined
  }

  if (request.body.mode === 'form-data') {
    const formData = new FormData()
    request.body.formData
      .filter((entry) => entry.enabled && entry.key.trim().length > 0)
      .forEach((entry) => {
        const key = substituteVariables(entry.key, environment).value
        const value = substituteVariables(entry.value, environment).value
        formData.append(key, value)
      })

    return formData
  }

  if (request.body.mode === 'raw') {
    const substBody = substituteVariables(request.body.content, environment)
    return substBody.value
  }

  const substBody = substituteVariables(request.body.content, environment)
  return substBody.value
}

function headersToArray(headers: Headers): Array<{ key: string; value: string }> {
  return Array.from(headers.entries()).map(([key, value]) => ({ key, value }))
}

function detectBodyFormat(body: string): 'json' | 'text' {
  if (!body.trim()) {
    return 'text'
  }

  try {
    JSON.parse(body)
    return 'json'
  } catch {
    return 'text'
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function buildSimulatedResponse(
  mode: Exclude<SimulationMode, 'off' | 'network-error' | 'timeout'>,
  request: RequestRecord,
  delayMs: number,
  forcedStatus?: number,
): ResponseRecord {
  if (mode === 'http-error') {
    const status = forcedStatus && forcedStatus >= 400 && forcedStatus <= 599 ? forcedStatus : 500
    return {
      status,
      ok: false,
      statusText: 'Simulated Error',
      durationMs: delayMs,
      url: request.url,
      headers: [
        { key: 'x-postcare-simulation', value: 'http-error' },
        { key: 'content-type', value: 'application/json' },
      ],
      body: JSON.stringify(
        {
          error: 'Simulated server error',
          status,
        },
        null,
        2,
      ),
      bodyFormat: 'json',
    }
  }

  if (mode === 'malformed-json') {
    return {
      status: 200,
      ok: true,
      statusText: 'OK',
      durationMs: delayMs,
      url: request.url,
      headers: [
        { key: 'x-postcare-simulation', value: 'malformed-json' },
        { key: 'content-type', value: 'application/json' },
      ],
      body: '{"status":"ok","items":[1,2,}',
      bodyFormat: 'text',
    }
  }

  if (mode === 'empty-body') {
    return {
      status: forcedStatus && forcedStatus >= 200 && forcedStatus <= 299 ? forcedStatus : 204,
      ok: true,
      statusText: 'No Content',
      durationMs: delayMs,
      url: request.url,
      headers: [
        { key: 'x-postcare-simulation', value: 'empty-body' },
      ],
      body: '',
      bodyFormat: 'text',
    }
  }

  return {
    status: 200,
    ok: true,
    statusText: 'OK',
    durationMs: delayMs,
    url: request.url,
    headers: [
      { key: 'x-postcare-simulation', value: 'large-payload' },
      { key: 'content-type', value: 'application/json' },
    ],
    body: JSON.stringify(
      {
        status: 'ok',
        items: Array.from({ length: 100 }, (_, index) => ({
          id: index + 1,
          name: `item-${index + 1}`,
          active: index % 2 === 0,
        })),
      },
      null,
      2,
    ),
    bodyFormat: 'json',
  }
}

export async function executeRequest(
  request: RequestRecord,
  environment?: EnvironmentRecord,
  options?: ExecuteRequestOptions,
): Promise<ResponseRecord> {
  const url = buildUrl(request.url, request.queryParams, environment)
  const headers = buildHeaders(request, environment)
  const body = buildBody(request, environment)
  const startedAt = performance.now()
  const simulationMode = options?.simulation?.mode ?? 'off'
  const delayMs = Math.max(0, options?.simulation?.delayMs ?? 0)

  if (delayMs > 0) {
    await delay(delayMs)
  }

  if (simulationMode === 'network-error') {
    throw new Error('Simulated network failure')
  }

  if (simulationMode === 'timeout') {
    throw new Error('Simulated timeout')
  }

  if (simulationMode !== 'off') {
    return buildSimulatedResponse(
      simulationMode,
      request,
      Math.round(performance.now() - startedAt),
      options?.simulation?.forcedStatus,
    )
  }

  const response = await fetch(url, {
    method: request.method,
    headers,
    body,
  })

  const responseBody = await response.text()
  const durationMs = Math.round(performance.now() - startedAt)

  return {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText,
    durationMs,
    url: response.url,
    headers: headersToArray(response.headers),
    body: responseBody,
    bodyFormat: detectBodyFormat(responseBody),
  }
}
