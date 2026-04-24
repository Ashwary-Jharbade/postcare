import { useCallback, useEffect, useState } from 'react'
import { database } from '../../lib/storage/db'
import { type RequestRecord } from '../../domain/models'

export interface CollectionRequestsState {
  requests: RequestRecord[]
  isLoading: boolean
  error: string | null
}

export function useCollectionRequests(collectionId: string | null) {
  const [state, setState] = useState<CollectionRequestsState>({
    requests: [],
    isLoading: !collectionId,
    error: null,
  })

  const loadRequests = useCallback(async () => {
    if (!collectionId) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const collection = await database.collections.get(collectionId)
      if (!collection) {
        setState({ requests: [], isLoading: false, error: 'Collection not found' })
        return
      }

      const requestIds = collection.requestIds || []
      const requests = await database.requests
        .where('id')
        .anyOf(requestIds.length > 0 ? requestIds : ['__nonexistent__'])
        .toArray()

      setState({ requests, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load collection requests'
      setState({ requests: [], isLoading: false, error: message })
    }
  }, [collectionId])

  useEffect(() => {
    if (!collectionId) {
      setState({ requests: [], isLoading: false, error: null })
      return
    }

    void loadRequests()
  }, [collectionId, loadRequests])

  return {
    ...state,
    reload: loadRequests,
  }
}
