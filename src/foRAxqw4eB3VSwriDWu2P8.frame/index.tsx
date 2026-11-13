import React, { useEffect, useState } from 'react'
import { RotateCcw, Volume2, VolumeX } from 'lucide-react'

import { BurstStage } from './components/BurstStage'

export const args = {
  state: 'playing',
  eventTitle: 'Harvest Festival Weekend',
  discountText: 'Up to 40% off',
  discountNote: 'fresh produce from 120+ local farms',
  eventDate: '2026-10-17T09:00:00',
  ctaText: 'Shop the harvest',
  brandColor: '#3f8f2a',
}

export const argTypes = {
  state: { control: 'select', options: ['playing', 'normal', 'reduced-motion'] },
  eventTitle: { control: 'text' },
  discountText: { control: 'text' },
  eventDate: { control: 'text' },
  ctaText: { control: 'text' },
  brandColor: { control: 'color' },
}

type Props = Partial<typeof args> & { onCta?: () => void }

export default function HomepageBurstPreview(props: Props) {
  const { state, eventTitle, discountText, discountNote, eventDate, ctaText, brandColor, onCta } = {
    ...args,
    ...props,
  }
  const [open, setOpen] = useState(state !== 'normal')
  const [run, setRun] = useState(0)
  const [sound, setSound] = useState(false)

  useEffect(() => {
    setOpen(state !== 'normal')
    setRun((r) => r + 1)
  }, [state])

  const replay = () => {
    setOpen(true)
    setRun((r) => r + 1)
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white">
      <BurstStage
        key={run}
        active={open}
        reduced={state === 'reduced-motion'}
        sound={sound}
        config={{ eventTitle, discountText, discountNote, eventDate, ctaText, brandColor }}
        onCta={onCta}
        onClosed={() => setOpen(false)}
      />

      {/* Preview-only controls: not part of the installed widget */}
      <div className="absolute bottom-4 left-4 z-[100] flex items-center gap-1 rounded-full bg-ink/90 p-1 text-white shadow-lg ring-1 ring-white/10">
        <button
          onClick={replay}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 hover:bg-white/10"
        >
          <RotateCcw className="size-4" /> Replay
        </button>
        <button
          onClick={() => setSound((s) => !s)}
          aria-pressed={sound}
          aria-label={sound ? 'Mute sound' : 'Enable sound'}
          className="grid size-9 place-items-center rounded-full transition-colors duration-150 hover:bg-white/10"
        >
          {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4 text-white/60" />}
        </button>
      </div>
    </div>
  )
}
