import type { Register } from 'claude-code'

import { drawBlock, drawNote } from './draw'
import { parseBody } from './markup'
import { sanitize } from './core'
import { blockTexts, noteKey, noteTracker, summaryTracker } from './notes'
import type { TextChunk, Write } from './notes'
import { hasStyled, splitReply } from './segments'

const GUTTER = 2

const tracker = noteTracker()
const summaries = summaryTracker()

// A failed write leaves the block as output.
async function write($: any, writes: Write[]) {
  for (const [id, isNote] of writes) {
    try {
      await $.state.set({ plugin: 'reply-style', key: 'isNote', id } as const, isNote)
    } catch {
      // output
    }
  }
}

async function writeSummaries($: any, writes: Write[]) {
  for (const [id, output] of writes) {
    try {
      await $.state.set({ plugin: 'reply-style', key: 'summaryOutput', id } as const, output)
    } catch {
      // the summary stays a note
    }
  }
}

export const register: Register = (on) => {
  // A working note (a text block the model wrote before a tool call) is told here, from the engine's own step result, and written to
  // state for the drawing. The stream is never changed: every chunk goes up as it came, in order, whatever marking does.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined) return yield* next(e)
    const it = next(e)
    const seen: TextChunk[] = []
    let r = await it.next()
    while (!r.done) {
      if (r.value.kind === 'text') seen.push(r.value)
      yield r.value
      r = await it.next()
    }
    try {
      await write($, tracker.step(e.turnId, e.agentId, blockTexts(seen), r.value.toolUses))
    } catch {
      // marking never reaches the stream
    }
    return r.value
  }).catch(async function* ($, e, next) {
    return yield* next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) summaries.start()
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    try {
      await write($, tracker.complete(e.turnId, e.reason))
      if (e.agentId === undefined) await writeSummaries($, summaries.complete(e.reason))
    } catch {
      // as above
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // A note is drawn quiet, a reply with a table, a diagram fence, a badge or a callout is drawn here; any other reply is left to the engine.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const { text, isFirstOfReply, isSummary } = e.props as { text: string; isFirstOfReply: boolean; isSummary?: true }
    const { Box, Text, Markdown } = $.ui.resolve(e) as any
    const cols = Math.max(20, (e.viewport?.columns ?? 80) - GUTTER)
    if (isSummary) {
      // The engine's one-sentence stand-in for the text between two tool calls: a note, unless its turn did not end on an answer.
      let output = false
      try {
        output = (await $.state.get({ plugin: 'reply-style', key: 'summaryOutput', id: e.requestId } as const)).value === true
      } catch {
        output = true
      }
      if (output) return next(e)
      summaries.drawn(e.requestId)
      return drawNote(text, cols, { Box, Text, Button: null }, true)
    }
    const key = noteKey(text)
    let note = false
    if (key !== undefined) {
      try {
        // Read for every block so the site is drawn again when its step is marked.
        note = (await $.state.get({ plugin: 'reply-style', key: 'isNote', id: key } as const)).value === true
      } catch {
        note = false
      }
    }
    if (note) return drawNote(text, cols, { Box, Text, Button: null })
    const segments = splitReply(text)
    if (!hasStyled(segments)) return next(e)
    const nodes = segments.map((s, i) => {
      if (s.kind === 'md') return <Markdown key={`m${i}`} text={s.text} />
      const blocks = parseBody(sanitize(s.text))
      return (
        <Box key={`s${i}`} flexDirection="column">
          {blocks.map((b, j) => drawBlock(b, cols, { Box, Text, Button: null }, `s${i}b${j}`).node)}
        </Box>
      )
    })
    return (
      <Box flexDirection="row">
        <Box key="gutter" width={GUTTER} flexShrink={0}>
          <Text>{isFirstOfReply ? '● ' : '  '}</Text>
        </Box>
        <Box key="body" flexDirection="column" flexShrink={1}>{nodes}</Box>
      </Box>
    )
  }).catch(($, e, next) => next(e))
}
