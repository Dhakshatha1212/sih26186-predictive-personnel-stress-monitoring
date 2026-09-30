import React, { useState } from 'react';
import { Role, User } from '../../types.ts';
import {
  Shield,
  ArrowLeft,
  User as UserIcon,
  Mail,
  Lock,
  Building,
  Users,
  IdCard,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigateToLogin: (successMsg?: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('SOLDIER');
  const [unit, setUnit] = useState('14 Rajputana Rifles (Alpha Coy)');
  const [squad, setSquad] = useState('1st Rifle Section');
  const [soldierId, setSoldierId] = useState('');
  const [rank, setRank] = useState('Sepoy');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unitsList = [
    '14 Rajputana Rifles (Alpha Coy)',
    '9 Parachute SF (Bravo Team)',
    '21 Maratha Light Infantry (Charlie Sqd)',
    '7 Ladakh Scouts (Delta Patrol)',
    'Military Hospital & Field Ambulance Base',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!name.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (role === 'SOLDIER' && !soldierId.trim()) {
      setErrorMessage('Soldier ID is required for Soldier registration (e.g. SDR-1049).');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          unit,
          squad: squad.trim(),
          soldierId: role === 'SOLDIER' ? soldierId.trim() : undefined,
          rank,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account.');
      }

      onNavigateToLogin('Account created successfully. Please sign in with your credentials.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error. Please verify the information entered.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-slate-700 selection:text-white">
      {/* Top minimal bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => onNavigateToLogin()}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>
        <span className="text-xs text-slate-500 font-mono">SIH26186 • New Personnel Onboarding</span>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Shield className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Official Account Setup
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Create Personnel Account
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Register for access to the personnel welfare and operational readiness platform
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sep. Vijay Rawat or Major S. K. Nair"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                  required
                />
                <UserIcon className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Official Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="personnel@defence.gov.in"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Personnel Role <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['SOLDIER', 'COMMANDER', 'DOCTOR'] as Role[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => {
                      setRole(r);
                      if (r === 'COMMANDER') setRank('Major');
                      else if (r === 'DOCTOR') setRank('Medical Officer');
                      else setRank('Sepoy');
                    }}
                    className={`py-2 px-3 text-xs font-medium rounded-md border text-center transition-colors cursor-pointer ${
                      role === r
                        ? 'bg-slate-800 text-white border-slate-600 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {r === 'SOLDIER' ? 'Soldier' : r === 'COMMANDER' ? 'Commander' : 'Doctor / MO'}
                  </button>
                ))}
              </div>
            </div>

            {/* Unit & Squad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assigned Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-600 cursor-pointer"
                >
                  {unitsList.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Squad / Section
                </label>
                <input
                  type="text"
                  value={squad}
                  onChange={(e) => setSquad(e.target.value)}
                  placeholder="e.g. 1st Rifle Section or HQ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600"
                />
              </div>
            </div>

            {/* Soldier ID (only if Soldier role) */}
            {role === 'SOLDIER' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Soldier ID <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={soldierId}
                    onChange={(e) => setSoldierId(e.target.value.toUpperCase())}
                    placeholder="e.g. SDR-1049"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-600 font-mono uppercase"
                    required
                  />
                  <IdCard className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Your unique military service identifier for personal welfare tracking.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-md text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Registering Account...</span>
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => onNavigateToLogin()}
              className="font-medium text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer ml-1"
            >
              Sign In
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-3 text-center text-xs text-slate-500">
        AI-Based Personnel Welfare Monitoring System • Strict Privacy &amp; Data Isolation
      </footer>
    </div>
  );
};
