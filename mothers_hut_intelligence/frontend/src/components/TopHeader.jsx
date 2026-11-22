import React from 'react'
import { Menu, UtensilsCrossed, CheckCircle2 } from 'lucide-react'

export default function TopHeader({ onOpenMenu, visionOnline }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#EAE3D9] bg-[#FAF7F2]/95 px-4 sm:px-6 py-3.5 backdrop-blur-sm">
      <div className="flex w-full items-center justify-between">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onOpenMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#63131B] text-white shadow-sm transition hover:bg-[#4D0E14]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E9E6] text-[#63131B]">
            <UtensilsCrossed className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#63131B]">
              MOTHER&apos;S HUT INTELLIGENCE WORKSPACE
            </p>
            <p className="text-xs text-[#6F5E60]">
              Autonomous Computer Vision &amp; Sentiment Verification
            </p>
          </div>
        </div>

        {/* Right: Vision Online Pill + Avatar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[#D4ECE0] bg-[#EFFAF4] px-3.5 py-1.5 text-xs font-medium text-[#15803D]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{visionOnline ? 'Vision Online' : 'Backend Offline'}</span>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#63131B] text-xs font-bold text-white shadow-sm">
            M
          </div>
        </div>
      </div>
    </header>
  )
}
