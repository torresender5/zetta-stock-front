import { useEffect, useState } from 'react'

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const listener = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])

  return reducedMotion
}
