// Which text blocks are working notes. Pure: no `$`. A block is a note when the model step that wrote it ended in a tool call;
// the mod learns this at `turn.step` and tells the drawing through `$.state` (`isNote`, by the key of the block's text).

// A step that asks something of the user is output, whatever tool it also calls.
const EXCLUDED = ['AskUserQuestion', 'ExitPlanMode']

// FNV-1a of the trimmed text, in hex. The same function runs in the hook and in `ui.render`; no match = no note = output.
// An empty or blank text has no key (the engine draws nothing for it).
export function noteKey(text: string): string | undefined {
  const t = text.trim()
  if (t === '') return undefined
  let h = 0x811c9dc5
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 0x01000193) >>> 0
  return `${h.toString(16)}:${t.length}`
}

export type TextChunk = { kind: string; index?: number; text?: string }

// The text of each block of one step, by the stream's text chunks grouped by block `index` (never the step's whole answer).
export function blockTexts(chunks: readonly TextChunk[]): string[] {
  const by = new Map<number, string>()
  for (const c of chunks) if (c.kind === 'text') by.set(c.index ?? 0, (by.get(c.index ?? 0) ?? '') + (c.text ?? ''))
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1])
}

export const isNoteStep = (toolUses: readonly { name: string }[]): boolean => toolUses.length > 0 && !toolUses.some((t) => EXCLUDED.includes(t.name))

export type Write = [key: string, isNote: boolean]

// Remembers, for the session, what each step decided. NOTE: the `isNote` family grows by one entry per text block for the whole
// session (backlog, not a defect).
export function noteTracker() {
  const outputs = new Set<string>() // keys a step ended on as output: output wins over note for the same text
  const lastMarked = new Map<string, string[]>() // turnId -> keys of the turn's last note step
  return {
    // The writes one finished step asks for. A step of a subagent (`agentId`) asks for none.
    step(turnId: string, agentId: string | undefined, texts: readonly string[], toolUses: readonly { name: string }[]): Write[] {
      if (agentId !== undefined) return []
      const keys = [...new Set(texts.map(noteKey).filter((k): k is string => k !== undefined))]
      if (!isNoteStep(toolUses)) {
        keys.forEach((k) => outputs.add(k))
        return keys.map((k) => [k, false])
      }
      const notes = keys.filter((k) => !outputs.has(k))
      if (notes.length > 0) lastMarked.set(turnId, notes)
      return notes.map((k) => [k, true])
    },
    // The turn ended: when it did not end on an answer, the last marked step's blocks are output (the reader must see them).
    complete(turnId: string, reason: string): Write[] {
      const keys = lastMarked.get(turnId) ?? []
      lastMarked.delete(turnId)
      if (reason === 'answer') return []
      keys.forEach((k) => outputs.add(k))
      return keys.map((k) => [k, false])
    },
  }
}

// The last `isSummary` block drawn in the turn (its `requestId`): a summary has no key, so after a turn that did not end on an
// answer this one block is told to draw as output (the reader must see it). Imprecision accepted: a redraw of an older summary
// can move it, which only errs towards output.
export function summaryTracker() {
  let last: string | undefined
  return {
    drawn(requestId: string): void {
      last = requestId
    },
    start(): void {
      last = undefined
    },
    // The writes a finished turn asks for: the last drawn summary is output unless the turn ended on an answer.
    complete(reason: string): Write[] {
      const id = last
      last = undefined
      return id === undefined || reason === 'answer' ? [] : [[id, true]]
    },
  }
}
