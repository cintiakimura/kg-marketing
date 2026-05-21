// @ts-nocheck
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuthNavigate } from '@/lib/AuthContext';

const ACCENT = '#14532d';
const BG = '#000000';

export default function Landing() {
  const { loginAndGoToDashboard, signupAndGoToDashboard } = useAuthNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setError('');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (authMode === 'signup') {
        await signupAndGoToDashboard(email.trim(), password, fullName.trim());
      } else {
        await loginAndGoToDashboard(email.trim(), password);
      }
      setLoginOpen(false);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'bg-kg-input border-green-500/20 text-white placeholder:text-gray-500 focus-visible:ring-green-500 font-normal';

  return (
    <div
      className="min-h-screen flex flex-col text-white overflow-x-hidden"
      style={{ backgroundColor: BG, fontFamily: '"Akkurat", sans-serif', fontWeight: 400 }}
    >
      <header className="w-full px-6 sm:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/kg-logo.png"
            alt="KG"
            className="h-9 w-auto object-contain"
            width={72}
            height={36}
          />
          <span className="text-white text-base tracking-tight" style={{ fontWeight: 400 }}>
            KG Marketing Tool
          </span>
        </div>
        <Button
          type="button"
          variant="kg"
          size="sm"
          onClick={() => setLoginOpen(true)}
          className="uppercase tracking-wide"
        >
          Login
        </Button>
      </header>

      <main className="flex-1 flex items-center px-6 sm:px-10 pb-16">
        <div className="w-full max-w-3xl text-left">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl text-white leading-[1.05] tracking-tight mb-4"
            style={{ fontWeight: 400 }}
          >
            KG Marketing
          </h1>
          <p
            className="text-2xl sm:text-3xl md:text-4xl mb-6 tracking-tight"
            style={{ color: ACCENT, fontWeight: 400 }}
          >
            Campaign in a Box
          </p>
          <p
            className="text-base sm:text-lg text-white/90 max-w-xl mb-10 leading-relaxed"
            style={{ fontWeight: 400 }}
          >
            Find high-quality decision makers. Run smart campaigns. Close more deals.
          </p>
          <Button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="h-12 px-8 rounded-md text-white hover:opacity-90 font-normal"
            style={{ backgroundColor: ACCENT, fontWeight: 400 }}
          >
            Login to your workspace
          </Button>
        </div>
      </main>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent
          className="border-green-500/20 text-white sm:max-w-md font-normal"
          style={{ backgroundColor: '#0a1f0a', fontFamily: '"Akkurat", sans-serif', fontWeight: 400 }}
        >
          <DialogHeader>
            <DialogTitle className="text-white" style={{ fontWeight: 400 }}>
              Team access
            </DialogTitle>
            <DialogDescription className="text-gray-400" style={{ fontWeight: 400 }}>
              Sign up once, then sign in with your saved password.
            </DialogDescription>
          </DialogHeader>

          <div className="flex rounded-lg bg-kg-input p-1 mt-2">
            <button
              type="button"
              onClick={() => switchAuthMode('login')}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                authMode === 'login' ? 'text-white' : 'text-gray-400'
              }`}
              style={{
                fontWeight: 400,
                backgroundColor: authMode === 'login' ? ACCENT : 'transparent',
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchAuthMode('signup')}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                authMode === 'signup' ? 'text-white' : 'text-gray-400'
              }`}
              style={{
                fontWeight: 400,
                backgroundColor: authMode === 'signup' ? ACCENT : 'transparent',
              }}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
            {authMode === 'signup' && (
              <div>
                <Label htmlFor="modal-name" className="text-gray-300 font-normal">
                  Full name
                </Label>
                <Input
                  id="modal-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                  disabled={loading}
                  style={{ fontWeight: 400 }}
                />
              </div>
            )}
            <div>
              <Label htmlFor="modal-email" className="text-gray-300 font-normal">
                Work email
              </Label>
              <Input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1.5 ${inputClass}`}
                disabled={loading}
                required
                style={{ fontWeight: 400 }}
              />
            </div>
            <div>
              <Label htmlFor="modal-password" className="text-gray-300 font-normal">
                Password {authMode === 'signup' ? '(min. 8 characters)' : ''}
              </Label>
              <Input
                id="modal-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1.5 ${inputClass}`}
                disabled={loading}
                required
                minLength={authMode === 'signup' ? 8 : undefined}
                style={{ fontWeight: 400 }}
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 font-normal" role="alert" style={{ fontWeight: 400 }}>
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-white font-normal hover:opacity-90"
              style={{ backgroundColor: ACCENT, fontWeight: 400 }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : authMode === 'signup' ? (
                'Create account'
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
