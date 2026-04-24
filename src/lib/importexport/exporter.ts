import { type CollectionRecord, type RequestRecord } from '../../domain/models'
import { IMPORT_EXPORT_VERSION, type CollectionExportData, type ExportedRequest } from './formats'

/**
 * Export a collection with all its requests as JSON data
 */
export function exportCollectionAsJson(
  collection: CollectionRecord,
  requests: RequestRecord[],
): CollectionExportData {
  const exportedRequests: ExportedRequest[] = requests.map((req: RequestRecord) => ({
    collectionId: req.collectionId,
    folderId: req.folderId,
    environmentId: req.environmentId,
    name: req.name,
    method: req.method,
    url: req.url,
    headers: req.headers,
    queryParams: req.queryParams,
    pathParams: req.pathParams,
    body: req.body,
    auth: req.auth,
    notes: req.notes,
    tags: req.tags,
  }))

  const exportedCollection = {
    name: collection.name,
    description: collection.description,
    parentId: collection.parentId,
    requestIds: collection.requestIds,
    requests: exportedRequests,
  }

  return {
    exportVersion: IMPORT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: '0.1.0',
    collections: [exportedCollection],
  }
}

/**
 * Export multiple collections with all their requests
 */
export function exportMultipleCollectionsAsJson(
  collections: CollectionRecord[],
  requestsByCollection: Map<string, RequestRecord[]>,
): CollectionExportData {
  const exportedCollections = collections.map((collection: CollectionRecord) => {
    const collectionRequests = requestsByCollection.get(collection.id) || []
    const exportedRequests: ExportedRequest[] = collectionRequests.map((req: RequestRecord) => ({
      collectionId: req.collectionId,
      folderId: req.folderId,
      environmentId: req.environmentId,
      name: req.name,
      method: req.method,
      url: req.url,
      headers: req.headers,
      queryParams: req.queryParams,
      pathParams: req.pathParams,
      body: req.body,
      auth: req.auth,
      notes: req.notes,
      tags: req.tags,
    }))

    return {
      name: collection.name,
      description: collection.description,
      parentId: collection.parentId,
      requestIds: collection.requestIds,
      requests: exportedRequests,
    }
  })

  return {
    exportVersion: IMPORT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: '0.1.0',
    collections: exportedCollections,
  }
}

/**
 * Convert export data to JSON string
 */
export function serializeExportData(data: CollectionExportData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Generate a filename for the export
 */
export function generateExportFilename(collectionName: string): string {
  const sanitized = collectionName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
  const timestamp = new Date().toISOString().split('T')[0]
  return `postcare-collection-${sanitized}-${timestamp}.json`
}
