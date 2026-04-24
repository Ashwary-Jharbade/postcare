import { type RequestRecord } from '../../domain/models'
import { redactRequestForAi, type RedactedRequestSnapshot } from '../redaction/redaction'
import { getBodyPreviewText } from '../body/requestBodyState'

export interface AiSuggestion {
  id: string
  title: string
  category: 'edge-case' | 'reliability' | 'security' | 'maintainability'
  detail: string
}

export interface AiSuggestionResult {
  redactedRequest: RedactedRequestSnapshot
  suggestions: AiSuggestion[]
}

function tryParseJson(body: string): unknown | null {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

export function generateAiSuggestions(request: RequestRecord): AiSuggestionResult {
  const redactedRequest = redactRequestForAi(request)
  const bodyPreview = getBodyPreviewText(request.body).trim()
  const suggestions: AiSuggestion[] = []

  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    suggestions.push({
      id: 'suggest_url_scheme',
      title: 'Use an explicit URL scheme',
      category: 'reliability',
      detail: 'Add https:// to avoid URL parsing or environment-specific behavior issues.',
    })
  }

  if (request.method === 'GET' && bodyPreview.length > 0) {
    suggestions.push({
      id: 'suggest_get_body',
      title: 'Avoid body with GET requests',
      category: 'reliability',
      detail: 'Most servers ignore GET request bodies. Move payload values to query params.',
    })
  }

  if (!request.headers.some((header) => header.key.toLowerCase() === 'x-request-id' && header.enabled)) {
    suggestions.push({
      id: 'suggest_trace_header',
      title: 'Add request trace header',
      category: 'maintainability',
      detail: 'Attach x-request-id to make logs and multi-environment comparisons easier to correlate.',
    })
  }

  if (request.body.mode === 'json' && request.body.content.trim()) {
    const parsed = tryParseJson(request.body.content)
    if (parsed === null) {
      suggestions.push({
        id: 'suggest_invalid_json',
        title: 'Fix malformed JSON body',
        category: 'edge-case',
        detail: 'The JSON payload cannot be parsed. Validate it before execution.',
      })
    } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      suggestions.push({
        id: 'suggest_null_variant',
        title: 'Generate null and empty variants',
        category: 'edge-case',
        detail: 'Test object fields with null, empty string, and missing values to verify server validation.',
      })
      suggestions.push({
        id: 'suggest_type_variant',
        title: 'Generate type mismatch variant',
        category: 'edge-case',
        detail: 'Probe strict validation by changing one numeric/string field type in a copy of the payload.',
      })
    }
  }

  if (redactedRequest.headers.some((header) => /authorization|token|secret|api[-_]?key/i.test(header.key))) {
    suggestions.push({
      id: 'suggest_redaction_notice',
      title: 'Sensitive values were redacted',
      category: 'security',
      detail: 'AI analysis used only redacted request values. Never include raw tokens in prompts or exports.',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'suggest_default_regression',
      title: 'Baseline regression checks',
      category: 'edge-case',
      detail: 'Run at least one success, one 4xx, and one timeout simulation to lock baseline behavior.',
    })
  }

  return {
    redactedRequest,
    suggestions,
  }
}
