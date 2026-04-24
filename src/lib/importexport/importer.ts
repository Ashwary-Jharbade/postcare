import { type CollectionRecord, type RequestRecord } from '../../domain/models'
import { type CollectionExportData, validateCollectionExportData } from './formats'

export interface ImportResult {
  success: boolean
  collectionsImported: number
  requestsImported: number
  errors: string[]
}

/**
 * Parse JSON string to export data with validation
 */
export function parseExportData(jsonString: string): CollectionExportData | null {
  try {
    const data = JSON.parse(jsonString)
    if (validateCollectionExportData(data)) {
      return data
    }
    return null
  } catch {
    return null
  }
}

/**
 * Generate a new UUID using a simple approach compatible with crypto-js
 * Note: For production, consider using a proper UUID library
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Import collection data and generate new records with fresh IDs
 */
export function importCollectionData(
  exportData: CollectionExportData,
  existingCollectionNames: Set<string> = new Set(),
): {
  collections: CollectionRecord[]
  requests: RequestRecord[]
  idMapping: Map<string, string> // Maps old IDs to new IDs
} {
  const collections: CollectionRecord[] = []
  const requests: RequestRecord[] = []
  const idMapping = new Map<string, string>()
  const now = new Date().toISOString()

  exportData.collections.forEach((exportedCollection, collectionIndex) => {
    // Handle duplicate collection names
    let collectionName = exportedCollection.name
    let counter = 1
    while (existingCollectionNames.has(collectionName)) {
      collectionName = `${exportedCollection.name} (${counter})`
      counter++
    }

    const collectionId = generateId()
    const collection: CollectionRecord = {
      id: collectionId,
      name: collectionName,
      description: exportedCollection.description,
      parentId: exportedCollection.parentId,
      requestIds: [],
      createdAt: now,
      updatedAt: now,
    }

    const importedRequestIds: string[] = []

    // Import requests for this collection
    exportedCollection.requests.forEach((exportedRequest: typeof exportedCollection.requests[0]) => {
      const requestId = generateId()
      const request: RequestRecord = {
        id: requestId,
        collectionId: collectionId,
        folderId: exportedRequest.folderId,
        environmentId: undefined, // Don't import environment bindings
        name: exportedRequest.name,
        method: exportedRequest.method,
        url: exportedRequest.url,
        headers: exportedRequest.headers.map((h: typeof exportedRequest.headers[0]) => ({ ...h, id: generateId() })),
        queryParams: exportedRequest.queryParams.map((p: typeof exportedRequest.queryParams[0]) => ({ ...p, id: generateId() })),
        pathParams: exportedRequest.pathParams.map((p: typeof exportedRequest.pathParams[0]) => ({ ...p, id: generateId() })),
        body: exportedRequest.body,
        auth: exportedRequest.auth,
        notes: exportedRequest.notes,
        tags: exportedRequest.tags,
        createdAt: now,
        updatedAt: now,
      }

      requests.push(request)
      importedRequestIds.push(requestId)

      // Track ID mappings for reference resolution
      if (exportedRequest.name) {
        idMapping.set(`${collectionIndex}-${exportedRequest.name}`, requestId)
      }
    })

    collection.requestIds = importedRequestIds
    collections.push(collection)
  })

  return { collections, requests, idMapping }
}

/**
 * Validate import data before import
 */
export function validateImportData(exportData: CollectionExportData): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!exportData.collections || !Array.isArray(exportData.collections)) {
    errors.push('Invalid export format: missing collections array')
    return { valid: false, errors }
  }

  exportData.collections.forEach((collection, idx) => {
    if (!collection.name || typeof collection.name !== 'string') {
      errors.push(`Collection ${idx}: missing or invalid name`)
    }
    if (!Array.isArray(collection.requests)) {
      errors.push(`Collection "${collection.name}": requests must be an array`)
    }
  })

  return { valid: errors.length === 0, errors }
}
