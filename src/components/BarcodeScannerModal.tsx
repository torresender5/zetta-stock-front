import { useEffect, useRef, useState } from 'react'
import { Loader2, RefreshCw, ScanBarcode } from 'lucide-react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import Modal from './Modal'

interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
  /** Se emite con el código detectado; el padre cierra el modal. */
  onDetected: (code: string) => void | Promise<void>
  title?: string
}

interface DetectedBarcode {
  rawValue: string
}

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128']

const ZXING_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
]

const isTouchDevice =
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0)

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
  title = 'Escanear código de barras',
}: BarcodeScannerModalProps) {
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [manual, setManual] = useState('')
  const [facing, setFacing] = useState<'environment' | 'user'>(isTouchDevice ? 'environment' : 'user')

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const rafRef = useRef(0)
  const doneRef = useRef(false)
  const onDetectedRef = useRef(onDetected)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  const emit = (code: string) => {
    const trimmed = code.trim()
    if (!trimmed || doneRef.current) return
    doneRef.current = true
    void onDetectedRef.current(trimmed)
  }

  useEffect(() => {
    if (isOpen) {
      doneRef.current = false
      setManual('')
      setCameraError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    const start = async () => {
      setStarting(true)
      setCameraError(null)
      setScanning(false)
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error('sin camara'), { name: 'NotFoundError' })
        }
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
        if (!video) return
        video.srcObject = stream
        await video.play().catch(() => {})
        if (cancelled) return

        setStarting(false)
        setScanning(true)

        const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
        if (Detector) {
          const detector = new Detector({ formats: BARCODE_FORMATS })
          const loop = async () => {
            if (cancelled || doneRef.current) return
            if (video.readyState >= 2 && video.videoWidth > 0) {
              try {
                const codes = await detector.detect(video)
                if (!cancelled && codes.length > 0 && codes[0].rawValue) {
                  emit(codes[0].rawValue)
                  return
                }
              } catch {
                // frame no procesable, se reintenta
              }
            }
            if (!cancelled) rafRef.current = requestAnimationFrame(loop)
          }
          rafRef.current = requestAnimationFrame(loop)
        } else {
          const hints = new Map<DecodeHintType, unknown>()
          hints.set(DecodeHintType.POSSIBLE_FORMATS, ZXING_FORMATS)
          const reader = new BrowserMultiFormatReader(hints)
          const controls = await reader.decodeFromStream(stream, video, (result) => {
            if (result && !cancelled) emit(result.getText())
          })
          if (cancelled) {
            controls.stop()
            return
          }
          controlsRef.current = controls
        }
      } catch (err) {
        if (cancelled) return
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setCameraError('Permiso de cámara denegado. Digita el código de barras manualmente.')
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setCameraError('No se encontró una cámara disponible. Digita el código de barras manualmente.')
        } else {
          setCameraError('No se pudo acceder a la cámara. Digita el código de barras manualmente.')
        }
        setStarting(false)
        setScanning(false)
      }
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      controlsRef.current?.stop()
      controlsRef.current = null
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      setScanning(false)
    }
  }, [isOpen, facing])

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault()
    emit(manual)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <div className="relative w-full h-80 bg-black rounded-2xl overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
          {!cameraError && scanning && (
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-24 rounded-lg border-2 border-violet-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"
            />
          )}
          {!cameraError && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none">
              {starting ? (
                <span className="flex items-center gap-2 text-sm text-white/80 bg-black/50 px-3 py-1.5 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando cámara...
                </span>
              ) : (
                scanning && (
                  <span className="text-sm text-white/80 bg-black/50 px-3 py-1.5 rounded-lg">
                    Apunta al código de barras
                  </span>
                )
              )}
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{cameraError}</div>
        )}

        <form onSubmit={submitManual} className="flex gap-2">
          <input
            type="text"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="O digita el código de barras..."
            inputMode="numeric"
            autoComplete="off"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
          />
          <button
            type="submit"
            disabled={!manual.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ScanBarcode className="w-4 h-4" />
            Usar código
          </button>
        </form>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
            disabled={starting || !!cameraError}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Voltear cámara
          </button>
        </div>
      </div>
    </Modal>
  )
}
