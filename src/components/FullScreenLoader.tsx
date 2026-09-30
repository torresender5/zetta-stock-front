import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'

interface FullScreenLoaderProps {
  loading: boolean
  text?: string
}

export default function FullScreenLoader({ loading, text = 'Cargando...' }: FullScreenLoaderProps) {
  useEffect(() => {
    if (!loading) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [loading])

  if (!loading) return null

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm animate-overlay-in"
    >
      <Loader2 className="w-8 h-8 animate-spin text-white" aria-hidden="true" />
      <p className="text-sm font-medium text-white">{text}</p>
    </div>,
    document.body,
  )
}
