import { describe, expect, it } from 'vitest'
import {
  createFormDataEntry,
  getBodyPreviewText,
  normalizeRequestBodyState,
} from './requestBodyState'

describe('requestBodyState normalization', () => {
  it('normalizes form-data legacy envelope into formData array', () => {
    const normalized = normalizeRequestBodyState({
      mode: 'form-data',
      content: JSON.stringify({
        kind: 'form-data',
        entries: [{ id: 'fd_1', key: 'name', value: 'alice', enabled: true }],
      }),
    })

    expect(normalized.formData).toHaveLength(1)
    expect(normalized.formData[0]?.key).toBe('name')
  })

  it('normalizes raw legacy envelope into content/contentType', () => {
    const normalized = normalizeRequestBodyState({
      mode: 'raw',
      content: JSON.stringify({
        kind: 'raw',
        contentType: 'application/xml',
        content: '<a>1</a>',
      }),
    })

    expect(normalized.contentType).toBe('application/xml')
    expect(normalized.content).toBe('<a>1</a>')
  })

  it('builds preview text for form-data entries', () => {
    const body = normalizeRequestBodyState({
      mode: 'form-data',
      formData: [
        createFormDataEntry({ key: 'a', value: '1' }),
        createFormDataEntry({ key: 'b', value: '2', enabled: false }),
      ],
      content: '',
    })

    expect(getBodyPreviewText(body)).toBe('a=1')
  })
})
