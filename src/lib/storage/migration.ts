import { STORAGE_SCHEMA_VERSION } from '../../domain/models'

export interface MigrationPlan {
  fromVersion: number
  toVersion: number
  requiresMigration: boolean
  steps: string[]
}

export function parseStoredSchemaVersion(value: string | undefined): number {
  if (!value) {
    return 0
  }

  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0
  }

  return parsed
}

export function buildMigrationPlan(
  fromVersion: number,
  toVersion: number = STORAGE_SCHEMA_VERSION,
): MigrationPlan {
  if (fromVersion >= toVersion) {
    return {
      fromVersion,
      toVersion,
      requiresMigration: false,
      steps: [],
    }
  }

  const steps: string[] = []
  for (let version = fromVersion + 1; version <= toVersion; version += 1) {
    steps.push(`Migrate schema to v${version}`)
  }

  return {
    fromVersion,
    toVersion,
    requiresMigration: true,
    steps,
  }
}
