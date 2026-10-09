import { useEffect, useRef } from 'react'

/** Tiempo máximo promedio entre teclas para considerar un escaneo wedge (ms). */
const MAX_KEY_INTERVAL = 50
/** Longitud mínima de un código escaneado con escáner wedge. */
const MIN_CODE_LENGTH = 4
/** Si la pausa entre teclas supera esto, se reinicia el buffer (escritura manual). */
const MAX_GAP = 400

/**
 * Escáner de barras Bluetooth/USB (wedge): bufferiza los `keydown` globales y
 * dispara `onScan(code)` cuando detecta una secuencia rápida de ≥4 caracteres
 * terminada en Enter (típico de un escáner que simula teclado).
 *
 * Se activa solo cuando `enabled` es true, es decir, cuando el botón
 * "Escanear" de ese contexto está disponible.
 */
export function useBarcodeWedge(onScan: (code: string) => void, enabled = true) {
  const onScanRef = useRef(onScan)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!enabled) return

    let buffer = ''
    let firstTime = 0
    let lastTime = 0

    const reset = () => {
      buffer = ''
      firstTime = 0
      lastTime = 0
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === 'Enter') {
        const now = performance.now()
        const intervals = buffer.length - 1
        const avg = intervals > 0 ? (lastTime - firstTime) / intervals : Number.POSITIVE_INFINITY
        const fastEnough = avg < MAX_KEY_INTERVAL && now - lastTime < MAX_KEY_INTERVAL
        if (buffer.length >= MIN_CODE_LENGTH && fastEnough) {
          e.preventDefault()
          e.stopPropagation()
          const code = buffer
          reset()
          onScanRef.current(code)
          return
        }
        reset()
        return
      }

      if (e.key.length !== 1) {
        reset()
        return
      }

      const now = performance.now()
      if (buffer.length > 0 && now - lastTime > MAX_GAP) reset()
      if (buffer.length === 0) firstTime = now
      buffer += e.key
      lastTime = now
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      reset()
    }
  }, [enabled])
}
