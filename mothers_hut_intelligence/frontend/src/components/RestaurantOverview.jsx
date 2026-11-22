import React from 'react'
import {
  Users,
  Smile,
  Frown,
  Utensils,
  Trash2,
  AlertTriangle,
  Check,
  ArrowRight,
  Sparkles,
  Clock,
} from 'lucide-react'

export default function RestaurantOverview({ data, onResolveAlert, onLaunchVerifier }) {
  const overview = data || {
    total_faces: 96,
    total_happy_faces: 19,
    satisfaction_ratio: 20,
    total_plates: 94,
    total_plate_waste: 36,
    waste_ratio: 38,
    unresolved_count: 3,
    alerts: [],
  }

  return (
    <div className="w-full px-4 sm:px-6 py-8">
      {/* Page Title matching Screenshot 2026-11-21 195140 */}
      <div className="mb-7">
        <h1 className="font-serif text-3xl font-bold text-[#63131B] sm:text-4xl">
          Restaurant Overview
        </h1>
        <p className="mt-1.5 text-sm text-[#6F5E60]">
          Real-time daily computer vision intelligence: total faces scanned, customer
          happiness index, total plates, and plate waste monitoring.
        </p>
      </div>

      {/* 3-Column Bento Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Total Faces + Total Happy Face */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Total Faces Card */}
          <div className="relative overflow-hidden rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#63131B]">
                <Users className="h-3.5 w-3.5" />
                TOTAL FACES
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3E8FF] text-[#6B21A8]">
                <Users className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2.5">
              <span className="text-4xl font-bold text-[#2A181A]">
                {overview.total_faces}
              </span>
              <span className="text-xs font-semibold text-[#16A34A]">↗ Today</span>
            </div>
            <p className="mt-1 text-xs text-[#8C7A7C]">Total faces scanned in a day</p>

            <button
              onClick={onLaunchVerifier}
              className="mt-5 flex w-full items-center justify-between border-t border-[#F3EFEA] pt-3 text-xs font-semibold text-[#63131B] hover:opacity-80"
            >
              <span>Scan New Face / Meal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Total Happy Face Card */}
          <div className="relative overflow-hidden rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#15803D]">
                <Smile className="h-3.5 w-3.5" />
                TOTAL HAPPY FACE
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
                <Smile className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <span className="text-4xl font-bold text-[#15803D]">
                {overview.total_happy_faces}
              </span>
              <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#15803D]">
                {overview.satisfaction_ratio}% Satisfaction
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8C7A7C]">Total detected happy in a day</p>

            <div className="mt-5 flex items-center justify-between border-t border-[#F3EFEA] pt-3 text-xs">
              <span className="flex items-center gap-1 text-[#6F5E60]">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Gemini Vision Sentiment
              </span>
              <span className="font-semibold text-[#15803D]">Optimal</span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Unhappy Guests Detected */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm lg:col-span-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
                  <Frown className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#63131B]">
                    Unhappy Guests Detected
                  </h2>
                  <p className="text-[11px] text-[#8C7A7C]">
                    Names &amp; tables flagged with negative sentiment by Computer Vision
                    today
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-1 text-xs font-semibold text-[#DC2626]">
                <AlertTriangle className="h-3 w-3" />
                {overview.unresolved_count} Unresolved
              </span>
            </div>

            <div className="space-y-3">
              {overview.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3.5 transition ${
                    alert.resolved
                      ? 'border-gray-200 bg-gray-50 opacity-60'
                      : 'border-[#FDE2E2] bg-[#FFF9F9]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-xs font-bold text-[#991B1B]">
                      {alert.initials}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#2A181A]">
                          {alert.guest_name}
                        </span>
                        <span className="rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-bold text-[#92400E]">
                          {alert.table}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[#8C7A7C]">
                          <Clock className="h-3 w-3" />
                          {alert.time}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[#DC2626]">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{alert.reason}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={alert.resolved}
                    onClick={() => onResolveAlert(alert.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                      alert.resolved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#63131B] text-white hover:bg-[#4D0E14]'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {alert.resolved ? 'Resolved' : 'Resolve'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#F3EFEA] pt-4 text-xs">
            <span className="text-[#8C7A7C]">
              Alerts automatically generated on Angry Face + Waste Plate condition
            </span>
            <button
              onClick={onLaunchVerifier}
              className="flex items-center gap-1 font-semibold text-[#63131B] hover:underline"
            >
              Launch Verifier <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Total Plates + Total Plate Waste */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Total Plates Card */}
          <div className="relative overflow-hidden rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#63131B]">
                <Utensils className="h-3.5 w-3.5" />
                TOTAL PLATES
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4338CA]">
                <Utensils className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2.5">
              <span className="text-4xl font-bold text-[#2A181A]">
                {overview.total_plates}
              </span>
              <span className="text-xs font-semibold text-[#2563EB]">↗ Today</span>
            </div>
            <p className="mt-1 text-xs text-[#8C7A7C]">Total plates scanned in a day</p>

            <button
              onClick={onLaunchVerifier}
              className="mt-5 flex w-full items-center justify-between border-t border-[#F3EFEA] pt-3 text-xs font-semibold text-[#2563EB] hover:opacity-80"
            >
              <span>YOLO + Gemini Detections</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Total Plate Waste Card */}
          <div className="relative overflow-hidden rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#DC2626]">
                <Trash2 className="h-3.5 w-3.5" />
                TOTAL PLATE WASTE
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEF2F2] text-[#DC2626]">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <span className="text-4xl font-bold text-[#DC2626]">
                {overview.total_plate_waste}
              </span>
              <span className="rounded-full bg-[#FEE2E2] px-2.5 py-0.5 text-[11px] font-semibold text-[#DC2626]">
                {overview.waste_ratio}% Waste Ratio
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8C7A7C]">
              Plates scanned with leftover food
            </p>

            <div className="mt-5 flex items-center justify-between border-t border-[#F3EFEA] pt-3 text-[11px]">
              <span className="font-semibold text-[#DC2626]">Leftover threshold</span>
              <span className="text-[#8C7A7C]">20% – 65% remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* Portal Footer matching Screenshot 2026-11-21 195140 */}
      <footer className="mt-12 text-center text-xs text-[#8C7A7C]">
        Mother&apos;s Hut Guest Portal · NH-12, Krishnanagar · Est. 2013
      </footer>
    </div>
  )
}
