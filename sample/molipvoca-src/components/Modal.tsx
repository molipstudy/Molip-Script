import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[120]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <div
              className="bg-surface w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[calc(100vh-1.5rem)] sm:max-h-[88vh] overflow-hidden flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-sm text-text-secondary hover:text-text transition-colors"
                >
                  닫기
                </button>
              </div>
              <div className="px-5 py-4 overflow-y-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
