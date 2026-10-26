// THE SPAM LIMIT — one bucket per seat. It holds `burst` sends; each send takes one, and one comes back every
// `refillSeconds`. Two sends are never closer than `minGapMs`. Past the limit a send is simply refused (nothing is
// queued — a queue only delays the spam) and readyIn() says how long until the next one, for the picker's ring.
// Plain maths on a clock it's handed, so tests need no waiting.
export interface BucketLimits {
  burst: number
  refillSeconds: number
  minGapMs?: number
}

export interface Bucket {
  /** ms until a send is allowed again (0 = now). */
  readyIn(now: number): number
  /** Take one send if one is there → true; past the limit → false (and nothing changes). */
  take(now: number): boolean
}

export function createBucket({ burst, refillSeconds, minGapMs = 0 }: BucketLimits): Bucket {
  const refillMs = refillSeconds * 1000
  let tokens = burst
  let stamp: number | null = null // when `tokens` was last brought up to date
  let lastSent = -Infinity

  const refill = (now: number) => {
    if (stamp !== null && now > stamp) tokens = Math.min(burst, tokens + (now - stamp) / refillMs)
    if (stamp === null || now > stamp) stamp = now
  }
  const readyIn = (now: number) => {
    refill(now)
    const gap = Math.max(0, lastSent + minGapMs - now)
    const token = tokens >= 1 ? 0 : (1 - tokens) * refillMs
    return Math.max(0, Math.ceil(Math.max(gap, token) - 1e-6)) // (the 1e-6: adding up fractions of a token leaves tiny crumbs)
  }
  return {
    readyIn,
    take(now) {
      if (readyIn(now) > 0) return false
      tokens -= 1
      lastSent = now
      return true
    },
  }
}
