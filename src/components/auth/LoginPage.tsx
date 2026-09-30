import React, { useState } from 'react';
import { User } from '../../types.ts';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HeartHandshake,
  Activity,
  Users,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
  onOpenForgotPassword: () => void;
  registrationSuccessMessage?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onOpenForgotPassword,
  registrationSuccessMessage,
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameOrEmail.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to the authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-slate-700 selection:text-white">
      {/* Top minimal bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-200">
            Personnel Welfare Monitoring System
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Secure personnel portal</span>
        </div>
      </header>

      {/* Main split content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left side: Visual / Photographic & Welfare statement */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
            {/* Subtle architectural / human pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700/80 text-[11px] font-medium text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Personnel Welfare &amp; Readiness</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
                Supporting informed welfare decisions through continuous monitoring.
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                A human-centered system dedicated to tracking physiological recovery, sleep quality, and operational tempo to safeguard service personnel.
              </p>
            </div>

            {/* Muted graphic representation of personnel wellbeing */}
            <div className="relative z-10 my-8 bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  Welfare Core Principles
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Confidential</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Early identification of accumulated strain</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Anonymized squad-level readiness visibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Medical officer clinical decision support</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
              <span>Prototype • SIH 2026</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Multi-Role Architecture
              </span>
            </div>
          </div>

          {/* Right side: Clean Login Card */}
          <div className="p-8 sm:p-10 flex flex-col justify-center bg-slate-900/50">
            <div className="mb-6">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials to access your designated welfare portal
              </p>
            </div>

            {registrationSuccessMessage && (
              <div className="mb-5 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{registrationSuccessMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="name@unit.mil or username"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-colors"
                    required
                    autoFocus
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onOpenForgotPassword}
                    className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600 transition-colors"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer ml-1"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-3 text-center text-xs text-slate-500">
        AI-Based Personnel Welfare Monitoring System • SIH Prototype • Designed for Service Personnel Care
      </footer>
    </div>
  );
};
