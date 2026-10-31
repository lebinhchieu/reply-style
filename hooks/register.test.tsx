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

test('a diagram line draws its state tag as a chip and a legend', async ($) => {
  const ui = await $.ui.mount(MSG('```diagram flow\nlint --> test [ok]\n```'))
  expect(await ui.find({ type: 'Text', text: /legend/ })).toBeTruthy()
  await ui.unmount()
})
