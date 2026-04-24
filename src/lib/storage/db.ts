import Dexie, { type Table } from 'dexie'
import {
  STORAGE_SCHEMA_VERSION,
  createKeyValueEntry,
  type AppSettingRecord,
  type CollectionRecord,
  type EnvironmentRecord,
  type HistoryRecord,
  type KeyValueEntry,
  type RequestRecord,
  type SecretRecord,
  type StorageSummary,
  createDefaultCollection,
  createDefaultEnvironment,
  createDefaultRequest,
  createTimestamp,
} from '../../domain/models'
import { buildMigrationPlan, parseStoredSchemaVersion } from './migration'

class PostcareDatabase extends Dexie {
  requests!: Table<RequestRecord, string>
  collections!: Table<CollectionRecord, string>
  environments!: Table<EnvironmentRecord, string>
  history!: Table<HistoryRecord, string>
  secrets!: Table<SecretRecord, string>
  settings!: Table<AppSettingRecord, string>

  constructor() {
    super('postcare')

    this.version(STORAGE_SCHEMA_VERSION).stores({
      requests: 'id, collectionId, environmentId, updatedAt, createdAt, method, name',
      collections: 'id, parentId, updatedAt, createdAt, name',
      environments: 'id, updatedAt, createdAt, name',
      history: 'id, requestId, environmentId, createdAt, status',
      secrets: 'id, scopeType, scopeId, updatedAt, createdAt, name',
      settings: 'key, updatedAt',
    })
  }
}

export const database = new PostcareDatabase()

export function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

export async function ensureSeedData(): Promise<void> {
  if (!isIndexedDbAvailable()) {
    return
  }

  const requestCount = await database.requests.count()
  const collectionCount = await database.collections.count()
  const environmentCount = await database.environments.count()
  const settingsCount = await database.settings.count()
  const schemaSetting = await database.settings.get('storageSchemaVersion')
  const storedSchemaVersion = parseStoredSchemaVersion(schemaSetting?.value)
  const migrationPlan = buildMigrationPlan(storedSchemaVersion, STORAGE_SCHEMA_VERSION)

  await database.transaction(
    'rw',
    database.requests,
    database.collections,
    database.environments,
    database.settings,
    async () => {
      if (requestCount === 0) {
        const request = createDefaultRequest()
        await database.requests.add(request)

        if (collectionCount === 0) {
          await database.collections.add(createDefaultCollection([request.id]))
        }
      }

      if (environmentCount === 0) {
        await database.environments.add(createDefaultEnvironment())
      }

      if (settingsCount === 0) {
        // Ensure seed settings exist. Use put instead of add to avoid ConstraintError
        // if settings were partially created in a previous attempt
        const timestamp = createTimestamp()
        await database.settings.put({
          key: 'storageSchemaVersion',
          value: String(STORAGE_SCHEMA_VERSION),
          updatedAt: timestamp,
        })
        await database.settings.put({
          key: 'activeEnvironmentId',
          value: '',
          updatedAt: timestamp,
        })
      } else if (migrationPlan.requiresMigration) {
        await database.settings.put({
          key: 'storageSchemaVersion',
          value: String(STORAGE_SCHEMA_VERSION),
          updatedAt: createTimestamp(),
        })
      }
    },
  )
}

export async function getStorageSummary(): Promise<StorageSummary> {
  if (!isIndexedDbAvailable()) {
    return {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      requests: 0,
      collections: 0,
      environments: 0,
      historyEntries: 0,
      secrets: 0,
    }
  }

  await ensureSeedData()

  const [
    requests,
    collections,
    environments,
    historyEntries,
    secrets,
    defaultCollection,
    defaultEnvironment,
  ] = await Promise.all([
    database.requests.count(),
    database.collections.count(),
    database.environments.count(),
    database.history.count(),
    database.secrets.count(),
    database.collections.orderBy('createdAt').first(),
    database.environments.orderBy('createdAt').first(),
  ])

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    requests,
    collections,
    environments,
    historyEntries,
    secrets,
    defaultCollectionName: defaultCollection?.name,
    defaultEnvironmentName: defaultEnvironment?.name,
  }
}

export async function getPrimaryRequest(): Promise<RequestRecord | null> {
  if (!isIndexedDbAvailable()) {
    return null
  }

  await ensureSeedData()
  const request = await database.requests.orderBy('createdAt').first()
  return request ?? null
}

export async function updateRequestRecord(
  requestId: string,
  changes: Partial<RequestRecord>,
): Promise<RequestRecord> {
  const existing = await database.requests.get(requestId)

  if (!existing) {
    throw new Error(`Request ${requestId} was not found`)
  }

  const updated: RequestRecord = {
    ...existing,
    ...changes,
    updatedAt: createTimestamp(),
  }

  await database.requests.put(updated)
  return updated
}

export function createEmptyFieldRow(): KeyValueEntry {
  return createKeyValueEntry('', '')
}

export async function addHistoryEntry(
  entry: Omit<HistoryRecord, keyof { id: string; createdAt: string; updatedAt: string }>,
): Promise<HistoryRecord> {
  const timestamp = createTimestamp()
  const record: HistoryRecord = {
    id: `hist_${crypto.randomUUID()}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...entry,
  }

  await database.history.add(record)
  return record
}
