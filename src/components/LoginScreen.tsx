import React, { useState } from 'react';
import { DatabaseStatus, Role, User } from '../types.ts';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Activity,
  Stethoscope,
  Lock,
  ArrowRight,
  Database,
  Calculator,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface DemoAccountItem {
  id: string;
  soldierId: string;
  username: string;
  demoPassword: string;
  name: string;
  role: Role;
  unit: string;
  squad?: string;
  rank: string;
  email: string;
  riskProfileNote: string;
}

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  dbStatus: DatabaseStatus | null;
  onOpenExplainability: () => void;
  onOpenDbStatus: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  dbStatus,
  onOpenExplainability,
  onOpenDbStatus,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('demo123');
  const [selectedRoleTab, setSelectedRoleTab] = useState<'SOLDIER' | 'COMMANDER' | 'DOCTOR'>('SOLDIER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Predefined demo accounts matching server roster
  const demoAccounts: DemoAccountItem[] = [
    // 8 Soldiers
    {
      id: 'user-soldier-1',
      soldierId: 'SDR-1042',
      username: 'soldier01',
      demoPassword: 'demo123',
      name: 'Sep. Vikram Rawat',
      role: 'SOLDIER',
      rank: 'Sepoy',
      unit: '14 Rajputana Rifles (Alpha Coy)',
      squad: '1st Rifle Section',
      email: 'soldier01@defence.sih.gov.in',
      riskProfileNote: 'High Risk / Heat Strain (Scout)',
    },
    {
      id: 'user-soldier-2',
      soldierId: 'SDR-1043',
      username: 'soldier02',
      demoPassword: 'demo123',
      name: 'L/Nk. Arvind Gurung',
      role: 'SOLDIER',
      rank: 'Lance Naik',
      unit: '14 Rajputana Rifles (Alpha Coy)',
      squad: '1st Rifle Section',
      email: 'soldier02@defence.sih.gov.in',
      riskProfileNote: 'Moderate Strain / 2IC Lead',
    },
    {
      id: 'user-soldier-3',
      soldierId: 'SDR-1044',
      username: 'soldier03',
      demoPassword: 'demo123',
      name: 'Nk. Gurpreet Singh',
      role: 'SOLDIER',
      rank: 'Naik',
      unit: '14 Rajputana Rifles (Alpha Coy)',
      squad: '1st Rifle Section',
      email: 'soldier03@defence.sih.gov.in',
      riskProfileNote: 'Optimal / Combat Ready (LMG)',
    },
    {
      id: 'user-soldier-4',
      soldierId: 'SDR-1045',
      username: 'soldier04',
      demoPassword: 'demo123',
      name: 'Sep. Ramesh Patil',
      role: 'SOLDIER',
      rank: 'Sepoy',
      unit: '14 Rajputana Rifles (Alpha Coy)',
      squad: 'Support Section',
      email: 'soldier04@defence.sih.gov.in',
      riskProfileNote: 'Optimal / Ready (Radio Op)',
    },
    {
      id: 'user-soldier-5',
      soldierId: 'SDR-2088',
      username: 'soldier05',
      demoPassword: 'demo123',
      name: 'Hav. Rajesh Thapa',
      role: 'SOLDIER',
      rank: 'Havildar',
      unit: '9 Parachute SF (Bravo Team)',
      squad: 'Special Assault Team 1',
      email: 'soldier05@defence.sih.gov.in',
      riskProfileNote: 'High Risk / High Altitude SF',
    },
    {
      id: 'user-soldier-6',
      soldierId: 'SDR-2089',
      username: 'soldier06',
      demoPassword: 'demo123',
      name: 'Sep. Manjeet Singh',
      role: 'SOLDIER',
      rank: 'Sepoy',
      unit: '9 Parachute SF (Bravo Team)',
      squad: 'Special Assault Team 1',
      email: 'soldier06@defence.sih.gov.in',
      riskProfileNote: 'Moderate Strain (Pointman)',
    },
    {
      id: 'user-soldier-7',
      soldierId: 'SDR-3014',
      username: 'soldier07',
      demoPassword: 'demo123',
      name: 'Hav. Tanaji Shinde',
      role: 'SOLDIER',
      rank: 'Havildar',
      unit: '21 Maratha Light Infantry (Charlie Sqd)',
      squad: 'Ghatak Platoon',
      email: 'soldier07@defence.sih.gov.in',
      riskProfileNote: 'High Risk / Jungle Heat Patrol',
    },
    {
      id: 'user-soldier-8',
      soldierId: 'SDR-4051',
      username: 'soldier08',
      demoPassword: 'demo123',
      name: 'Sep. Stanzin Norbu',
      role: 'SOLDIER',
      rank: 'Sepoy',
      unit: '7 Ladakh Scouts (Delta Patrol)',
      squad: 'High-Altitude Sentinel Post',
      email: 'soldier08@defence.sih.gov.in',
      riskProfileNote: 'High Risk / Extreme Cold Patrol',
    },

    // 2 Commanders
    {
      id: 'user-commander-1',
      soldierId: 'CMD-501',
      username: 'commander01',
      demoPassword: 'demo123',
      name: 'Major Aditya Chauhan',
      role: 'COMMANDER',
      rank: 'Major',
      unit: '14 Rajputana Rifles (Alpha Coy)',
      squad: 'Company Headquarters',
      email: 'commander01@defence.sih.gov.in',
      riskProfileNote: 'Coy Commander • Anonymized Heatmap',
    },
    {
      id: 'user-commander-2',
      soldierId: 'CMD-502',
      username: 'commander02',
      demoPassword: 'demo123',
      name: 'Col. Vikramaditya Singh',
      role: 'COMMANDER',
      rank: 'Colonel',
      unit: '9 Parachute SF (Bravo Team)',
      squad: 'Special Operations Task Force HQ',
      email: 'commander02@defence.sih.gov.in',
      riskProfileNote: 'Task Force Commander • SF Squads',
    },

    // 2 Doctors / Medical Officers
    {
      id: 'user-doctor-1',
      soldierId: 'MED-802',
      username: 'doctor01',
      demoPassword: 'demo123',
      name: 'Dr. Maj. Ritu Sharma',
      role: 'DOCTOR',
      rank: 'Major (Medical Officer)',
      unit: 'Military Hospital & Field Ambulance Base',
      squad: 'Regimental Medical Inspection Room',
      email: 'doctor01@defence.sih.gov.in',
      riskProfileNote: 'RMO • Clinical Triage & Rest Passes',
    },
    {
      id: 'user-doctor-2',
      soldierId: 'MED-803',
      username: 'doctor02',
      demoPassword: 'demo123',
      name: 'Lt. Col. Dr. A. Sen',
      role: 'DOCTOR',
      rank: 'Lt. Colonel (Chief Medical Specialist)',
      unit: 'Base Hospital & High-Altitude Physiology Center',
      squad: 'Clinical Triage Review Board',
      email: 'doctor02@defence.sih.gov.in',
      riskProfileNote: 'CMO • High Altitude Review',
    },
  ];

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter your Username or Soldier ID');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Try selecting a quick login account below.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (acc: DemoAccountItem) => {
    setUsername(acc.username);
    setPassword(acc.demoPassword);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: acc.username,
          password: acc.demoPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAccounts = demoAccounts.filter((a) => a.role === selectedRoleTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30">
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 border border-emerald-800 rounded text-[11px]">
            SIH26186
          </span>
          <span className="hidden sm:inline font-semibold text-slate-300">
            Smart India Hackathon • Personnel Stress &amp; Welfare Monitoring
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400/90 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Prototype Simulation • Synthetic Data Only • Non-Diagnostic
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenExplainability}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-800 px-2 py-1 rounded border border-slate-700 text-[11px]"
          >
            <Calculator className="w-3 h-3 text-cyan-400" />
            Formula Inspector
          </button>
          <button
            onClick={onOpenDbStatus}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-800 px-2 py-1 rounded border border-slate-700 text-[11px]"
          >
            <Database className="w-3 h-3 text-cyan-400" />
            <span>{dbStatus?.type === 'mongodb_atlas' ? 'MongoDB Atlas M0' : 'In-Memory Store ($0)'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dbStatus?.connected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center gap-8">
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-mono uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Multi-User Defence Access Control
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            VIGIL-WELFARE CORE
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            AI-Based Predictive Personnel Stress and Welfare Monitoring System
          </p>
        </div>

        {/* Two-Column Grid: Manual Login + Quick Switcher */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Manual Login Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Sign In With Credentials
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your assigned Defence personnel credentials
                </p>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                RBAC
              </span>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Authentication Error</p>
                  <p className="text-rose-400/90 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username or Soldier ID
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. soldier01, commander01, doctor01"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tip: All demo accounts use password: <strong className="text-slate-300 font-mono">demo123</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/30 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate &amp; Enter Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Helper Credentials Preview */}
            <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Credentials Quick Guide:</span>
              </div>
              <p>
                • <strong>Soldiers:</strong> <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">soldier01</code> to <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">soldier08</code>
              </p>
              <p>
                • <strong>Commanders:</strong> <code className="text-blue-400 bg-slate-950 px-1 py-0.5 rounded">commander01</code>, <code className="text-blue-400 bg-slate-950 px-1 py-0.5 rounded">commander02</code>
              </p>
              <p>
                • <strong>Medical Officers:</strong> <code className="text-rose-400 bg-slate-950 px-1 py-0.5 rounded">doctor01</code>, <code className="text-rose-400 bg-slate-950 px-1 py-0.5 rounded">doctor02</code>
              </p>
              <p className="text-slate-500">
                • Standard Password for all: <code className="text-slate-300">demo123</code>
              </p>
            </div>
          </div>

          {/* Right Column: 1-Click Interactive Roster for Evaluators (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-base font-bold text-white">
                      1-Click Hackathon Evaluator Quick Login
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any personnel below to instantly log in and test isolated role views
                  </p>
                </div>

                {/* Role Tabs */}
                <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                  <button
                    onClick={() => setSelectedRoleTab('SOLDIER')}
                    className={`px-3 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedRoleTab === 'SOLDIER'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Soldiers (8)</span>
                  </button>
                  <button
                    onClick={() => setSelectedRoleTab('COMMANDER')}
                    className={`px-3 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedRoleTab === 'COMMANDER'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Activity className="w-3 h-3" />
                    <span>Commanders (2)</span>
                  </button>
                  <button
                    onClick={() => setSelectedRoleTab('DOCTOR')}
                    className={`px-3 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedRoleTab === 'DOCTOR'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Stethoscope className="w-3 h-3" />
                    <span>Doctors (2)</span>
                  </button>
                </div>
              </div>

              {/* Strict Isolation Notice */}
              <div className="mb-4 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    {selectedRoleTab === 'SOLDIER' &&
                      'Role Isolation Active: Soldiers can ONLY see their own telemetry, biometrics & logs.'}
                    {selectedRoleTab === 'COMMANDER' &&
                      'Privacy Active: Commanders view squad-level readiness & anonymized IDs.'}
                    {selectedRoleTab === 'DOCTOR' &&
                      'Medical Access: Doctors view clinical alerts, triage, & Tactical Rest Passes.'}
                  </span>
                </span>
                <span className="font-mono text-emerald-400 text-[10px]">ENFORCED</span>
              </div>

              {/* Grid of Accounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredAccounts.map((acc) => {
                  const isHighRisk = acc.riskProfileNote.includes('High Risk');
                  const isModerate = acc.riskProfileNote.includes('Moderate');

                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleQuickLogin(acc)}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        acc.role === 'SOLDIER'
                          ? 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/60'
                          : acc.role === 'COMMANDER'
                          ? 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-blue-500/60'
                          : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-rose-500/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs group-hover:text-emerald-300 transition-colors">
                              {acc.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {acc.username}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {acc.rank} · {acc.unit}
                          </p>
                          {acc.squad && (
                            <p className="text-[10px] text-slate-500 font-mono">{acc.squad}</p>
                          )}
                        </div>

                        {/* Status chip */}
                        {acc.role === 'SOLDIER' && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                              isHighRisk
                                ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                                : isModerate
                                ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                                : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                            }`}
                          >
                            {isHighRisk ? 'HIGH STRAIN' : isModerate ? 'MODERATE' : 'READY'}
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 italic line-clamp-1">
                          {acc.riskProfileNote}
                        </span>
                        <span
                          className={`font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ${
                            acc.role === 'SOLDIER'
                              ? 'text-emerald-400'
                              : acc.role === 'COMMANDER'
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          Sign In &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Note */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Prototype build for Smart India Hackathon (SIH26186)</span>
              <span className="text-emerald-400/90 font-mono">₹0 / $0 Cost Architecture</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 px-4 text-center text-xs text-slate-500">
        SIH26186 — AI-Based Predictive Personnel Stress and Welfare Monitoring System • Defence Prototype Only
      </footer>
    </div>
  );
};
