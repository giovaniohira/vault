import { LockClosedIcon, KeyIcon, ArrowRightOnRectangleIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useMasterPassword } from '../contexts/MasterPasswordContext'
import { useState, useEffect } from 'react'

interface NavigationProps {
  activeTab: 'passwords' | 'totp' | 'audit'
  onTabChange: (tab: 'passwords' | 'totp' | 'audit') => void
}

const tabs = [
  { id: 'passwords', label: 'Passwords', icon: LockClosedIcon },
  { id: 'totp', label: 'TOTP', icon: KeyIcon },
] as const

const adminTabs = [
  { id: 'audit', label: 'Audit', icon: ChartBarIcon },
] as const

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const router = useRouter()
  const { clearMasterPassword } = useMasterPassword()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminRole = () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          // Decode JWT token to get user role
          const payload = JSON.parse(atob(token.split('.')[1]))
          setIsAdmin(payload.role === 'admin')
        } catch (error) {
          console.error('Error decoding token:', error)
          setIsAdmin(false)
        }
      }
    }

    checkAdminRole()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    clearMasterPassword() // Limpa a senha mestra
    router.push('/login')
  }

  return (
    <nav className="flex-1 flex flex-col">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center w-full p-3 rounded-lg mb-2 transition-colors ${
            activeTab === tab.id
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <tab.icon className="w-5 h-5 mr-3" />
          {tab.label}
        </button>
      ))}
      
      {/* Admin-only tabs */}
      {isAdmin && adminTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center w-full p-3 rounded-lg mb-2 transition-colors ${
            activeTab === tab.id
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <tab.icon className="w-5 h-5 mr-3" />
          {tab.label}
        </button>
      ))}
      
      <div className="mt-auto pt-4 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-lg transition-colors text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </nav>
  )
} 