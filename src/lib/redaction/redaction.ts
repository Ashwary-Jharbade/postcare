import { type RequestRecord } from '../../domain/models'
import { getBodyPreviewText } from '../body/requestBodyState'

const SENSITIVE_KEY_PATTERNS = [/authorization/i, /token/i, /secret/i, /password/i, /api[-_]?key/i]
const BEARER_TOKEN_REGEX = /(bearer\s+)[A-Za-z0-9._~+/=-]+/gi
const BASIC_TOKEN_REGEX = /(basic\s+)[A-Za-z0-9._~+/=-]+/gi
const GENERIC_TOKEN_REGEX = /([A-Za-z0-9_-]{8,}\.[A-Za-z0-9._-]{8,}\.?[A-Za-z0-9._-]*)/g

export interface RedactedRequestSnapshot {
  method: string
  url: string
  headers: Array<{ key: string; value: string }>
  body: string
}

export function redactSensitiveValue(value: string): string {
  if (!value.trim()) {
    return value
  }

  const mask = '[REDACTED]'
  return value
    .replace(BEARER_TOKEN_REGEX, `$1${mask}`)
    .replace(BASIC_TOKEN_REGEX, `$1${mask}`)
    .replace(GENERIC_TOKEN_REGEX, mask)
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

export function redactHeaders(headers: Array<{ key: string; value: string }>): Array<{ key: string; value: string }> {
  return headers.map((header) => ({
    key: header.key,
    value: isSensitiveKey(header.key) ? '[REDACTED]' : redactSensitiveValue(header.value),
  }))
}

function redactJsonObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactJsonObject(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const objectValue = value as Record<string, unknown>
  const next: Record<string, unknown> = {}

  Object.keys(objectValue).forEach((key) => {
    if (isSensitiveKey(key)) {
      next[key] = '[REDACTED]'
      return
    }

    next[key] = redactJsonObject(objectValue[key])
  })

  return next
}

function redactBody(body: string): string {
  const trimmed = body.trim()
  if (!trimmed) {
    return body
  }

  try {
    const parsed = JSON.parse(trimmed)
    return JSON.stringify(redactJsonObject(parsed), null, 2)
  } catch {
    return redactSensitiveValue(body)
  }
}

export function redactRequestForAi(request: RequestRecord): RedactedRequestSnapshot {
  const bodyPreview = getBodyPreviewText(request.body)

  return {
    method: request.method,
    url: redactSensitiveValue(request.url),
    headers: redactHeaders(
      request.headers
        .filter((header) => header.enabled && header.key.trim().length > 0)
        .map((header) => ({ key: header.key, value: header.value })),
    ),
    body: redactBody(bodyPreview),
  }
}
