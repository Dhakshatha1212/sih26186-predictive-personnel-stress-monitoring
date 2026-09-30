import React, { useState } from 'react';
import { DatabaseStatus, Role, User } from '../../types.ts';
import {
  Shield,
  Activity,
  HeartHandshake,
  LogOut,
  Calculator,
  Database,
  Menu,
  X,
  User as UserIcon,
  Home,
  FileEdit,
  TrendingUp,
  Bell,
  Users,
  Grid,
  History,
  Stethoscope,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';

export type SoldierNavTab = 'overview' | 'daily-log' | 'trends' | 'alerts' | 'profile';
export type CommanderNavTab = 'overview' | 'unit-readiness' | 'squad-monitoring' | 'alerts' | 'action-history';
export type DoctorNavTab = 'overview' | 'personnel-review' | 'high-risk' | 'interventions' | 'alerts';

export type NavTab = SoldierNavTab | CommanderNavTab | DoctorNavTab;

interface AppShellProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  dbStatus: DatabaseStatus | null;
  onOpenExplainability: () => void;
  onOpenDbStatus: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentUser,
  onLogout,
  activeTab,
  onSelectTab,
  dbStatus,
  onOpenExplainability,
  onOpenDbStatus,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define role-specific navigation items strictly according to user requirements
  const getNavItems = (): Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> => {
    if (currentUser.role === 'SOLDIER') {
      return [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'daily-log', label: 'Daily Welfare Log', icon: FileEdit },
        { id: 'trends', label: 'My Trends', icon: TrendingUp },
        { id: 'alerts', label: 'My Alerts', icon: Bell },
        { id: 'profile', label: 'Profile', icon: UserIcon },
      ];
    } else if (currentUser.role === 'COMMANDER') {
      return [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'unit-readiness', label: 'Unit Readiness', icon: Activity },
        { id: 'squad-monitoring', label: 'Squad Monitoring', icon: Grid },
        { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
        { id: 'action-history', label: 'Action History', icon: History },
      ];
    } else {
      return [
        { id: 'overview', label: 'Overview', icon: Home },
        { id: 'personnel-review', label: 'Personnel Review', icon: Users },
        { id: 'high-risk', label: 'High-Risk Cases', icon: AlertTriangle },
        { id: 'interventions', label: 'Interventions', icon: ClipboardList },
        { id: 'alerts', label: 'Alerts', icon: Bell },
      ];
    }
  };

  const navItems = getNavItems();

  const getRoleBadgeStyle = (r: Role) => {
    switch (r) {
      case 'SOLDIER':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      case 'COMMANDER':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
      case 'DOCTOR':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/80';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-slate-700 selection:text-white">
      {/* Top Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">
                Personnel Welfare Monitoring
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                SIH26186
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Continuous Welfare &amp; Readiness Triage Platform
            </p>
          </div>
        </div>

        {/* Right: Tools & User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle Formula Inspector */}
          <button
            onClick={onOpenExplainability}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            title="Inspect Heuristic Weights & Thresholds"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-400" />
            <span>Formula</span>
          </button>

          {/* Database status pill */}
          <button
            onClick={onOpenDbStatus}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            title="System & Database Connectivity"
          >
            <Database className="w-3 h-3 text-slate-400" />
            <span className="hidden md:inline">
              {dbStatus?.type === 'mongodb_atlas' ? 'MongoDB Atlas M0' : 'Local Store'}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dbStatus?.connected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* User profile identifier */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-200">{currentUser.name}</span>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border font-mono ${getRoleBadgeStyle(
                    currentUser.role
                  )}`}
                >
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">
                {currentUser.rank} · {currentUser.unit.split(' ')[0]}
              </p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-rose-300 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 px-2.5 py-1 rounded-md transition-colors cursor-pointer ml-1"
            title="Sign out of system"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-300" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* App Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-slate-800/80 bg-slate-950/60 p-4 shrink-0 justify-between">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
              {currentUser.role === 'SOLDIER'
                ? 'Personnel Space'
                : currentUser.role === 'COMMANDER'
                ? 'Operational Command'
                : 'Clinical Workspace'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar Note */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
              <span>Welfare Protocol</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Confidential personnel telemetry for readiness triage.
            </p>
          </div>
        </aside>

        {/* Mobile Dropdown Nav Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-[53px] z-30 bg-slate-900 border-b border-slate-800 p-4 space-y-1 shadow-2xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-md transition-colors text-left ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global restrained footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Personnel Welfare Monitoring System • SIH26186 Prototype</span>
          <span className="text-[11px] text-slate-600">
            Confidential Military Health &amp; Readiness Triage
          </span>
        </div>
      </footer>
    </div>
  );
};
