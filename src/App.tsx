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
import { Header } from './components/Header.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { SoldierDashboard } from './components/SoldierDashboard.tsx';
import { CommanderDashboard } from './components/CommanderDashboard.tsx';
import { DoctorDashboard } from './components/DoctorDashboard.tsx';
import { ExplainabilityModal } from './components/ExplainabilityModal.tsx';
import { MongoStatusModal } from './components/MongoStatusModal.tsx';
import { DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS } from './utils/stressCalculator.ts';
import { Shield, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('sih_active_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentRole, setCurrentRole] = useState<Role>(currentUser?.role || 'SOLDIER');
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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Units list
  const units = [
    '14 Rajputana Rifles (Alpha Coy)',
    '9 Parachute SF (Bravo Team)',
    '21 Maratha Light Infantry (Charlie Sqd)',
    '7 Ladakh Scouts (Delta Patrol)',
  ];

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

  // Fetch Users & Soldiers
  const fetchInitialData = useCallback(async () => {
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
      console.error('Initialization error:', err);
      setErrorMessage('Could not connect to local API server. Retrying...');
    } finally {
      setIsLoading(false);
    }
  }, [fetchDbStatus, fetchCommanderActions]);

  // Load initial data on mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // When current user changes, trigger targeted data queries
  useEffect(() => {
    if (currentUser) {
      setCurrentRole(currentUser.role);
      if (currentUser.role === 'SOLDIER' && currentUser.soldierId) {
        setSelectedSoldierId(currentUser.soldierId);
        fetchSoldierLogs(currentUser.soldierId);
      } else if (currentUser.role === 'COMMANDER') {
        fetchSquadReadiness(selectedUnit);
        fetchCommanderActions();
      } else if (currentUser.role === 'DOCTOR') {
        fetchAlerts();
      }
    }
  }, [currentUser, selectedUnit, fetchSoldierLogs, fetchSquadReadiness, fetchCommanderActions, fetchAlerts]);

  // Handlers for Authentication
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
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

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('sih_active_user');
    } catch (err) {
      console.warn('sessionStorage error:', err);
    }
  };

  const handleQuickSwitchUser = (user: User) => {
    handleLoginSuccess(user);
  };

  // Switch role handler (when enabled)
  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      handleLoginSuccess(targetUser);
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

    // Refresh logs and statuses
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

    // Refresh commander state & soldier logs
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
          fetchInitialData(),
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

  // If not authenticated, render Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          dbStatus={dbStatus}
          onOpenExplainability={() => setIsExplainabilityOpen(true)}
          onOpenDbStatus={() => setIsDbModalOpen(true)}
        />

        {/* Explainability & Calculation Inspector Modal */}
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
      </div>
    );
  }

  // Active Soldier user profile
  const soldierUser: User = currentUser;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header with User Badge & Logout */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUser}
        onLogout={handleLogout}
        allUsers={users}
        onQuickSwitchUser={handleQuickSwitchUser}
        dbStatus={dbStatus}
        onOpenExplainability={() => setIsExplainabilityOpen(true)}
        onOpenDbStatus={() => setIsDbModalOpen(true)}
        onResetData={handleResetData}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center justify-center p-12 text-slate-400 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
            <span className="text-sm">Synchronizing Defence Welfare Core Telemetry...</span>
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
              onClick={() => fetchInitialData()}
              className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-white rounded cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Active Role Dashboard View with Strict Role Isolation */}
        {!isLoading && (
          <>
            {currentRole === 'SOLDIER' && (
              <SoldierDashboard
                soldier={soldierUser}
                logs={soldierLogs}
                onSubmitLog={handleSubmitLog}
                weights={weights}
                thresholds={thresholds}
              />
            )}

            {currentRole === 'COMMANDER' && (
              <CommanderDashboard
                readiness={squadReadiness}
                selectedUnit={selectedUnit}
                onSelectUnit={setSelectedUnit}
                units={units}
                actions={commanderActions}
                onIssueAction={handleIssueCommanderAction}
              />
            )}

            {currentRole === 'DOCTOR' && (
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
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>SIH26186 • Predictive Personnel Stress &amp; Welfare Monitoring Prototype</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Synthetic Demonstration Data Only</span>
            <span>·</span>
            <span>₹0 Cost Architecture • MongoDB Atlas M0 Ready</span>
          </div>
        </div>
      </footer>

      {/* Explainability & Calculation Inspector Modal */}
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
    </div>
  );
}
