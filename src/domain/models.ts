export const STORAGE_SCHEMA_VERSION = 1

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'

export type AuthType = 'none' | 'apiKey' | 'bearer' | 'basic' | 'oauth2'
export type RequestBodyMode = 'none' | 'json' | 'text' | 'form-data' | 'raw'
export type SecretScopeType = 'request' | 'environment' | 'global'

export interface PersistedEntityBase {
  id: string
  createdAt: string
  updatedAt: string
}

export interface KeyValueEntry {
  id: string
  key: string
  value: string
  enabled: boolean
  secret?: boolean
  description?: string
}

export interface RequestBodyState {
  mode: RequestBodyMode
  content: string
  contentType: string
  formData: KeyValueEntry[]
}

export interface RequestAuthState {
  type: AuthType
  referenceId?: string
  config: Record<string, string>
}

export interface RequestRecord extends PersistedEntityBase {
  collectionId?: string
  folderId?: string
  environmentId?: string
  name: string
  method: HttpMethod
  url: string
  headers: KeyValueEntry[]
  queryParams: KeyValueEntry[]
  pathParams: KeyValueEntry[]
  body: RequestBodyState
  auth: RequestAuthState
  notes?: string
  tags: string[]
}

export interface CollectionRecord extends PersistedEntityBase {
  name: string
  description?: string
  parentId?: string
  requestIds: string[]
}

export interface EnvironmentVariable extends KeyValueEntry {
  scope: 'shared' | 'secret'
}

export interface EnvironmentRecord extends PersistedEntityBase {
  name: string
  color: string
  variables: EnvironmentVariable[]
}

export interface HistoryRecord extends PersistedEntityBase {
  requestId: string
  environmentId?: string
  status: 'success' | 'error' | 'cancelled'
  responseCode?: number
  durationMs?: number
  requestSnapshot: Pick<RequestRecord, 'method' | 'url' | 'headers' | 'queryParams' | 'body'>
}

export interface ResponseRecord {
  status: number
  ok: boolean
  statusText: string
  durationMs: number
  url: string
  headers: Array<{ key: string; value: string }>
  body: string
  bodyFormat: 'json' | 'text'
}

export interface SecretRecord extends PersistedEntityBase {
  name: string
  scopeType: SecretScopeType
  scopeId: string
  encryptedValue: string
  algorithm: 'none'
}

export interface AppSettingRecord {
  key: string
  updatedAt: string
  value: string
}

export interface StorageSummary {
  schemaVersion: number
  requests: number
  collections: number
  environments: number
  historyEntries: number
  secrets: number
  defaultCollectionName?: string
  defaultEnvironmentName?: string
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

export function createTimestamp(): string {
  return new Date().toISOString()
}

export function createKeyValueEntry(
  key = '',
  value = '',
  overrides: Partial<KeyValueEntry> = {},
): KeyValueEntry {
  return {
    id: createId('kv'),
    key,
    value,
    enabled: true,
    ...overrides,
  }
}

export function createDefaultRequest(): RequestRecord {
  const timestamp = createTimestamp()

  return {
    id: createId('req'),
    createdAt: timestamp,
    updatedAt: timestamp,
    name: 'Untitled Request',
    method: 'GET',
    url: 'https://api.example.com/health',
    headers: [],
    queryParams: [],
    pathParams: [],
    body: {
      mode: 'none',
      content: '',
      contentType: 'application/json',
      formData: [],
    },
    auth: {
      type: 'none',
      config: {},
    },
    tags: [],
  }
}

export function createDefaultCollection(requestIds: string[]): CollectionRecord {
  const timestamp = createTimestamp()

  return {
    id: createId('col'),
    createdAt: timestamp,
    updatedAt: timestamp,
    name: 'Getting Started',
    description: 'Seed collection for local-first API workflows.',
    requestIds,
  }
}

export function createDefaultEnvironment(): EnvironmentRecord {
  const timestamp = createTimestamp()

  return {
    id: createId('env'),
    createdAt: timestamp,
    updatedAt: timestamp,
    name: 'Local',
    color: '#7ad3c4',
    variables: [
      {
        ...createKeyValueEntry('baseUrl', 'https://api.example.com'),
        scope: 'shared',
        description: 'Default base URL for seeded examples.',
      },
    ],
  }
}
