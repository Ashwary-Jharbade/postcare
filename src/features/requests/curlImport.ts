import {
  createKeyValueEntry,
  type HttpMethod,
  type KeyValueEntry,
  type RequestBodyState,
} from '../../domain/models'
import { getDefaultContentType } from '../../lib/body/requestBodyState'

const SUPPORTED_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const FLAGS_WITH_VALUES = new Set([
  '-A',
  '--user-agent',
  '-b',
  '--cookie',
  '--cert',
  '-e',
  '--referer',
  '-F',
  '--form',
  '--key',
  '--proxy',
  '-u',
  '--user',
])

const CONDITIONAL_HEADERS = new Set([
  'if-match',
  'if-none-match',
  'if-modified-since',
  'if-unmodified-since',
])

export interface ParsedCurlImport {
  method: HttpMethod
  url: string
  headers: KeyValueEntry[]
  queryParams: KeyValueEntry[]
  body: RequestBodyState
  warnings: string[]
}

function ensureJsonHeaders(headers: KeyValueEntry[]) {
  const hasContentType = headers.some((header) => header.key.toLowerCase() === 'content-type')
  const hasAccept = headers.some((header) => header.key.toLowerCase() === 'accept')

  if (!hasContentType) {
    headers.push(createKeyValueEntry('Content-Type', 'application/json'))
  }

  if (!hasAccept) {
    headers.push(createKeyValueEntry('Accept', 'application/json'))
  }
}

function normalizeInput(input: string): string {
  return input
    .replace(/\\\r?\n/g, ' ')
    .replace(/^\s*\$\s?/gm, '')
    .trim()
}

function tokenizeShellWords(input: string): string[] {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index] ?? ''

    if (quote) {
      if (character === quote) {
        quote = null
        continue
      }

      if (character === '\\' && quote === '"' && index + 1 < input.length) {
        index += 1
        current += input[index] ?? ''
        continue
      }

      current += character
      continue
    }

    if (character === '"' || character === "'") {
      quote = character
      continue
    }

    if (character === '\\' && index + 1 < input.length) {
      index += 1
      current += input[index] ?? ''
      continue
    }

    if (/\s/.test(character)) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += character
  }

  if (quote) {
    throw new Error('The pasted cURL command has an unclosed quote.')
  }

  if (current) {
    tokens.push(current)
  }

  return tokens
}

function normalizeMethod(value: string, warnings: string[]): HttpMethod {
  const candidate = value.toUpperCase()

  if (SUPPORTED_METHODS.includes(candidate as HttpMethod)) {
    return candidate as HttpMethod
  }

  warnings.push(`Unsupported HTTP method "${value}" was ignored.`)
  return 'GET'
}

function isLikelyUrl(token: string): boolean {
  return /^(https?:\/\/|localhost[:/]|[a-z0-9.-]+\.[a-z]{2,}[:/])/i.test(token)
}

function parseHeader(headerText: string, warnings: string[]): KeyValueEntry | null {
  const separatorIndex = headerText.indexOf(':')

  if (separatorIndex <= 0) {
    warnings.push(`Ignored invalid header "${headerText}".`)
    return null
  }

  const key = headerText.slice(0, separatorIndex).trim()
  const value = headerText.slice(separatorIndex + 1).trim()

  if (CONDITIONAL_HEADERS.has(key.toLowerCase())) {
    warnings.push(`Ignored conditional header "${key}" because it can force a cached response.`)
    return null
  }

  return createKeyValueEntry(key, value)
}

function buildQueryParams(url: string): KeyValueEntry[] {
  try {
    const parsedUrl = new URL(url)
    return Array.from(parsedUrl.searchParams.entries()).map(([key, value]) =>
      createKeyValueEntry(key, value),
    )
  } catch {
    return []
  }
}

function isJsonContentType(contentType: string | undefined): boolean {
  return typeof contentType === 'string' && contentType.toLowerCase().includes('json')
}

function isSafeJsonBody(body: string): boolean {
  const trimmed = body.trim()

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return false
  }

  try {
    JSON.parse(trimmed)
    return true
  } catch {
    return false
  }
}

function buildBody(bodyContent: string, headers: KeyValueEntry[]): RequestBodyState {
  if (!bodyContent) {
    return {
      mode: 'none',
      content: '',
      contentType: getDefaultContentType('none'),
      formData: [],
    }
  }

  const contentType = headers.find((header) => header.key.toLowerCase() === 'content-type')?.value
  const useJsonMode = isJsonContentType(contentType) || isSafeJsonBody(bodyContent)

  if (useJsonMode) {
    return {
      mode: 'json',
      content: bodyContent,
      contentType: contentType ?? 'application/json',
      formData: [],
    }
  }

  return {
    mode: 'text',
    content: bodyContent,
    contentType: contentType ?? getDefaultContentType('text'),
    formData: [],
  }
}

