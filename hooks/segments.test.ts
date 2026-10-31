import { expect, test } from 'claude-code/testing'

import { hasStyled, splitReply } from './segments'

test('plain prose and a normal code fence stay with the engine', () => {
  const segs = splitReply('Hello there.\n\n```ts\nconst a = 1 | 2\n```\n\n- one\n- two')
  expect(hasStyled(segs)).toBe(false)
})

test('a table is styled and the prose around it is not', () => {
  const segs = splitReply('Before\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\nAfter')
  expect(segs.map((s) => s.kind)).toEqual(['md', 'styled', 'md'])
  expect(segs[1].text).toContain('| 1 | 2 |')
})

test('a diagram fence is styled, by label or by box characters', () => {
  expect(hasStyled(splitReply('```diagram flow\nA --> B\n```'))).toBe(true)
  expect(hasStyled(splitReply('```\n┌─┐\n└─┘\n```'))).toBe(true)
})

test('a badge or a callout line is styled, a badge inside a normal fence is not', () => {
  expect(hasStyled(splitReply('Build [ok] and tests [fail]'))).toBe(true)
  expect(hasStyled(splitReply('[decision] Ship it?'))).toBe(true)
  expect(hasStyled(splitReply('[rec] (a) merge now'))).toBe(true)
  expect(hasStyled(splitReply('```\n[ok]\n```'))).toBe(false)
})

test('an unclosed fence keeps everything after it', () => {
  const segs = splitReply('```diagram\nA -> B\n[ok] done')
  expect(segs).toHaveLength(1)
  expect(segs[0].text).toContain('[ok] done')
})
