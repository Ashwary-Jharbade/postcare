import { useEffect, useState } from 'react'
import {
  type AuthType,
  type HttpMethod,
  type KeyValueEntry,
  type RequestBodyMode,
  type RequestBodyState,
  type RequestRecord,
} from '../../domain/models'
import {
  createEmptyFieldRow,
  getPrimaryRequest,
  isIndexedDbAvailable,
  updateRequestRecord,
} from '../../lib/storage/db'
import { normalizeRequestBodyState } from '../../lib/body/requestBodyState'

type ComposerState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string }
  | {
    status: 'ready'
    request: RequestRecord
    saveState: 'idle' | 'saving' | 'saved' | 'error'
    saveMessage?: string
  }

function parseQueryParamsFromUrl(url: string): KeyValueEntry[] | null {
  if (!url.includes('?')) {
    return null
  }

  try {
    const parsedUrl = new URL(url, 'https://placeholder.local')

    return Array.from(parsedUrl.searchParams.entries()).map(([key, value]) => ({
      id: `kv_${crypto.randomUUID()}`,
      key,
      value,
      enabled: true,
    }))
  } catch {
    return null
  }
}

function applyQueryParamsToUrl(url: string, queryParams: KeyValueEntry[]): string {
  const hashStart = url.indexOf('#')
  const hashSuffix = hashStart >= 0 ? url.slice(hashStart) : ''
  const withoutHash = hashStart >= 0 ? url.slice(0, hashStart) : url
  const queryStart = withoutHash.indexOf('?')
  const baseUrl = queryStart >= 0 ? withoutHash.slice(0, queryStart) : withoutHash

  const nextSearch = new URLSearchParams()
  queryParams.forEach((entry) => {
    if (!entry.key) {
      return
    }

    nextSearch.append(entry.key, entry.value)
  })

  const searchText = nextSearch.toString()
  return `${baseUrl}${searchText ? `?${searchText}` : ''}${hashSuffix}`
}

export function usePrimaryRequestComposer() {
  const [state, setState] = useState<ComposerState>({ status: 'loading' })

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
        const request = await getPrimaryRequest()

        if (!active) {
          return
        }

        if (!request) {
          setState({ status: 'error', message: 'No request is available in local storage.' })
          return
        }

        const normalizedBody = normalizeRequestBodyState(request.body)
        const normalizedRequest: RequestRecord = {
          ...request,
          body: normalizedBody,
        }

        setState({ status: 'ready', request: normalizedRequest, saveState: 'idle' })

        if (JSON.stringify(normalizedBody) !== JSON.stringify(request.body)) {
          await updateRequestRecord(request.id, { body: normalizedBody })
        }
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown request load failure',
          })
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  async function save(changes: Partial<RequestRecord>) {
    const currentRequestId = state.status === 'ready' ? state.request.id : undefined

    if (!currentRequestId) {
      setState((current) =>
        current.status === 'ready'
          ? { ...current, saveState: 'error', saveMessage: 'Request composer is not ready.' }
          : current,
      )
      return
    }

    setState((current) =>
      current.status === 'ready'
        ? { ...current, saveState: 'saving', saveMessage: undefined }
        : current,
    )

    try {
      setState((current) => {
        if (current.status !== 'ready') {
          return current
        }

        return {
          ...current,
          request: {
            ...current.request,
            ...changes,
          },
        }
      })

      const request = await updateRequestRecord(currentRequestId, changes)
      setState({ status: 'ready', request, saveState: 'saved', saveMessage: 'Saved locally' })
    } catch (error) {
      setState((current) =>
        current.status === 'ready'
          ? {
            ...current,
            saveState: 'error',
            saveMessage:
              error instanceof Error ? error.message : 'Unknown request save failure',
          }
          : current,
      )
    }
  }

  return {
    state,
    setMethod(method: HttpMethod) {
      void save({ method })
    },
    setName(name: string) {
      void save({ name })
    },
    setUrl(url: string) {
      const parsedQueryParams = parseQueryParamsFromUrl(url)

      if (!parsedQueryParams) {
        void save({ url })
        return
      }

      void save({ url, queryParams: parsedQueryParams })
    },
    setBodyMode(mode: RequestBodyMode) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        body: {
          ...state.request.body,
          mode,
        },
      })
    },
    setBodyContentType(contentType: string) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        body: {
          ...state.request.body,
          contentType,
        },
      })
    },
    setBodyContent(content: string) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        body: {
          ...state.request.body,
          content,
        },
      })
    },
    setFormData(formData: KeyValueEntry[]) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        body: {
          ...state.request.body,
          formData,
        },
      })
    },
    setBody(body: RequestBodyState) {
      if (state.status !== 'ready') {
        return
      }

      void save({ body })
    },
    setHeaders(headers: KeyValueEntry[]) {
      void save({ headers })
    },
    setQueryParams(queryParams: KeyValueEntry[]) {
      if (state.status !== 'ready') {
        return
      }

      void save({ queryParams, url: applyQueryParamsToUrl(state.request.url, queryParams) })
    },
    setAuth(type: AuthType) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        auth: {
          type,
          referenceId: state.request.auth.referenceId,
          config: {},
        },
      })
    },
    setAuthConfig(key: string, value: string) {
      if (state.status !== 'ready') {
        return
      }

      void save({
        auth: {
          ...state.request.auth,
          config: {
            ...state.request.auth.config,
            [key]: value,
          },
        },
      })
    },
    addHeaderRow() {
      if (state.status !== 'ready') {
        return
      }

      void save({ headers: [...state.request.headers, createEmptyFieldRow()] })
    },
    addQueryParamRow() {
      if (state.status !== 'ready') {
        return
      }

      void save({ queryParams: [...state.request.queryParams, createEmptyFieldRow()] })
    },
  }
}
