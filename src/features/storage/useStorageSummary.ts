import { useEffect, useState } from 'react'
import { type StorageSummary } from '../../domain/models'
import { getStorageSummary, isIndexedDbAvailable } from '../../lib/storage/db'

type StorageState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; summary: StorageSummary }
  | { status: 'error'; message: string }

export function useStorageSummary(): StorageState {
  const [state, setState] = useState<StorageState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function load() {
      if (!isIndexedDbAvailable()) {
        if (active) {
          setState({ status: 'unavailable' })
        }
        return
      }

      try {
        const summary = await getStorageSummary()

        if (active) {
          setState({ status: 'ready', summary })
        }
      } catch (error) {
        if (active) {
          const message = error instanceof Error ? error.message : 'Unknown storage error'
          setState({ status: 'error', message })
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  return state
}
