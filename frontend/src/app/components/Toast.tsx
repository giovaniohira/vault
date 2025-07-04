import { useEffect, useState } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

interface ToastProps {
  message: string
  duration?: number
  onClose: () => void
}

export function Toast({ message, duration = 2000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={`fixed bottom-4 right-4 flex flex-col bg-green-600 text-white rounded-lg shadow-lg transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-2">
        <CheckCircleIcon className="w-5 h-5" />
        <span>{message}</span>
      </div>
      <div className="h-0.5 bg-green-700/30 rounded-b-lg overflow-hidden">
        <div 
          className="h-full bg-white/20 animate-progress"
          style={{ 
            animationDuration: `${duration}ms`,
            animationTimingFunction: 'linear'
          }}
        />
      </div>
    </div>
  )
} 