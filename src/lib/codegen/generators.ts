import { type RequestRecord, type KeyValueEntry } from '../../domain/models'

export interface GeneratedCode {
  curl: string
  fetch: string
  axios: string
  python: string
}

/**
 * Build the full URL with query parameters
 */
function buildFullUrl(baseUrl: string, queryParams: KeyValueEntry[]): string {
  if (!queryParams || queryParams.length === 0) {
    return baseUrl
  }

  const enabled = queryParams.filter((p: KeyValueEntry) => p.enabled !== false)
  if (enabled.length === 0) {
    return baseUrl
  }

  const params = enabled.map((p: KeyValueEntry) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params}`
}

/**
 * Get headers as a filtered map
 */
function getEnabledHeaders(
  headers: KeyValueEntry[],
): Record<string, string> {
  const enabled = headers.filter((h: KeyValueEntry) => h.enabled !== false)
  return Object.fromEntries(enabled.map((h: KeyValueEntry) => [h.key, h.value]))
}

/**
 * Get auth header if applicable (Bearer, API Key, Basic)
 */
function getAuthHeader(request: RequestRecord): [string, string] | null {
  const { auth } = request

  if (auth.type === 'none') return null

  if (auth.type === 'bearer') {
    const token = auth.config['token'] || ''
    return ['Authorization', `Bearer ${token}`]
  }

  if (auth.type === 'apiKey') {
    const key = auth.config['key'] || ''
    const header = auth.config['header'] || 'X-API-Key'
    return [header, key]
  }

  if (auth.type === 'basic') {
    const username = auth.config['username'] || ''
    const password = auth.config['password'] || ''
    const encoded = btoa(`${username}:${password}`)
    return ['Authorization', `Basic ${encoded}`]
  }

  return null
}

/**
 * Generate a cURL command
 */
export function generateCurl(request: RequestRecord): string {
  const url = buildFullUrl(request.url, request.queryParams)
  let cmd = `curl -X ${request.method} '${url}'`

  const headers = getEnabledHeaders(request.headers)
  const authHeader = getAuthHeader(request)
  if (authHeader) {
    headers[authHeader[0]] = authHeader[1]
  }
  if (request.body.mode === 'raw' && request.body.contentType && !headers['Content-Type']) {
    headers['Content-Type'] = request.body.contentType
  }

  Object.entries(headers).forEach(([key, value]) => {
    cmd += ` \\\n  -H '${key}: ${value.replace(/'/g, "'\\''")}'`
  })

  if (request.body.mode === 'form-data') {
    request.body.formData
      .filter((entry) => entry.enabled && entry.key.trim().length > 0)
      .forEach((entry) => {
        cmd += ` \\\n+  -F '${entry.key}=${entry.value.replace(/'/g, "'\\''")}'`
      })
  } else if (request.body.mode !== 'none' && request.body.content) {
    cmd += ` \\\n  -d '${request.body.content.replace(/'/g, "'\\''")}'`
  }

  return cmd
}

/**
 * Generate a JavaScript Fetch request
 */
export function generateFetch(request: RequestRecord): string {
  const url = buildFullUrl(request.url, request.queryParams)

  let code = `const response = await fetch('${url}', {\n`
  code += `  method: '${request.method}',\n`

  const headers = getEnabledHeaders(request.headers)
  const authHeader = getAuthHeader(request)
  if (authHeader) {
    headers[authHeader[0]] = authHeader[1]
  }
  if (request.body.mode === 'raw' && request.body.contentType && !headers['Content-Type']) {
    headers['Content-Type'] = request.body.contentType
  }

  if (Object.keys(headers).length > 0) {
    code += `  headers: {\n`
    Object.entries(headers).forEach(([key, value]) => {
      code += `    '${key}': '${value}',\n`
    })
    code += `  },\n`
  }

  if (request.body.mode === 'form-data') {
    code = `const formData = new FormData();\n`
      + request.body.formData
        .filter((entry) => entry.enabled && entry.key.trim().length > 0)
        .map((entry) => `formData.append('${entry.key}', '${entry.value}');`)
        .join('\n')
      + `\n\nconst response = await fetch('${url}', {\n`
      + `  method: '${request.method}',\n`
      + (Object.keys(headers).length > 0
        ? `  headers: {\n${Object.entries(headers).map(([key, value]) => `    '${key}': '${value}',`).join('\n')}\n  },\n`
        : '')
      + `  body: formData,\n`
      + `});\n\n`
      + `const data = await response.json();\n`
      + `console.log(data);`
    return code
  }

  if (request.body.mode !== 'none' && request.body.content) {
    code += `  body: ${request.body.mode === 'json' ? request.body.content : `'${request.body.content.replace(/'/g, "\\'")}'`},\n`
  }

  code += `});\n\n`
  code += `const data = await response.json();\n`
  code += `console.log(data);`

  return code
}

