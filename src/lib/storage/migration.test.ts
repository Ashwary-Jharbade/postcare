import { describe, expect, it } from 'vitest'
import { buildMigrationPlan, parseStoredSchemaVersion } from './migration'

describe('storage migration planning', () => {
  it('parses invalid schema version safely', () => {
    expect(parseStoredSchemaVersion(undefined)).toBe(0)
    expect(parseStoredSchemaVersion('')).toBe(0)
    expect(parseStoredSchemaVersion('abc')).toBe(0)
  })

  it('returns migration steps when from version is older', () => {
    const plan = buildMigrationPlan(0, 2)
    expect(plan.requiresMigration).toBe(true)
    expect(plan.steps).toEqual(['Migrate schema to v1', 'Migrate schema to v2'])
  })

  it('returns no migration when up to date', () => {
    const plan = buildMigrationPlan(2, 2)
    expect(plan.requiresMigration).toBe(false)
    expect(plan.steps).toEqual([])
  })
})
