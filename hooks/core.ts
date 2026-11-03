// Pure helpers of the reply-style mod: sanitising, badges, diagram runs, cell widths, table layout. No `$`, no I/O.
// Began as a copy of the squad po-inbox mod; it may now differ from it.

// C0 and C1 controls incl. ESC and DEL, and the bidi overrides; \n and \t survive when `keepLayout`.
function isControl(code: number, keepLayout: boolean): boolean {
  if (keepLayout && (code === 10 || code === 9)) return false
  const isBidi = (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069)
  return code <= 0x1f || (code >= 0x7f && code <= 0x9f) || isBidi
}

function stripControls(text: string, keepLayout: boolean, replacement: string): string {
  let out = ''
  for (const ch of text) {
    out += isControl(ch.codePointAt(0) as number, keepLayout) || (!keepLayout && (ch === '\u2028' || ch === '\u2029')) ? replacement : ch
  }
  return out
}

// An agent-written text must not drive the terminal: no ESC or other control but \n and \t.
export function sanitize(text: string): string {
  return stripControls(text.split('\r\n').join('\n').split('\r').join('\n'), true, '')
}

// One line, no controls: the title goes into a header line the Manager reads.
export function oneLine(text: string): string {
  return stripControls(text, false, ' ').split(' ').filter((w) => w !== '').join(' ')
}

// --- visual helpers (IV-02): pure, no drawing ---------------------------------------------------

// V-15 / T6: theme keys, never RGB. Dim is the `dimColor` prop, not a colour.
export const TONE = { good: 'success', bad: 'error', warn: 'warning' } as const
export type Tone = 'good' | 'bad' | 'warn' | 'dim' | 'none'

// Connectors and quiet text are `inactive`; a decision label is `permission`; an info label is `planMode`, a teal that is not
// `permission` or `success`, so an info chip never reads as a decision, a pass or a skipped step. Change INFO here to retune it.
export const ACCENT = 'permission'
export const INFO = 'planMode'
// Inline code is bold in `ide`, with no fill.
export const CODE = 'ide'
export const QUIET = 'inactive'
// The one background fill outside a badge: every second body row of an aligned table. A theme key, so it follows the user's theme.
export const STRIPE = 'bashMessageBackgroundColor'
export type ChipTone = 'good' | 'bad' | 'warn' | 'accent' | 'info' | 'quiet'
const CHIP_COLOR: Record<ChipTone, string> = { good: TONE.good, bad: TONE.bad, warn: TONE.warn, accent: ACCENT, info: INFO, quiet: QUIET }

// The exact Ink props of a filled badge or callout label: `inverse` swaps colour and letters, so the fill is the theme
// colour and the letters take the terminal's own background. Never `dimColor`; a badge sets no `backgroundColor` (only STRIPE does, on a table row).
export const badgeProps = (tone: ChipTone): { inverse: true; bold: true; color: string } => ({ inverse: true, bold: true, color: CHIP_COLOR[tone] })

// Badge and callout words: tone and glyph. The glyph and the word both carry the meaning; colour is the second signal.
export const CHIPS = {
  ok: { tone: 'good', glyph: '✓' }, fail: { tone: 'bad', glyph: '✗' }, warn: { tone: 'warn', glyph: '⚠' }, skip: { tone: 'quiet', glyph: '–' },
  decision: { tone: 'accent', glyph: '◆' }, warning: { tone: 'warn', glyph: '⚠' }, info: { tone: 'info', glyph: '›' }, rec: { tone: 'good', glyph: '✓' },
} as const satisfies Record<string, { tone: ChipTone; glyph: string }>
export type ChipWord = keyof typeof CHIPS

// The badge in a diagram line: `✓ ok`, as wide as the typed `[ok]` (word + 2), so the diagram keeps its columns.
// U+00A0 so a badge never splits across two rows (`wrap-ansi` breaks on a plain space only).
export const badgeText = (word: InlineWord): string => `${CHIPS[word].glyph}\u00a0${word}`

// A filled badge in prose, a table cell or a bullet: one no-break space of padding each side, ` ✓ ok `.
// A callout word in mid-line is the same kind of chip, ` › info `; `rec` stays short there (` ✓ rec `).
export const chipText = (word: InlineWord): string => `\u00a0${badgeText(word)}\u00a0`

// A callout label chip: ` ◆ decision `, ` ⚠ warning `, ` › info `, ` ✓ recommended `.
export const calloutChip = (word: 'decision' | 'warning' | 'info' | 'rec'): string =>
  `\u00a0${CHIPS[word].glyph}\u00a0${word === 'rec' ? 'recommended' : word}\u00a0`

// A box-drawing character: a fence holding one is a diagram.
export const BOX_RE = /[\u2500-\u257f]/

