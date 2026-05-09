import { useCallback, useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { database } from '../../lib/storage/db'
import { type RequestRecord } from '../../domain/models'

export interface CollectionRequestsState {
  requests: RequestRecord[]
  isLoading: boolean
  error: string | null
}

/** Preserves collection order; omits missing rows (stale ids). */
export function orderRequestsByRequestIds(
  requests: RequestRecord[],
  requestIds: string[],
): RequestRecord[] {
  const byId = new Map(requests.map((r) => [r.id, r]))
  return requestIds.map((id) => byId.get(id)).filter((r): r is RequestRecord => r !== undefined)
}

export function useCollectionRequests(collectionId: string | null) {
  const [state, setState] = useState<CollectionRequestsState>({
    requests: [],
    isLoading: !collectionId,
    error: null,
  })

  useEffect(() => {
    if (!collectionId) {
      setState({ requests: [], isLoading: false, error: null })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    const subscription = liveQuery(async () => {
      const collection = await database.collections.get(collectionId)
      if (!collection) {
        return { kind: 'missing' as const }
      }

      const requestIds = collection.requestIds ?? []
      if (requestIds.length === 0) {
        return { kind: 'ok' as const, requests: [] as RequestRecord[] }
      }

      const rows = await database.requests.where('id').anyOf(requestIds).toArray()
      return {
        kind: 'ok' as const,
        requests: orderRequestsByRequestIds(rows, requestIds),
      }
    }).subscribe({
      next: (value) => {
        if (value.kind === 'missing') {
          setState({ requests: [], isLoading: false, error: 'Collection not found' })
          return
        }
        setState({ requests: value.requests, isLoading: false, error: null })
      },
      error: (err) => {
        const message = err instanceof Error ? err.message : 'Failed to load collection requests'
        setState({ requests: [], isLoading: false, error: message })
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [collectionId])

  const reload = useCallback(async () => {
    // IndexedDB updates are observed via liveQuery; callers may still await this after mutations.
    await Promise.resolve()
  }, [])

  return {
    ...state,
    reload,
  }
}
