import { describe, expect, it } from 'vitest'
import template from '../templates/content/crashes.json'
import { DEFAULT_CRASHES_CONFIG, readCrashesConfig } from './config'

describe('content/crashes.json', () => {
  it('the template a game gets holds exactly the defaults', () => {
    const warnings: string[] = []
    expect(readCrashesConfig(template, (m) => warnings.push(m))).toEqual(DEFAULT_CRASHES_CONFIG)
    expect(warnings).toEqual([])
  })

  it('every value has a help line, every number a range', () => {
    const help = Object.keys(template._help)
    const ranges = Object.keys(template._ranges)
    for (const [part, values] of Object.entries(DEFAULT_CRASHES_CONFIG)) {
      for (const [name, value] of Object.entries(values)) {
        expect(help).toContain(`${part}.${name}`)
        if (typeof value === 'number') expect(ranges).toContain(`${part}.${name}`)
      }
    }
  })

  it('a bad value warns once and uses the default; a missing file is all defaults', () => {
    const warnings: string[] = []
    const config = readCrashesConfig({ client: { url: 'not a url', perSession: 99 }, server: { perDay: -1 } }, (m) => warnings.push(m))
    expect(config.client.url).toBe('')
    expect(config.client.perSession).toBe(5)
    expect(config.server.perDay).toBe(15000)
    expect(warnings).toHaveLength(3)
    expect(readCrashesConfig(undefined)).toEqual(DEFAULT_CRASHES_CONFIG)
  })

  it('a server address loses its trailing slash', () => {
    expect(readCrashesConfig({ client: { url: 'https://goops-crashes.example.workers.dev/' } }).client.url).toBe('https://goops-crashes.example.workers.dev')
  })
})
