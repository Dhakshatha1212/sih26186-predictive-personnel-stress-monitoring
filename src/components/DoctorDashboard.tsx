import React, { useState } from 'react';
import { BiometricLog, InterventionStatus, RiskLevel, StressAlert, TacticalRestPass } from '../types.ts';
import { TrendLineChart, MultiMetricChart } from './StressChart.tsx';
import { TacticalRestPassModal } from './TacticalRestPassModal.tsx';
import {
  Stethoscope,
  AlertOctagon,
  CheckCircle,
  Clock,
  User,
  Heart,
  Moon,
  Activity,
  FileText,
  Filter,
  Eye,
  Check,
  RotateCcw,
  Printer,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

interface DoctorDashboardProps {
  alerts: StressAlert[];
  allSoldiers: Array<{ soldierId: string; name: string; rank: string; unit: string }>;
  selectedSoldierId: string;
  onSelectSoldier: (soldierId: string) => void;
  soldierLogs: BiometricLog[];
  units: string[];
  onUpdateAlert: (
    alertId: string,
    updates: {
      status: StressAlert['status'];
      interventionStatus?: InterventionStatus;
      doctorNotes: string;
      reviewedBy: string;
      recommendedRestPeriod?: string;
    }
  ) => Promise<void>;
  activeTab?: 'overview' | 'personnel-review' | 'high-risk' | 'interventions' | 'alerts';
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  alerts,
  allSoldiers,
  selectedSoldierId,
  onSelectSoldier,
  soldierLogs,
  units,
  onUpdateAlert,
  activeTab = 'overview',
}) => {
  // Enhanced Filtering States (Requirement 7)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'UNDER_OBSERVATION' | 'RESOLVED'>('ALL');
  const [interventionFilter, setInterventionFilter] = useState<'ALL' | InterventionStatus>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');

  // Review Modal State
  const [activeReviewAlert, setActiveReviewAlert] = useState<StressAlert | null>(null);
  const [reviewStatus, setReviewStatus] = useState<StressAlert['status']>('RESOLVED');
  const [reviewInterventionStatus, setReviewInterventionStatus] = useState<InterventionStatus>('Resolved');
  const [recommendedRestPeriod, setRecommendedRestPeriod] = useState('24 Hours Mandatory Stand-Down');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [reviewerName, setReviewerName] = useState('Dr. Maj. Ritu Sharma (RMO)');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Tactical Rest Pass Modal State (Requirement 4)
  const [generatedPass, setGeneratedPass] = useState<TacticalRestPass | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Filter alerts across the 4 criteria
  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (interventionFilter !== 'ALL' && a.interventionStatus !== interventionFilter) return false;
    if (unitFilter !== 'ALL' && a.soldierUnit !== unitFilter) return false;
    if (riskFilter !== 'ALL' && a.riskLevel !== riskFilter) return false;
    return true;
  });

  const pendingCount = alerts.filter((a) => a.status === 'PENDING').length;
  const observationCount = alerts.filter((a) => a.status === 'UNDER_OBSERVATION').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  // Selected soldier info
  const selectedSoldier = allSoldiers.find((s) => s.soldierId === selectedSoldierId) || allSoldiers[0];

  const handleOpenReview = (alert: StressAlert) => {
    setActiveReviewAlert(alert);
    setReviewStatus(alert.status === 'PENDING' ? 'UNDER_OBSERVATION' : alert.status);
    setReviewInterventionStatus(alert.interventionStatus || 'Under Review');
    setRecommendedRestPeriod(alert.recommendedRestPeriod || '24 Hours Mandatory Stand-Down');
    setDoctorNotes(
      alert.doctorNotes ||
        'Personnel evaluated for autonomic fatigue strain. Prescribed 24hr physiological rest, oral rehydration therapy, and sleep stabilization.'
    );
  };

  const handleSaveReview = async () => {
    if (!activeReviewAlert) return;
    setIsUpdating(true);
    try {
      await onUpdateAlert(activeReviewAlert.id, {
        status: reviewStatus,
        interventionStatus: reviewInterventionStatus,
        doctorNotes,
        reviewedBy: reviewerName,
        recommendedRestPeriod,
      });
      setSuccessNotice(
        `Intervention recorded for ${activeReviewAlert.soldierName || activeReviewAlert.soldierId} (${reviewInterventionStatus})`
      );
      setActiveReviewAlert(null);
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Generate Tactical Medical Rest Pass (Requirement 4)
  const handleGenerateRestPass = () => {
    if (!activeReviewAlert) return;

    const pass: TacticalRestPass = {
      documentId: `DEMO-REST-${activeReviewAlert.soldierId}-${Date.now().toString().slice(-4)}`,
      soldierId: activeReviewAlert.soldierId,
      soldierName: activeReviewAlert.soldierName || 'Sep. Personnel',
      soldierRank: activeReviewAlert.soldierRank || 'Sepoy',
      unit: activeReviewAlert.soldierUnit || 'Combined Tactical Formation',
      generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      reviewDate: activeReviewAlert.date,
      riskLevel: activeReviewAlert.riskLevel,
      stressScore: activeReviewAlert.stressScore,
      biometricSummary: {
        hrv: activeReviewAlert.biometrics.hrv,
        sleepHours: activeReviewAlert.biometrics.sleepHours,
        restingHeartRate: activeReviewAlert.biometrics.restingHeartRate,
        dutyDuration: activeReviewAlert.biometrics.dutyDuration,
      },
      recommendedRestPeriod: recommendedRestPeriod || '24 Hours Mandatory Stand-Down',
      medicalOfficerNotes:
        doctorNotes ||
        'Physiological fatigue detected. Mandatory operational rest and vital sign observation advised.',
      documentStatus: 'PROTOTYPE_ADVISORY',
      attendingOfficer: reviewerName,
    };

    setGeneratedPass(pass);
    setIsPassModalOpen(true);
  };

  // Prepare chart data for deep dive
  const chronologicalLogs = [...soldierLogs].reverse();
  const chartLabels = chronologicalLogs.map((l) => l.date.slice(5));
  const stressScores = chronologicalLogs.map((l) => l.stressScore);
  const hrvValues = chronologicalLogs.map((l) => l.hrv);
  const sleepValues = chronologicalLogs.map((l) => l.sleepHours);
  const rhrValues = chronologicalLogs.map((l) => l.restingHeartRate);

  return (
    <div className="space-y-6">
      {/* Doctor Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-rose-950/80 border border-rose-800/80 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Regimental Medical Officer (RMO) Clinical Console
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  CONFIDENTIAL MEDICAL CLEARANCE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review high-risk stress alerts, examine longitudinal biometrics, and issue clinical stand-down advisories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-right">
              <span className="text-[10px] text-slate-500 uppercase block">Attending Officer</span>
              <span className="text-slate-200 font-semibold">{reviewerName}</span>
            </div>
          </div>
        </div>

        {successNotice && (
          <div className="mt-4 p-3 bg-emerald-950/70 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
      </div>

      {/* Alert Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-rose-950/40 border-rose-600 ring-1 ring-rose-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Pending Medical Review
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2 text-3xl font-extrabold font-mono text-rose-400">
            {pendingCount}
          </div>
          <p className="text-[11px] text-slate-400">Requires clinical triage &amp; stand-down order</p>
        </div>

        <div
          onClick={() => setStatusFilter('UNDER_OBSERVATION')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'UNDER_OBSERVATION'
              ? 'bg-amber-950/40 border-amber-600 ring-1 ring-amber-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Under Observation
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 text-3xl font-extrabold font-mono text-amber-400">
            {observationCount}
          </div>
          <p className="text-[11px] text-slate-400">Monitoring recovery telemetry over 24-48h</p>
        </div>

        <div
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'RESOLVED'
              ? 'bg-emerald-950/40 border-emerald-600 ring-1 ring-emerald-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Resolved Cases
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 text-3xl font-extrabold font-mono text-emerald-400">
            {resolvedCount}
          </div>
          <p className="text-[11px] text-slate-400">Biometrics restabilized to operational baseline</p>
        </div>
      </div>

      {/* Main Section: High-Risk Alert Queue with Multi-filter Controls (Requirement 7) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              High-Risk Alert Management &amp; Intervention Tracker
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated heuristic flags requiring medical officer evaluation and rest pass issuance
            </p>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredAlerts.length} of {alerts.length} Alerts
          </span>
        </div>

        {/* 4 Multi-Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
          {/* Filter 1: Status */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Review Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="UNDER_OBSERVATION">Under Observation</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* Filter 2: Intervention Status (Requirement 7) */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Intervention Status
            </label>
            <select
              value={interventionFilter}
              onChange={(e) => setInterventionFilter(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Interventions</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Rest Recommended">Rest Recommended</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Filter 3: Unit */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Unit Formation
            </label>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer truncate"
            >
              <option value="ALL">All Military Units</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 4: Risk Level */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Risk Level Tier
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MODERATE">Moderate Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Alerts Table with Predictive Risk & Intervention Status Columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Personnel</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Stress Score</th>
                <th className="py-2.5 px-3">Predictive Risk (48h)</th>
                <th className="py-2.5 px-3">Biometrics Trigger</th>
                <th className="py-2.5 px-3">Intervention Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No alerts match the selected filter combination.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {alert.date}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">
                        {alert.soldierRank} {alert.soldierName}
                      </div>
                      <span className="font-mono text-[10px] text-cyan-400">{alert.soldierId}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-[150px] truncate">
                      {alert.soldierUnit}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-sm font-extrabold text-rose-400">
                        {alert.stressScore}
                      </span>
                      <span className="text-[10px] text-slate-500">/100</span>
                    </td>
                    {/* Predictive Risk Column (Requirement 7) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                        <TrendingUp className="w-3 h-3 text-purple-400" />
                        {alert.predictiveRiskPercent || 85}% Risk
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-300 whitespace-nowrap">
                      <span className="text-cyan-400">HRV: {alert.biometrics.hrv}ms</span> ·{' '}
                      <span className="text-purple-400">Sleep: {alert.biometrics.sleepHours}h</span> ·{' '}
                      <span className="text-rose-400">Pulse: {alert.biometrics.restingHeartRate}</span>
                    </td>
                    {/* Intervention Status Column (Requirement 7) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          alert.interventionStatus === 'Rest Recommended'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : alert.interventionStatus === 'Under Review' || alert.interventionStatus === 'Monitoring'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : alert.interventionStatus === 'Resolved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {alert.interventionStatus || 'New'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectSoldier(alert.soldierId)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors cursor-pointer flex items-center gap-1"
                          title="View 14-day telemetry trend"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Trend</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(alert)}
                          className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Resolution Panel with Rest Pass Generation (Requirement 4) */}
      {activeReviewAlert && (
        <div className="bg-slate-900 border-2 border-rose-800/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold text-white">
                Medical Officer Clinical Review &amp; Rest Pass Protocol
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveReviewAlert(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Personnel</span>
              <span className="text-sm font-bold text-white">
                {activeReviewAlert.soldierRank} {activeReviewAlert.soldierName}
              </span>
              <p className="text-slate-400 font-mono mt-0.5">{activeReviewAlert.soldierId}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Trigger Score</span>
              <span className="text-sm font-bold text-rose-400 font-mono">
                {activeReviewAlert.stressScore} / 100 (HIGH RISK)
              </span>
              <p className="text-slate-400 mt-0.5">Triggered on {activeReviewAlert.date}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block mb-0.5">Biometric Snapshot</span>
              <p className="text-slate-300 mt-0.5">
                HRV: {activeReviewAlert.biometrics.hrv}ms · Sleep: {activeReviewAlert.biometrics.sleepHours}h · Duty: {activeReviewAlert.biometrics.dutyDuration}h
              </p>
            </div>
          </div>

          {/* Intervention Status Selector (Requirement 7) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Clinical Intervention Status:
              </label>
              <select
                value={reviewInterventionStatus}
                onChange={(e) => setReviewInterventionStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="New">New</option>
                <option value="Under Review">Under Review</option>
                <option value="Rest Recommended">Rest Recommended</option>
                <option value="Monitoring">Monitoring</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Recommended Rest Period:
              </label>
              <input
                type="text"
                value={recommendedRestPeriod}
                onChange={(e) => setRecommendedRestPeriod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                placeholder="e.g. 24 Hours Mandatory Stand-Down"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Doctor Clinical Notes &amp; Tactical Intervention Directive:
            </label>
            <textarea
              rows={3}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              placeholder="Record clinical impressions, mandatory stand-down hours, hydration protocol, or counseling instructions..."
            />
          </div>

          {/* Bottom Actions: Generate Rest Pass + Submit Order */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleGenerateRestPass}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/80 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Generate Tactical Medical Rest Pass</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveReviewAlert(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReview}
                disabled={isUpdating}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isUpdating ? 'Saving...' : 'Submit Medical Resolution Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Longitudinal Deep-Dive Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Longitudinal Biometric Telemetry Inspector
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect complete 14-day history, sympathetic recovery, and duty correlations for any individual
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 whitespace-nowrap">Select Personnel:</label>
            <select
              value={selectedSoldierId}
              onChange={(e) => onSelectSoldier(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {allSoldiers.map((s) => (
                <option key={s.soldierId} value={s.soldierId}>
                  {s.rank} {s.name} ({s.soldierId}) - {s.unit.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendLineChart
            labels={chartLabels}
            stressScores={stressScores}
            title={`${selectedSoldier?.rank} ${selectedSoldier?.name} (${selectedSoldier?.soldierId}) - Stress Score Curve`}
            height={240}
          />
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">
              Multi-Variable Biometric Correlation
            </h4>
            <MultiMetricChart
              labels={chartLabels}
              hrv={hrvValues}
              sleep={sleepValues}
              rhr={rhrValues}
              height={240}
            />
          </div>
        </div>

        {/* Clinical History Table for Selected Soldier */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Daily Record Audit Log
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">HRV (ms)</th>
                  <th className="py-2 px-3">Sleep (hrs)</th>
                  <th className="py-2 px-3">Resting HR</th>
                  <th className="py-2 px-3">Duty (hrs)</th>
                  <th className="py-2 px-3">Calculated Score</th>
                  <th className="py-2 px-3">Condition</th>
                  <th className="py-2 px-3">Physiological Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {soldierLogs.slice(0, 7).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-mono text-slate-400">{log.date}</td>
                    <td className="py-2 px-3 font-mono text-cyan-400">{log.hrv} ms</td>
                    <td className="py-2 px-3 font-mono text-purple-400">{log.sleepHours} hrs</td>
                    <td className="py-2 px-3 font-mono text-rose-400">{log.restingHeartRate} bpm</td>
                    <td className="py-2 px-3 font-mono text-amber-400">{log.dutyDuration} hrs</td>
                    <td className="py-2 px-3 font-mono font-bold">
                      <span
                        className={
                          log.stressScore >= 70
                            ? 'text-rose-400'
                            : log.stressScore >= 40
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {log.stressScore}/100
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400 text-[10px]">
                      {log.environmentalCondition || 'NORMAL'}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[240px]">
                      {log.notes || 'Normal daily telemetry'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Printable Tactical Medical Rest Pass Modal (Requirement 4) */}
      <TacticalRestPassModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        pass={generatedPass}
      />
    </div>
  );
};
