import React from 'react'
import { UtensilsCrossed, BarChart3, LogOut, X, Home } from 'lucide-react'

export default function SidebarDrawer({ isOpen, onClose, activeTab, onSelectTab }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Maroon Sidebar matching Screenshot (129) & 195106 */}
      <aside className="relative z-10 flex w-72 flex-col justify-between bg-[#63131B] text-white shadow-2xl">
        <div>
          {/* Top close button */}
          <div className="flex justify-end p-4">
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/75 hover:bg-white/10 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Brand Emblem */}
          <div className="flex flex-col items-center px-6 pb-8 pt-1 text-center">
            <div className="mb-3 flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-[#FAF7F2] text-[#63131B] shadow-md">
              <Home className="h-6 w-6 text-[#B86B2B]" />
              <span className="mt-0.5 font-serif text-[7px] font-bold tracking-wider">
                MOTHER&apos;S
              </span>
              <span className="font-serif text-[7px] font-bold tracking-wider">
                HUT
              </span>
            </div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-white">
              Mother&apos;s Hut
            </h2>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F5C451]">
              • INTELLIGENCE •
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2 px-4">
            <button
              onClick={() => {
                onSelectTab('verifier')
                onClose()
              }}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === 'verifier'
                  ? 'bg-[#F5C451] font-semibold text-[#2A181A] shadow-sm'
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <UtensilsCrossed className="h-4 w-4" />
                Meal Verifier
              </span>
              {activeTab === 'verifier' && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#63131B]" />
              )}
            </button>

            <button
              onClick={() => {
                onSelectTab('overview')
                onClose()
              }}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeTab === 'overview'
                  ? 'bg-[#F5C451] font-semibold text-[#2A181A] shadow-sm'
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4" />
                Restaurant Overview
              </span>
              {activeTab === 'overview' && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#63131B]" />
              )}
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-white/15 px-6 py-5">
          <button
            onClick={onClose}
            className="flex items-center gap-2.5 text-sm text-white/80 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          <p className="mt-4 text-[11px] text-white/45">
            NH-12, Krishnanagar · Est. 2013
          </p>
        </div>
      </aside>
    </div>
  )
}
