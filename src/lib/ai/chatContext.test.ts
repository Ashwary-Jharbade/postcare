import { describe, expect, it } from 'vitest'
import { createDefaultRequest, createDefaultCollection } from '../../domain/models'
import { buildChatContext, renderContextForPrompt, buildSystemPrompt } from './chatContext'

describe('chatContext', () => {
  describe('buildChatContext', () => {
    it('returns empty snapshot when no collections exist', () => {
      const ctx = buildChatContext([], [])
      expect(ctx.collections).toEqual([])
      expect(ctx.totalRequests).toBe(0)
      expect(ctx.activeEnvironment).toBeUndefined()
    })

    it('maps requests to their collections with redacted data', () => {
      const req = createDefaultRequest()
      req.headers = [
        { id: '1', key: 'Authorization', value: 'Bearer secret-token-123', enabled: true },
        { id: '2', key: 'Accept', value: 'application/json', enabled: true },
      ]
      const coll = createDefaultCollection([req.id])

      const ctx = buildChatContext([coll], [req])

      expect(ctx.collections).toHaveLength(1)
      const snapshot = ctx.collections[0]!
      expect(snapshot.name).toBe(coll.name)
      expect(snapshot.requests).toHaveLength(1)

      const reqSnapshot = snapshot.requests[0]!
      expect(reqSnapshot.name).toBe(req.name)

      // Auth header value should be redacted
      const authHeader = reqSnapshot.redacted.headers
        .find((h) => h.key === 'Authorization')
      expect(authHeader?.value).toBe('[REDACTED]')

      // Non-sensitive header should be preserved
      const acceptHeader = reqSnapshot.redacted.headers
        .find((h) => h.key === 'Accept')
      expect(acceptHeader?.value).toBe('application/json')
    })

    it('excludes requests not in any collection', () => {
      const req1 = createDefaultRequest()
      const req2 = createDefaultRequest()
      const coll = createDefaultCollection([req1.id])

      const ctx = buildChatContext([coll], [req1, req2])

      const snapshot = ctx.collections[0]!
      expect(snapshot.requests).toHaveLength(1)
      expect(snapshot.requests[0]!.id).toBe(req1.id)
      // total still counts all
      expect(ctx.totalRequests).toBe(2)
    })

    it('includes active environment name without variables', () => {
      const env = {
        id: 'env_1',
        name: 'Production',
        color: '#ff0000',
        variables: [
          { id: 'v1', key: 'apiKey', value: 'secret-value', enabled: true, scope: 'secret' as const },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const ctx = buildChatContext([], [], env)

      expect(ctx.activeEnvironment).toEqual({ id: 'env_1', name: 'Production' })
      // Variables should NOT be in the snapshot
      expect(JSON.stringify(ctx)).not.toContain('secret-value')
    })
  })

  describe('renderContextForPrompt', () => {
    it('returns empty message for no collections', () => {
      const text = renderContextForPrompt({ collections: [], totalRequests: 0 })
      expect(text).toContain('no collections')
    })

    it('renders collection and request details', () => {
      const req = createDefaultRequest()
      const coll = createDefaultCollection([req.id])
      const ctx = buildChatContext([coll], [req])
      const text = renderContextForPrompt(ctx)

      expect(text).toContain('1 collection(s)')
      expect(text).toContain(coll.name)
      expect(text).toContain(req.name)
      expect(text).toContain('GET')
    })
  })

  describe('buildSystemPrompt', () => {
    it('includes guardrail instructions', () => {
      const ctx = buildChatContext([], [])
      const prompt = buildSystemPrompt(ctx)

      expect(prompt).toContain('Postcare Assistant')
      expect(prompt).toContain('NEVER reveal')
      expect(prompt).toContain('ONLY respond')
      expect(prompt).toContain('EXECUTE_REQUEST')
      expect(prompt).toContain('EXECUTE_COLLECTION')
    })

    it('does not include raw secret values', () => {
      const req = createDefaultRequest()
      req.headers = [
        { id: '1', key: 'Authorization', value: 'Bearer super-secret-token', enabled: true },
      ]
      req.body.content = '{"password":"my-password-123"}'
      const coll = createDefaultCollection([req.id])
      const ctx = buildChatContext([coll], [req])
      const prompt = buildSystemPrompt(ctx)

      expect(prompt).not.toContain('super-secret-token')
      expect(prompt).not.toContain('my-password-123')
      expect(prompt).toContain('[REDACTED]')
    })
  })
})
