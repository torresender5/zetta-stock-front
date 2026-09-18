import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, ChevronDown } from 'lucide-react'
import type { Product } from '../types'

interface ProductSelectProps {
  value: string
  onChange: (productId: string) => void
  products: Product[]
}

const stockClass = (stock: number) =>
  stock === 0
    ? 'bg-red-50 text-red-600'
    : stock < 10
      ? 'bg-amber-50 text-amber-600'
      : 'bg-emerald-50 text-emerald-600'

const DROPDOWN_HEIGHT = 240
const GAP = 8

export function ProductSelect({ value, onChange, products }: ProductSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const catalog = useMemo(() => products.filter((p) => p.stock > 0), [products])
  const selectedProduct = useMemo(() => products.find((p) => p.id === value) ?? null, [products, value])

  const trimmed = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!trimmed) return catalog
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(trimmed) ||
        p.code.toLowerCase().includes(trimmed) ||
        p.sku.toLowerCase().includes(trimmed)
    )
  }, [catalog, trimmed])

  const inputValue = open ? query : selectedProduct?.name ?? ''

  const updatePos = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom - GAP
    const top =
      spaceBelow >= DROPDOWN_HEIGHT || spaceBelow >= rect.top
        ? rect.bottom + GAP
        : Math.max(GAP, rect.top - DROPDOWN_HEIGHT - GAP)
    setPos({ top, left: rect.left, width: rect.width })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePos()
    const onMove = () => updatePos()
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
      setActiveIndex(-1)
    }
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [open, updatePos])

  const selectProduct = (p: Product) => {
    onChange(p.id)
    setQuery(p.name)
    setActiveIndex(-1)
    setOpen(false)
  }

  const moveIndex = (direction: 1 | -1) => {
    if (!open) {
      setOpen(true)
      return
    }
    setActiveIndex((prev) => {
      if (filtered.length === 0) return -1
      if (prev === -1) return direction === 1 ? 0 : filtered.length - 1
      return (prev + direction + filtered.length) % filtered.length
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        moveIndex(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        moveIndex(-1)
        break
      case 'Enter':
        if (open && activeIndex >= 0) {
          e.preventDefault()
          selectProduct(filtered[activeIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  const clearSelection = () => {
    onChange('')
    setQuery('')
    setActiveIndex(-1)
    setOpen(true)
  }

  const dropdown =
    open && pos
      ? createPortal(
          <div
            ref={panelRef}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className="fixed z-[70] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-modal-in"
          >
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">Sin productos disponibles</p>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                {filtered.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === i}
                    onClick={() => selectProduct(p)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                      activeIndex === i ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium truncate">{p.name}</span>
                      <span className="block text-xs text-gray-400 font-mono truncate">
                        {p.code}
                        {p.sku ? ` · ${p.sku}` : ''}
                      </span>
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold shrink-0 ${stockClass(p.stock)}`}>
                      Stock: {p.stock}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body
        )
      : null

  return (
    <div ref={anchorRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label="Buscar producto"
          value={inputValue}
          placeholder="Buscar producto..."
          onFocus={() => {
            setOpen(true)
            setQuery(selectedProduct?.name ?? '')
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
        {selectedProduct && !open ? (
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Quitar selección"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
      </div>
      {dropdown}
    </div>
  )
}