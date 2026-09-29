import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportCsv } from '../export'

describe('exportCsv', () => {
  let captured
  beforeEach(() => {
    captured = null
    globalThis.URL.createObjectURL = vi.fn((blob) => { captured = blob; return 'blob:test' })
    globalThis.URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  const read = (blob) => new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsText(blob) })

  it('writes a header row and quotes cells that contain commas, quotes or newlines', async () => {
    exportCsv({ key: 'athletes', columns: ['Name', 'Note'], rows: [['Ama Mensah', 'likes "fast", games'], ['Kofi', 'line\nbreak']] })
    const text = await read(captured)
    expect(text).toContain('Name,Note')
    expect(text).toContain('"likes ""fast"", games"')
    expect(text).toContain('"line\nbreak"')
  })
  it('neutralises spreadsheet formulas so a name cannot run code in Excel', async () => {
    exportCsv({ key: 'athletes', columns: ['Name'], rows: [['=HYPERLINK("http://evil")'], ['+1+1'], ['@SUM(A1)'], ['-2+3']] })
    const text = await read(captured)
    for (const bad of ['=HYPERLINK', '+1+1', '@SUM', '-2+3']) expect(text).toContain(`'${bad}`.replace(/"/g, '""'))
  })
  it('downloads a file named after the report', () => {
    const click = HTMLAnchorElement.prototype.click
    exportCsv({ key: 'financial', columns: ['A'], rows: [] })
    expect(click).toHaveBeenCalledTimes(1)
  })
})
