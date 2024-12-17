import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePosStore } from '../pos-store'

describe('POS Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should create store', () => {
    const store = usePosStore()
    expect(store).toBeDefined()
  })
})
