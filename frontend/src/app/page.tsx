'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Navigation } from './components/Navigation'
import { PasswordSection } from './components/PasswordSection'
import { TOTPSection } from './components/TOTPSection'
import { AuditDashboard } from './components/AuditDashboard'
import { AuthGuard } from './components/AuthGuard'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'passwords' | 'totp' | 'audit'>('passwords')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminRole = () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'passwords':
        return <PasswordSection />
      case 'totp':
        return <TOTPSection />
      case 'audit':
        if (!isAdmin) {
          return (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
                <p className="text-zinc-400">You need admin privileges to access this section.</p>
              </div>
            </div>
          )
        }
        return <AuditDashboard />
      default:
        return <PasswordSection />
    }
  }

  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar>
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </Sidebar>

        <main className="flex-1 p-8">
          {renderActiveTab()}
        </main>
      </div>
    </AuthGuard>
  )
}
