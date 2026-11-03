// Drawing of a reply's structured parts: inline spans, tables, diagrams, callouts. Began as a copy of the squad po-inbox mod.
// Pure functions of props, no `$`. Colour is a theme key (TONE, INFO, CODE, QUIET) or weight only (V-15, V-18, body-styles.md 9.5). Every function that
// draws rows also says how many rows it drew, by the same `rowsFor` the screen uses for its cut (T9 v3).
import { badgeProps, badgeText, BOX_RE, calloutChip, CHIPS, chipText, CODE, cellWidth, DIAGRAM_TAGS, diagramRuns, QUIET, rowsFor, STRIPE, tableLayout, TONE, wrapRows } from './core'
import type { DiagramRun } from './core'
import type { Block, Span } from './markup'

type T = { Box: any; Text: any; Button: any }
// `parts` are the row nodes of a code block or table, for a row clip.
export type Drawn = { node: any; rows: number; parts?: any[] }

// `text` cut into rows of at most `width` cells, by code point (a wide char that does not fit starts the next row).
export function wrapCells(text: string, width: number): string[] {
  const w = Math.max(1, width)
  const out: string[] = []
  let row = ''
  let used = 0
  for (const ch of text) {
    const cw = cellWidth(ch)
    if (used > 0 && used + cw > w) {
      out.push(row)
      row = ''
      used = 0
    }
    row += ch
    used += cw
  }
  out.push(row)
  return out
}

export const toneProps = (t: string): Record<string, unknown> =>
  t === 'good' ? { color: TONE.good } : t === 'bad' ? { color: TONE.bad } : t === 'warn' ? { color: TONE.warn } : t === 'dim' ? { dimColor: true } : {}

// What a span list draws as plain text: inline code is its text, no padding (the plain spaces of the sentence stay);
// a link is `label <url>` (a bare url is itself); a badge is its padded chip ` ✓ ok `.
const spanDrawn = (s: Span): string =>
  s.kind === 'link' ? (s.text === '' ? s.url : `${s.text} <${s.url}>`) : s.kind === 'badge' ? chipText(s.text) : s.text
const drawnText = (spans: Span[]): string => spans.map(spanDrawn).join('')

export function drawSpans(spans: Span[], T: T, base = ''): any[] {
  const { Text } = T
  return spans.map((s, i) => {
    const key = `${base}s${i}`
    if (s.kind === 'bold') return <Text key={key} bold>{s.text}</Text>
    if (s.kind === 'code') return <Text key={key} bold color={CODE}>{s.text}</Text>
    if (s.kind === 'badge') return <Text key={key} {...badgeProps(CHIPS[s.text].tone)}>{chipText(s.text)}</Text>
    if (s.kind === 'link') {
      // The url is always shown: a pane cannot open it, and no escape sequence leaves the pane.
      return s.text === '' ? (
        <Text key={key} underline>{s.url}</Text>
      ) : (
        <Text key={key}>
          <Text underline>{s.text}</Text>
          {' '}
          <Text dimColor>{`<${s.url}>`}</Text>
        </Text>
      )
    }
    return s.text
  })
}

const GLYPHS = ['•', '◦', '▪']

// Indent is capped so a hostile run of leading spaces cannot push the text out of the pane.
const indentFor = (depth: number, cols: number): number => Math.min(2 * depth, Math.max(0, Math.floor(cols / 2) - 4))

// A hanging row: a fixed prefix, then text that wraps under itself.
function hanging(key: string, prefix: any, prefixWidth: number, content: any, T: T) {
  const { Box, Text } = T
  return (
    <Box key={key} flexDirection="row">
      <Box key="p" width={prefixWidth} flexShrink={0}>{prefix}</Box>
      <Box key="c" flexDirection="column" flexShrink={1}>{content}</Box>
    </Box>
  )
}

