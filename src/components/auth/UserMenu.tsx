'use client'

import React from 'react'
import { useAuth } from './AuthContext'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { LogOut, Settings, User, Map, FileText, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ADMIN_EMAILS } from '@/lib/constants'

export const UserMenu = () => {
  const { user, signOut } = useAuth()
  const router = useRouter()
  
  // Get username from email (everything before @)
  const username = user?.email?.split('@')[0] || 'User'

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
            {username}
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          sideOffset={5}
          align="end"
        >
          <DropdownMenu.Item 
            onClick={() => router.push('/my-itineraries')}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
          >
            <Map size={16} className="flex-shrink-0" />
            <span>My Itineraries</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item 
            onClick={() => router.push('/my-bookings')}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
          >
            <Clock size={16} className="flex-shrink-0" />
            <span>My Bookings</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item 
            onClick={() => router.push('/account')}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
          >
            <User size={16} className="flex-shrink-0" />
            <span>Account</span>
          </DropdownMenu.Item>
          {isAdmin && (
            <DropdownMenu.Item 
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              Admin Dashboard
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
          <DropdownMenu.Item 
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}