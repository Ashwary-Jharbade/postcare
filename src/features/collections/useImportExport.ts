import { useCallback } from 'react'
import { database } from '../../lib/storage/db'
import { generateExportFilename, serializeExportData, exportMultipleCollectionsAsJson } from '../../lib/importexport/exporter'
import { importCollectionData, parseExportData, validateImportData } from '../../lib/importexport/importer'

export function useImportExport() {
  /**
   * Export all collections with their requests to JSON file
   */
  const exportCollections = useCallback(async () => {
    try {
      const collections = await database.collections.toArray()
      const allRequests = await database.requests.toArray()

      // Group requests by collection
      const requestsByCollection = new Map<string, typeof allRequests>()
      collections.forEach((c: typeof collections[0]) => {
        requestsByCollection.set(c.id, allRequests.filter((r: typeof allRequests[0]) => r.collectionId === c.id))
      })

      const exportData = exportMultipleCollectionsAsJson(collections, requestsByCollection)
      const jsonString = serializeExportData(exportData)

      // Create and trigger download
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `postcare-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { success: true, message: 'Export successful' }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Export failed',
      }
    }
  }, [])

  /**
   * Export a single collection with its requests
   */
  const exportCollection = useCallback(async (collectionId: string) => {
    try {
      const collection = await database.collections.get(collectionId)
      if (!collection) {
        return { success: false, message: 'Collection not found' }
      }

      const requests = await database.requests.where('collectionId').equals(collectionId).toArray()
      const exportData = exportMultipleCollectionsAsJson([collection], new Map([[collectionId, requests]]))
      const jsonString = serializeExportData(exportData)

      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = generateExportFilename(collection.name)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { success: true, message: 'Export successful' }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Export failed',
      }
    }
  }, [])

  /**
   * Import collections and requests from JSON file
   */
  const importCollectionsFromJson = useCallback(async (jsonString: string) => {
    try {
      const exportData = parseExportData(jsonString)
      if (!exportData) {
        return {
          success: false,
          message: 'Invalid JSON format',
          collectionsImported: 0,
          requestsImported: 0,
        }
      }

      const validation = validateImportData(exportData)
      if (!validation.valid) {
        return {
          success: false,
          message: `Import validation failed: ${validation.errors.join('; ')}`,
          collectionsImported: 0,
          requestsImported: 0,
        }
      }

      // Get existing collection names to avoid duplicates
      const existingCollections = await database.collections.toArray()
      const existingNames = new Set(existingCollections.map((c: typeof existingCollections[0]) => c.name))

      // Generate new records with fresh IDs
      const { collections: importedCollections, requests: importedRequests } = importCollectionData(exportData, existingNames)

      // Import into database
      await database.transaction('rw', database.collections, database.requests, async () => {
        await database.collections.bulkAdd(importedCollections)
        await database.requests.bulkAdd(importedRequests)
      })

      return {
        success: true,
        message: `Imported ${importedCollections.length} collection(s) and ${importedRequests.length} request(s)`,
        collectionsImported: importedCollections.length,
        requestsImported: importedRequests.length,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
        collectionsImported: 0,
        requestsImported: 0,
      }
    }
  }, [])

  /**
   * Handle file import - reads file and triggers import
   */
  const handleFileImport = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        return importCollectionsFromJson(text)
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to read file',
          collectionsImported: 0,
          requestsImported: 0,
        }
      }
    },
    [importCollectionsFromJson],
  )

  return {
    exportCollections,
    exportCollection,
    importCollectionsFromJson,
    handleFileImport,
  }
}
