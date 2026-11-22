import React, { useState, useRef, useEffect } from 'react'
import {
  Upload,
  Video,
  Camera,
  Zap,
  Utensils,
  ChevronRight,
  Loader2,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  StopCircle,
  ScanLine,
} from 'lucide-react'

const SATISFACTION_BADGE = {
  satisfied: {
    label: 'Satisfied',
    cls: 'border-[#BBF7D0] bg-[#ECFDF5] text-[#15803D]',
  },
  unsatisfied: {
    label: 'Unsatisfied',
    cls: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]',
  },
  none: {
    label: 'Satisfaction: None',
    cls: 'border-[#E5E7EB] bg-[#F3F4F6] text-[#4B5563]',
  },
}

const PLATE_LABELS = {
  full_plate: 'Full Plate (Not Started)',
  waste_plate: 'Waste Plate (Left Food)',
  empty_plate: 'Empty Plate (Finished)',
}

const FACE_LABELS = {
  happy: 'Happy Face',
  normal: 'Normal Face',
  angry: 'Angry Face',
}

export default function MealVerifier({ onScanComplete }) {
  const [inputMode, setInputMode] = useState('image') // 'image' | 'media'
  const [mediaSubMode, setMediaSubMode] = useState('video') // 'video' | 'webcam'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // Webcam state
  const [webcamActive, setWebcamActive] = useState(false)
  const [autoScanWebcam, setAutoScanWebcam] = useState(true)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)

  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  useEffect(() => {
    if (!webcamActive || !autoScanWebcam) return
    const timer = setInterval(() => {
      captureAndAnalyzeWebcam(false)
    }, 3500)
    return () => clearInterval(timer)
  }, [webcamActive, autoScanWebcam])

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setWebcamActive(false)
  }

  const startWebcam = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setWebcamActive(true)
    } catch (err) {
      setError('Could not access webcam. Please allow camera permissions.')
    }
  }

  const captureAndAnalyzeWebcam = async (recordMetrics = true) => {
    if (!videoRef.current || !canvasRef.current || loading) return
    const video = videoRef.current
    if (video.videoWidth === 0) return

    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      async (blob) => {
        if (!blob) return
        const formData = new FormData()
        formData.append('file', blob, 'webcam_frame.jpg')

        setLoading(true)
        try {
          const res = await fetch(
            `/api/analyze/image?record_metrics=${recordMetrics}`,
            {
              method: 'POST',
              body: formData,
            }
          )
          const data = await res.json()
          if (!res.ok) throw new Error(data.detail || 'Webcam scan failed')
          setResult(data)
          if (recordMetrics && onScanComplete) onScanComplete()
        } catch (err) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      },
      'image/jpeg',
      0.85
    )
  }

  const handleImageFile = async (file) => {
    if (!file) return
    setError('')
    setPreviewUrl(URL.createObjectURL(file))
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/analyze/image?record_metrics=true', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Image analysis failed')
      setResult(data)
      if (onScanComplete) onScanComplete()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoFile = async (file) => {
    if (!file) return
    setError('')
    setPreviewUrl(null)
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/analyze/video', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Video analysis failed')
      setResult(data)
      if (onScanComplete) onScanComplete()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runPresetScenario = async (scenario) => {
    setError('')
    setPreviewUrl(null)
    setLoading(true)
    try {
      const res = await fetch('/api/analyze/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Scenario test failed')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const overallSat = result?.summary?.overall_satisfaction || 'none'
  const overallBadge = SATISFACTION_BADGE[overallSat] || SATISFACTION_BADGE.none

  return (
    <div className="w-full px-4 sm:px-6 py-8">
      {/* Header matching Screenshot 2026-11-21 195039 */}
      <div className="mb-7">
        <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#63131B]">
          <Utensils className="h-3.5 w-3.5" />
          <span>COMPUTER VISION INTELLIGENCE</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#63131B] sm:text-4xl">
          Meal Verifier &amp; Customer Sentiment
        </h1>
        <p className="mt-1.5 text-sm text-[#6F5E60]">
          Automated plate fullness heuristic analysis combined with facial emotion
          recognition. Correlates dining satisfaction and alerts floor managers in
          real-time.
        </p>
      </div>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT CARD: Input & Controls */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm lg:col-span-6">
          <div>
            {/* Mode Switcher + Auto-Analysis Badge */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    stopWebcam()
                    setInputMode('image')
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    inputMode === 'image'
                      ? 'bg-[#63131B] text-white shadow-sm'
                      : 'text-[#6F5E60] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  Image Upload
                </button>

                <button
                  onClick={() => setInputMode('media')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    inputMode === 'media'
                      ? 'bg-[#63131B] text-white shadow-sm'
                      : 'text-[#6F5E60] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  Video / Webcam
                </button>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-xs font-medium text-[#B45309]">
                <Zap className="h-3 w-3 fill-amber-500 text-amber-500" />
                Auto-Analysis Enabled
              </span>
            </div>

            {/* IMAGE UPLOAD MODE */}
            {inputMode === 'image' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files?.[0]
                  if (f) handleImageFile(f)
                }}
                className="flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2D8CE] bg-[#FCFBF9] p-6 text-center transition hover:border-[#63131B]/50 hover:bg-[#FAF7F2]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageFile(e.target.files?.[0])}
                />
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EBEB] text-[#63131B]">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-[#2A181A]">
                  Click or drag and drop guest dining image
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[#D97706]">
                  <Zap className="h-3 w-3" />
                  Automatically analyzes as soon as you upload
                </p>
              </div>
            )}

            {/* VIDEO / WEBCAM MODE */}
            {inputMode === 'media' && (
              <div className="space-y-4">
                <div className="flex gap-2 rounded-xl bg-[#FAF7F2] p-1">
                  <button
                    onClick={() => {
                      stopWebcam()
                      setMediaSubMode('video')
                    }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                      mediaSubMode === 'video'
                        ? 'bg-white text-[#63131B] shadow-sm'
                        : 'text-[#6F5E60]'
                    }`}
                  >
                    Upload Video File
                  </button>
                  <button
                    onClick={() => setMediaSubMode('webcam')}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                      mediaSubMode === 'webcam'
                        ? 'bg-white text-[#63131B] shadow-sm'
                        : 'text-[#6F5E60]'
                    }`}
                  >
                    Live Webcam Stream
                  </button>
                </div>

                {mediaSubMode === 'video' ? (
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2D8CE] bg-[#FCFBF9] p-6 text-center transition hover:border-[#63131B]/50"
                  >
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleVideoFile(e.target.files?.[0])}
                    />
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EBEB] text-[#63131B]">
                      <Video className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-[#2A181A]">
                      Click to upload dining room video (.mp4, .mov, .webm)
                    </p>
                    <p className="mt-1 text-xs text-[#6F5E60]">
                      Samples key frames and detects all plates &amp; faces
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-[#EAE3D9] bg-[#FCFBF9] p-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-[#1E1415]">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                      {!webcamActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/75">
                          <Camera className="mb-2 h-8 w-8" />
                          <p className="text-xs">Camera preview inactive</p>
                        </div>
                      )}
                    </div>
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {!webcamActive ? (
                        <button
                          onClick={startWebcam}
                          className="flex items-center gap-1.5 rounded-xl bg-[#63131B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4D0E14]"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Start Live Camera
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => captureAndAnalyzeWebcam(true)}
                            className="flex items-center gap-1.5 rounded-xl bg-[#63131B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#4D0E14]"
                          >
                            <ScanLine className="h-3.5 w-3.5" />
                            Scan Now
                          </button>
                          <button
                            onClick={stopWebcam}
                            className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-semibold text-[#4B5563] hover:bg-gray-50"
                          >
                            <StopCircle className="h-3.5 w-3.5" />
                            Stop
                          </button>
                        </div>
                      )}

                      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[#6F5E60]">
                        <input
                          type="checkbox"
                          checked={autoScanWebcam}
                          onChange={(e) => setAutoScanWebcam(e.target.checked)}
                          className="accent-[#63131B]"
                        />
                        Auto-scan every 3.5s
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pre-configured dining scenarios matching Screenshot 2026-11-21 195039 */}
            <div className="mt-6">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6F5E60]">
                OR TEST A PRE-CONFIGURED DINING SCENARIO:
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  onClick={() => runPresetScenario('full_plate')}
                  className="flex items-center justify-between rounded-xl border border-[#EAE3D9] bg-white px-3.5 py-2.5 text-left text-xs font-medium text-[#2A181A] transition hover:border-[#63131B]/40 hover:bg-[#FAF7F2]"
                >
                  <span>Full Dining Plate (None - Not Started)</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
                </button>

                <button
                  onClick={() => runPresetScenario('empty_plate')}
                  className="flex items-center justify-between rounded-xl border border-[#EAE3D9] bg-white px-3.5 py-2.5 text-left text-xs font-medium text-[#2A181A] transition hover:border-[#63131B]/40 hover:bg-[#FAF7F2]"
                >
                  <span>Empty Cleared Plate (Satisfied - Finished)</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
                </button>

                <button
                  onClick={() => runPresetScenario('waste_plate')}
                  className="flex items-center justify-between rounded-xl border border-[#EAE3D9] bg-white px-3.5 py-2.5 text-left text-xs font-medium text-[#2A181A] transition hover:border-[#63131B]/40 hover:bg-[#FAF7F2] sm:col-span-2"
                >
                  <span>Finished / Food Waste (Unsatisfied)</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom status pill */}
          <div className="mt-6 border-t border-[#F1ECE4] pt-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D1FAE5] bg-[#ECFDF5] px-3.5 py-1 text-xs font-medium text-[#059669]">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              Instant Auto-Detection Active
            </span>
          </div>
        </div>

        {/* RIGHT CARD: Intelligence Outcome */}
        <div className="flex flex-col rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm lg:col-span-6">
          <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-4">
            <h2 className="font-serif text-xl font-bold text-[#63131B]">
              Intelligence Outcome
            </h2>
            <span className="rounded-full bg-[#F7ECEC] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#63131B]">
              CORRELATION V1.0
            </span>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
              <Loader2 className="mb-3 h-9 w-9 animate-spin text-[#63131B]" />
              <p className="text-sm font-semibold text-[#2A181A]">
                Analyzing plates &amp; facial expressions...
              </p>
              <p className="mt-1 text-xs text-[#6F5E60]">
                Running computer vision &amp; Gemini semantic verification
              </p>
            </div>
          ) : !result ? (
            /* Idle State matching Screenshot 2026-11-21 195039 */
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
              <Utensils className="mb-3 h-9 w-9 text-[#D1C7BE]" />
              <p className="text-sm font-semibold text-[#6F5E60]">
                Ready for Automatic Scanning
              </p>
              <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[#9C8E90]">
                Upload an image/video or start the live camera. The computer vision
                pipeline will automatically analyze the dining state in real-time.
              </p>
            </div>
          ) : (
            /* Active Detection Outcome */
            <div className="mt-4 space-y-4 overflow-y-auto">
              {/* Annotated Image Preview */}
              {(result.annotated_image || previewUrl) && (
                <div className="overflow-hidden rounded-xl border border-[#EAE3D9] bg-[#1E1415]">
                  <img
                    src={result.annotated_image || previewUrl}
                    alt="Annotated Dining Detection"
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              )}

              {result.scenario_note && (
                <div className="rounded-xl border border-[#EAE3D9] bg-[#FAF7F2] px-3.5 py-2.5 text-xs font-medium text-[#2A181A]">
                  {result.scenario_note}
                </div>
              )}

              {/* Summary Strip */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-[#EAE3D9] bg-[#FAF7F2] p-3">
                  <p className="text-[11px] font-semibold uppercase text-[#6F5E60]">
                    Plates Detected
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-[#63131B]">
                    {result.summary?.total_plates ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-[#EAE3D9] bg-[#FAF7F2] p-3">
                  <p className="text-[11px] font-semibold uppercase text-[#6F5E60]">
                    Faces Detected
                  </p>
                  <p className="mt-0.5 text-2xl font-bold text-[#63131B]">
                    {result.summary?.total_faces ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-[#EAE3D9] bg-[#FAF7F2] p-3">
                  <p className="text-[11px] font-semibold uppercase text-[#6F5E60]">
                    Overall State
                  </p>
                  <span
                    className={`mt-1.5 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${overallBadge.cls}`}
                  >
                    {overallBadge.label}
                  </span>
                </div>
              </div>

              {/* Individual Plates List (1, 2, 3... N) */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6F5E60]">
                  Detected Plates ({result.plates?.length || 0})
                </h3>
                {result.plates?.length ? (
                  <div className="space-y-2">
                    {result.plates.map((p, i) => {
                      const badge =
                        SATISFACTION_BADGE[p.satisfaction] || SATISFACTION_BADGE.none
                      return (
                        <div
                          key={`${p.id}-${i}`}
                          className="flex items-center justify-between rounded-xl border border-[#EAE3D9] bg-[#FCFBF9] px-3.5 py-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            {p.state === 'empty_plate' && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            )}
                            {p.state === 'waste_plate' && (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                            {p.state === 'full_plate' && (
                              <Clock className="h-4 w-4 text-amber-600" />
                            )}
                            <div>
                              <p className="font-semibold text-[#2A181A]">
                                {p.id} — {PLATE_LABELS[p.state] || p.state}
                              </p>
                              <p className="text-[11px] text-[#6F5E60]">
                                Confidence: {Math.round((p.confidence || 0) * 100)}%
                              </p>
                            </div>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#9C8E90]">No plates detected in frame.</p>
                )}
              </div>

              {/* Individual Faces List */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6F5E60]">
                  Detected Human Faces ({result.faces?.length || 0})
                </h3>
                {result.faces?.length ? (
                  <div className="space-y-2">
                    {result.faces.map((f, i) => {
                      const badge =
                        SATISFACTION_BADGE[f.satisfaction] || SATISFACTION_BADGE.none
                      return (
                        <div
                          key={`${f.id}-${i}`}
                          className="flex items-center justify-between rounded-xl border border-[#EAE3D9] bg-[#FCFBF9] px-3.5 py-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            {f.expression === 'happy' && (
                              <Smile className="h-4 w-4 text-emerald-600" />
                            )}
                            {f.expression === 'angry' && (
                              <Frown className="h-4 w-4 text-red-600" />
                            )}
                            {f.expression === 'normal' && (
                              <Meh className="h-4 w-4 text-slate-500" />
                            )}
                            <div>
                              <p className="font-semibold text-[#2A181A]">
                                {f.id} — {FACE_LABELS[f.expression] || f.expression}
                              </p>
                              <p className="text-[11px] text-[#6F5E60]">
                                Confidence: {Math.round((f.confidence || 0) * 100)}%
                              </p>
                            </div>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#9C8E90]">No human faces visible in frame.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
