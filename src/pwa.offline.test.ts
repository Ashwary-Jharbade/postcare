import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')

describe('offline pwa assets', () => {
  it('contains required manifest metadata', () => {
    const manifestPath = path.join(projectRoot, 'public', 'manifest.webmanifest')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
      name: string
      start_url: string
      display: string
      icons: Array<{ src: string }>
    }

    expect(manifest.name).toBe('Postcare')
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.length).toBeGreaterThan(0)
  })

  it('contains app shell and offline fallback in service worker', () => {
    const serviceWorkerPath = path.join(projectRoot, 'public', 'sw.js')
    const content = readFileSync(serviceWorkerPath, 'utf-8')

    expect(content).toContain("cache.addAll(APP_SHELL)")
    expect(content).toContain("caches.match('/')")
  })
})
