import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Plus, X, ChevronDown, Loader2 } from 'lucide-react'
import { useClientStore } from '../stores/clientStore'
import { ClientForm } from './ClientForm'
import Modal from './Modal'
import type { Client } from '../types'

interface ClientSelectProps {
  value: string
  onChange: (clientId: string) => void
}

export function ClientSelect({ value, onChange }: ClientSelectProps) {
  const { clients, loading, addClient, error } = useClientStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedClient = useMemo(() => clients.find((c) => c.id === value) ?? null, [clients, value])

  const trimmed = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!trimmed) return clients
    return clients.filter(
      (c) => c.name.toLowerCase().includes(trimmed) || c.document.toLowerCase().includes(trimmed)
    )
  }, [clients, trimmed])

  const showCreate = trimmed.length > 0 && filtered.length === 0
  const totalOptions = filtered.length + (showCreate ? 1 : 0)
  const inputValue = open ? query : selectedClient?.name ?? ''

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

  const selectClient = (client: Client) => {
    onChange(client.id)
    setQuery(client.name)
    setActiveIndex(-1)
    setOpen(false)
  }

  const openCreate = () => {
    setCreateError(null)
    setIsCreateOpen(true)
  }

  const handleCreate = async (form: { name: string; document: string; email: string; phone: string; address: string }) => {
    setCreating(true)
    setCreateError(null)
    try {
      const newClient = await addClient(form)
      onChange(newClient.id)
      setQuery(newClient.name)
      setActiveIndex(-1)
      setOpen(false)
      setIsCreateOpen(false)
    } catch {
      setCreateError(error ?? 'Error al crear cliente')
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
            selectClient(filtered[activeIndex])
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
          aria-label="Seleccionar cliente"
          type="text"
          value={inputValue}
          placeholder="Buscar o seleccionar cliente..."
          onFocus={() => {
            setOpen(true)
            setQuery(selectedClient?.name ?? '')
          }}
          onBlur={(e) => {
            if (containerRef.current?.contains(e.relatedTarget as Node)) return
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm bg-card focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none transition-all"
        />
        {selectedClient && !open ? (
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
          {loading && clients.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              Cargando clientes...
            </div>
          ) : filtered.length === 0 && !showCreate ? (
            <p className="px-4 py-3 text-sm text-gray-500">No hay clientes</p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {filtered.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  id={`client-opt-${i}`}
                  onClick={() => selectClient(c)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                    activeIndex === i ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium truncate">{c.name}</span>
                  <span className="text-xs text-gray-400 font-mono shrink-0">{c.document}</span>
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
              Crear nuevo cliente "{query.trim()}"
            </button>
          )}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Cliente">
        {createError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{createError}</div>
        )}
        <ClientForm
          submitLabel={creating ? 'Creando...' : 'Crear'}
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>
    </div>
  )
}