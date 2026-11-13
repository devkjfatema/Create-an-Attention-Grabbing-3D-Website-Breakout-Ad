/**
 * Synthesised sound: no audio files to download. Off by default; browsers
 * only allow audio after a user gesture, which the sound toggle provides.
 */
let ctx: AudioContext | null = null

function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    ctx = new C()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function noise(c: AudioContext, seconds: number, brown = false) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1
    if (brown) {
      last = (last + 0.02 * white) / 1.02
      d[i] = last * 3.5
    } else d[i] = white
  }
  const src = c.createBufferSource()
  src.buffer = buf
  return src
}

export const sfx = {
  rumble(seconds: number) {
    const c = ac()
    if (!c) return
    const src = noise(c, seconds, true)
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 120
    const g = c.createGain()
    const t = c.currentTime
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.9, t + seconds * 0.85)
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
    src.connect(lp).connect(g).connect(c.destination)
    src.start()
  },
  crack() {
    const c = ac()
    if (!c) return
    const src = noise(c, 0.25)
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1800
    const g = c.createGain()
    const t = c.currentTime
    g.gain.setValueAtTime(0.5, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    src.connect(hp).connect(g).connect(c.destination)
    src.start()
  },
  boom() {
    const c = ac()
    if (!c) return
    const o = c.createOscillator()
    const g = c.createGain()
    const t = c.currentTime
    o.frequency.setValueAtTime(90, t)
    o.frequency.exponentialRampToValueAtTime(32, t + 0.6)
    g.gain.setValueAtTime(0.9, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
    o.connect(g).connect(c.destination)
    o.start()
    o.stop(t + 0.75)
    sfx.crack()
  },
}
