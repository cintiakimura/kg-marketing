// @ts-nocheck — shadcn UI components are untyped JSX; Vite build is authoritative.
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Target,
  Megaphone,
  TrendingUp,
  Mail,
  Loader2,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
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

const FEATURES = [
  {
    icon: Target,
    title: 'Smart Lead Finder',
    description:
      'Grok-powered research finds 8–15 high-intent decision-makers with fit scores, activity signals, and personalized openers.',
  },
  {
    icon: Megaphone,
    title: 'Campaign in a Box',
    description:
      'Launch multi-touch email campaigns, follow-ups, and A/B tests from one workspace built for industrial B2B.',
  },
  {
    icon: TrendingUp,
    title: 'Pipeline clarity',
    description:
      'Track leads, clients, and campaign performance with dashboards your team actually uses.',
  },
  {
    icon: Mail,
    title: 'Webmail & calendar',
    description:
      'Coordinate outreach and webinars without switching tools — everything stays in brand.',
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Landing() {
  const loginRef = useRef(null);
  const { loginAndGoToDashboard } = useAuthNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAndGoToDashboard(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'bg-[#333333] border-[#444444] text-white placeholder:text-gray-500 focus-visible:ring-[#00c600]';

  return (
    <div className="min-h-screen bg-[#212121] text-white overflow-x-hidden">
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/akkurat');
        * { font-family: 'Akkurat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      `}</style>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[#333333]/80 bg-[#212121]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00c600] flex items-center justify-center shadow-lg shadow-[#00c600]/20">
              <span className="text-[#212121] font-bold text-lg">KG</span>
            </div>
            <span className="font-semibold text-white hidden sm:inline">KG Marketing</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={scrollToLogin}
              className="text-gray-300 hover:text-white hover:bg-[#333333]"
            >
              Sign in
            </Button>
            <Button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-semibold"
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 sm:px-6 pt-16 pb-24 max-w-6xl mx-auto">
        <div
          className="absolute inset-0 -z-10 overflow-hidden pointer-events-none"
          aria-hidden
        >
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00c600]/10 rounded-full blur-[100px]" />
        </div>

        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c600]/10 border border-[#00c600]/30 text-[#00c600] text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Campaign in a Box
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            KG Marketing
            <span className="block text-[#00c600] mt-2 text-3xl sm:text-4xl md:text-5xl">
              Campaign in a Box
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed">
            Find high-quality leads · Run smart campaigns · Close more deals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              type="button"
              size="lg"
              onClick={() => setLoginOpen(true)}
              className="bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-semibold text-base px-8 h-12"
            >
              Get started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={scrollToLogin}
              className="border-[#444444] text-gray-200 hover:bg-[#333333] h-12 px-8"
            >
              Sign in to your account
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center"
        >
          {[
            { label: 'Precision leads', value: '8–15' },
            { label: 'Grok research', value: 'Live' },
            { label: 'All-in-one', value: 'B2B' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl bg-[#2a2a2a] border border-[#333333]"
            >
              <p className="text-2xl font-bold text-[#00c600]">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 py-20 bg-[#1a1a1a] border-y border-[#333333]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            {...fadeUp}
            className="text-2xl sm:text-3xl font-bold text-center mb-4"
          >
            Built for teams who sell on trust
          </motion.h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            Industrial and tech B2B needs more than a contact list. KG Marketing combines
            AI research with campaign execution in one premium workspace.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="p-6 rounded-xl bg-[#2a2a2a] border border-[#333333] hover:border-[#00c600]/40 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#00c600]/15 flex items-center justify-center mb-4 group-hover:bg-[#00c600]/25 transition-colors">
                    <Icon className="w-6 h-6 text-[#00c600]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Inline login */}
      <section
        ref={loginRef}
        className="px-4 sm:px-6 py-20 max-w-md mx-auto"
        id="login"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-[#2a2a2a] border border-[#333333] shadow-xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-[#00c600]" />
            <h2 className="text-xl font-bold">Sign in</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="landing-email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="landing-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={`mt-1.5 ${inputClass}`}
                disabled={loading}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="landing-password" className="text-gray-300">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs text-[#00c600] hover:underline"
                  onClick={() =>
                    setError('Password reset coming soon — contact your administrator.')
                  }
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="landing-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`mt-1.5 ${inputClass}`}
                disabled={loading}
                required
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-semibold h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Login
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </section>

      <footer className="px-4 py-8 text-center text-gray-600 text-sm border-t border-[#333333]">
        © {new Date().getFullYear()} KG Protech · Campaign in a Box
      </footer>

      {/* Login modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="bg-[#2a2a2a] border-[#444444] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Welcome back</DialogTitle>
            <DialogDescription className="text-gray-400">
              Sign in to access your campaigns, leads, and analytics.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              setLoading(true);
              try {
                await loginAndGoToDashboard(email.trim(), password);
                setLoginOpen(false);
              } catch (err) {
                setError(err.message || 'Login failed');
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-4 mt-2"
          >
            <div>
              <Label htmlFor="modal-email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1.5 ${inputClass}`}
                disabled={loading}
                required
              />
            </div>
            <div>
              <Label htmlFor="modal-password" className="text-gray-300">
                Password
              </Label>
              <Input
                id="modal-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1.5 ${inputClass}`}
                disabled={loading}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00c600] hover:bg-[#00dd00] text-[#212121] font-semibold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
