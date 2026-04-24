import { type EnvironmentRecord } from '../../domain/models'

export interface SubstitutionResult {
  value: string
  substitutions: SubstitutionInfo[]
}

export interface SubstitutionInfo {
  variable: string
  found: boolean
  isSecret: boolean
  originalValue: string
}

export interface FieldEntry {
  key: string
  value: string
  enabled?: boolean
}

/**
 * Extract all {{variable}} patterns from a string
 */
export function extractVariableNames(text: string): string[] {
  const pattern = /\{\{([^}]+)\}\}/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const varName = match[1]?.trim()
    if (varName && !matches.includes(varName)) {
      matches.push(varName)
    }
  }

  return matches
}

/**
 * Substitute {{variable}} patterns with environment variable values
 */
export function substituteVariables(
  text: string,
  environment: EnvironmentRecord | null | undefined,
): SubstitutionResult {
  if (!text || !environment) {
    return { value: text || '', substitutions: [] }
  }

  const substitutions: SubstitutionInfo[] = []
  const variables = environment.variables || []

  let result = text
  const variableNames = extractVariableNames(text)

  for (const varName of variableNames) {
    const variable = variables.find((v) => v.key === varName && v.enabled)
    const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(varName)}\\s*\\}\\}`, 'g')

    if (variable) {
      result = result.replace(pattern, variable.value)
      substitutions.push({
        variable: varName,
        found: true,
        isSecret: variable.secret ?? false,
        originalValue: `{{${varName}}}`,
      })
    } else {
      // Variable not found or disabled
      substitutions.push({
        variable: varName,
        found: false,
        isSecret: false,
        originalValue: `{{${varName}}}`,
      })
    }
  }

  return { value: result, substitutions }
}

/**
 * Substitute variables in multiple field entries (headers, query params, etc.)
 */
export function substituteFieldVariables(
  entries: FieldEntry[],
  environment: EnvironmentRecord | null | undefined,
): { entries: FieldEntry[]; allSubstitutions: SubstitutionInfo[] } {
  const allSubstitutions: SubstitutionInfo[] = []
  const entries_ = entries.map((entry) => {
    const result = substituteVariables(entry.value, environment)
    allSubstitutions.push(...result.substitutions)
    return { ...entry, value: result.value }
  })

  return { entries: entries_, allSubstitutions }
}

/**
 * Get all variables needed for a request
 */
export function getRequestVariables(
  url: string,
  headers: FieldEntry[],
  queryParams: FieldEntry[],
  body: string,
): string[] {
  const allVars = new Set<string>()

  extractVariableNames(url).forEach((v) => allVars.add(v))
  extractVariableNames(body).forEach((v) => allVars.add(v))

  headers.forEach((h) => {
    extractVariableNames(h.value).forEach((v) => allVars.add(v))
    extractVariableNames(h.key).forEach((v) => allVars.add(v))
  })

  queryParams.forEach((p) => {
    extractVariableNames(p.value).forEach((v) => allVars.add(v))
    extractVariableNames(p.key).forEach((v) => allVars.add(v))
  })

  return Array.from(allVars)
}

/**
 * Check if all variables in a request are available in the environment
 */
export function validateVariables(
  url: string,
  headers: FieldEntry[],
  queryParams: FieldEntry[],
  body: string,
  environment: EnvironmentRecord | null | undefined,
): { isValid: boolean; missingVariables: string[]; unavailableVariables: string[] } {
  const requiredVars = getRequestVariables(url, headers, queryParams, body)
  const envVariables = (environment?.variables || []).filter((v) => v.enabled)
  const availableVarNames = new Set(envVariables.map((v) => v.key))

  const missingVariables = requiredVars.filter((v) => !availableVarNames.has(v))

  return {
    isValid: missingVariables.length === 0,
    missingVariables,
    unavailableVariables: [],
  }
}

/**
 * Escape special regex characters
 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
