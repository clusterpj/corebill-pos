// src/test/setup.js
import { config } from '@vue/test-utils'

// Configure Vue Test Utils globally
config.global.plugins = []
config.global.mocks = {
  $route: {
    name: 'test'
  }
}

// Mock window.ResizeObserver
window.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock CSS modules
vi.mock('*.css', () => ({}))
