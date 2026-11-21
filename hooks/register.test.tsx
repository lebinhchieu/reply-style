import { expect, test } from 'claude-code/testing'

const MSG = (text: string, extra: object = {}) =>
  ({ plugin: 'reply-style', component: 'AssistantMessage', requestId: 'm1', surface: 'terminal', viewport: { columns: 80, rows: 24 },
     props: { text, isFirstOfReply: true, ...extra } }) as const

test('a table is drawn as aligned cells with a rule under the header', async ($, on) => {
  on('ui.render', ($, e) => { const { Text } = $.ui.resolve(e); return <Text>engine</Text> })
  const ui = await $.ui.mount(MSG('| name | state |\n|---|---|\n| build | [ok] |'))
  expect(await ui.find({ type: 'Text', text: /─{4}/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /engine/ })).toBeFalsy()
  await ui.unmount()
})

test('a plain reply is left to the engine', async ($, on) => {
  on('ui.render', ($, e) => { const { Text } = $.ui.resolve(e); return <Text>engine</Text> })
  const ui = await $.ui.mount(MSG('Just words, `code` and **bold**.'))
  expect(await ui.find({ type: 'Text', text: /engine/ })).toBeTruthy()
  await ui.unmount()
})

test('a summary block is left to the engine', async ($, on) => {
  on('ui.render', ($, e) => { const { Text } = $.ui.resolve(e); return <Text>engine</Text> })
  const ui = await $.ui.mount(MSG('Build [ok]', { isSummary: true }))
  expect(await ui.find({ type: 'Text', text: /engine/ })).toBeTruthy()
  await ui.unmount()
})

test('a diagram line draws its state tag as a badge and no legend', async ($) => {
  const ui = await $.ui.mount(MSG('```diagram flow\nlint --> test [ok]\n```'))
  expect(await ui.find({ type: 'Text', text: /✓.ok/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /legend/ })).toBeFalsy()
  await ui.unmount()
})

test('the model stream goes through unchanged, also when marking fails', async ($, on) => {
  const result = { turnId: 't1', index: 0, answer: 'I will read.', toolUses: [{ id: 'u1', name: 'Read', input: {} }], stopReason: 'tool_use', usage: null } as const
  const chunks = [{ kind: 'text', ref: 1, index: 0, text: 'I will ' }, { kind: 'text', ref: 3, index: 0, text: 'read.' }] as const
  on('turn.step', async function* () { yield* chunks; return result })
  on('state.set', () => { throw new Error('write failed') })
  const out: unknown[] = []
  const stream = $.turn.step({ turnId: 't1', index: 0, model: 'm', messageCount: 1 } as any)
  for await (const c of stream) out.push(c)
  expect(out).toEqual([...chunks])
})
