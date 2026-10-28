import React, { useState } from 'react';
import { AuthState } from '../types';
import {
  KeyRound,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Mail,
  Check,
  Copy,
  ExternalLink,
  X,
  ShieldCheck,
} from 'lucide-react';
import { BananaIcon } from './BananaIcon';
import { HabitCorpIcon } from './HabitCorpIcon';
import { fetchJson } from '../apiHelper';

interface AuthModalProps {
  onSuccess: (auth: AuthState) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onClose, canClose = false }) => {
  const [tab, setTab] = useState<'magic' | 'password' | 'apikey'>('magic');
  const [passwordMode, setPasswordMode] = useState<'login' | 'register'>('login');

  // Magic link state
  const [emailInput, setEmailInput] = useState('');
  const [magicLinkResult, setMagicLinkResult] = useState<{
    token: string;
    url: string;
    username: string;
    email: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Password state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // API Key state
  const [apiKeyInput, setApiKeyInput] = useState('');

  // General state
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Submit Magic Link Request
  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = emailInput.trim();
      if (!cleanEmail) throw new Error('Please enter an email or username');

      const data = await fetchJson('/api/v1/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      setMagicLinkResult({
        token: data.token,
        url: data.url,
        username: data.user.username,
        email: data.user.email || cleanEmail,
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // 2. Consume / Verify Magic Link
  const handleVerifyMagicLink = async (tokenToVerify?: string) => {
    const token = tokenToVerify || magicLinkResult?.token;
    if (!token) return;

    setError(null);
    setLoading(true);

    try {
      const data = await fetchJson('/api/v1/auth/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      onSuccess({
        id: data.id,
        username: data.username,
        email: data.email,
        apiKey: data.apiKey,
      });
    } catch (err: any) {
      setError(err.message || 'Invalid or expired magic link');
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit Traditional Password Form
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = passwordMode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
      const data = await fetchJson(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      onSuccess({ id: data.id, username: data.username, apiKey: data.apiKey });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit API Key
  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const key = apiKeyInput.trim();
      if (!key) throw new Error('API key cannot be empty');

      const user = await fetchJson('/api/v1/auth/me', {
        headers: { 'X-API-Key': key },
      });

      onSuccess({
        id: user.id,
        username: user.username,
        apiKey: user.api_key || key,
      });
    } catch (err: any) {
      setError(err.message || 'Invalid API Key');
    } finally {
      setLoading(false);
    }
  };

  // 5. Shortcut: Quick Test User
  const handleQuickTestUser = async () => {
    setLoading(true);
    try {
      const data = await fetchJson('/api/v1/auth/default-user');
      if (data?.apiKey) {
        onSuccess(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Copy magic link to clipboard
  const handleCopyLink = () => {
    if (!magicLinkResult) return;
    const fullUrl = `${window.location.origin}${magicLinkResult.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Optional close button if user is already authenticated */}
        {canClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shadow-2xs">
            <HabitCorpIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">HabitCorp</h2>
            <p className="text-xs text-stone-500">The boring cousin of Habitica</p>
          </div>
        </div>

        {/* Primary Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 border border-stone-200/80 rounded-2xl mb-5 text-xs">
          <button
            type="button"
            onClick={() => {
              setTab('magic');
              setError(null);
            }}
            className={`py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition ${
              tab === 'magic'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Magic Link</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('password');
              setError(null);
            }}
            className={`py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition ${
              tab === 'password'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
            <span>Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('apikey');
              setError(null);
            }}
            className={`py-2 px-2.5 rounded-xl font-medium flex items-center justify-center gap-1.5 transition ${
              tab === 'apikey'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>API Key</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: PASSWORDLESS MAGIC LINK (NO PASSWORDS NEEDED) */}
        {tab === 'magic' && (
          <div>
            {!magicLinkResult ? (
              <form onSubmit={handleRequestMagicLink} className="space-y-4">
                <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl text-xs text-rose-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    <span>No password needed!</span>
                  </div>
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    Enter your email or username below. If you're new, an account will be created
                    automatically in one click.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Email or Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. alex@example.com or alex"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-rose-400 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  <span>{loading ? 'Generating Link...' : 'Send Magic Link / Sign Up'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Magic Link Result Card */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2 text-emerald-950">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Magic Sign-in Link Ready!</span>
                  </div>
                  <p className="text-stone-600 text-[11px]">
                    Account ready for <strong>@{magicLinkResult.username}</strong> ({magicLinkResult.email}).
                  </p>
                </div>

                {/* 1-Click Instant Sign In Button */}
                <button
                  type="button"
                  onClick={() => handleVerifyMagicLink()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-xs active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Signing in...' : `Sign In as @${magicLinkResult.username}`}</span>
                </button>

                {/* Copy Link Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition border border-stone-200"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Magic Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMagicLinkResult(null)}
                    className="py-2 px-3 text-stone-500 hover:text-stone-800 text-xs font-medium rounded-xl hover:bg-stone-100 transition"
                  >
                    Change Email
                  </button>
                </div>

                <p className="text-[10px] text-stone-400 text-center">
                  💡 In production, this link is delivered directly to your inbox. In local mode, you can sign in directly!
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRADITIONAL USERNAME & PASSWORD */}
        {tab === 'password' && (
          <div>
            <div className="flex gap-2 border-b border-stone-200 pb-2 mb-4 text-xs">
              <button
                type="button"
                onClick={() => setPasswordMode('login')}
                className={`font-semibold pb-1 transition ${
                  passwordMode === 'login'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setPasswordMode('register')}
                className={`font-semibold pb-1 transition ${
                  passwordMode === 'register'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-indigo-400 focus:bg-white"
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
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-9 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-indigo-400 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-xs disabled:opacity-50"
              >
                <span>
                  {loading
                    ? 'Processing...'
                    : passwordMode === 'register'
                    ? 'Create My Account'
                    : 'Sign In'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: API KEY ACCESS */}
        {tab === 'apikey' && (
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Personal / Agent API Key</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="tk_..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm font-mono text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-indigo-400 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition shadow-xs disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In with API Key'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Bottom Quick Test-User Shortcut */}
        <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleQuickTestUser}
            className="text-stone-500 hover:text-indigo-600 font-medium transition flex items-center gap-1.5"
          >
            <span>⚡ Continue as Test User (@testuser)</span>
          </button>

          <span className="text-[11px] text-stone-400">Zero-friction preview</span>
        </div>
      </div>
    </div>
  );
};
