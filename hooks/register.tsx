import type { Register } from 'claude-code'

import { drawBlock } from './draw'
import { parseBody } from './markup'
import { sanitize } from './core'
import { hasStyled, splitReply } from './segments'
import { SYNTAX } from './syntax'

const GUTTER = 2

export const register: Register = (on) => {
  // A reply with a table, a diagram fence, a badge or a callout is drawn here; any other reply is left to the engine.
  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    const { text, isFirstOfReply, isSummary } = e.props as { text: string; isFirstOfReply: boolean; isSummary?: true }
    if (isSummary) return next(e)
    const segments = splitReply(text)
    if (!hasStyled(segments)) return next(e)
    const { Box, Text, Markdown } = $.ui.resolve(e) as any
    const cols = Math.max(20, (e.viewport?.columns ?? 80) - GUTTER)
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

  // Tell the model the syntax that gets drawn.
  on('prompt.compose', async ($, e, next) => {
    const result = await next(e)
    return { sections: [...result.sections, { id: 'reply-style:syntax', text: SYNTAX, scope: 'session' as const }] }
  }).catch(($, e, next) => next(e))
}
