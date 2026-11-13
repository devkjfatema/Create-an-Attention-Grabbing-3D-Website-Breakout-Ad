import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { X } from 'lucide-react'

import { FarmartPage } from '../../shared/components/FarmartPage'
import { EventCard, EventConfig } from './EventCard'
import { buildGeometry, Geo } from './geometry'
import { createParticles } from './particles'
import { sfx } from './sfx'

type Props = {
  active: boolean
  reduced: boolean
  sound: boolean
  config: EventConfig
  onCta?: () => void
  onClosed: () => void
}

/**
 * The live page plus the guerrilla overlay that breaks through it.
 * Timeline (seconds): 0 normal · 1.0 rumble + Close · 2.0 cracks + bulge ·
 * 3.4 tear · 3.75 basket bursts out · 5.6 offer card · 6.3 idle loop.
 */
export function BurstStage({ active, reduced, sound, config, onCta, onClosed }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const closingRef = useRef(false)
  const soundRef = useRef(sound)
  soundRef.current = sound
  const [geo, setGeo] = useState<Geo | null>(null)

  useLayoutEffect(() => {
    if (!active || !rootRef.current) return
    const { width, height } = rootRef.current.getBoundingClientRect()
    setGeo(buildGeometry(width, height))
  }, [active])

  const close = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    tlRef.current?.pause()
    gsap.killTweensOf('.kj-idle')
    gsap.to(liveRef.current, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 0.2, ease: 'power2.out' })
    gsap.to([preRef.current, overlayRef.current, closeRef.current], {
      autoAlpha: 0,
      duration: 0.26,
      ease: 'power2.out',
    })
    gsap.to(rootRef.current?.querySelector('.kj-card-wrap') ?? [], { y: 24, scale: 0.97, duration: 0.26, ease: 'power2.out' })
    gsap.delayedCall(0.28, onClosed)
  }, [onClosed])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, close])

  // ---- The timeline -------------------------------------------------------
  useLayoutEffect(() => {
    if (!geo || reduced || !rootRef.current) return
    const root = rootRef.current
    const parts = canvasRef.current ? createParticles(canvasRef.current) : null
    const play = (fn: () => void) => () => soundRef.current && fn()

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      const { cx, cy, minDim, mobile } = geo
      const live = liveRef.current!
      const tl = gsap.timeline()
      tlRef.current = tl

      gsap.set([q('.kj-void'), q('.kj-tear'), q('.kj-dim')], { autoAlpha: 0 })
      gsap.set(live, { transformOrigin: `${cx}px ${cy}px` })

      // 1.0 · Close appears, foreshadowing rumble
      tl.fromTo(closeRef.current, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'power2.out' }, 1.0)
      tl.call(play(() => sfx.rumble(2.4)), [], 1.0)
      tl.to(live, { x: 'random(-1.5,1.5)', y: 'random(-1,1)', duration: 0.05, repeat: 15, repeatRefresh: true, ease: 'none' }, 1.0)
      tl.to(live, { x: 'random(-3,3)', y: 'random(-2.5,2.5)', duration: 0.045, repeat: 35, repeatRefresh: true, ease: 'none' }, 1.8)
      tl.call(() => parts?.emit('dust', 14, cx, cy, 0.6), [], 1.1)
      tl.call(() => parts?.emit('dust', 26, cx, cy, 1), [], 2.0)

      // 2.0 · Cracks race out along the future shard edges; page bulges toward viewer
      tl.call(play(sfx.crack), [], 2.0)
      q('.kj-crack').forEach((el: Element) => {
        const len = Number(el.getAttribute('data-len'))
        const delay = Number(el.getAttribute('data-delay'))
        gsap.set(el, { strokeDasharray: len, strokeDashoffset: len })
        tl.to(el, { strokeDashoffset: 0, duration: 0.32, ease: 'power3.out' }, 2.0 + delay)
      })
      tl.call(play(sfx.crack), [], 2.45)
      tl.fromTo(q('.kj-crack-glow'), { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 2.1)
      tl.to(live, { scale: 1.025, duration: 1.4, ease: 'power2.inOut' }, 2.0)
      tl.to(q('.kj-pressure'), { opacity: 1, duration: 1.4, ease: 'power2.inOut' }, 2.0)

      // 3.4 · TEAR: live page swapped for identical shards, void revealed behind
      const T = 3.4
      tl.call(play(sfx.boom), [], T)
      tl.set(q('.kj-void'), { autoAlpha: 1 }, T)
      tl.set(q('.kj-tear'), { autoAlpha: 1 }, T)
      tl.set(live, { autoAlpha: 0 }, T)
      tl.call(() => {
        parts?.emit('chip', mobile ? 26 : 50, cx, cy, 1.1)
        parts?.emit('dust', 60, cx, cy, 2.2)
      }, [], T)
      tl.fromTo(q('.kj-flash'), { opacity: 0.55 }, { opacity: 0, duration: 0.3, ease: 'power2.out' }, T)
      tl.to(q('.kj-stage'), { x: 'random(-8,8)', y: 'random(-6,6)', duration: 0.04, repeat: 7, repeatRefresh: true, ease: 'none' }, T)
      tl.to(q('.kj-stage'), { x: 0, y: 0, duration: 0.15, ease: 'power2.out' }, T + 0.32)
      tl.to(q('.kj-tear'), { scale: 1, duration: 0.6, ease: 'power3.out' }, T)

      geo.shards.forEach((s) => {
        const el = q(`[data-shard="${s.id}"]`)[0]
        if (!el) return
        const [r0, r1, r2, r3, r4, r5] = s.r
        const dx = Math.cos(s.angle)
        const dy = Math.sin(s.angle)
        if (s.band === 2) {
          // Outer page buckles slightly back: the torn edge of the hole
          tl.to(el, {
            x: dx * (4 + r0 * 10),
            y: dy * (4 + r1 * 10) + r2 * 6,
            z: -(12 + r3 * 30),
            rotationX: (r4 - 0.5) * 10,
            rotationY: (r5 - 0.5) * 10,
            duration: 0.7,
            ease: 'power3.out',
          }, T)
          return
        }
        // Inner shards fly outward and toward the camera, tumbling
        const dist = minDim * (0.7 + r0 * 0.7) * (s.band === 0 ? 1 : 0.8)
        const start = T + s.band * 0.05 + r1 * 0.05
        const dur = 1.2 + r2 * 0.4
        tl.to(el, {
          x: dx * dist,
          y: dy * dist,
          z: 220 + r3 * 420,
          rotationX: (r4 - 0.5) * 220,
          rotationY: (r5 - 0.5) * 220,
          rotationZ: (r0 - 0.5) * 120,
          duration: dur,
          ease: 'power3.out',
        }, start)
        tl.to(el, { y: `+=${minDim * (0.25 + r1 * 0.3)}`, duration: dur, ease: 'power2.in' }, start + 0.25)
        tl.to(el, { autoAlpha: 0, duration: 0.35, ease: 'power1.out' }, start + 0.65 + r2 * 0.3)
        const shine = el.querySelector('.kj-shine')
        tl.to(shine, { opacity: 0.15 + r3 * 0.35, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, start + 0.15 + r4 * 0.2)
        if (!mobile) {
          // Motion blur at peak velocity only (desktop: blur is costly on phones)
          tl.fromTo(el, { filter: 'blur(0px)' }, { filter: 'blur(2.5px)', duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.out' }, start + 0.05)
        }
      })

      tl.fromTo(q('.kj-ray'), { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power2.out' }, T + 0.1)
      tl.fromTo(q('.kj-rim'), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }, T)

      // 3.75 · Basket: rises from depth, anticipates, bursts, overshoots, settles
      const B = T + 0.35
      const basket = q('.kj-basket')[0]
      const shadow = q('.kj-shadow')[0]
      gsap.set(basket, { autoAlpha: 0, scaleX: 0.18, scaleY: 0.18, y: 30, rotation: 6, filter: 'blur(10px)' })
      gsap.set(shadow, { autoAlpha: 0, scale: 0.3 })
      tl.to(basket, { autoAlpha: 1, scaleX: 0.34, scaleY: 0.34, y: 10, filter: 'blur(5px)', duration: 0.35, ease: 'power2.out' }, B)
      tl.to(basket, { scaleX: 0.33, scaleY: 0.29, y: 26, rotation: 9, duration: 0.25, ease: 'power2.inOut' }, B + 0.35)
      tl.to(basket, { scaleX: 1.1, scaleY: 1.17, y: -24, rotation: -9, filter: 'blur(0px)', duration: 0.42, ease: 'power4.out' }, B + 0.6)
      tl.to(basket, { scaleX: 1.05, scaleY: 0.95, y: 4, duration: 0.14, ease: 'power2.out' }, B + 1.02)
      tl.to(basket, { scaleX: 1, scaleY: 1, y: 0, rotation: -4, duration: 0.9, ease: 'elastic.out(1, 0.45)' }, B + 1.16)
      tl.fromTo(q('.kj-rimlight'), { opacity: 0 }, { opacity: 0.9, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, B + 0.6)
      tl.to(shadow, { autoAlpha: 0.55, scale: 1.15, duration: 0.42, ease: 'power4.out' }, B + 0.6)
      tl.to(shadow, { autoAlpha: 0.42, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.45)' }, B + 1.16)
      tl.call(play(sfx.boom), [], B + 0.6)
      tl.call(() => {
        parts?.emit('drop', mobile ? 24 : 44, cx, cy, 1)
        parts?.emit('chip', 16, cx, cy, 0.8)
      }, [], B + 0.62)

      // Leaves torn loose, tumbling past the camera
      q('.kj-leaf').forEach((el: Element, i: number) => {
        const a = (i / 10) * Math.PI * 2 + 0.3
        const d = minDim * (0.45 + (i % 3) * 0.18)
        tl.fromTo(
          el,
          { x: 0, y: 0, z: 0, scale: 0.4, autoAlpha: 0, rotationX: 0, rotationY: 0, rotationZ: i * 37 },
          {
            x: Math.cos(a) * d,
            y: Math.sin(a) * d - minDim * 0.1,
            z: 150 + (i % 4) * 120,
            scale: 1,
            autoAlpha: 1,
            rotationX: 160 + i * 40,
            rotationY: 120 - i * 25,
            rotationZ: i * 37 + 140,
            duration: 1.3,
            ease: 'power3.out',
          },
          B + 0.6 + i * 0.03,
        )
        tl.to(el, { y: `+=${minDim * 0.5}`, autoAlpha: 0, duration: 1.1, ease: 'power2.in' }, B + 1.5 + i * 0.04)
      })

      // 5.6 · The offer
      const C = B + 1.85
      tl.to(q('.kj-dim'), { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, C)
      tl.fromTo(q('.kj-card-wrap'), { autoAlpha: 0, y: 36, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'expo.out' }, C + 0.1)
      tl.fromTo(q('.kj-in'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power3.out' }, C + 0.2)

      // 6.3 · Idle loop: gentle float + light sweep across the card
      tl.call(() => {
        gsap.to(q('.kj-basket-float'), { y: -10, rotation: 1.5, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
        gsap.to(q('.kj-card-float'), { y: -4, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' })
        gsap.fromTo(
          q('.kj-sweep'),
          { xPercent: 0, opacity: 0.9 },
          { xPercent: 520, duration: 1.4, repeat: -1, repeatDelay: 2.6, ease: 'power2.inOut' },
        )
      }, [], C + 0.7)
    }, root)

    return () => {
      ctx.revert()
      parts?.destroy()
    }
  }, [geo, reduced])

  const showFx = active && !reduced && geo
  const basketSize = geo
    ? geo.mobile
      ? Math.min(geo.w * 0.92, geo.h * 0.46, 520)
      : Math.min(geo.h * 0.8, geo.w * 0.48)
    : 0

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden">
      <div className="kj-stage absolute inset-0">
        <div ref={liveRef} className="absolute inset-0">
          <FarmartPage />
          {showFx && (
            <div ref={preRef} className="pointer-events-none absolute inset-0">
              <div
                className="kj-pressure absolute inset-0 opacity-0"
                style={{
                  background: `radial-gradient(circle ${geo.holeR * 1.3}px at ${geo.cx}px ${geo.cy}px, rgba(20,16,8,0.32), rgba(20,16,8,0) 100%)`,
                }}
              />
              <svg className="absolute inset-0" width={geo.w} height={geo.h} aria-hidden>
                <g className="kj-crack-glow" style={{ filter: 'blur(3px)' }}>
                  {geo.cracks.map((c, i) => (
                    <path key={i} className="kj-crack" data-len={c.len} data-delay={c.delay} d={c.d} fill="none" stroke="#ffc978" strokeWidth={c.width * 3.5} strokeLinecap="round" strokeLinejoin="round" />
                  ))}
                </g>
                {geo.cracks.map((c, i) => (
                  <path key={i} className="kj-crack" data-len={c.len} data-delay={c.delay} d={c.d} fill="none" stroke="#231f17" strokeWidth={c.width} strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </svg>
            </div>
          )}
        </div>

        {showFx && (
          <div ref={overlayRef} className="absolute inset-0">
            {/* The void behind the page: dark depth + volumetric light leaking from the rim */}
            <div className="kj-void invisible absolute inset-0 bg-void">
              {[-62, -30, -8, 18, 44, 78].map((deg, i) => (
                <div
                  key={deg}
                  className="kj-ray absolute opacity-0"
                  style={{
                    left: geo.cx - 50,
                    top: geo.cy,
                    width: 100 + (i % 2) * 60,
                    height: Math.hypot(geo.w, geo.h),
                    transformOrigin: '50% 0',
                    transform: `rotate(${deg + 180}deg)`,
                    background: 'linear-gradient(to bottom, rgba(255,201,120,0.22), rgba(255,201,120,0) 70%)',
                    filter: 'blur(22px)',
                  }}
                />
              ))}
              <div
                className="kj-rim absolute rounded-full opacity-0"
                style={{
                  left: geo.cx - geo.holeR * 1.25,
                  top: geo.cy - geo.holeR * 1.25,
                  width: geo.holeR * 2.5,
                  height: geo.holeR * 2.5,
                  background: 'radial-gradient(circle, rgba(255,190,110,0) 52%, rgba(255,190,110,0.32) 66%, rgba(255,190,110,0) 78%)',
                }}
              />
            </div>

            <div
              className="kj-tear invisible absolute inset-0"
              style={{ transform: 'scale(1.025)', transformOrigin: `${geo.cx}px ${geo.cy}px` }}
            >
              <div className="absolute inset-0" style={{ perspective: 1100, perspectiveOrigin: `${geo.cx}px ${geo.cy}px` }}>
                {geo.shards
                  .filter((s) => s.band === 2)
                  .map((s) => (
                    <div key={s.id} data-shard={s.id} className="absolute inset-0" style={{ transformOrigin: `${s.cx}px ${s.cy}px` }}>
                      <div className="absolute inset-0" style={{ clipPath: s.clip }}>
                        <FarmartPage />
                      </div>
                    </div>
                  ))}

                <div className="kj-dim invisible absolute inset-0 bg-black/45" />

                {/* Hero object + its cast shadow on the remaining page */}
                <div
                  className="absolute"
                  style={{ left: geo.cx - basketSize / 2, top: geo.cy - basketSize / 2, width: basketSize, height: basketSize }}
                >
                  <div
                    className="kj-shadow absolute rounded-[50%] opacity-0"
                    style={{
                      left: '12%',
                      right: '12%',
                      top: '88%',
                      height: '16%',
                      background: 'radial-gradient(closest-side, rgba(0,0,0,0.75), rgba(0,0,0,0))',
                      filter: 'blur(14px)',
                    }}
                  />
                  <div className="kj-basket-float kj-idle absolute inset-0">
                    <div className="kj-basket absolute inset-0" style={{ transformOrigin: '50% 70%' }}>
                      <img
                        src={BASKET}
                        alt=""
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-contain"
                        style={{ maskImage: MASK, WebkitMaskImage: MASK }}
                      />
                      <div
                        className="kj-rimlight absolute inset-0 opacity-0 mix-blend-screen"
                        style={{
                          maskImage: MASK,
                          WebkitMaskImage: MASK,
                          background: 'radial-gradient(circle at 65% 25%, rgba(255,200,120,0.55), rgba(255,200,120,0) 55%)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {geo.shards
                  .filter((s) => s.band < 2)
                  .map((s) => (
                    <div
                      key={s.id}
                      data-shard={s.id}
                      className="absolute inset-0 will-change-transform"
                      style={{ transformOrigin: `${s.cx}px ${s.cy}px`, transformStyle: 'preserve-3d' }}
                    >
                      <div className="absolute inset-0 bg-[#cdc5b0]" style={{ clipPath: s.clip, transform: 'translateZ(-6px)' }} />
                      <div className="absolute inset-0" style={{ clipPath: s.clip }}>
                        <FarmartPage />
                        <div className="kj-shine absolute inset-0 bg-white opacity-0" />
                      </div>
                    </div>
                  ))}

                {LEAVES.map((l, i) => (
                  <svg
                    key={i}
                    className="kj-leaf invisible absolute"
                    style={{ left: geo.cx - l.size / 2, top: geo.cy - l.size / 2, filter: i % 4 === 0 ? 'blur(1.5px)' : undefined }}
                    width={l.size}
                    height={l.size * 0.55}
                    viewBox="0 0 40 22"
                    aria-hidden
                  >
                    <path d="M1 20 C 6 4, 24 0, 39 1 C 34 15, 19 23, 1 20 Z" fill={l.fill} />
                    <path d="M2 19.5 C 14 13, 26 7, 38 1.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.9" fill="none" />
                  </svg>
                ))}
              </div>
            </div>

            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
            <div className="kj-flash pointer-events-none absolute inset-0 bg-[#fff6e6] opacity-0" />

            <div className="kj-card-wrap invisible absolute inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] mx-auto max-w-md lg:inset-x-auto lg:top-1/2 lg:right-[5%] lg:bottom-auto lg:w-[420px] lg:max-w-none lg:-translate-y-1/2">
              <div className="kj-card-float kj-idle">
                <EventCard config={config} onCta={onCta} />
              </div>
            </div>
          </div>
        )}

        {active && reduced && (
          <div className="absolute inset-0 grid place-items-center bg-black/50 p-4">
            <div className="w-full max-w-md">
              <EventCard config={config} onCta={onCta} />
            </div>
          </div>
        )}
      </div>

      {active && (
        <button
          ref={closeRef}
          onClick={close}
          aria-label="Close event announcement"
          className="absolute top-[max(12px,env(safe-area-inset-top))] right-[max(12px,env(safe-area-inset-right))] z-50 grid size-12 place-items-center rounded-full bg-black/70 text-white ring-1 ring-white/25 transition-[background-color,transform] duration-150 ease-out hover:bg-black/85 active:scale-95"
          style={reduced ? undefined : { visibility: 'hidden' }}
        >
          <X className="size-6" />
        </button>
      )}
    </div>
  )
}

const BASKET = 'https://cdn.magicpatterns.com/patterns/generated-images/91182161-0398-44e4-8362-312de0a8ce00.jpg'
const MASK = 'radial-gradient(ellipse 62% 62% at 50% 50%, #000 58%, transparent 100%)'

const LEAVES = [
  { size: 54, fill: '#4f9a2f' },
  { size: 38, fill: '#6fb33d' },
  { size: 62, fill: '#3d7f25' },
  { size: 30, fill: '#86c24a' },
  { size: 46, fill: '#4f9a2f' },
  { size: 70, fill: '#2f6b1d' },
  { size: 34, fill: '#6fb33d' },
  { size: 50, fill: '#5ea836' },
  { size: 42, fill: '#3d7f25' },
  { size: 58, fill: '#77b843' },
]
