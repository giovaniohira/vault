import { ClipboardDocumentIcon, PlusIcon, MagnifyingGlassIcon, StarIcon as StarIconOutline } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, TrashIcon } from '@heroicons/react/24/solid'
import { useState, useEffect, useMemo } from 'react'
import { AddTOTPModal } from './AddTOTPModal'
import { Toast } from './Toast'
import { useMasterPassword } from '../contexts/MasterPasswordContext'
import { decrypt } from '../utils/crypto.js'
import { authenticator } from 'otplib'

interface EncryptedTOTP {
  id: string
  serviceName: string
  totpSecretEncrypted: string
  iv: string
  authTag: string
  salt: string
  createdAt: string
  updatedAt: string
  favorite?: boolean
}

interface TOTPEntry {
  id: string
  service: string
  username: string
  code: string
  timeLeft: number
  favorite?: boolean
}

const initialPlaceholderTOTPs: TOTPEntry[] = [
  {
    id: '1',
    service: 'Google',
    username: 'john.doe@gmail.com',
    code: '123456',
    timeLeft: 30
  },
  {
    id: '2',
    service: 'GitHub',
    username: 'johndoe',
    code: '789012',
    timeLeft: 15
  },
  {
    id: '3',
    service: 'Microsoft',
    username: 'john.doe@outlook.com',
    code: '345678',
    timeLeft: 25
  }
]

export function TOTPSection() {
  const [totpEntries, setTotpEntries] = useState<TOTPEntry[]>([])
  const [encryptedTOTPs, setEncryptedTOTPs] = useState<EncryptedTOTP[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showToast, setShowToast] = useState(false)
  const { masterPassword, isUnlocked } = useMasterPassword()

  // Fetch TOTPs from backend
  const fetchTOTPs = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) throw new Error('Authentication token not found')
      const response = await fetch('/api/totp', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch TOTPs')
      const data = await response.json()
      setEncryptedTOTPs(data)
    } catch (err) {
      setEncryptedTOTPs([])
    }
  }

  // Decrypt and generate TOTP codes
  useEffect(() => {
    if (isUnlocked && masterPassword && encryptedTOTPs.length > 0) {
      const updateTOTPs = async () => {
        const now = Date.now()
        const timeStep = 30
        const timeLeft = timeStep - Math.floor((now / 1000) % timeStep)
        const decrypted = await Promise.all(
          encryptedTOTPs.map(async (entry) => {
            try {
              const key = await window.crypto.subtle.importKey(
                'raw',
                await (await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(masterPassword))).slice(0, 32),
                { name: 'AES-GCM' },
                false,
                ['decrypt']
              )
              // Use decrypt utilitário igual ao das credenciais
              const secret = await decrypt(
                entry.totpSecretEncrypted,
                await (await import('../utils/crypto.js')).deriveKey(masterPassword, entry.salt),
                entry.iv,
                entry.authTag
              )
              const code = authenticator.generate(secret)
              return {
                id: entry.id,
                service: entry.serviceName,
                username: '', // Opcional: adicionar campo username se existir
                code,
                timeLeft,
                favorite: entry.favorite
              }
            } catch (e) {
              return null
            }
          })
        )
        setTotpEntries(decrypted.filter(Boolean) as TOTPEntry[])
      }
      updateTOTPs()
      const interval = setInterval(updateTOTPs, 1000)
      return () => clearInterval(interval)
    } else {
      setTotpEntries([])
    }
  }, [isUnlocked, masterPassword, encryptedTOTPs])

  useEffect(() => {
    fetchTOTPs()
  }, [])

  const handleCopyTOTP = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setShowToast(true)
      })
      .catch(err => {
        console.error('Failed to copy TOTP code: ', err)
      })
  }

  const handleAddTOTP = (service: string, username: string, secret: string) => {
    const newTOTP: TOTPEntry = {
      id: Date.now().toString(),
      service,
      username,
      code: Math.floor(100000 + Math.random() * 900000).toString(), // Placeholder for actual TOTP generation
      timeLeft: 30
    }
    setTotpEntries(prev => [...prev, newTOTP])
  }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('authToken')
    await fetch(`/api/totp/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchTOTPs()
  }

  const handleToggleFavorite = async (id: string) => {
    const token = localStorage.getItem('authToken')
    await fetch(`/api/totp/${id}/favorite`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchTOTPs()
  }

  const filteredAndSortedTOTPs = useMemo(() => {
    let list = totpEntries
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase()
      const matching: TOTPEntry[] = []
      const nonMatching: TOTPEntry[] = []
      list.forEach(totp => {
        const matches = 
          totp.service.toLowerCase().includes(lowerCaseQuery) ||
          totp.username.toLowerCase().includes(lowerCaseQuery)
        if (matches) {
          matching.push(totp)
        } else {
          nonMatching.push(totp)
        }
      })
      list = [...matching, ...nonMatching]
    }
    // Favoritos no topo
    return [...list.filter(t => t.favorite), ...list.filter(t => !t.favorite)]
  }, [totpEntries, searchQuery])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium">TOTP Authenticator</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add New TOTP
        </button>
      </div>

      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search TOTP entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>
      
      <div className="bg-zinc-900 rounded-lg divide-y divide-zinc-800">
        {filteredAndSortedTOTPs.map((entry) => {
          const isDimmed = searchQuery && 
            !(entry.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
              entry.username.toLowerCase().includes(searchQuery.toLowerCase()))
          
          return (
            <div 
              key={entry.id} 
              className={`p-4 transition-colors ${isDimmed ? 'opacity-20' : 'hover:bg-zinc-800'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-zinc-700 rounded flex items-center justify-center">
                      {entry.service.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-normal">{entry.service}</h3>
                      <p className="text-sm text-zinc-400">{entry.username}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg tracking-wider">{entry.code}</span>
                  <div className="relative group">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Copy TOTP code
                    </div>
                    <button
                      onClick={() => handleCopyTOTP(entry.code)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <button onClick={() => handleToggleFavorite(entry.id)} title="Favorite" className={entry.favorite ? 'text-yellow-400' : 'text-zinc-400 hover:text-yellow-400'}>
                    {entry.favorite ? <StarIconSolid className="w-5 h-5" /> : <StarIconOutline className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleDelete(entry.id)} title="Delete" className="text-red-500 hover:text-red-700">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {showToast && (
        <Toast
          message="TOTP code copied to clipboard!"
          onClose={() => setShowToast(false)}
        />
      )}
      <AddTOTPModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTOTP={handleAddTOTP}
      />
    </div>
  )
} 