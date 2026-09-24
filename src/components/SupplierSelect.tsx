import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Plus, X, ChevronDown, Loader2 } from 'lucide-react'
import { useSupplierStore } from '../stores/supplierStore'
import Modal from './Modal'
import type { Supplier } from '../types'

interface SupplierSelectProps {
  value: string
  onChange: (supplierId: string) => void
}

const emptyForm = { name: '', document: '', email: '', phone: '', address: '' }

export function SupplierSelect({ value, onChange }: SupplierSelectProps) {
  const { allSuppliers, loading, addSupplier, error } = useSupplierStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedSupplier = useMemo(
    () => allSuppliers.find((s) => s.id === value) ?? null,
    [allSuppliers, value]
  )

  const trimmed = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!trimmed) return allSuppliers
    return allSuppliers.filter(
      (s) => s.name.toLowerCase().includes(trimmed) || s.document.toLowerCase().includes(trimmed)
    )
  }, [allSuppliers, trimmed])

  const showCreate = trimmed.length > 0 && filtered.length === 0
  const totalOptions = filtered.length + (showCreate ? 1 : 0)
  const inputValue = open ? query : selectedSupplier?.name ?? ''

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectSupplier = (supplier: Supplier) => {
    onChange(supplier.id)
    setQuery(supplier.name)
    setActiveIndex(-1)
    setOpen(false)
  }

  const openCreate = () => {
    setForm(emptyForm)
    setCreateError(null)
    setIsCreateOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.document.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const newSupplier = await addSupplier({
        name: form.name.trim(),
        document: form.document.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      })
      onChange(newSupplier.id)
      setQuery(newSupplier.name)
      setActiveIndex(-1)
      setOpen(false)
      setIsCreateOpen(false)
    } catch {
      setCreateError(error ?? 'Error al crear proveedor')
    } finally {
      setCreating(false)
    }
  }

  const moveIndex = (direction: 1 | -1) => {
    if (!open) {
      setOpen(true)
      return
    }
    setActiveIndex((prev) => {
      if (totalOptions === 0) return -1
      if (prev === -1) return direction === 1 ? 0 : totalOptions - 1
      return (prev + direction + totalOptions) % totalOptions
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
          if (activeIndex < filtered.length) {
            selectSupplier(filtered[activeIndex])
          } else if (showCreate) {
            openCreate()
          }
        }
        break
      case 'Escape':
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

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label="Seleccionar proveedor"
          type="text"
          value={inputValue}
          placeholder="Buscar o seleccionar proveedor..."
          onFocus={() => {
            setOpen(true)
            setQuery(selectedSupplier?.name ?? '')
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-card focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none transition-all"
        />
        {selectedSupplier && !open ? (
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

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-modal-in">
          {loading && allSuppliers.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              Cargando proveedores...
            </div>
          ) : filtered.length === 0 && !showCreate ? (
            <p className="px-4 py-3 text-sm text-gray-500">No hay proveedores</p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {filtered.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  id={`supplier-opt-${i}`}
                  onClick={() => selectSupplier(s)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                    activeIndex === i ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium truncate">{s.name}</span>
                  <span className="text-xs text-gray-400 font-mono shrink-0">{s.document}</span>
                </button>
              ))}
            </div>
          )}

          {showCreate && (
            <button
              type="button"
              onClick={openCreate}
              onMouseEnter={() => setActiveIndex(filtered.length)}
              className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium border-t border-gray-100 transition-colors cursor-pointer ${
                activeIndex === filtered.length
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-violet-600 hover:bg-violet-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Crear nuevo proveedor "{query.trim()}"
            </button>
          )}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Proveedor">
        {createError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{createError}</div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
              <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NIT / Cédula *</label>
              <input required type="text" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">Cancelar</button>
            <button type="submit" disabled={creating} className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50">
              {creating ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}