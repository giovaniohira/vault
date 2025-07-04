import { ReactNode } from 'react'

interface SidebarProps {
  children: ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-medium">Vault</h1>
      </div>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </aside>
  )
} 