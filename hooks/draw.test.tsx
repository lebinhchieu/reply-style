import { expect, test } from 'claude-code/testing'

import { badgeText, cellWidth, DIAGRAM_TAGS } from './core'
import { drawBlock, drawNote, drawSpans } from './draw'
import { parseBody } from './markup'

// Bare stand-ins for the engine's components: enough to run the draw functions and read `rows`.
const T = { Box: 'Box', Text: 'Text', Button: null } as any

test('a badge is as wide as the typed [word]', () => {
  for (const w of DIAGRAM_TAGS) expect(cellWidth(badgeText(w))).toBe(cellWidth(`[${w}]`))
})

const TABLE = '| Service | State | p95 | Note |\n|---|---|---|---|\n| api | [ok] | 120 ms | stable |\n| worker | [warn] | 480 ms | queue grows after 18:00 |\n| billing | [fail] | – | timeout on /charge |\n| search | [skip] | – | not deployed in staging |'

test('a table that fits stays aligned, one cell too many stacks', () => {
  const [table] = parseBody(TABLE)
  expect(drawBlock(table, 50, T, 'k').rows).toBe(6) // header, rule, 4 rows
  expect(drawBlock(table, 49, T, 'k').rows).toBeGreaterThan(6) // stacked records
})

test('every second table row has the stripe background, the others and the badges have none', () => {
  const [table] = parseBody(TABLE)
  const rows = drawBlock(table, 50, T, 'k').parts as any[]
  expect(rows.slice(2).map((r) => r.props.backgroundColor)).toEqual([undefined, 'bashMessageBackgroundColor', undefined, 'bashMessageBackgroundColor'])
  const badge = [rows[3].children].flat(2).find((c: any) => c?.props?.inverse)
  expect(badge.props.backgroundColor).toBeUndefined()
})

test('inline code is bold in the ide colour, with no fill', () => {
  const [el] = drawSpans([{ kind: 'code', text: 'x' } as any], T)
  expect(el.props).toMatchObject({ bold: true, color: 'ide' })
  expect(el.props.inverse).toBeUndefined()
  expect(el.props.backgroundColor).toBeUndefined()
})

test('a badge and a callout label are filled chips, and info is not the quiet grey', () => {
  const [badge] = drawSpans([{ kind: 'badge', text: 'ok' } as any], T)
  expect(badge.props).toMatchObject({ inverse: true, bold: true, color: 'success' })
  expect(badge.props.backgroundColor).toBeUndefined()
  const [info] = parseBody('[info] Build finished.')
  const label = (drawBlock(info, 80, T, 'k').node as any).children.find((c: any) => c?.props?.inverse)
  expect(label.props.color).not.toBe('inactive')
  expect(label.props.color).toBe('planMode')
})

test('a note is flat dim text under a `· ` gutter: no weight, no colour but the gutter, no fill', () => {
  const note = drawNote('Checking **core** with `x` [ok]\n\n[info] Done.\n\n| a | b |\n|---|---|\n| 1 | [fail] |\n| 2 | 3 |', 60, T) as any
  const texts: any[] = []
  const walk = (n: any) => { if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === 'object') { if (n.type === 'Text') texts.push(n); walk(n.children) } }
  walk(note)
  const [gutter, ...body] = texts
  expect(gutter.props).toMatchObject({ color: 'inactive' })
  expect(body.length).toBeGreaterThan(3)
  for (const t of body) {
    expect(t.props.dimColor).toBe(true)
    for (const k of ['bold', 'italic', 'underline', 'inverse', 'color', 'backgroundColor']) expect(t.props[k]).toBeUndefined()
  }
  const shown = body.map((t) => [t.children].flat(9).filter((c: any) => typeof c === 'string').join('')).join('|')
  expect(shown).toContain('✓ ok')
  expect(shown).toContain('› info Done.')
})

test('a summary note ends in the whole mark, after a table on its own row, and an empty one draws nothing', () => {
  const text = (n: any) => JSON.stringify(n)
  expect(text(drawNote('Checked both files.', 60, T, true))).toContain(' ·\u00a0summary')
  expect(text(drawNote('| a | b |\n|---|---|\n| 1 | 2 |', 60, T, true))).toContain('"  ·\u00a0summary"')
  expect(text(drawNote('Checked.', 60, T))).not.toContain('summary')
  expect(drawNote('  ', 60, T, true)).toBeNull()
})
