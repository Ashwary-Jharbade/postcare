import { describe, expect, it } from 'vitest'
import { diffHeaders, diffJsonStructure, generateLineDiff } from './diffHighlight'

describe('generateLineDiff', () => {
  it('tracks added and removed lines with counts', () => {
    const diff = generateLineDiff('alpha\nbeta\ngamma', 'alpha\ndelta\ngamma\nextra')

    expect(diff.hasPlusMinus).toBe(true)
    expect(diff.addedCount).toBe(2)
    expect(diff.removedCount).toBe(1)
    expect(diff.lines.some((line) => line.type === 'unchanged' && line.content === 'alpha')).toBe(true)
    expect(diff.lines.some((line) => line.type === 'added' && line.content === 'delta')).toBe(true)
    expect(diff.lines.some((line) => line.type === 'removed' && line.content === 'beta')).toBe(true)
  })
})

describe('diffHeaders', () => {
  it('detects added, changed, and removed headers', () => {
    const diff = diffHeaders(
      [
        { key: 'content-type', value: 'application/json' },
        { key: 'x-request-id', value: 'abc' },
      ],
      [
        { key: 'content-type', value: 'text/plain' },
        { key: 'x-trace-id', value: 'trace-1' },
      ],
    )

    expect(diff.added).toEqual([{ key: 'x-trace-id', value: 'trace-1' }])
    expect(diff.removed).toEqual([{ key: 'x-request-id', value: 'abc' }])
    expect(diff.changed).toEqual([
      { key: 'content-type', old: 'application/json', new: 'text/plain' },
    ])
  })
})

describe('diffJsonStructure', () => {
  it('reports structural additions, removals, and type changes', () => {
    const diff = diffJsonStructure(
      {
        user: {
          id: 1,
          name: 'A',
        },
        tags: ['a'],
      },
      {
        user: {
          id: '1',
        },
        tags: [{ label: 'a' }],
        meta: {
          region: 'us',
        },
      },
    )

    expect(diff.hasDifferences).toBe(true)
    expect(diff.added).toEqual(
      expect.arrayContaining([
        { path: '$.meta', type: 'object' },
        { path: '$.meta.region', type: 'string' },
      ]),
    )
    expect(diff.removed).toEqual(
      expect.arrayContaining([{ path: '$.user.name', type: 'string' }]),
    )
    expect(diff.changed).toEqual(
      expect.arrayContaining([
        { path: '$.user.id', oldType: 'number', newType: 'string' },
        { path: '$.tags[]', oldType: 'string', newType: 'object' },
      ]),
    )
  })
})
