import CartContent from './CartContent'

interface CartPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartPanel({ isOpen, onClose }: CartPanelProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} aria-hidden="true" />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Carrito de venta"
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <CartContent variant="drawer" active={isOpen} onClose={onClose} />
      </div>
    </>
  )
}
