/**
 * Tiny canvas particle system: dust, paper chips and water droplets.
 * One rAF loop, transform-free drawing, DPR-aware, stops itself when idle.
 */

type Kind = 'dust' | 'chip' | 'drop'
type P = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  z: number
  vz: number
  life: number
  max: number
  size: number
  rot: number
  vr: number
}

export function createParticles(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const list: P[] = []
  let raf = 0
  let last = 0
  let w = 0
  let h = 0

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const r = canvas.getBoundingClientRect()
    w = r.width
    h = r.height
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()

  const tick = (t: number) => {
    const dt = Math.min(0.033, (t - (last || t)) / 1000)
    last = t
    ctx.clearRect(0, 0, w, h)
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i]
      p.life += dt
      if (p.life > p.max) {
        list.splice(i, 1)
        continue
      }
      const g = p.kind === 'dust' ? 40 : p.kind === 'chip' ? 900 : 1300
      const drag = p.kind === 'dust' ? 0.96 : 0.99
      p.vx *= drag
      p.vy = p.vy * drag + g * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      p.rot += p.vr * dt
      const persp = 1 + Math.max(0, p.z) / 600
      const a = Math.min(1, (1 - p.life / p.max) * 1.6)
      const s = p.size * persp
      ctx.save()
      ctx.globalAlpha = a
      ctx.translate(p.x, p.y)
      if (p.kind === 'dust') {
        ctx.fillStyle = 'rgba(214,198,168,0.9)'
        ctx.beginPath()
        ctx.arc(0, 0, s, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.kind === 'chip') {
        ctx.rotate(p.rot)
        ctx.scale(1, Math.cos(p.rot * 1.7))
        ctx.fillStyle = '#f4f1e8'
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'
        ctx.beginPath()
        ctx.moveTo(-s, -s * 0.4)
        ctx.lineTo(s * 0.8, -s)
        ctx.lineTo(s, s * 0.6)
        ctx.lineTo(-s * 0.4, s)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      } else {
        // droplet: body + specular highlight, stretched along velocity (motion blur)
        const sp = Math.hypot(p.vx, p.vy)
        ctx.rotate(Math.atan2(p.vy, p.vx))
        ctx.scale(1 + Math.min(2.2, sp / 700), 1)
        ctx.fillStyle = 'rgba(190,225,240,0.55)'
        ctx.beginPath()
        ctx.arc(0, 0, s, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.arc(-s * 0.3, -s * 0.35, s * 0.35, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    raf = list.length ? requestAnimationFrame(tick) : 0
    if (!raf) last = 0
  }

  return {
    emit(kind: Kind, n: number, x: number, y: number, power = 1, spread = Math.PI * 2, dir = 0) {
      for (let i = 0; i < n; i++) {
        const a = dir + (Math.random() - 0.5) * spread
        const v =
          (kind === 'dust' ? 30 + Math.random() * 90 : kind === 'chip' ? 250 + Math.random() * 650 : 300 + Math.random() * 700) *
          power
        list.push({
          kind,
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - (kind === 'dust' ? 20 : 180),
          z: 0,
          vz: kind === 'dust' ? 0 : 200 + Math.random() * 500,
          life: 0,
          max: kind === 'dust' ? 1.6 + Math.random() * 1.4 : 0.9 + Math.random() * 0.8,
          size: kind === 'dust' ? 0.8 + Math.random() * 1.8 : kind === 'chip' ? 2 + Math.random() * 5 : 1.5 + Math.random() * 3,
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 18,
        })
      }
      if (!raf) raf = requestAnimationFrame(tick)
    },
    resize,
    destroy() {
      cancelAnimationFrame(raf)
      list.length = 0
    },
  }
}
