// Splits a reply into stretches the engine's own markdown draws ('md') and stretches this mod draws ('styled'):
// a table, a diagram fence, a callout or `[rec]` line, any line holding a state badge, and a whole bullet list when one item holds a badge. Pure: no `$`.
import { BOX_RE } from './core'
import { CALLOUTS, cellsOf, isFenceEnd, isSeparator, isSpace, parseInline } from './markup'

export type Segment = { kind: 'md' | 'styled'; text: string }

const DIAGRAM_LANG = /^diagram(\s|$)/

const isFenceStart = (t: string): boolean => t.startsWith('```') || t.startsWith('~~~')

function isDiagramFence(lang: string, lines: string[]): boolean {
  return DIAGRAM_LANG.test(lang) || lines.some((l) => BOX_RE.test(l))
}

function isMarkerLine(trimmed: string): boolean {
  const words = ['rec', ...CALLOUTS]
  return words.some((w) => trimmed.startsWith(`[${w}]`) && (trimmed.length === w.length + 2 || isSpace(trimmed[w.length + 2])))
}

const BULLET = /^\s*([-*+]|\d+[.)])\s/

// Bullet items plus their indented continuation lines. An indented fence, table row or marker line is not
// a continuation: the branches below handle it as before.
const isListLine = (line: string): boolean => {
  if (BULLET.test(line)) return true
  const t = line.trim()
  return isSpace(line[0] ?? '') && t !== '' && !isFenceStart(t) && !t.startsWith('|') && !isMarkerLine(t)
}

const hasBadge = (line: string): boolean => parseInline(line).some((s) => s.kind === 'badge')

export function splitReply(text: string): Segment[] {
  const lines = text.split('\r\n').join('\n').split('\r').join('\n').split('\n')
  const out: Segment[] = []
  const add = (kind: Segment['kind'], chunk: string[]) => {
    const last = out[out.length - 1]
    if (last !== undefined && last.kind === kind) last.text += `\n${chunk.join('\n')}`
    else out.push({ kind, text: chunk.join('\n') })
  }
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === '') {
      add(out.length > 0 ? out[out.length - 1].kind : 'md', [line])
      i++
      continue
    }
    if (isFenceStart(trimmed)) {
      const start = i
      const body: string[] = []
      i++
      while (i < lines.length && !isFenceEnd(lines[i], trimmed[0])) body.push(lines[i++])
      const closed = i < lines.length
      i++
      add(isDiagramFence(trimmed.slice(3).trim(), body) ? 'styled' : 'md', lines.slice(start, closed ? i : lines.length))
      continue
    }
    if (line.includes('|') && i + 1 < lines.length && isSeparator(lines[i + 1], cellsOf(line).length)) {
      const start = i
      i += 2
      while (i < lines.length && lines[i].includes('|')) i++
      add('styled', lines.slice(start, i))
      continue
    }
    if (BULLET.test(line)) {
      // Whole-list rule: one badge item makes the whole list styled, so bullet styles never mix.
      const start = i
      let end = i
      while (end < lines.length) {
        if (isListLine(lines[end])) {
          end++
          continue
        }
        // A blank line keeps a loose list together when the next non-blank line is a bullet.
        let k = end
        while (k < lines.length && lines[k].trim() === '') k++
        if (k > end && k < lines.length && BULLET.test(lines[k])) end = k
        else break
      }
      i = end
      const run = lines.slice(start, i)
      add(run.some(hasBadge) ? 'styled' : 'md', run)
      continue
    }
    add(isMarkerLine(trimmed) || hasBadge(line) ? 'styled' : 'md', [line])
    i++
  }
  return out
}

export const hasStyled = (segments: Segment[]): boolean => segments.some((s) => s.kind === 'styled')
