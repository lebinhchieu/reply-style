import { expect, test } from 'claude-code/testing'

import { blockTexts, noteKey, noteTracker } from './notes'

const TOOL = [{ name: 'Read' }]
const key = (t: string) => noteKey(t) as string

test('a step that ends in a tool call marks each text block a note, an end_turn step marks it output', () => {
  const t = noteTracker()
  expect(t.step('t', undefined, ['I will read.', ' '], TOOL)).toEqual([[key('I will read.'), true]])
  expect(t.step('t', undefined, ['Result.'], [])).toEqual([[key('Result.'), false]])
})

test('blocks are told apart by the stream index, not by the step answer', () => {
  const texts = blockTexts([{ kind: 'text', index: 0, text: 'a' }, { kind: 'tool' }, { kind: 'text', index: 2, text: 'c' }, { kind: 'text', index: 0, text: 'b' }])
  expect(texts).toEqual(['ab', 'c'])
})

test('a step asking something of the user is output, a subagent step is skipped', () => {
  const t = noteTracker()
  expect(t.step('t', undefined, ['Which one?'], [{ name: 'AskUserQuestion' }])).toEqual([[key('Which one?'), false]])
  expect(t.step('t', 'agent-1', ['x'], TOOL)).toEqual([])
})

test('the same text written as output stays output when a later step ends in a tool call', () => {
  const t = noteTracker()
  t.step('a', undefined, ['Done.'], [])
  expect(t.step('b', undefined, ['Done.'], TOOL)).toEqual([])
})

test('an aborted turn turns only its last marked step back to output', () => {
  const t = noteTracker()
  t.step('t', undefined, ['first'], TOOL)
  t.step('t', undefined, ['second'], TOOL)
  expect(t.complete('t', 'aborted')).toEqual([[key('second'), false]])
  t.step('u', undefined, ['third'], TOOL)
  expect(t.complete('u', 'answer')).toEqual([])
})
