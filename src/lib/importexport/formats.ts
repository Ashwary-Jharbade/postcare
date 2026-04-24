import { type CollectionRecord, type RequestRecord } from '../../domain/models'

export const IMPORT_EXPORT_VERSION = '1.0'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportedRequest extends Omit<RequestRecord, 'id' | 'createdAt' | 'updatedAt'> {
  // Omit database-generated fields, will be regenerated on import
}

export interface ExportedCollection extends Omit<CollectionRecord, 'id' | 'createdAt' | 'updatedAt'> {
  requests: ExportedRequest[]
}

export interface CollectionExportData {
  exportVersion: string
  exportedAt: string
  appVersion: string
  collections: ExportedCollection[]
}

export interface RequestExportData {
  exportVersion: string
  exportedAt: string
  appVersion: string
  requests: ExportedRequest[]
}

/**
 * Validate export data structure
 */
export function validateCollectionExportData(data: unknown): data is CollectionExportData {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>
  if (typeof obj.exportVersion !== 'string') return false
  if (typeof obj.exportedAt !== 'string') return false
  if (!Array.isArray(obj.collections)) return false

  return true
}

export function validateRequestExportData(data: unknown): data is RequestExportData {
  if (!data || typeof data !== 'object') return false

  const obj = data as Record<string, unknown>
  if (typeof obj.exportVersion !== 'string') return false
  if (typeof obj.exportedAt !== 'string') return false
  if (!Array.isArray(obj.requests)) return false

  return true
}
