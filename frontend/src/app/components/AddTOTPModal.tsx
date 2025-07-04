import { useState } from 'react'
import { Modal } from './Modal'
import { useMasterPassword } from '../contexts/MasterPasswordContext'
import { encrypt } from '../utils/crypto.js'

interface AddTOTPModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTOTP: (service: string, username: string, secret: string) => void
}

export function AddTOTPModal({ isOpen, onClose, onAddTOTP }: AddTOTPModalProps) {
  const [service, setService] = useState('')
  const [username, setUsername] = useState('')
  const [secret, setSecret] = useState('')
  const { masterPassword, isUnlocked } = useMasterPassword()

  const handleSubmit = async () => {
    if (!service || !username || !secret || !masterPassword) return
    // Criptografa o segredo TOTP
    const salt = (await import('../utils/crypto.js')).generateSalt()
    const key = await (await import('../utils/crypto.js')).deriveKey(masterPassword, salt)
    const encrypted = await encrypt(secret, key) as { encrypted: string, iv: string, authTag: string }
    // Envia para o backend
    const token = localStorage.getItem('authToken')
    await fetch('/api/totp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        serviceName: service,
        totpSecretEncrypted: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        salt
      })
    })
    setService('')
    setUsername('')
    setSecret('')
    onClose()
    if (onAddTOTP) onAddTOTP(service, username, secret)
  }

  const isSubmitDisabled = !service || !username || !secret

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New TOTP"
      onSubmit={handleSubmit}
      submitButtonText="Add TOTP"
      submitButtonDisabled={isSubmitDisabled}
    >
      <div>
        <label htmlFor="service" className="block text-sm font-medium text-zinc-300 mb-1">Service</label>
        <input
          type="text"
          id="service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full py-2 px-3 bg-transparent border-b border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-600 placeholder-zinc-500"
          placeholder="e.g., Google, GitHub"
        />
      </div>
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-1">Username</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full py-2 px-3 bg-transparent border-b border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-600 placeholder-zinc-500"
          placeholder="e.g., your_email@example.com"
        />
      </div>
      <div>
        <label htmlFor="secret" className="block text-sm font-medium text-zinc-300 mb-1">Secret Key</label>
        <input
          type="text"
          id="secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full py-2 px-3 bg-transparent border-b border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-600 placeholder-zinc-500"
          placeholder="Enter your secret key or scan QR code (later)"
        />
      </div>
    </Modal>
  )
} 