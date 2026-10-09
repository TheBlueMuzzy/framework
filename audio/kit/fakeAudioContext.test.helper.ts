// A hand-rolled fake AudioContext for the engine tests: records every node, connection, start/stop and volume ramp.
// (Not shipped to games: the installer skips files with ".test." in the name.)
// AudioParam ramps jump `value` straight to the ramp's target, so a test can read where a value is heading.

export class FakeParam {
  calls: [string, ...number[]][] = []
  value: number
  constructor(value: number) {
    this.value = value
  }
  setValueAtTime(value: number, at: number) {
    this.calls.push(['set', value, at])
    this.value = value
    return this
  }
  linearRampToValueAtTime(value: number, at: number) {
    this.calls.push(['ramp', value, at])
    this.value = value
    return this
  }
  cancelScheduledValues(at: number) {
    this.calls.push(['cancel', at])
    return this
  }
}

export class FakeNode {
  connections: FakeNode[] = []
  channelCount = 2
  channelCountMode = 'max'
  channelInterpretation = 'speakers'
  disconnected = false
  kind: string
  constructor(kind: string) {
    this.kind = kind
  }
  connect(node: FakeNode) {
    this.connections.push(node)
    return node
  }
  disconnect() {
    this.connections = []
    this.disconnected = true
  }
}

export class FakeGain extends FakeNode {
  gain = new FakeParam(1)
  constructor() { super('gain') }
}
export class FakeFilter extends FakeNode {
  type = 'lowpass'
  frequency = new FakeParam(350)
  constructor() { super('filter') }
}
export class FakePanner extends FakeNode {
  pan = new FakeParam(0)
  constructor() { super('panner') }
}
export class FakeCompressor extends FakeNode {
  threshold = new FakeParam(-24)
  knee = new FakeParam(30)
  ratio = new FakeParam(12)
  attack = new FakeParam(0.003)
  release = new FakeParam(0.25)
  constructor() { super('compressor') }
}
export class FakeSource extends FakeNode {
  buffer: { duration: number } | null = null
  playbackRate = new FakeParam(1)
  loop = false
  loopStart = 0
  loopEnd = 0
  started: number[] | null = null
  stoppedAt: number | null = null
  onended: (() => void) | null = null
  constructor() { super('source') }
  start(...args: number[]) {
    this.started = args
  }
  stop(at = 0) {
    this.stoppedAt = at
  }
  /** The test says "this sound finished" */
  end() {
    this.onended?.()
  }
}

export class FakeAudioContext {
  state: 'suspended' | 'running' | 'interrupted' | 'closed' = 'suspended'
  currentTime = 0
  sampleRate = 48000
  destination = new FakeNode('destination')
  onstatechange: (() => void) | null = null
  /** false = the browser refuses to resume (e.g. iOS without a tap) */
  allowResume = true
  resumeCalls = 0
  suspendCalls = 0
  nodes: FakeNode[] = []
  decoded = 0

  private made<T extends FakeNode>(node: T): T {
    this.nodes.push(node)
    return node
  }
  createGain() { return this.made(new FakeGain()) }
  createBiquadFilter() { return this.made(new FakeFilter()) }
  createStereoPanner() { return this.made(new FakePanner()) }
  createDynamicsCompressor() { return this.made(new FakeCompressor()) }
  createBufferSource() { return this.made(new FakeSource()) }
  createBuffer(_channels: number, length: number, rate: number) { return { duration: length / rate } }
  decodeAudioData(_data: ArrayBuffer) {
    this.decoded++
    return Promise.resolve({ duration: 1 })
  }
  setState(state: FakeAudioContext['state']) {
    this.state = state
    this.onstatechange?.()
  }
  resume() {
    this.resumeCalls++
    if (this.allowResume) this.setState('running')
    return Promise.resolve()
  }
  suspend() {
    this.suspendCalls++
    this.setState('suspended')
    return Promise.resolve()
  }
  close() {
    this.setState('closed')
    return Promise.resolve()
  }
  /** Sources that were started (the silent unlock blip has no `buffer` duration of 1 — filter by that) */
  startedSounds() {
    return this.nodes.filter((n): n is FakeSource => n instanceof FakeSource && n.started !== null && n.buffer?.duration === 1)
  }
}

export class FakeDocument extends EventTarget {
  visibilityState: 'visible' | 'hidden' = 'visible'
  setVisibility(state: 'visible' | 'hidden') {
    this.visibilityState = state
    this.dispatchEvent(new Event('visibilitychange'))
  }
}

/** Lets pending promises (resume, fetch, decode) settle */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
