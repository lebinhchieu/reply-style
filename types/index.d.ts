declare module 'claude-code' {
  interface PluginState {
    'reply-style': {
      /** By the key of a text block (`noteKey`): true when the block is a working note, false or absent when it is output. */
      isNote: StateFamily<boolean>
      /** By the `requestId` of an `isSummary` block: true when its turn did not end on an answer, so the block is drawn as output. */
      summaryOutput: StateFamily<boolean>
    }
  }
}
