import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  role: 'customer' | 'admin';
};

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (payload: { token: string; user: AuthUser }) => void;
};

export default function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setError('');
      setPassword('');
    }
  }, [open]);

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body: Record<string, string> = { email: email.trim(), password };
      if (mode === 'register') {
        body.name = name;
        body.phone = phone;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const raw = await response.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!response.ok) {
        throw new Error(data?.error || 'Authentication failed');
      }
      onSuccess({ token: data.token, user: data.user });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        data-lenis-prevent
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-brand-bg-alt border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="px-8 pt-8 pb-4">
            <h2 className="font-display font-bold text-2xl text-white tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-brand-slate mt-1">
              {mode === 'login'
                ? 'Sign in to your CinePass account'
                : 'Join CinePass to start booking'}
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-6 space-y-4">
            {error && (
              <div className="px-4 py-3 bg-brand-crimson/10 border border-brand-crimson/30 rounded-xl text-sm text-brand-crimson">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/50" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 transition-colors"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/50" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 transition-colors"
              />
            </div>

            {mode === 'register' && (
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/50" />
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 transition-colors"
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/50" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-indigo/50 transition-colors"
              />
            </div>

            <button
              onClick={submit}
              disabled={loading || !email || !password}
              className="w-full py-3.5 bg-brand-crimson hover:bg-brand-crimson/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium uppercase tracking-widest text-sm transition-all"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 text-center">
            <p className="text-sm text-brand-slate">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="text-brand-crimson hover:text-white transition-colors font-medium"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