/**
 * Generate a JavaScript Axios request
 */
export function generateAxios(request: RequestRecord): string {
  const url = buildFullUrl(request.url, request.queryParams)

  let code = `axios({\n`
  code += `  method: '${request.method.toLowerCase()}',\n`
  code += `  url: '${url}',\n`

  const headers = getEnabledHeaders(request.headers)
  const authHeader = getAuthHeader(request)
  if (authHeader) {
    headers[authHeader[0]] = authHeader[1]
  }
  if (request.body.mode === 'raw' && request.body.contentType && !headers['Content-Type']) {
    headers['Content-Type'] = request.body.contentType
  }

  if (Object.keys(headers).length > 0) {
    code += `  headers: {\n`
    Object.entries(headers).forEach(([key, value]) => {
      code += `    '${key}': '${value}',\n`
    })
    code += `  },\n`
  }

  if (request.body.mode === 'form-data') {
    code += `  data: {\n`
    request.body.formData
      .filter((entry) => entry.enabled && entry.key.trim().length > 0)
      .forEach((entry) => {
        code += `    '${entry.key}': '${entry.value}',\n`
      })
    code += `  },\n`
  } else if (request.body.mode !== 'none' && request.body.content) {
    code += `  data: ${request.body.mode === 'json' ? request.body.content : `'${request.body.content.replace(/'/g, "\\'")}'`},\n`
  }

  code += `})\n`
  code += `.then(response => console.log(response.data))\n`
  code += `.catch(error => console.error(error));`

  return code
}

/**
 * Generate a Python request
 */
export function generatePython(request: RequestRecord): string {
  let code = `import requests\n\n`

  const url = buildFullUrl(request.url, request.queryParams)

  const headers = getEnabledHeaders(request.headers)
  const authHeader = getAuthHeader(request)
  if (authHeader) {
    headers[authHeader[0]] = authHeader[1]
  }
  if (request.body.mode === 'raw' && request.body.contentType && !headers['Content-Type']) {
    headers['Content-Type'] = request.body.contentType
  }

  code += `url = '${url}'\n`

  if (Object.keys(headers).length > 0) {
    code += `headers = {\n`
    Object.entries(headers).forEach(([key, value]) => {
      code += `    '${key}': '${value}',\n`
    })
    code += `}\n\n`
  }

  if (request.body.mode === 'none' || (request.body.mode !== 'form-data' && !request.body.content)) {
    code += `response = requests.${request.method.toLowerCase()}(url${Object.keys(headers).length > 0 ? ', headers=headers' : ''})\n`
  } else {
    if (request.body.mode === 'json') {
      code += `import json\n\n`
      code += `data = ${request.body.content}\n\n`
      code += `response = requests.${request.method.toLowerCase()}(url, json=data${Object.keys(headers).length > 0 ? ', headers=headers' : ''})\n`
    } else if (request.body.mode === 'form-data') {
      code += `data = {\n`
      request.body.formData
        .filter((entry) => entry.enabled && entry.key.trim().length > 0)
        .forEach((entry) => {
          code += `    '${entry.key}': '${entry.value}',\n`
        })
      code += `}\n\n`
      code += `response = requests.${request.method.toLowerCase()}(url, data=data${Object.keys(headers).length > 0 ? ', headers=headers' : ''})\n`
    } else {
      code += `data = '${request.body.content.replace(/'/g, "\\'").replace(/\n/g, '\\n')}'\n\n`
      code += `response = requests.${request.method.toLowerCase()}(url, data=data${Object.keys(headers).length > 0 ? ', headers=headers' : ''})\n`
    }
  }

  code += `print(response.json())`

  return code
}

/**
 * Generate all code snippets for a request
 */
export function generateAllCode(request: RequestRecord): GeneratedCode {
  return {
    curl: generateCurl(request),
    fetch: generateFetch(request),
    axios: generateAxios(request),
    python: generatePython(request),
  }
}