function drawTable(b: Extract<Block, { type: 'table' }>, cols: number, T: T, key: string): Drawn {
  const { Box, Text } = T
  const header = b.header.map(drawnText)
  const rows = b.rows.map((r) => r.map(drawnText))
  const lay = tableLayout({ header, rows }, cols)
  const out: any[] = []
  let n = 0
  if (lay.kind === 'aligned') {
    // One Text per row, one child per cell, so a badge cell keeps its colour; the last non-empty cell has no padding.
    // `stripe` fills the row with the STRIPE theme background (every second body row). A stripe row is padded to the full
    // table width so the band is even, but only when that stays under `cols`: a row as wide as the pane may wrap early.
    const total = lay.widths.reduce((x, y) => x + y, 0) + 2 * Math.max(0, lay.widths.length - 1)
    const row = (k: string, cells: Span[][], props: Record<string, unknown>, stripe = false) => {
      let last = lay.widths.length - 1
      while (last > 0 && drawnText(cells[last] ?? []) === '') last--
      const parts: any[] = []
      let used = 0
      for (let i = 0; i <= last; i++) {
        const sp = cells[i] ?? []
        parts.push(...drawSpans(sp, T, `${k}c${i}`))
        used += cellWidth(drawnText(sp))
        if (i < last) {
          const pad = Math.max(0, lay.widths[i] - cellWidth(drawnText(sp))) + 2
          parts.push(' '.repeat(pad))
          used += pad
        }
      }
      if (stripe && total < cols) parts.push(' '.repeat(Math.max(0, total - used)))
      return <Text key={k} wrap="wrap" {...props}>{parts}</Text>
    }
    out.push(row('h', b.header, { bold: true }))
    out.push(<Text key="r" wrap="wrap">{lay.widths.map((w) => '─'.repeat(w)).join('  ')}</Text>)
    b.rows.forEach((r, i) => out.push(row(`t${i}`, r, i % 2 === 1 ? { backgroundColor: STRIPE } : {}, i % 2 === 1)))
    n = 2 + rows.length
  } else {
    const width = Math.max(header.length, ...rows.map((r) => r.length))
    b.rows.forEach((r, i) => {
      if (i > 0) {
        out.push(<Text key={`g${i}`}>{' '}</Text>)
        n += 1
      }
      for (let j = 0; j < width; j++) {
        const column = header[j] ?? ''
        const value = rows[i][j] ?? ''
        out.push(
          <Text key={`c${i}-${j}`} wrap="wrap">
            <Text bold>{column}</Text>
            {value === '' ? ':' : ': '}
            {drawSpans(r[j] ?? [], T, `c${i}-${j}`)}
          </Text>,
        )
        n += rowsFor(value === '' ? `${column}:` : `${column}: ${value}`, cols)
      }
    })
  }
  return { node: <Box key={key} flexDirection="column">{out}</Box>, rows: n, parts: out }
}

// A diagram (body-styles.md 3): a fence labelled `diagram`, or any fence with a box-drawing character.
const DIAGRAM_LANG = /^diagram(\s|$)/
export const isDiagram = (b: Extract<Block, { type: 'code' }>): boolean => DIAGRAM_LANG.test(b.lang) || b.lines.some((l) => BOX_RE.test(l))

// The first `n` cells of `s`, a wide char that does not fit dropped whole.
function cutCells(s: string, n: number): string {
  let out = ''
  let w = 0
  for (const ch of s) {
    const cw = cellWidth(ch)
    if (w + cw > n) break
    out += ch
    w += cw
  }
  return out
}

// The runs of one line cut to `n` cells. A run cut in the middle keeps its visible part: a connector stays a connector,
// a tag becomes plain text (a cut tag is not a tag).
function cutRuns(runs: DiagramRun[], n: number): DiagramRun[] {
  const out: DiagramRun[] = []
  let used = 0
  for (const r of runs) {
    const w = cellWidth(r.text)
    if (used + w <= n) {
      out.push(r)
      used += w
      continue
    }
    const part = cutCells(r.text, n - used)
    if (part !== '') out.push({ kind: r.kind === 'tag' ? 'name' : r.kind, text: part })
    break
  }
  return out
}

// Aligned, never wrapped. Lines wider than `W = cols - 2` are cut to `W - 1` cells and end in `›`, with a footer row. Colour is
// decided on the drawn text: connectors `inactive`, state tags in badge form in place, names plain, no legend. Every part is one row.
function drawDiagram(b: Extract<Block, { type: 'code' }>, cols: number, T: T, key: string): Drawn {
  const { Box, Text } = T
  if (b.lines.length === 0) return { node: <Box key={key} flexDirection="column" />, rows: 0, parts: [] }
  const W = Math.max(1, cols - 2)
  const lines = b.lines.map((l) => l.split('\t').join('    ').trimEnd())
  const widest = Math.max(...lines.map(cellWidth))
  // Tags are read on the typed line; a line wider than W is cut to W - 1 cells plus `›`, so a cut tag is plain and a whole one keeps its badge form.
  const shown: DiagramRun[][] = lines.map((l) => (cellWidth(l) > W ? [...cutRuns(diagramRuns(l), W - 1), { kind: 'name' as const, text: '›' }] : diagramRuns(l)))
  const out: any[] = []
  const caption = (DIAGRAM_LANG.test(b.lang) ? b.lang.slice('diagram'.length) : b.lang).trim()
  if (caption !== '') wrapRows(caption, W, Infinity).forEach((r, i) => out.push(<Text key={`cap${i}`} italic dimColor>{`  ${r}`}</Text>))
  shown.forEach((line, i) => {
    const runs = line.map((r, j) =>
      r.kind === 'conn' ? (
        <Text key={`d${i}-${j}`} color={QUIET}>{r.text}</Text>
      ) : r.kind === 'tag' ? (
        <Text key={`d${i}-${j}`} {...badgeProps(CHIPS[r.text.slice(1, -1) as 'ok'].tone)}>{badgeText(r.text.slice(1, -1) as 'ok')}</Text>
      ) : (
        r.text
      ),
    )
    out.push(<Text key={`d${i}`}>{'  '}{runs}</Text>)
  })
  if (widest > W) wrapCells(`› ${widest} columns wide, the pane shows ${W}`, W).forEach((r, i) => out.push(<Text key={`ft${i}`} dimColor>{`  ${r}`}</Text>))
  return { node: <Box key={key} flexDirection="column">{out}</Box>, rows: out.length, parts: out }
}

