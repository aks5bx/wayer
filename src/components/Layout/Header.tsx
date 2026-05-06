import { Plus, X, List, Map } from 'lucide-react'
import type { Profile } from '../../types'

interface Props {
  profile: Profile
  isAddingMode: boolean
  showList: boolean
  onAddModeToggle: () => void
  onListToggle: () => void
  onProfileClick: () => void
}

function WayerLogo() {
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M10 1C5.58 1 2 4.58 2 9c0 5.25 7 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z" fill="currentColor" />
      <path d="M5.5 9.5c.9-1.5 2.1-.75 2.75 0s2.1 1.5 2.75 0 2.1-.75 2.75 0" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function Header({ profile, isAddingMode, showList, onAddModeToggle, onListToggle, onProfileClick }: Props) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 z-10">
      <div className="flex items-center gap-2 text-gray-900">
        <WayerLogo />
        <span className="wayer-wordmark text-lg text-gray-900 leading-none">Wayer</span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* List / map toggle */}
        <button
          onClick={onListToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            showList ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showList ? <Map size={14} /> : <List size={14} />}
          <span className="hidden sm:inline">{showList ? 'Map' : 'List'}</span>
        </button>

        {/* Add place */}
        <button
          onClick={onAddModeToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            isAddingMode ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isAddingMode ? <X size={14} /> : <Plus size={14} />}
          <span className="hidden sm:inline">{isAddingMode ? 'Cancel' : 'Add place'}</span>
        </button>

        {/* Profile avatar */}
        <button
          onClick={onProfileClick}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-base border-2 border-gray-200 hover:border-gray-400 transition-colors select-none"
        >
          {profile.avatar_emoji ?? '🦊'}
        </button>
      </div>
    </header>
  )
}
