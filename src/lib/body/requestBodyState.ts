import { type KeyValueEntry, type RequestBodyMode, type RequestBodyState, createId } from '../../domain/models'

interface LegacyFormDataEnvelope {
  kind: 'form-data'
  entries: Array<Partial<KeyValueEntry>>
}

interface LegacyRawEnvelope {
  kind: 'raw'
  contentType?: string
  content: string
}

function isLegacyFormDataEnvelope(value: unknown): value is LegacyFormDataEnvelope {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return candidate.kind === 'form-data' && Array.isArray(candidate.entries)
}

function isLegacyRawEnvelope(value: unknown): value is LegacyRawEnvelope {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return candidate.kind === 'raw' && typeof candidate.content === 'string'
}

export function createFormDataEntry(overrides: Partial<KeyValueEntry> = {}): KeyValueEntry {
  return {
    id: createId('fd'),
    key: '',
    value: '',
    enabled: true,
    ...overrides,
  }
}

export function getDefaultContentType(mode: RequestBodyMode): string {
  if (mode === 'json') {
    return 'application/json'
  }

  if (mode === 'text') {
    return 'text/plain;charset=UTF-8'
  }

  if (mode === 'form-data') {
    return 'multipart/form-data'
  }

  return 'text/plain'
}

function normalizeFormDataEntries(entries: unknown): KeyValueEntry[] {
  if (!Array.isArray(entries)) {
    return []
  }

  return entries
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const candidate = entry as Record<string, unknown>
      return createFormDataEntry({
        id: typeof candidate.id === 'string' ? candidate.id : createId('fd'),
        key: typeof candidate.key === 'string' ? candidate.key : '',
        value: typeof candidate.value === 'string' ? candidate.value : '',
        enabled: candidate.enabled !== false,
      })
    })
}

function parseLegacyFormDataFromContent(content: string): KeyValueEntry[] {
  const trimmed = content.trim()
  if (!trimmed) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (isLegacyFormDataEnvelope(parsed)) {
      return normalizeFormDataEntries(parsed.entries)
    }
  } catch {
    // Ignore and fallback to key=value line parsing.
  }

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [key, ...rest] = line.split('=')
      return createFormDataEntry({
        key: key ?? '',
        value: rest.join('='),
      })
    })
}

function parseLegacyRawFromContent(content: string): { content: string; contentType?: string } {
  const trimmed = content.trim()
  if (!trimmed) {
    return { content: '' }
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (isLegacyRawEnvelope(parsed)) {
      return {
        content: parsed.content,
        contentType: parsed.contentType,
      }
    }
  } catch {
    // Keep raw body content as-is.
  }

  return { content }
}

export function normalizeRequestBodyState(body: Partial<RequestBodyState> | undefined): RequestBodyState {
  const mode = body?.mode ?? 'none'
  const content = typeof body?.content === 'string' ? body.content : ''
  const contentType =
    typeof body?.contentType === 'string' && body.contentType.trim().length > 0
      ? body.contentType
      : getDefaultContentType(mode)

  if (mode === 'form-data') {
    const formDataFromField = normalizeFormDataEntries(body?.formData)
    const formData =
      formDataFromField.length > 0 ? formDataFromField : parseLegacyFormDataFromContent(content)

    return {
      mode,
      content: '',
      contentType,
      formData,
    }
  }

  if (mode === 'raw') {
    const raw = parseLegacyRawFromContent(content)
    return {
      mode,
      content: raw.content,
      contentType: raw.contentType ?? contentType,
      formData: [],
    }
  }

  return {
    mode,
    content,
    contentType,
    formData: [],
  }
}

export function getBodyPreviewText(body: RequestBodyState): string {
  if (body.mode === 'form-data') {
    return body.formData
      .filter((entry) => entry.enabled && entry.key.trim().length > 0)
      .map((entry) => `${entry.key}=${entry.value}`)
      .join('\n')
  }

  return body.content
}