function drawCode(b: Extract<Block, { type: 'code' }>, cols: number, T: T, key: string): Drawn {
  if (isDiagram(b)) return drawDiagram(b, cols, T, key)
  const { Box, Text } = T
  const out: any[] = []
  if (b.lang !== '') out.push(<Text key="l" italic wrap="wrap">{b.lang}</Text>)
  let n = b.lang === '' ? 0 : rowsFor(b.lang, cols)
  b.lines.forEach((l, i) => {
    wrapCells(l.split('\t').join('    '), cols - 4).forEach((r, j) => {
      out.push(<Text key={`c${i}-${j}`}>{`  │ ${r}`}</Text>)
      n += 1
    })
  })
  return { node: <Box key={key} flexDirection="column">{out}</Box>, rows: n, parts: out }
}

export function drawBlock(b: Block, cols: number, T: T, key: string): Drawn {
  const { Text } = T
  switch (b.type) {
    case 'blank':
      return { node: <Text key={key}>{' '}</Text>, rows: 1 }
    case 'heading': {
      const props = b.level === 1 ? { bold: true, underline: true } : b.level === 2 ? { bold: true } : { bold: true, italic: true }
      return { node: <Text key={key} {...props} wrap="wrap">{drawSpans(b.spans, T, key)}</Text>, rows: rowsFor(drawnText(b.spans), cols) }
    }
    case 'rec':
      return calloutRow(b, 'rec', cols, T, key)
    case 'callout':
      return calloutRow(b, b.tone, cols, T, key)
    case 'bullet':
    case 'number': {
      const indent = ' '.repeat(indentFor(b.depth, cols))
      const mark = b.type === 'bullet' ? GLYPHS[Math.min(b.depth, 2)] : `${b.n}.`
      const prefix = `${indent}${mark} `
      const pw = cellWidth(prefix)
      const first = b.spans[0]
      if (b.type === 'bullet' && first !== undefined && first.kind === 'badge') {
        // A status bullet: the chip is padded to the widest chip plus one space, so the texts line up.
        const pad = NBSP.repeat(Math.max(0, STATUS_W - cellWidth(chipText(first.text))) + 1)
        const rest = b.spans.slice(1)
        const head = rest[0]
        if (head !== undefined && head.kind === 'text') rest[0] = { ...head, text: head.text.replace(/^ /, '') }
        return {
          node: hanging(key, <Text key="m">{prefix}</Text>, pw, <Text key="t" wrap="wrap">{drawSpans([first], T, key)}{pad}{drawSpans(rest, T, `${key}r`)}</Text>, T),
          rows: rowsFor(`${chipText(first.text)}${pad}${drawnText(rest)}`, Math.max(1, cols - pw)),
        }
      }
      return {
        node: hanging(key, b.type === 'bullet' ? <Text key="m">{prefix}</Text> : <Text key="m">{indent}<Text bold>{mark}</Text>{' '}</Text>, pw, <Text key="t" wrap="wrap">{drawSpans(b.spans, T, key)}</Text>, T),
        rows: rowsFor(drawnText(b.spans), Math.max(1, cols - pw)),
      }
    }
    case 'code':
      return drawCode(b, cols, T, key)
    case 'table':
      return drawTable(b, cols, T, key)
    default:
      return { node: <Text key={key} wrap="wrap">{drawSpans(b.spans, T, key)}</Text>, rows: rowsFor(drawnText(b.spans), cols) }
  }
}


// A counted pad is no-break spaces: `rowsFor` drops plain ones.
const NBSP = '\u00a0'
// The widest filled badge, ` ✗ fail `: a status bullet pads the others to it.
const STATUS_W = Math.max(...DIAGRAM_TAGS.map((t) => cellWidth(chipText(t))))

// A callout or `[rec]` row: the label chip, then the text. The text wraps under column 0 of the row, as in the PO inbox.
// `[decision]` and `[rec]` keep their sentence bold. `indent` is a counted pad of no-break spaces.
function calloutRow(b: { spans: Span[]; indent?: number }, word: 'decision' | 'warning' | 'info' | 'rec', cols: number, T: T, key: string): Drawn {
  const { Text } = T
  const chip = calloutChip(word)
  const rest = drawnText(b.spans)
  const pad = NBSP.repeat(Math.min(b.indent ?? 0, 8))
  const words = drawSpans(b.spans, T, key)
  return {
    node: (
      <Text key={key} wrap="wrap">
        {pad}
        <Text {...badgeProps(word === 'rec' ? 'good' : CHIPS[word].tone)}>{chip}</Text>
        {rest === '' ? null : ' '}
        {word === 'decision' || word === 'rec' ? <Text bold>{words}</Text> : words}
      </Text>
    ),
    rows: rowsFor(`${pad}${chip}${rest === '' ? '' : ' '}${rest}`, cols),
  }
}
