import { useState, useEffect, useRef, type ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'

interface ActionItem {
  label: string
  icon: ReactNode
  onClick: () => void
  className?: string
}

interface ActionDropdownProps {
  actions: ActionItem[]
}

export default function ActionDropdown({ actions }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-dropdown-in">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => {
                action.onClick()
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-50 ${action.className ?? 'text-gray-700'}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
