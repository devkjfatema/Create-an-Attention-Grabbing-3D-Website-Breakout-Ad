/**
 * Shard + crack geometry for the page-break.
 *
 * The viewport is cut by N jittered rays from the impact point and three
 * jittered rings. Every vertex is computed once and shared, so the shards
 * tile the screen with no gaps, and the crack lines trace exactly the
 * edges the page will later split along.
 *
 *   ring band 0 (core triangles)  -> fly toward the camera first
 *   ring band 1 (inner quads)     -> fly a moment later
 *   ring band 2 (outer frame)     -> stays, slightly buckled: the torn hole edge
 */

export type Pt = [number, number]

export type Shard = {
  id: string
  band: 0 | 1 | 2
  angle: number
  clip: string
  cx: number
  cy: number
  r: [number, number, number, number, number, number]
}

export type Crack = { d: string; len: number; delay: number; width: number }

export type Geo = {
  w: number
  h: number
  cx: number
  cy: number
  minDim: number
  holeR: number
  mobile: boolean
  shards: Shard[]
  cracks: Crack[]
}

export function buildGeometry(w: number, h: number, seed = 11): Geo {
  const rand = mulberry32(seed)
  // "compact" = phones and tablets: hole up top, offer card docked at the bottom.
  // Wide screens: hole left of centre, offer card on the right.
  const mobile = w < 1024
  const minDim = Math.min(w, h)
  const cx = w * (mobile ? 0.5 : 0.4)
  const cy = h * (mobile ? 0.33 : 0.48)
  const holeR = mobile ? Math.min(minDim * 0.44, h * 0.26) : minDim * 0.4
  const radii = [0, holeR * 0.4, holeR, Math.hypot(w, h) * 1.3]
  const N = w < 640 ? 9 : 12

  const angles: number[] = []
  for (let i = 0; i < N; i++) angles.push(((i + (rand() - 0.5) * 0.55) / N) * Math.PI * 2 - Math.PI / 2)

  const polar = (a: number, r: number): Pt => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]

  // Ring vertices
  const pts: Pt[][] = radii.map((r, k) =>
    angles.map((a) => {
      if (k === 0) return [cx, cy] as Pt
      if (k === 3) return polar(a, r)
      return polar(a + (rand() - 0.5) * 0.1, r * (1 + (rand() - 0.5) * 0.3))
    }),
  )

  // Jagged midpoint on each ray edge between ring k and k+1 (shared by neighbours)
  const rayMid: Pt[][] = [0, 1, 2].map((k) =>
    angles.map((_, i) => {
      const [ax, ay] = pts[k][i]
      const [bx, by] = pts[k + 1][i]
      const t = 0.35 + rand() * 0.3
      const nx = -(by - ay)
      const ny = bx - ax
      const nl = Math.hypot(nx, ny) || 1
      const off = (rand() - 0.5) * (k === 2 ? 40 : minDim * 0.06)
      return [ax + (bx - ax) * t + (nx / nl) * off, ay + (by - ay) * t + (ny / nl) * off] as Pt
    }),
  )

  // Jagged midpoint on each ring edge between ray i and i+1
  const ringMid: Pt[][] = radii.map((r, k) =>
    angles.map((a, i) => {
      if (k === 0) return [cx, cy] as Pt
      const next = angles[(i + 1) % N] + (i === N - 1 ? Math.PI * 2 : 0)
      const am = a + (next - a) * (0.4 + rand() * 0.2)
      const rr = k === 3 ? r : r * (1 + (rand() - 0.5) * 0.25)
      return polar(am, rr)
    }),
  )

  const shards: Shard[] = []
  for (let k = 0; k < 3; k++) {
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N
      const poly: Pt[] =
        k === 0
          ? [pts[0][i], rayMid[0][i], pts[1][i], ringMid[1][i], pts[1][j], rayMid[0][j]]
          : [pts[k][i], rayMid[k][i], pts[k + 1][i], ringMid[k + 1][i], pts[k + 1][j], rayMid[k][j], pts[k][j], ringMid[k][i]]
      const c = centroid(k === 2 ? poly.filter((_, n) => n === 0 || n === 6 || n === 7) : poly)
      shards.push({
        id: `s${k}-${i}`,
        band: k as 0 | 1 | 2,
        angle: Math.atan2(c[1] - cy, c[0] - cx),
        clip: `polygon(${poly.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`,
        cx: c[0],
        cy: c[1],
        r: [rand(), rand(), rand(), rand(), rand(), rand()],
      })
    }
  }

  // Cracks: rays first, then the rings, then hairlines into the outer page
  const cracks: Crack[] = []
  angles.forEach((_, i) => {
    const ray = [pts[0][i], rayMid[0][i], pts[1][i], rayMid[1][i], pts[2][i]]
    cracks.push(toCrack(ray, rand() * 0.18, 2.2))
    const [ex, ey] = pts[2][i]
    const a = Math.atan2(ey - cy, ex - cx)
    const len = minDim * (0.08 + rand() * 0.14)
    const hair: Pt[] = [
      [ex, ey],
      [ex + Math.cos(a + 0.3) * len * 0.5, ey + Math.sin(a + 0.3) * len * 0.5],
      [ex + Math.cos(a - 0.1) * len, ey + Math.sin(a - 0.1) * len],
    ]
    cracks.push(toCrack(hair, 0.55 + rand() * 0.2, 1))
  })
  for (const k of [1, 2]) {
    const loop: Pt[] = []
    angles.forEach((_, i) => loop.push(pts[k][i], ringMid[k][i]))
    loop.push(pts[k][0])
    cracks.push(toCrack(loop, k === 1 ? 0.25 : 0.42, k === 1 ? 1.6 : 2))
  }

  return { w, h, cx, cy, minDim, holeR, mobile, shards, cracks }
}

function toCrack(p: Pt[], delay: number, width: number): Crack {
  let len = 0
  for (let i = 1; i < p.length; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])
  return { d: 'M' + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L'), len: Math.ceil(len), delay, width }
}

function centroid(p: Pt[]): Pt {
  const x = p.reduce((s, q) => s + q[0], 0) / p.length
  const y = p.reduce((s, q) => s + q[1], 0) / p.length
  return [x, y]
}

export function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
