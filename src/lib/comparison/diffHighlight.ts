/**
 * Diff utilities for highlighting changes between responses
 */

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'header'
  content: string
  lineNumber: number
}

export interface DiffResult {
  lines: DiffLine[]
  changeCount: number
  hasPlusMinus: boolean
  addedCount: number
  removedCount: number
}

/**
 * Generate line-by-line diff
 */
export function generateLineDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const lines: DiffLine[] = []
  let lineNumber = 1
  let changeCount = 0
  let addedCount = 0
  let removedCount = 0

  let oldIndex = 0
  let newIndex = 0

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex]
    const newLine = newLines[newIndex]

    if (oldLine === newLine && oldLine !== undefined) {
      lines.push({
        type: 'unchanged',
        content: oldLine,
        lineNumber,
      })
      lineNumber += 1
      oldIndex += 1
      newIndex += 1
      continue
    }

    const nextOldLine = oldLines[oldIndex + 1]
    const nextNewLine = newLines[newIndex + 1]

    if (oldLine !== undefined && nextOldLine === newLine) {
      lines.push({
        type: 'removed',
        content: oldLine,
        lineNumber,
      })
      lineNumber += 1
      changeCount++
      removedCount += 1
      oldIndex += 1
      continue
    }

    if (newLine !== undefined && oldLine === nextNewLine) {
      lines.push({
        type: 'added',
        content: newLine,
        lineNumber,
      })
      lineNumber += 1
      changeCount++
      addedCount += 1
      newIndex += 1
      continue
    }

    if (oldLine !== undefined) {
      lines.push({
        type: 'removed',
        content: oldLine,
        lineNumber,
      })
      lineNumber += 1
      changeCount++
      removedCount += 1
      oldIndex += 1
    }

    if (newLine !== undefined) {
      lines.push({
        type: 'added',
        content: newLine,
        lineNumber,
      })
      lineNumber += 1
      changeCount++
      addedCount += 1
      newIndex += 1
    }
  }

  return {
    lines,
    changeCount,
    hasPlusMinus: changeCount > 0,
    addedCount,
    removedCount,
  }
}

/**
 * Compare two JSON objects and highlight differences
 */
export function diffJsonObjects(a: unknown, b: unknown): {
  differences: Record<string, { old: unknown; new: unknown }>
  hasDifferences: boolean
} {
  const aObj = a && typeof a === 'object' ? (a as Record<string, unknown>) : {}
  const bObj = b && typeof b === 'object' ? (b as Record<string, unknown>) : {}

  const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)])
  const differences: Record<string, { old: unknown; new: unknown }> = {}

  allKeys.forEach((key) => {
    const aVal = JSON.stringify(aObj[key])
    const bVal = JSON.stringify(bObj[key])
    if (aVal !== bVal) {
      differences[key] = {
        old: aObj[key],
        new: bObj[key],
      }
    }
  })

  return {
    differences,
    hasDifferences: Object.keys(differences).length > 0,
  }
}

/**
 * Format value for display with type hint
 */
export function formatDiffValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') {
    return Array.isArray(value) ? `[${value.length} items]` : `{...}`
  }
  return String(value)
}

/**
 * Compare header objects
 */
export function diffHeaders(
  oldHeaders: Array<{ key: string; value: string }>,
  newHeaders: Array<{ key: string; value: string }>,
): {
  added: Array<{ key: string; value: string }>
  removed: Array<{ key: string; value: string }>
  changed: Array<{ key: string; old: string; new: string }>
} {
  const oldMap = new Map(oldHeaders.map((h) => [h.key.toLowerCase(), h]))
  const newMap = new Map(newHeaders.map((h) => [h.key.toLowerCase(), h]))

  const added: Array<{ key: string; value: string }> = []
  const removed: Array<{ key: string; value: string }> = []
  const changed: Array<{ key: string; old: string; new: string }> = []

  // Find removed and changed headers
  oldMap.forEach((header, key) => {
    const newHeader = newMap.get(key)
    if (!newHeader) {
      removed.push(header)
    } else if (header.value !== newHeader.value) {
      changed.push({
        key: header.key,
        old: header.value,
        new: newHeader.value,
      })
    }
  })

  // Find added headers
  newMap.forEach((header, key) => {
    if (!oldMap.has(key)) {
      added.push(header)
    }
  })

  return { added, removed, changed }
}

type JsonValueType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

export interface JsonStructureEntry {
  path: string
  type: JsonValueType
}

export interface JsonStructureDiffResult {
  added: JsonStructureEntry[]
  removed: JsonStructureEntry[]
  changed: Array<{ path: string; oldType: JsonValueType; newType: JsonValueType }>
  hasDifferences: boolean
}

function detectType(value: unknown): JsonValueType {
  if (value === null) {
    return 'null'
  }

  if (Array.isArray(value)) {
    return 'array'
  }

  if (typeof value === 'object') {
    return 'object'
  }

  return typeof value as Exclude<JsonValueType, 'object' | 'array' | 'null'>
}

function collectStructure(
  value: unknown,
  path: string,
  output: Map<string, JsonValueType>,
) {
  const currentType = detectType(value)
  output.set(path, currentType)

  if (currentType === 'object') {
    const objectValue = value as Record<string, unknown>
    Object.keys(objectValue)
      .sort()
      .forEach((key) => {
        collectStructure(objectValue[key], `${path}.${key}`, output)
      })
  }

  if (currentType === 'array') {
    const arrayValue = value as unknown[]
    if (arrayValue.length > 0) {
      collectStructure(arrayValue[0], `${path}[]`, output)
    }
  }
}

export function diffJsonStructure(oldValue: unknown, newValue: unknown): JsonStructureDiffResult {
  const oldMap = new Map<string, JsonValueType>()
  const newMap = new Map<string, JsonValueType>()

  collectStructure(oldValue, '$', oldMap)
  collectStructure(newValue, '$', newMap)

  const added: JsonStructureEntry[] = []
  const removed: JsonStructureEntry[] = []
  const changed: Array<{ path: string; oldType: JsonValueType; newType: JsonValueType }> = []

  oldMap.forEach((oldType, path) => {
    const newType = newMap.get(path)
    if (!newType) {
      removed.push({ path, type: oldType })
      return
    }

    if (newType !== oldType) {
      changed.push({ path, oldType, newType })
    }
  })

  newMap.forEach((newType, path) => {
    if (!oldMap.has(path)) {
      added.push({ path, type: newType })
    }
  })

  return {
    added,
    removed,
    changed,
    hasDifferences: added.length > 0 || removed.length > 0 || changed.length > 0,
  }
}
