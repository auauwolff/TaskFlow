import { describe, expect, it } from 'vitest'
import { guidIdentifier } from './identifier'

const sampleId = guidIdentifier<string & { readonly brand: 'sample' }>('sample ID')

describe('guidIdentifier', () => {
  it('accepts a GUID and returns it unchanged', () => {
    expect(sampleId('5d3347f2-5e92-4476-96df-56c06f49d273'))
      .toBe('5d3347f2-5e92-4476-96df-56c06f49d273')
  })

  it('rejects a non-GUID value with the supplied label', () => {
    expect(() => sampleId('not-a-guid')).toThrow('A valid sample ID is required.')
  })
})
