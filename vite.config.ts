import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/// <reference types="vitest/config" />

// Ensure Web Crypto getRandomValues exists (fixes "crypto.getRandomValues is not a function" in some Node/env setups)
if (typeof globalThis.crypto !== 'object' || typeof globalThis.crypto.getRandomValues !== 'function') {
  const nodeCrypto = await import('node:crypto')
  globalThis.crypto = globalThis.crypto || {} as Crypto
  globalThis.crypto.getRandomValues = function getRandomValues<T extends ArrayBufferView>(array: T): T {
    const bytes = nodeCrypto.default.randomBytes(array.byteLength)
    new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(bytes)
    return array
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