export type DiagramRun = { kind: 'name' | 'conn' | 'tag'; text: string }
// The four state words: badges in prose, tags in a diagram.
export const DIAGRAM_TAGS = ['ok', 'warn', 'fail', 'skip'] as const
export type DiagramTag = (typeof DIAGRAM_TAGS)[number]
// Words that become a chip anywhere in a line: the four state words and the four callout words.
export const INLINE_WORDS = [...DIAGRAM_TAGS, 'decision', 'warning', 'info', 'rec'] as const
export type InlineWord = (typeof INLINE_WORDS)[number]

const isConnectorCode = (c: number): boolean =>
  (c >= 0x2500 && c <= 0x257f) || (c >= 0x2190 && c <= 0x21ff) || c === 0x25b2 || c === 0x25ba || c === 0x25bc || c === 0x25c4

// The tag a `[word]` at `at` spells, when it stands alone (a space or the line edge on both sides); else null.
function tagAt(chars: string[], at: number): DiagramTag | null {
  if (chars[at] !== '[' || (at > 0 && chars[at - 1] !== ' ')) return null
  for (const t of DIAGRAM_TAGS) {
    const end = at + t.length + 2
    if (end > chars.length || chars[end - 1] !== ']') continue
    let same = true
    for (let k = 0; k < t.length && same; k++) same = chars[at + 1 + k] === t[k]
    if (same && (end === chars.length || chars[end] === ' ')) return t
  }
  return null
}

// A diagram line as runs (9.4): connectors, state tags, and everything else as names. One pass over the code points; the
// run texts joined give the line back, so a colour never changes a character or its width. A lone `-`, `|`, `+`, `v`, `^`
// stay names because they also occur inside words (`BRD-01`).
export function diagramRuns(line: string): DiagramRun[] {
  const chars = Array.from(line)
  const n = chars.length
  const conn: boolean[] = new Array(n).fill(false)
  for (let i = 0; i < n; i++) {
    const c = chars[i]
    if (isConnectorCode(c.codePointAt(0) as number)) conn[i] = true
    else if (c === '-' || c === '=') {
      let j = i
      while (j < n && (chars[j] === '-' || chars[j] === '=')) j++
      if (j - i >= 2) for (let k = i; k < j; k++) conn[k] = true
      else if (c === '-' && chars[i + 1] === '>') conn[i] = true
      i = j - 1
    }
  }
  // one `>` right after a connector run and one `<` right before one (not a chain of them)
  const base = conn.slice()
  for (let i = 1; i < n; i++) if (chars[i] === '>' && base[i - 1]) conn[i] = true
  for (let i = n - 2; i >= 0; i--) if (chars[i] === '<' && base[i + 1]) conn[i] = true
  const runs: DiagramRun[] = []
  const add = (kind: DiagramRun['kind'], text: string) => {
    const last = runs[runs.length - 1]
    if (last !== undefined && last.kind === kind && kind !== 'tag') last.text += text
    else runs.push({ kind, text })
  }
  for (let i = 0; i < n; ) {
    if (!conn[i]) {
      const tag = tagAt(chars, i)
      if (tag !== null) {
        add('tag', `[${tag}]`)
        i += tag.length + 2
        continue
      }
    }
    add(conn[i] ? 'conn' : 'name', chars[i])
    i++
  }
  return runs
}

const inRanges = (c: number, r: number[][]): boolean => r.some(([a, b]) => c >= a && c <= b)
const ZERO = [[0x300, 0x36f], [0x200b, 0x200f], [0x20d0, 0x20ff], [0xfe00, 0xfe0f], [0xfe20, 0xfe2f], [0xe0100, 0xe01ef]]
const WIDE = [
  [0x1100, 0x115f], [0x2e80, 0x303e], [0x3041, 0x33ff], [0x3400, 0x4dbf], [0x4e00, 0x9fff], [0xa000, 0xa4cf],
  [0xac00, 0xd7a3], [0xf900, 0xfaff], [0xfe30, 0xfe6f], [0xff01, 0xff60], [0xffe0, 0xffe6],
  [0x1f300, 0x1f64f], [0x1f680, 0x1f6ff], [0x1f900, 0x1f9ff], [0x20000, 0x3fffd],
  // Emoji presentation (drawn 2 cells wide). U+2713 and U+26A0, the inbox's own glyphs, stay 1.
  [0x231a, 0x231b], [0x23e9, 0x23f3], [0x25fd, 0x25fe], [0x2614, 0x2615], [0x2648, 0x2653], [0x267f, 0x267f],
  [0x2693, 0x2693], [0x26a1, 0x26a1], [0x26aa, 0x26ab], [0x26bd, 0x26be], [0x26c4, 0x26c5], [0x26ce, 0x26ce],
  [0x26d4, 0x26d4], [0x26ea, 0x26ea], [0x26f2, 0x26f5], [0x26fa, 0x26fa], [0x26fd, 0x26fd], [0x2705, 0x2705],
  [0x270a, 0x270b], [0x2728, 0x2728], [0x274c, 0x274c], [0x274e, 0x274e], [0x2753, 0x2755], [0x2757, 0x2757],
  [0x2795, 0x2797], [0x27b0, 0x27b0], [0x27bf, 0x27bf], [0x2b1b, 0x2b1c], [0x2b50, 0x2b50], [0x2b55, 0x2b55],
  [0x1f1e6, 0x1f1ff], [0x1fa70, 0x1faff],
]

