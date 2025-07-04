import { ClipboardDocumentIcon, EyeIcon, EyeSlashIcon, PlusIcon, MagnifyingGlassIcon, LockClosedIcon, StarIcon as StarIconOutline, TrashIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { useState, useMemo, useEffect } from 'react'
import { AddPasswordModal } from './AddPasswordModal'
import { MasterPasswordModal } from './MasterPasswordModal'
import { Toast } from './Toast'
import { useMasterPassword } from '../contexts/MasterPasswordContext'
import { decryptCredentials } from '../utils/crypto.js'

interface PasswordEntry {
  id: string
  serviceName: string
  loginUsername: string
  loginPassword: string
  createdAt: string
  updatedAt: string
  favorite?: boolean
}

interface EncryptedCredential {
  id: string
  serviceName: string
  loginUsernameEncrypted: string
  loginPasswordEncrypted: string
  usernameIv: string
  usernameAuthTag: string
  passwordIv: string
  passwordAuthTag: string
  salt: string
  createdAt: string
  updatedAt: string
  favorite?: boolean
}

export function PasswordSection() {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMasterPasswordModalOpen, setIsMasterPasswordModalOpen] = useState(false)
  const [passwords, setPasswords] = useState<PasswordEntry[]>([])
  const [encryptedCredentials, setEncryptedCredentials] = useState<EncryptedCredential[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { masterPassword, isUnlocked } = useMasterPassword()
  
  // Mostra o modal automaticamente quando não há senha mestra
  useEffect(() => {
    if (isUnlocked === false && !isLoading && !isMasterPasswordModalOpen) {
      setIsMasterPasswordModalOpen(true)
    }
  }, [isUnlocked, isLoading, isMasterPasswordModalOpen])

  // Busca credenciais do backend
  const fetchCredentials = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch('/api/credentials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch credentials')
      }

      const data = await response.json()
      setEncryptedCredentials(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credentials')
    } finally {
      setIsLoading(false)
    }
  }

  // Descriptografa credenciais quando a senha mestra está disponível
  useEffect(() => {
    if (isUnlocked && masterPassword && encryptedCredentials.length > 0) {
              const decryptAll = async () => {
          try {
            const decryptedPasswords = await Promise.all(
              encryptedCredentials.map(async (credential) => {
                const decrypted = await decryptCredentials(credential, masterPassword) as PasswordEntry
                return decrypted
              })
            )
            setPasswords(decryptedPasswords)
          } catch (err) {
            console.error('Decryption error:', err)
            setError('Failed to decrypt credentials. Please check your master password.')
            setPasswords([])
          }
        }
      
      decryptAll()
    } else if (!isUnlocked) {
      setPasswords([])
    }
  }, [isUnlocked, masterPassword, encryptedCredentials])

  // Busca credenciais quando o componente é montado
  useEffect(() => {
    fetchCredentials()
  }, [])

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password)
      .then(() => {
        setShowToast(true)
      })
      .catch(err => {
        console.error('Failed to copy password: ', err)
      })
  }

  const handleAddPassword = (website: string, username: string, password: string) => {
    // Recarrega as credenciais do backend
    fetchCredentials()
  }

  const handleUnlockSuccess = () => {
    // Recarrega as credenciais quando o vault é desbloqueado
    fetchCredentials()
  }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('authToken')
    await fetch(`/api/credentials/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchCredentials()
  }

  const handleToggleFavorite = async (id: string) => {
    const token = localStorage.getItem('authToken')
    await fetch(`/api/credentials/${id}/favorite`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    fetchCredentials()
  }

  const filteredAndSortedPasswords = useMemo(() => {
    let list = passwords
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase()
      const matching: PasswordEntry[] = []
      const nonMatching: PasswordEntry[] = []
      list.forEach(password => {
        const matches = 
          password.serviceName.toLowerCase().includes(lowerCaseQuery) ||
          password.loginUsername.toLowerCase().includes(lowerCaseQuery)
        if (matches) {
          matching.push(password)
        } else {
          nonMatching.push(password)
        }
      })
      list = [...matching, ...nonMatching]
    }
    // Favoritos no topo
    return [...list.filter(p => p.favorite), ...list.filter(p => !p.favorite)]
  }, [passwords, searchQuery])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return '1 day ago'
    return `${Math.floor(diffInHours / 24)} days ago`
  }


  
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <LockClosedIcon className="w-16 h-16 text-zinc-600 mb-4" />
        <h2 className="text-2xl font-medium mb-2">Vault is Locked</h2>
        <p className="text-zinc-400 mb-6 max-w-md">
          Enter your master password to unlock your encrypted credentials and view your passwords.
        </p>
        <button
          onClick={() => setIsMasterPasswordModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Unlock Vault
        </button>
        
        <MasterPasswordModal
          isOpen={isMasterPasswordModalOpen}
          onClose={() => setIsMasterPasswordModalOpen(false)}
          onSuccess={handleUnlockSuccess}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium">Passwords</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add New Password
        </button>
      </div>

      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search passwords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAndSortedPasswords.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400">No passwords found. Add your first password to get started.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg divide-y divide-zinc-800">
          {filteredAndSortedPasswords.map((entry) => {
            const isDimmed = searchQuery && 
              !(entry.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                entry.loginUsername.toLowerCase().includes(searchQuery.toLowerCase()))
            
            return (
              <div 
                key={entry.id} 
                className={`p-4 transition-colors ${isDimmed ? 'opacity-20' : 'hover:bg-zinc-800'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-zinc-700 rounded flex items-center justify-center">
                        {entry.serviceName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-normal">{entry.serviceName}</h3>
                        <p className="text-sm text-zinc-400">{entry.loginUsername}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg tracking-wider">
                      {showPasswords[entry.id] ? entry.loginPassword : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(entry.id)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      {showPasswords[entry.id] ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                    <div className="relative group">
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Copy password
                      </div>
                      <button
                        onClick={() => handleCopyPassword(entry.loginPassword)}
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
      )}
      
      {showToast && (
        <Toast
          message="Password copied to clipboard!"
          onClose={() => setShowToast(false)}
        />
      )}
      
      <AddPasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddPassword={handleAddPassword}
      />
      
      <MasterPasswordModal
        isOpen={isMasterPasswordModalOpen}
        onClose={() => setIsMasterPasswordModalOpen(false)}
        onSuccess={handleUnlockSuccess}
      />
    </div>
  )
} 