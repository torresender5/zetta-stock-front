import { useEffect, useRef, useState } from 'react'
import { Camera, FileImage, Loader2, RefreshCw, Upload, X } from 'lucide-react'
import Modal from './Modal'

interface ProductImageInputProps {
  value: string | null
  onChange: (file: File | null) => void
  onClearImage?: () => void
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

export default function ProductImageInput({ value, onChange, onClearImage }: ProductImageInputProps) {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
  const hasCamera = !!navigator.mediaDevices?.getUserMedia

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(value)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [facing, setFacing] = useState<'environment' | 'user'>(isTouchDevice ? 'environment' : 'user')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const selectFile = (f: File | null) => {
    if (f && !f.type.startsWith('image/')) return
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
    onChange(f)
  }

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    onChange(null)
    onClearImage?.()
  }

  useEffect(() => {
    if (!cameraOpen) return
    let cancelled = false
    const start = async () => {
      setStarting(true)
      setCameraError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
        }
      } catch (err) {
        if (cancelled) return
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setCameraError('Permiso de cámara denegado. Usa la galería o el selector de archivos.')
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setCameraError('No se encontró una cámara disponible. Usa la galería o el selector de archivos.')
        } else {
          setCameraError('No se pudo acceder a la cámara. Usa la galería o el selector de archivos.')
        }
      } finally {
        if (!cancelled) setStarting(false)
      }
    }
    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [cameraOpen, facing])

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return
    setCapturing(true)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setCapturing(false)
      return
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          selectFile(new File([blob], 'producto.jpg', { type: 'image/jpeg' }))
        }
        setCapturing(false)
        setCameraOpen(false)
      },
      'image/jpeg',
      0.9
    )
  }

  const dropCardClass = preview
    ? 'border-violet-300 bg-violet-50/30'
    : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/30'

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const dropped = e.dataTransfer.files?.[0]
          if (dropped && dropped.type.startsWith('image/')) {
            selectFile(dropped)
          }
        }}
        className={`relative flex flex-col items-center justify-center w-full min-h-[180px] rounded-2xl border-2 border-dashed transition-all cursor-pointer ${dropCardClass}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-40 rounded-xl object-contain" />
            <div className="flex items-center gap-3 mt-3">
              {hasCamera && (
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Tomar otra foto
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Cambiar
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
              <Upload className="w-5 h-5 text-violet-500" />
            </div>
            <div className="text-center mt-2">
              <p className="text-sm font-medium text-gray-700">Arrastra una imagen aquí</p>
              <p className="text-xs text-gray-400 mt-0.5">o usa una de las opciones</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {hasCamera && (
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Tomar foto
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-violet-600 bg-violet-100 rounded-xl hover:bg-violet-200 transition-colors"
              >
                <FileImage className="w-3.5 h-3.5" />
                {isTouchDevice ? 'Seleccionar de galería' : 'Seleccionar archivo'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">JPG, PNG, WebP o GIF. Max 5MB.</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={(e) => {
            const selected = e.target.files?.[0] ?? null
            selectFile(selected)
            e.target.value = ''
          }}
          className="hidden"
        />
      </div>

      <Modal isOpen={cameraOpen} onClose={() => setCameraOpen(false)} title="Tomar foto" size="md">
        <div className="space-y-4">
          <div className="relative w-full h-80 bg-black rounded-2xl overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
            {!cameraError && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {starting ? (
                  <span className="flex items-center gap-2 text-sm text-white/70">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando cámara...
                  </span>
                ) : (
                  videoRef.current && videoRef.current.videoWidth === 0 && (
                    <span className="flex items-center gap-2 text-sm text-white/70">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Preparando cámara...
                    </span>
                  )
                )}
              </div>
            )}
          </div>
          {cameraError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{cameraError}</div>
          )}
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
              disabled={starting || !!cameraError}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Voltear cámara
            </button>
            <button
              type="button"
              onClick={capture}
              disabled={starting || capturing || !!cameraError}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {capturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              Capturar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}