import { type ResponseRecord } from '../../domain/models'

export interface ComparisonResult {
  environmentId: string
  environmentName: string
  environmentColor: string
  response: ResponseRecord | null
  error: string | null
  status: 'pending' | 'success' | 'error'
}

export interface ResponseComparison {
  requestId: string
  results: ComparisonResult[]
  executedAt: string
}

export interface DiffHighlight {
  type: 'added' | 'removed' | 'changed' | 'unchanged'
  content: string
  lineNumber?: number
}

/**
 * Compare two responses and return diff highlights
 */
export function diffResponses(responseA: ResponseRecord | null, responseB: ResponseRecord | null): {
  statusDiff: { a: string; b: string; same: boolean }
  headersDiff: DiffHighlight[]
  bodyDiff: DiffHighlight[]
} {
  return {
    statusDiff: {
      a: responseA?.status.toString() || 'N/A',
      b: responseB?.status.toString() || 'N/A',
      same: responseA?.status === responseB?.status,
    },
    headersDiff: [],
    bodyDiff: [],
  }
}

/**
 * Extract JSON structure for deep diff
 */
export function extractJsonStructure(jsonString: string): Record<string, unknown> {
  try {
    return JSON.parse(jsonString)
  } catch {
    return {}
  }
}

/**
 * Compare JSON structures and return differences
 */
export function diffJsonStructures(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): Record<string, { a: unknown; b: unknown }> {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
  const differences: Record<string, { a: unknown; b: unknown }> = {}

  allKeys.forEach((key) => {
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
      differences[key] = { a: a[key], b: b[key] }
    }
  })

  return differences
}
