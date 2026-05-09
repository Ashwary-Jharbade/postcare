import { describe, expect, it } from 'vitest'
import { createDefaultRequest, type RequestRecord } from '../../domain/models'
import { orderRequestsByRequestIds } from './useCollectionRequests'

describe('orderRequestsByRequestIds', () => {
  it('orders rows to match requestIds and drops missing ids', () => {
    const a: RequestRecord = { ...createDefaultRequest(), id: 'a', name: 'A' }
    const b: RequestRecord = { ...createDefaultRequest(), id: 'b', name: 'B' }
    const c: RequestRecord = { ...createDefaultRequest(), id: 'c', name: 'C' }

    const ordered = orderRequestsByRequestIds([c, a, b], ['b', 'a', 'missing', 'c'])
    expect(ordered.map((r) => r.id)).toEqual(['b', 'a', 'c'])
  })
})
