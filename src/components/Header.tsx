import React, { useState } from 'react';
import { DatabaseStatus, Role, User } from '../types.ts';
import {
  ShieldAlert,
  Activity,
  UserCheck,
  Stethoscope,
  Database,
  Calculator,
  RotateCcw,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Shield,
  Lock,
} from 'lucide-react';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  currentUser: User | null;
  onLogout: () => void;
  allUsers?: User[];
  onQuickSwitchUser?: (user: User) => void;
  dbStatus: DatabaseStatus | null;
  onOpenExplainability: () => void;
  onOpenDbStatus: () => void;
  onResetData: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  onLogout,
  allUsers = [],
  onQuickSwitchUser,
  dbStatus,
  onOpenExplainability,
  onOpenDbStatus,
  onResetData,
  isResetting,
}) => {
  const [isSwitchMenuOpen, setIsSwitchMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
      {/* Top Banner: SIH Project Identification */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-800/60 rounded">
            SIH26186
          </span>
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-cyan-300 bg-cyan-950/60 px-2 py-0.5 border border-cyan-800/60 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Prototype Simulation
          </span>
          <span className="font-semibold text-slate-300 hidden sm:inline">
            AI-Based Predictive Personnel Stress &amp; Welfare Monitoring System
          </span>
          <span className="hidden md:inline-block text-slate-600">|</span>
          <span className="hidden lg:inline-block text-slate-400">
            Armed Forces Operational Readiness Division
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 sm:mt-0">
          <span className="inline-flex items-center gap-1 text-amber-400/90 bg-amber-950/40 px-2 py-0.5 border border-amber-900/50 rounded text-[10px]">
            <ShieldAlert className="w-3 h-3" />
            Non-Clinical / Advisory Only
          </span>

          <button
            onClick={onOpenDbStatus}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-800/80 px-2 py-0.5 border border-slate-700 rounded text-[11px]"
            title="View Database Status"
          >
            <Database className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">
              {dbStatus?.type === 'mongodb_atlas' ? 'MongoDB Atlas M0' : 'In-Memory Store ($0)'}
            </span>
            <span className="sm:hidden">DB</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dbStatus?.connected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Header Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Logo and Context */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                VIGIL-WELFARE CORE
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                v2.0-SIH
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Heuristic Biometric Stress &amp; Squad Readiness Portal
            </p>
          </div>
        </div>

        {/* Action Controls & Logged-In User Profile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Explainability button */}
          <button
            onClick={onOpenExplainability}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded transition-colors cursor-pointer"
            title="Inspect Heuristic Stress Calculation"
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Formula Inspector</span>
          </button>

          {/* Reset Demo Data button */}
          <button
            onClick={onResetData}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded transition-colors cursor-pointer disabled:opacity-50"
            title="Reset to default synthetic dataset"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          {/* Logged in User Badge & Account Switcher Dropdown */}
          {currentUser && (
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setIsSwitchMenuOpen(!isSwitchMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded text-xs text-left hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      currentUser.role === 'SOLDIER'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : currentUser.role === 'COMMANDER'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {currentUser.role === 'SOLDIER'
                      ? 'S'
                      : currentUser.role === 'COMMANDER'
                      ? 'C'
                      : 'M'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white text-xs">{currentUser.name}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded font-mono ${
                          currentUser.role === 'SOLDIER'
                            ? 'bg-emerald-900/60 text-emerald-300'
                            : currentUser.role === 'COMMANDER'
                            ? 'bg-blue-900/60 text-blue-300'
                            : 'bg-rose-900/60 text-rose-300'
                        }`}
                      >
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {currentUser.rank} · {currentUser.unit.split(' ')[0]}
                    </p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-500 ml-1" />
                </button>

                <div className="h-6 w-px bg-slate-800" />

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer rounded hover:bg-rose-950/40"
                  title="Logout / Change User"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Switch Dropdown for Evaluators */}
              {isSwitchMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSwitchMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-xs">
                    <div className="px-2 py-1.5 border-b border-slate-800 font-semibold text-slate-300 flex items-center justify-between">
                      <span>Evaluator Quick Switch</span>
                      <span className="text-[10px] text-slate-500 font-normal">Click to switch</span>
                    </div>

                    <div className="py-1 max-h-64 overflow-y-auto space-y-1">
                      {allUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            if (onQuickSwitchUser) onQuickSwitchUser(u);
                            setIsSwitchMenuOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                            u.soldierId === currentUser.soldierId
                              ? 'bg-slate-800 text-white font-medium'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs">{u.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {u.soldierId}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              {u.rank} · {u.unit.slice(0, 20)}...
                            </p>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              u.role === 'SOLDIER'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                                : u.role === 'COMMANDER'
                                ? 'bg-blue-950 text-blue-400 border border-blue-900'
                                : 'bg-rose-950 text-rose-400 border border-rose-900'
                            }`}
                          >
                            {u.role}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setIsSwitchMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full py-1 text-center text-xs text-rose-400 hover:text-rose-300 font-medium hover:bg-rose-950/30 rounded cursor-pointer"
                      >
                        Exit to Login Screen
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Role Navigation Badges (Enforcing RBAC) */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
            {currentUser?.role === 'SOLDIER' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-emerald-600 text-white shadow-sm">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Soldier Portal</span>
                <span className="text-[10px] opacity-80 font-mono">({currentUser.soldierId})</span>
              </div>
            ) : currentUser?.role === 'COMMANDER' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-blue-600 text-white shadow-sm">
                <Activity className="w-3.5 h-3.5" />
                <span>Commander Oversight</span>
              </div>
            ) : currentUser?.role === 'DOCTOR' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-rose-600 text-white shadow-sm">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Medical Officer Portal</span>
              </div>
            ) : (
              // Fallback role switchers if no user logged in
              <>
                <button
                  onClick={() => onRoleChange('SOLDIER')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                    currentRole === 'SOLDIER'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Soldier</span>
                </button>
                <button
                  onClick={() => onRoleChange('COMMANDER')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                    currentRole === 'COMMANDER'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Commander</span>
                </button>
                <button
                  onClick={() => onRoleChange('DOCTOR')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                    currentRole === 'DOCTOR'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Medical Officer</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
