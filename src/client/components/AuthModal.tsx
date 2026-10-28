import React, { useState } from 'react';
import { AuthState } from '../types';
import { KeyRound, User, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { BananaIcon } from './BananaIcon';

interface AuthModalProps {
  onSuccess: (auth: AuthState) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'apikey'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'apikey') {
        const key = apiKeyInput.trim();
        if (!key) throw new Error('API key cannot be empty');

        const res = await fetch('/api/v1/tasks', {
          headers: { 'X-API-Key': key },
        });

        if (!res.ok) {
          throw new Error('Invalid API Key');
        }

        onSuccess({
          id: 'user_' + key.slice(0, 8),
          username: 'Agent User',
          apiKey: key,
        });
        return;
      }

      const endpoint = mode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess({ id: data.id, username: data.username, apiKey: data.apiKey });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl p-6 shadow-xl">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-amber-100/90 border border-amber-300/80 flex items-center justify-center shadow-2xs">
            <BananaIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">HabitCorp</h2>
            <p className="text-xs text-stone-500">The boring cousin of Habitica</p>
          </div>
        </div>

        {/* Clear Prominent Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 border border-stone-200 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'register'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'login'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            {error.includes('already taken') && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-[11px] text-indigo-600 hover:underline pl-5 block text-left font-medium"
              >
                Already created this account? Click here to Sign In →
              </button>
            )}
            {error.includes('Invalid username or password') && (
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-[11px] text-indigo-600 hover:underline pl-5 block text-left font-medium"
              >
                Need to create a new account instead? Click here →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'apikey' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Username <span className="text-stone-400 font-normal">(min 3 chars)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-9 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Personal API Key</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="tk_..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-xs disabled:opacity-50"
          >
            <span>
              {loading
                ? 'Processing...'
                : mode === 'apikey'
                ? 'Sign In with API Key'
                : mode === 'register'
                ? 'Create My Account'
                : 'Sign In'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'apikey' ? 'login' : 'apikey');
              setError(null);
            }}
            className="hover:text-indigo-600 transition"
          >
            {mode === 'apikey' ? '← Back to username/password' : 'Use API key directly'}
          </button>

          {mode !== 'apikey' && (
            <span className="text-[11px] text-stone-400">
              {mode === 'register' ? 'Private board for you & friends' : 'Secure local session'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
