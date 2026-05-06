import { useState } from 'react'
import { Mail } from 'lucide-react'
import type { AuthError } from '@supabase/supabase-js'

interface Props {
  onSignIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  onSignUp: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null | unknown }>
}

export default function AuthScreen({ onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('handleSubmit fired, mode:', mode, 'email:', email)
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await onSignIn(email, password)
      if (error) {
        console.error('Sign in error:', error)
        setError(error.message || 'Login failed')
      }
    } else {
      const { error } = await onSignUp(email, password, displayName)
      if (error) {
        setError((error as AuthError).message ?? 'Something went wrong')
      } else {
        setSignedUp(true)
      }
    }
    setLoading(false)
  }

  if (signedUp) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="flex justify-center mb-4 text-gray-400"><Mail size={40} /></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-4">
            We sent a confirmation link to <strong>{email}</strong>. Click it to verify your account.
          </p>
          <p className="text-gray-400 text-xs">
            After confirming, your account will be reviewed before you can access the map.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3 text-gray-900">
            <svg width="32" height="38" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M10 1C5.58 1 2 4.58 2 9c0 5.25 7 14 8 14s8-8.75 8-14c0-4.42-3.58-8-8-8z" fill="currentColor" />
              <path d="M5.5 9.5c.9-1.5 2.1-.75 2.75 0s2.1 1.5 2.75 0 2.1-.75 2.75 0" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <h1 className="wayer-wordmark text-3xl text-gray-900">Wayer</h1>
          <p className="text-gray-500 text-sm mt-1">Bay Area spots, saved together</p>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : mode === 'login' ? 'Log in' : 'Request access'}
          </button>
        </form>

        {mode === 'signup' && (
          <p className="text-gray-400 text-xs text-center mt-4">
            Wayer is invite-only. Your account will be approved before you can access the map.
          </p>
        )}
      </div>
    </div>
  )
}
