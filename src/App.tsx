/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  BiometricLog,
  CalculationThresholds,
  CalculationWeights,
  CommanderAction,
  DatabaseStatus,
  EnvironmentalCondition,
  InterventionStatus,
  Role,
  SquadReadinessSummary,
  StressAlert,
  User,
} from './types.ts';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { RegisterPage } from './components/auth/RegisterPage.tsx';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal.tsx';
import { AppShell, NavTab } from './components/layout/AppShell.tsx';
import { SoldierDashboard } from './components/SoldierDashboard.tsx';
import { CommanderDashboard } from './components/CommanderDashboard.tsx';
import { DoctorDashboard } from './components/DoctorDashboard.tsx';
import { ExplainabilityModal } from './components/ExplainabilityModal.tsx';
import { MongoStatusModal } from './components/MongoStatusModal.tsx';
import { DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS } from './utils/stressCalculator.ts';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('sih_active_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Client Routing State for Login/Register
  const [authRoute, setAuthRoute] = useState<'login' | 'register'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/register') {
      return 'register';
    }
    return 'login';
  });

  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Active navigation tab within authenticated shell
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // Core Data States
  const [users, setUsers] = useState<User[]>([]);
  const [allSoldiers, setAllSoldiers] = useState<
    Array<{ soldierId: string; name: string; rank: string; unit: string }>
  >([]);
  const [selectedSoldierId, setSelectedSoldierId] = useState<string>(
    currentUser?.soldierId || 'SDR-1042'
  );
  const [soldierLogs, setSoldierLogs] = useState<BiometricLog[]>([]);
  const [squadReadiness, setSquadReadiness] = useState<SquadReadinessSummary | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [alerts, setAlerts] = useState<StressAlert[]>([]);
  const [commanderActions, setCommanderActions] = useState<CommanderAction[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  const [weights, setWeights] = useState<CalculationWeights>(DEFAULT_WEIGHTS);
  const [thresholds, setThresholds] = useState<CalculationThresholds>(DEFAULT_THRESHOLDS);

  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Units list
  const units = [
    '14 Rajputana Rifles (Alpha Coy)',
    '9 Parachute SF (Bravo Team)',
    '21 Maratha Light Infantry (Charlie Sqd)',
    '7 Ladakh Scouts (Delta Patrol)',
  ];

  // Route Synchronization & Guard
  useEffect(() => {
    if (!currentUser) {
      if (authRoute === 'register') {
        window.history.replaceState(null, '', '/register');
      } else {
        window.history.replaceState(null, '', '/login');
      }
    } else {
      if (currentUser.role === 'SOLDIER') {
        window.history.replaceState(null, '', '/soldier');
      } else if (currentUser.role === 'COMMANDER') {
        window.history.replaceState(null, '', '/commander');
      } else if (currentUser.role === 'DOCTOR') {
        window.history.replaceState(null, '', '/doctor');
      }
    }
  }, [currentUser, authRoute]);

  // Fetch DB Status
  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err: any) {
      console.warn('API fetchDbStatus fallback:', err.message);
    }
  }, []);

  // Fetch Commander Actions
  const fetchCommanderActions = useCallback(async () => {
    try {
      const res = await fetch('/api/commander/actions');
      if (res.ok) {
        const data = await res.json();
        setCommanderActions(data);
      }
    } catch (err: any) {
      console.error('fetchCommanderActions error:', err);
    }
  }, []);

  // Fetch Soldier Logs (Filtered strictly to soldierId)
  const fetchSoldierLogs = useCallback(async (soldierId: string) => {
    try {
      const res = await fetch(`/api/logs?soldierId=${soldierId}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        setSoldierLogs(data);
      }
    } catch (err: any) {
      console.error('fetchSoldierLogs error:', err);
    }
  }, []);

  // Fetch Squad Readiness for Commander
  const fetchSquadReadiness = useCallback(async (unit: string) => {
    try {
      const url =
        unit === 'ALL'
          ? '/api/commander/readiness'
          : `/api/commander/readiness?unit=${encodeURIComponent(unit)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSquadReadiness(data);
      }
    } catch (err: any) {
      console.error('fetchSquadReadiness error:', err);
    }
  }, []);

  // Fetch Alerts for Doctor
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/doctor/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err: any) {
      console.error('fetchAlerts error:', err);
    }
  }, []);

  // Fetch Initial Data (only triggered when authenticated to prevent data leakage)
  const fetchAuthenticatedData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [usersRes, soldiersRes, configRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/soldiers'),
        fetch('/api/config'),
      ]);

      if (usersRes.ok) {
        const userData: User[] = await usersRes.json();
        setUsers(userData);
      }

      if (soldiersRes.ok) {
        const soldierList = await soldiersRes.json();
        setAllSoldiers(soldierList);
      }

      if (configRes.ok) {
        const cfg = await configRes.json();
        if (cfg.weights) setWeights(cfg.weights);
        if (cfg.thresholds) setThresholds(cfg.thresholds);
      }

      await Promise.all([fetchDbStatus(), fetchCommanderActions()]);
    } catch (err: any) {
      console.error('Authenticated initialization error:', err);
      setErrorMessage('Could not connect to local API server.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchDbStatus, fetchCommanderActions]);

  // Load data only when user is authenticated
  useEffect(() => {
    if (currentUser) {
      fetchAuthenticatedData();
      if (currentUser.role === 'SOLDIER' && currentUser.soldierId) {
        setSelectedSoldierId(currentUser.soldierId);
        fetchSoldierLogs(currentUser.soldierId);
      } else if (currentUser.role === 'COMMANDER') {
        fetchSquadReadiness(selectedUnit);
        fetchCommanderActions();
      } else if (currentUser.role === 'DOCTOR') {
        fetchAlerts();
      }
    } else {
      // Background DB status check for login indicators
      fetchDbStatus();
    }
  }, [currentUser, selectedUnit, fetchAuthenticatedData, fetchSoldierLogs, fetchSquadReadiness, fetchCommanderActions, fetchAlerts, fetchDbStatus]);

  // Login Handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('overview');
    try {
      sessionStorage.setItem('sih_active_user', JSON.stringify(user));
    } catch (err) {
      console.warn('sessionStorage error:', err);
    }

    if (user.role === 'SOLDIER' && user.soldierId) {
      setSelectedSoldierId(user.soldierId);
      fetchSoldierLogs(user.soldierId);
    } else if (user.role === 'COMMANDER') {
      fetchSquadReadiness(selectedUnit);
      fetchCommanderActions();
    } else if (user.role === 'DOCTOR') {
      fetchAlerts();
    }
  };

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    setAuthRoute('login');
    setActiveTab('overview');
    setSoldierLogs([]);
    setSquadReadiness(null);
    setAlerts([]);
    try {
      sessionStorage.removeItem('sih_active_user');
    } catch (err) {
      console.warn('sessionStorage error:', err);
    }
  };

  // Submit new biometric log
  const handleSubmitLog = async (data: {
    soldierId: string;
    date: string;
    hrv: number;
    sleepHours: number;
    restingHeartRate: number;
    dutyDuration: number;
    environmentalCondition?: EnvironmentalCondition;
    notes?: string;
  }) => {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit log');
    }

    await Promise.all([
      fetchSoldierLogs(data.soldierId),
      fetchSquadReadiness(selectedUnit),
      fetchAlerts(),
      fetchDbStatus(),
    ]);
  };

  // Commander action issuer (Stand-down / Shift rotation)
  const handleIssueCommanderAction = async (data: {
    targetAnonId: string;
    soldierId: string;
    soldierName?: string;
    unit: string;
    actionType: 'STAND_DOWN_24H' | 'AUTO_ROTATE_SHIFT';
    commanderNotes?: string;
  }) => {
    const res = await fetch('/api/commander/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to issue commander action');
    }

    await Promise.all([
      fetchCommanderActions(),
      fetchSquadReadiness(selectedUnit),
      fetchSoldierLogs(selectedSoldierId),
      fetchAlerts(),
      fetchDbStatus(),
    ]);
  };

  // Update alert review status (Doctor)
  const handleUpdateAlert = async (
    alertId: string,
    updates: {
      status: StressAlert['status'];
      interventionStatus?: InterventionStatus;
      doctorNotes: string;
      reviewedBy: string;
      recommendedRestPeriod?: string;
    }
  ) => {
    const res = await fetch(`/api/doctor/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update alert');
    }

    await Promise.all([fetchAlerts(), fetchDbStatus()]);
  };

  // Save calculation config
  const handleSaveConfig = async (
    newWeights: CalculationWeights,
    newThresholds: CalculationThresholds
  ) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights: newWeights, thresholds: newThresholds }),
      });
      if (res.ok) {
        setWeights(newWeights);
        setThresholds(newThresholds);
        fetchSoldierLogs(selectedSoldierId);
        fetchSquadReadiness(selectedUnit);
        fetchAlerts();
      }
    } catch (err: any) {
      console.error('Config save error:', err);
    }
  };

  // Reset demo synthetic data
  const handleResetData = async () => {
    if (!window.confirm('Reset all demo biometric logs, alerts, and actions back to default synthetic state?')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset-demo', { method: 'POST' });
      if (res.ok) {
        await Promise.all([
          fetchAuthenticatedData(),
          fetchSoldierLogs(selectedSoldierId),
          fetchSquadReadiness(selectedUnit),
          fetchAlerts(),
          fetchCommanderActions(),
          fetchDbStatus(),
        ]);
      }
    } catch (err: any) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // ============================================================
  // 1. UNATHENTICATED STATE: ONLY LOGIN OR REGISTER SCREEN IS RENDERED
  // ============================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        {authRoute === 'register' ? (
          <RegisterPage
            onNavigateToLogin={(msg) => {
              setAuthRoute('login');
              if (msg) setRegistrationNotice(msg);
            }}
          />
        ) : (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => {
              setRegistrationNotice(null);
              setAuthRoute('register');
            }}
            onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
            registrationSuccessMessage={registrationNotice}
          />
        )}

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      </div>
    );
  }

  // ============================================================
  // 2. AUTHENTICATED STATE: PROFESSIONAL APPLICATION SHELL & DASHBOARD
  // ============================================================
  return (
    <AppShell
      currentUser={currentUser}
      onLogout={handleLogout}
      activeTab={activeTab}
      onSelectTab={(tab) => setActiveTab(tab)}
      dbStatus={dbStatus}
      onOpenExplainability={() => setIsExplainabilityOpen(true)}
      onOpenDbStatus={() => setIsDbModalOpen(true)}
    >
      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-center justify-center p-8 text-slate-400 gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-sm">Synchronizing personnel records...</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-950/60 border border-rose-800 rounded-lg flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchAuthenticatedData()}
            className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-white rounded cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Role Dashboard Routing */}
      {!isLoading && (
        <>
          {currentUser.role === 'SOLDIER' && (
            <SoldierDashboard
              soldier={currentUser}
              logs={soldierLogs}
              onSubmitLog={handleSubmitLog}
              weights={weights}
              thresholds={thresholds}
              activeTab={activeTab as any}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {currentUser.role === 'COMMANDER' && (
            <CommanderDashboard
              readiness={squadReadiness}
              selectedUnit={selectedUnit}
              onSelectUnit={setSelectedUnit}
              units={units}
              actions={commanderActions}
              onIssueAction={handleIssueCommanderAction}
              activeTab={activeTab as any}
            />
          )}

          {currentUser.role === 'DOCTOR' && (
            <DoctorDashboard
              alerts={alerts}
              allSoldiers={allSoldiers}
              selectedSoldierId={selectedSoldierId}
              onSelectSoldier={(id) => {
                setSelectedSoldierId(id);
                fetchSoldierLogs(id);
              }}
              soldierLogs={soldierLogs}
              units={units}
              onUpdateAlert={handleUpdateAlert}
              activeTab={activeTab as any}
            />
          )}
        </>
      )}

      {/* Calculation Inspector Modal */}
      <ExplainabilityModal
        isOpen={isExplainabilityOpen}
        onClose={() => setIsExplainabilityOpen(false)}
        weights={weights}
        thresholds={thresholds}
        onSaveConfig={handleSaveConfig}
      />

      {/* Database Status & MongoDB Atlas M0 Modal */}
      <MongoStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        status={dbStatus}
        onResetData={handleResetData}
        isResetting={isResetting}
      />
    </AppShell>
  );
}
