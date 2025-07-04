import { useState } from 'react'
import { Modal } from './Modal'
import { useMasterPassword } from '../contexts/MasterPasswordContext'
import { encryptCredentials } from '../utils/crypto.js'

interface AddPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPassword: (website: string, username: string, password: string) => void
}

export function AddPasswordModal({ isOpen, onClose, onAddPassword }: AddPasswordModalProps) {
  const [website, setWebsite] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { masterPassword } = useMasterPassword()

  const handleSubmit = async () => {
    if (!website || !username || !password) {
      setError('All fields are required')
      return
    }

    if (!masterPassword) {
      setError('Master password is required. Please unlock your vault first.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      // Criptografa os dados no frontend antes de enviar
      const encryptedData = await encryptCredentials({
        serviceName: website,
        loginUsername: username,
        loginPassword: password
      }, masterPassword)

      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(encryptedData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add credential')
      }

      const result = await response.json()
      
      // Chama a função de callback para atualizar a UI
      onAddPassword(website, username, password)
      
      // Limpa os campos
      setWebsite('')
      setUsername('')
      setPassword('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add credential')
    } finally {
      setIsLoading(false)
    }
  }

  const isSubmitDisabled = !website || !username || !password || isLoading

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Password"
      onSubmit={handleSubmit}
      submitButtonText={isLoading ? "Adding..." : "Add Password"}
      submitButtonDisabled={isSubmitDisabled}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-zinc-300 mb-1">Website</label>
          <input
            type="text"
            id="website"
            value={website}
            onChange={(e) => {
              setWebsite(e.target.value)
              if (error) setError('')
            }}
            className="w-full py-2 px-3 bg-transparent border-b border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-600 placeholder-zinc-500"
            placeholder="e.g., example.com"
          />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-1">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              if (error) setError('')
            }}
            className="w-full py-2 px-3 bg-transparent border-b border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-600 placeholder-zinc-500"
            placeholder="e.g., your_email@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            className="w-full py-2 px-3 bg-transparent border-b border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-600 placeholder-zinc-500"
            placeholder="••••••••••••"
          />
        </div>
        
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!masterPassword && (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
            <p className="text-yellow-400 text-sm">
              <strong>Note:</strong> You need to unlock your vault with your master password before adding credentials.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
} 