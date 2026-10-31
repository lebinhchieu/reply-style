// Splits a reply into stretches the engine's own markdown draws ('md') and stretches this mod draws ('styled'):
// a table, a diagram fence, a callout or `[rec]` line, and any line holding a state badge. Pure: no `$`.
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
    add(isMarkerLine(trimmed) || hasBadge(line) ? 'styled' : 'md', [line])
    i++
  }
  return out
}

export const hasStyled = (segments: Segment[]): boolean => segments.some((s) => s.kind === 'styled')