// Terminal cells of a text, by code point: wide (CJK, fullwidth, emoji) 2, combining and zero-width 0.
export function cellWidth(s: string): number {
  let w = 0
  for (const ch of s) {
    const c = ch.codePointAt(0) as number
    w += inRanges(c, ZERO) ? 0 : inRanges(c, WIDE) ? 2 : 1
  }
  return w
}

// Rows a text takes when wrapped to `cols` cells: words wrap on spaces, a longer word is hard-wrapped.
// Rounds up when unsure (the engine's real wrap is not measurable).
export function rowsFor(text: string, cols: number): number {
  const width = Math.max(1, Math.floor(cols) || 1)
  let rows = 0
  for (const line of text.split('\n')) {
    let used = 0
    let r = 1
    for (const word of line.split(' ')) {
      const w = cellWidth(word)
      if (used > 0 && used + 1 + w <= width) {
        used += 1 + w
        continue
      }
      if (w === 0 && used > 0) {
        // A run of spaces at the row end: the space starts the next row (counted, so the estimate rounds up).
        r++
        used = 1
        continue
      }
      if (used > 0) {
        r++
        // after a row filled to the full width the real renderer starts the next row one cell in
        used = used === width ? 1 : 0
      }
      // Hard-wrap one code point at a time: a wide char that does not fit starts the next row.
      for (const ch of word) {
        const cw = cellWidth(ch)
        if (used > 0 && used + cw > width) {
          r++
          used = 0
        }
        used += cw
      }
    }
    rows += r
  }
  return rows
}

export type Table = { header: string[]; rows: string[][] }
export type TableLayout =
  | { kind: 'aligned'; widths: number[] }
  | { kind: 'stacked'; rows: { column: string; value: string }[][] }

// Aligned at 40+ columns when header and rows fit as `cell  cell` (widest cell per column,
// two spaces between columns); otherwise each row stacks as `column: value`.
export function tableLayout(table: Table, cols: number): TableLayout {
  const n = Math.max(table.header.length, ...table.rows.map((r) => r.length))
  const cell = (r: string[], i: number): string => (i < r.length ? r[i] : '')
  const widths: number[] = []
  for (let i = 0; i < n; i++) {
    widths.push(Math.max(cellWidth(cell(table.header, i)), ...table.rows.map((r) => cellWidth(cell(r, i)))))
  }
  const total = widths.reduce((a, b) => a + b, 0) + 2 * Math.max(0, n - 1)
  if (cols >= 40 && total <= cols) return { kind: 'aligned', widths }
  return {
    kind: 'stacked',
    rows: table.rows.map((r) => Array.from({ length: n }, (_, i) => ({ column: cell(table.header, i), value: cell(r, i) }))),
  }
}

// At most `cols` cells by cellWidth; a cut text ends with `…`; a wide char at the cut is dropped whole.
export function clipCells(s: string, cols: number): string {
  if (cols < 1) return ''
  if (cellWidth(s) <= cols) return s
  let out = ''
  let w = 0
  for (const ch of s) {
    const cw = cellWidth(ch)
    if (w + cw > cols - 1) break
    out += ch
    w += cw
  }
  return `${out}…`
}

// Rows of at most `width` cells, a word longer than a row is cut across rows; past `maxRows` the last row ends with `…`.
export function wrapRows(text: string, width: number, maxRows: number): string[] {
  const rows: string[] = []
  let cur = ''
  for (const word of text.split(' ')) {
    const pieces: string[] = []
    let piece = ''
    for (const ch of word) {
      if (piece !== '' && cellWidth(piece + ch) > width) {
        pieces.push(piece)
        piece = ''
      }
      piece += ch
    }
    pieces.push(piece)
    for (const p of pieces) {
      if (cur === '') cur = p
      else if (cellWidth(cur) + 1 + cellWidth(p) <= width) cur += ` ${p}`
      else {
        rows.push(cur)
        cur = p
      }
    }
  }
  rows.push(cur)
  if (rows.length <= maxRows) return rows
  return [...rows.slice(0, maxRows - 1), clipCells(`${rows.slice(maxRows - 1).join(' ')}…`, width)]
}

