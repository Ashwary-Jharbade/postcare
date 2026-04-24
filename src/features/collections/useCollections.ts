import { useEffect, useState } from 'react'
import { database } from '../../lib/storage/db'
import { type CollectionRecord, createId, createTimestamp } from '../../domain/models'

export interface CollectionsState {
  collections: CollectionRecord[]
  isLoading: boolean
  error: string | null
}

export function useCollections() {
  const [state, setState] = useState<CollectionsState>({
    collections: [],
    isLoading: true,
    error: null,
  })

  // Load collections on mount
  useEffect(() => {
    loadCollections()
  }, [])

  async function loadCollections() {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const collections = await database.collections.toArray()
      setState({ collections, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load collections'
      setState({ collections: [], isLoading: false, error: message })
    }
  }

  async function createCollection(name: string, description = '') {
    try {
      const newCollection: CollectionRecord = {
        id: createId('coll'),
        name,
        description,
        createdAt: createTimestamp(),
        updatedAt: createTimestamp(),
        requestIds: [],
      }
      await database.collections.add(newCollection)
      await loadCollections()
      return newCollection
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create collection'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  async function updateCollection(
    id: string,
    updates: Partial<Pick<CollectionRecord, 'name' | 'description'>>,
  ) {
    try {
      await database.collections.update(id, {
        ...updates,
        updatedAt: createTimestamp(),
      })
      await loadCollections()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update collection'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  async function deleteCollection(id: string) {
    try {
      // Get all requests in this collection
      const collection = await database.collections.get(id)
      if (collection) {
        // Delete associated requests
        await database.requests.bulkDelete(collection.requestIds)
      }
      // Delete the collection
      await database.collections.delete(id)
      await loadCollections()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete collection'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  async function addRequestToCollection(collectionId: string, requestId: string) {
    try {
      const collection = await database.collections.get(collectionId)
      if (collection) {
        const requestIds = collection.requestIds || []
        if (!requestIds.includes(requestId)) {
          requestIds.push(requestId)
          await database.collections.update(collectionId, {
            requestIds,
            updatedAt: createTimestamp(),
          })
          await loadCollections()
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add request to collection'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  async function removeRequestFromCollection(collectionId: string, requestId: string) {
    try {
      const collection = await database.collections.get(collectionId)
      if (collection) {
        const requestIds = (collection.requestIds || []).filter((id) => id !== requestId)
        await database.collections.update(collectionId, {
          requestIds,
          updatedAt: createTimestamp(),
        })
        await loadCollections()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove request from collection'
      setState((prev) => ({ ...prev, error: message }))
      throw err
    }
  }

  return {
    ...state,
    createCollection,
    updateCollection,
    deleteCollection,
    addRequestToCollection,
    removeRequestFromCollection,
    reload: loadCollections,
  }
}