function readFlagValue(
  tokens: string[],
  index: number,
  flag: string,
): { value: string; nextIndex: number } {
  const nextValue = tokens[index + 1]

  if (!nextValue) {
    throw new Error(`${flag} requires a value.`)
  }

  return { value: nextValue, nextIndex: index + 1 }
}

function consumeUnsupportedFlag(
  token: string,
  tokens: string[],
  index: number,
  warnings: string[],
): number {
  warnings.push(`Ignored unsupported cURL flag "${token}".`)

  if (FLAGS_WITH_VALUES.has(token) && tokens[index + 1]) {
    return index + 1
  }

  return index
}

export function parseCurlCommand(input: string): ParsedCurlImport {
  const normalizedInput = normalizeInput(input)

  if (!normalizedInput) {
    throw new Error('Paste a cURL command to import.')
  }

  const tokens = tokenizeShellWords(normalizedInput)
  if (tokens.length === 0) {
    throw new Error('Paste a cURL command to import.')
  }

  const warnings: string[] = []
  const headers: KeyValueEntry[] = []
  const bodyParts: string[] = []
  let sawDataFlag = false
  let explicitMethod: HttpMethod | null = null
  let url = ''

  const firstToken = tokens[0]?.toLowerCase()
  const startIndex = firstToken === 'curl' || firstToken === 'curl.exe' ? 1 : 0

  for (let index = startIndex; index < tokens.length; index += 1) {
    const token = tokens[index]!

    if (token === '-X' || token === '--request') {
      const result = readFlagValue(tokens, index, token)
      explicitMethod = normalizeMethod(result.value, warnings)
      index = result.nextIndex
      continue
    }

    if (token.startsWith('-X') && token.length > 2) {
      explicitMethod = normalizeMethod(token.slice(2), warnings)
      continue
    }

    if (token.startsWith('--request=') && token.length > '--request='.length) {
      explicitMethod = normalizeMethod(token.slice('--request='.length), warnings)
      continue
    }

    if (token === '--url') {
      const result = readFlagValue(tokens, index, token)
      url = result.value
      index = result.nextIndex
      continue
    }

    if (token.startsWith('--url=') && token.length > '--url='.length) {
      url = token.slice('--url='.length)
      continue
    }

    if (token === '-H' || token === '--header') {
      const result = readFlagValue(tokens, index, token)
      const parsedHeader = parseHeader(result.value, warnings)
      if (parsedHeader) {
        headers.push(parsedHeader)
      }
      index = result.nextIndex
      continue
    }

    if (token.startsWith('-H') && token.length > 2) {
      const parsedHeader = parseHeader(token.slice(2), warnings)
      if (parsedHeader) {
        headers.push(parsedHeader)
      }
      continue
    }

    if (token.startsWith('--header=') && token.length > '--header='.length) {
      const parsedHeader = parseHeader(token.slice('--header='.length), warnings)
      if (parsedHeader) {
        headers.push(parsedHeader)
      }
      continue
    }

    if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--data-urlencode'
    ) {
      const result = readFlagValue(tokens, index, token)
      sawDataFlag = true
      bodyParts.push(result.value)
      index = result.nextIndex
      continue
    }

    if (token === '--json') {
      const result = readFlagValue(tokens, index, token)
      sawDataFlag = true
      bodyParts.push(result.value)
      ensureJsonHeaders(headers)
      index = result.nextIndex
      continue
    }

    if (
      (token.startsWith('-d') && token.length > 2) ||
      token.startsWith('--data=') ||
      token.startsWith('--data-raw=') ||
      token.startsWith('--data-binary=') ||
      token.startsWith('--data-urlencode=') ||
      token.startsWith('--json=')
    ) {
      sawDataFlag = true
      if (token.startsWith('--json=')) {
        ensureJsonHeaders(headers)
      }
      bodyParts.push(token.startsWith('-d') ? token.slice(2) : token.slice(token.indexOf('=') + 1))
      continue
    }

    if (token.startsWith('-') && token !== '-') {
      index = consumeUnsupportedFlag(token, tokens, index, warnings)
      continue
    }

    if (!url && isLikelyUrl(token)) {
      url = token
      continue
    }
  }

  if (!url) {
    throw new Error('Could not find a request URL in the pasted cURL command.')
  }

  const bodyContent = bodyParts.join('&')
  const method = explicitMethod ?? (sawDataFlag ? 'POST' : 'GET')

  return {
    method,
    url,
    headers,
    queryParams: buildQueryParams(url),
    body: buildBody(bodyContent, headers),
    warnings,
  }
}
