import { XMarkIcon } from '@heroicons/react/24/outline'
import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  onSubmit: () => void
  submitButtonText: string
  submitButtonDisabled?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitButtonText,
  submitButtonDisabled = false,
}: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md relative border border-zinc-800">
        <button onClick={onClose} className="absolute top-3 right-3 text-zinc-400 hover:text-white">
          <XMarkIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-medium mb-6">{title}</h2>
        <div className="space-y-4 mb-6">
          {children}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitButtonDisabled}
          >
            {submitButtonText}
          </button>
        </div>
      </div>
    </div>
  )
} 