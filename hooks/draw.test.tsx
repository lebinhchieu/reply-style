import { expect, test } from 'claude-code/testing'

import { badgeText, cellWidth, DIAGRAM_TAGS } from './core'
import { drawBlock, drawSpans } from './draw'
import { parseBody } from './markup'

// Bare stand-ins for the engine's components: enough to run the draw functions and read `rows`.
const T = { Box: 'Box', Text: 'Text', Button: null } as any

test('a badge is as wide as the typed [word]', () => {
  for (const w of DIAGRAM_TAGS) expect(cellWidth(badgeText(w))).toBe(cellWidth(`[${w}]`))
})

const TABLE = '| Service | State | p95 | Note |\n|---|---|---|---|\n| api | [ok] | 120 ms | stable |\n| worker | [warn] | 480 ms | queue grows after 18:00 |\n| billing | [fail] | – | timeout on /charge |\n| search | [skip] | – | not deployed in staging |'

test('a table that fits stays aligned, one cell too many stacks', () => {
  const [table] = parseBody(TABLE)
  expect(drawBlock(table, 48, T, 'k').rows).toBe(6) // header, rule, 4 rows
  expect(drawBlock(table, 47, T, 'k').rows).toBeGreaterThan(6) // stacked records
})

test('inline code is bold in the permission colour, with no fill', () => {
  const [el] = drawSpans([{ kind: 'code', text: 'x' } as any], T)
  expect(el.props).toMatchObject({ bold: true, color: 'permission' })
  expect(el.props.inverse).toBeUndefined()
  expect(el.props.backgroundColor).toBeUndefined()
})
