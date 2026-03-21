/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@wix/sdk', '@wix/blog', '@wix/data'],
  },
  server: {
    port: 3001,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react'
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('@tanstack/react-query')) return 'vendor-query'
          if (id.includes('@wix/')) return 'vendor-wix'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'api/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'api/**/*.ts'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types/index.ts',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'api/**/*.test.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
