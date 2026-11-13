import React, { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays } from 'lucide-react'

export type EventConfig = {
  eventTitle: string
  discountText: string
  discountNote: string
  eventDate: string
  ctaText: string
  brandColor: string
}

/** The offer that lands after the burst. The discount is the loudest thing on it. */
export function EventCard({ config, onCta }: { config: EventConfig; onCta?: () => void }) {
  const left = useCountdown(config.eventDate)
  const date = new Date(config.eventDate)
  const dateLabel = isNaN(date.getTime())
    ? config.eventDate
    : date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div
      role="dialog"
      aria-label={config.eventTitle}
      className="kj-card relative overflow-hidden rounded-2xl bg-cream p-5 text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] ring-1 ring-black/5 sm:p-7"
    >
      <div className="kj-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/50 opacity-0" />

      <p className="kj-in flex items-center gap-2 text-sm font-medium" style={{ color: config.brandColor }}>
        <CalendarDays className="size-4 shrink-0" />
        <span className="truncate">{dateLabel}</span>
      </p>
      <h2 className="kj-in mt-2 font-display text-2xl leading-tight font-semibold sm:text-3xl">{config.eventTitle}</h2>

      <div className="kj-in mt-4 border-t border-ink/10 pt-4">
        <p className="font-display text-5xl leading-none font-extrabold tracking-tight sm:text-6xl" style={{ color: config.brandColor }}>
          {config.discountText}
        </p>
        <p className="mt-2 text-sm text-muted">{config.discountNote}</p>
      </div>

      <div className="kj-in mt-5 grid grid-cols-4 gap-2" aria-label="Time until the event starts">
        {left ? (
          (
            [
              ['days', left.d],
              ['hrs', left.h],
              ['min', left.m],
              ['sec', left.s],
            ] as const
          ).map(([label, v]) => (
            <div key={label} className="rounded-lg bg-white px-2 py-2 text-center ring-1 ring-ink/5">
              <div className="text-xl font-bold tabular-nums sm:text-2xl">{String(v).padStart(2, '0')}</div>
              <div className="text-[11px] text-muted">{label}</div>
            </div>
          ))
        ) : (
          <div className="col-span-4 rounded-lg bg-white py-3 text-center text-sm font-semibold" style={{ color: config.brandColor }}>
            Happening now
          </div>
        )}
      </div>

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          onCta?.()
        }}
        className="kj-in mt-5 flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold whitespace-nowrap text-white transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98]"
        style={{ backgroundColor: config.brandColor }}
      >
        {config.ctaText} <ArrowRight className="size-5" />
      </a>
    </div>
  )
}

function useCountdown(iso: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = new Date(iso).getTime() - now
  if (!(diff > 0)) return null
  const s = Math.floor(diff / 1000)
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}
