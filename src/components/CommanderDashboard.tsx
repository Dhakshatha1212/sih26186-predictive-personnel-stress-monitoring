import React, { useState } from 'react';
import { CommanderAction, RiskLevel, SquadReadinessSummary } from '../types.ts';
import { DistributionBarChart } from './StressChart.tsx';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Activity,
  Filter,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertOctagon,
  TrendingDown,
  RotateCw,
  Bed,
  History,
  Info,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

interface CommanderDashboardProps {
  readiness: SquadReadinessSummary | null;
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  units: string[];
  actions: CommanderAction[];
  onIssueAction: (data: {
    targetAnonId: string;
    soldierId: string;
    soldierName?: string;
    unit: string;
    actionType: 'STAND_DOWN_24H' | 'AUTO_ROTATE_SHIFT';
    commanderNotes?: string;
  }) => Promise<void>;
}

export const CommanderDashboard: React.FC<CommanderDashboardProps> = ({
  readiness,
  selectedUnit,
  onSelectUnit,
  units,
  actions,
  onIssueAction,
}) => {
  const [filterRisk, setFilterRisk] = useState<'ALL' | RiskLevel>('ALL');
  const [selectedAnonPersonnel, setSelectedAnonPersonnel] = useState<
    SquadReadinessSummary['anonymizedPersonnel'][0] | null
  >(null);

  // Action Confirmation Modal State
  const [pendingActionTarget, setPendingActionTarget] = useState<
    SquadReadinessSummary['anonymizedPersonnel'][0] | null
  >(null);
  const [pendingActionType, setPendingActionType] = useState<
    'STAND_DOWN_24H' | 'AUTO_ROTATE_SHIFT' | null
  >(null);
  const [commanderCustomNote, setCommanderCustomNote] = useState('');
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  if (!readiness) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading squad operational readiness data...
      </div>
    );
  }

  const filteredPersonnel = readiness.anonymizedPersonnel.filter((p) => {
    if (filterRisk === 'ALL') return true;
    return p.riskLevel === filterRisk;
  });

  const handleOpenActionModal = (
    person: SquadReadinessSummary['anonymizedPersonnel'][0],
    type: 'STAND_DOWN_24H' | 'AUTO_ROTATE_SHIFT'
  ) => {
    setPendingActionTarget(person);
    setPendingActionType(type);
    setCommanderCustomNote(
      type === 'STAND_DOWN_24H'
        ? 'Mandatory 24h operational stand-down ordered to prevent acute cognitive and physical fatigue breakdown.'
        : 'Reassigned sentry duty from forward observation post to lower-tempo base camp shelter.'
    );
  };

  const handleConfirmAction = async () => {
    if (!pendingActionTarget || !pendingActionType) return;
    setIsExecutingAction(true);
    try {
      await onIssueAction({
        targetAnonId: pendingActionTarget.anonId,
        soldierId: pendingActionTarget.soldierId,
        unit: readiness.unit === 'ALL' ? 'Squad Formation Alpha/Bravo' : readiness.unit,
        actionType: pendingActionType,
        commanderNotes: commanderCustomNote,
      });

      const title =
        pendingActionType === 'STAND_DOWN_24H'
          ? '24h Mandatory Stand-Down'
          : 'Shift Auto-Rotation';
      setActionSuccessNotice(
        `Action "${title}" executed successfully for ${pendingActionTarget.anonId}! Stress metrics adjusted.`
      );
      setPendingActionTarget(null);
      setPendingActionType(null);
      setTimeout(() => setActionSuccessNotice(null), 4000);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Squads breakdown for Squad Welfare Actions summary
  const squadFormations = [
    { name: '14 Rajputana Rifles (Alpha Coy)', tag: 'ALPHA', high: 1, mod: 2, low: 3, status: 'ELEVATED' },
    { name: '9 Parachute SF (Bravo Team)', tag: 'BRAVO', high: 1, mod: 2, low: 3, status: 'ELEVATED' },
    { name: '21 Maratha Light Infantry (Charlie Sqd)', tag: 'CHARLIE', high: 1, mod: 1, low: 4, status: 'OPERATIONAL' },
    { name: '7 Ladakh Scouts (Delta Patrol)', tag: 'DELTA', high: 1, mod: 2, low: 3, status: 'HIGH_WATCH' },
  ];

  const welfareSummary = readiness.squadWelfareActionsSummary || {
    highRiskSquadsCount: readiness.riskCounts.high,
    elevatedRiskSquadsCount: readiness.riskCounts.moderate,
    activeStandDownCount: actions.filter((a) => a.actionType === 'STAND_DOWN_24H').length,
    activeShiftRotationCount: actions.filter((a) => a.actionType === 'AUTO_ROTATE_SHIFT').length,
    totalRecentInterventions: actions.length,
  };

  return (
    <div className="space-y-6">
      {/* Unit Selector & Privacy Safeguard Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Squad Operational Readiness Command Center
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                LEVEL-3 TACTICAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Aggregated personnel welfare metrics and deployment readiness analysis
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedUnit}
              onChange={(e) => onSelectUnit(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[240px]"
            >
              <option value="ALL">All Combined Formations (24 Personnel)</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Commander Privacy Banner */}
        <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center gap-2.5 text-xs text-slate-400">
          <EyeOff className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-slate-300 font-semibold">Strict Medical Privacy Protocol Active:</strong> Individual
            identities, names, and private clinical records are cryptographically anonymized in this tactical view.
            Medical intervention is handled exclusively by authorized Medical Officers.
          </span>
        </div>

        {actionSuccessNotice && (
          <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* NEW SECTION (Requirement 6): Squad Welfare Actions Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Squad Welfare Actions &amp; Tactical Intervention Status
              </h3>
              <p className="text-xs text-slate-400">
                Actionable commander interventions across operational formations
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            Active Stand-Downs: {welfareSummary.activeStandDownCount} · Rotations: {welfareSummary.activeShiftRotationCount}
          </span>
        </div>

        {/* Welfare Action Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] uppercase text-slate-500 block">High-Risk Squads</span>
            <span className="text-xl font-bold font-mono text-rose-400 my-0.5 block">
              {welfareSummary.highRiskSquadsCount}
            </span>
            <span className="text-[10px] text-slate-400">Exceeds threshold</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] uppercase text-slate-500 block">Elevated Squads</span>
            <span className="text-xl font-bold font-mono text-amber-400 my-0.5 block">
              {welfareSummary.elevatedRiskSquadsCount}
            </span>
            <span className="text-[10px] text-slate-400">Fatigue watch</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] uppercase text-slate-500 block">Active Stand-Downs</span>
            <span className="text-xl font-bold font-mono text-blue-400 my-0.5 block">
              {welfareSummary.activeStandDownCount}
            </span>
            <span className="text-[10px] text-slate-400">24h mandatory</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
            <span className="text-[10px] uppercase text-slate-500 block">Shift Rotations</span>
            <span className="text-xl font-bold font-mono text-purple-400 my-0.5 block">
              {welfareSummary.activeShiftRotationCount}
            </span>
            <span className="text-[10px] text-slate-400">Duty rescheduled</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase text-slate-500 block">Total Interventions</span>
            <span className="text-xl font-bold font-mono text-emerald-400 my-0.5 block">
              {welfareSummary.totalRecentInterventions}
            </span>
            <span className="text-[10px] text-slate-400">Logged actions</span>
          </div>
        </div>

        {/* Visual Squad Formation Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {squadFormations.map((sqd) => (
            <div
              key={sqd.tag}
              className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-white">Squad {sqd.tag}</span>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    sqd.status === 'HIGH_WATCH'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : sqd.status === 'ELEVATED'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {sqd.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mb-2">{sqd.name}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-900 font-mono">
                <span className="text-emerald-400">{sqd.low} Ready</span>
                <span className="text-amber-400">{sqd.mod} Watch</span>
                <span className="text-rose-400">{sqd.high} High</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Personnel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Squad Roster
            </span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-white">
              {readiness.totalPersonnel}
            </span>
            <span className="text-xs text-slate-400">Troops</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {readiness.unit === 'ALL' ? 'Across 4 Active Detachments' : readiness.unit}
          </p>
        </div>

        {/* Squad Combat Readiness Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Combat Readiness Index
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-emerald-400">
              {readiness.combatReadinessRate}%
            </span>
            <span className="text-xs text-slate-400">Optimal Tiers</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {readiness.riskCounts.low} of {readiness.totalPersonnel} troops at peak physical resilience
          </p>
        </div>

        {/* Average Stress Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Average Squad Stress
            </span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-amber-400">
              {readiness.averageStressScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Avg Sleep: {readiness.averageSleep}h · Avg Duty: {readiness.averageDutyHours}h
          </p>
        </div>

        {/* High Risk Stand-down Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Fatigue Stand-Down Req.
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-rose-400">
              {readiness.riskCounts.high}
            </span>
            <span className="text-xs text-slate-400">Troops (High Risk)</span>
          </div>
          <p className="text-[11px] text-rose-400/90 font-medium">
            Subject to commander administrative action
          </p>
        </div>
      </div>

      {/* Main Grid: Readiness Heatmap with Action Column & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Grid (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Squad Readiness Heatmap
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time operational readiness state per troop (Click card to issue commander action)
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setFilterRisk('ALL')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  filterRisk === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({readiness.anonymizedPersonnel.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterRisk('LOW')}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                  filterRisk === 'LOW' ? 'bg-emerald-950 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                Ready ({readiness.riskCounts.low})
              </button>
              <button
                type="button"
                onClick={() => setFilterRisk('MODERATE')}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                  filterRisk === 'MODERATE' ? 'bg-amber-950 text-amber-300 font-semibold' : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                Watch ({readiness.riskCounts.moderate})
              </button>
              <button
                type="button"
                onClick={() => setFilterRisk('HIGH')}
                className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                  filterRisk === 'HIGH' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                High Risk ({readiness.riskCounts.high})
              </button>
            </div>
          </div>

          {/* Interactive Heatmap Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {filteredPersonnel.map((person) => {
              const isSelected = selectedAnonPersonnel?.anonId === person.anonId;
              const isHigh = person.riskLevel === 'HIGH';
              const isMod = person.riskLevel === 'MODERATE';

              return (
                <div
                  key={person.anonId}
                  onClick={() => setSelectedAnonPersonnel(person)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-slate-800'
                      : 'hover:border-slate-600 bg-slate-950/60'
                  } ${
                    isHigh
                      ? 'border-rose-900/80 hover:bg-rose-950/20'
                      : isMod
                      ? 'border-amber-900/80 hover:bg-amber-950/20'
                      : 'border-emerald-900/60 hover:bg-emerald-950/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-slate-300">
                        {person.anonId}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isHigh ? 'bg-rose-500 animate-pulse' : isMod ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-400">{person.squadRole}</span>
                      <span
                        className={`font-mono text-sm font-bold ${
                          isHigh ? 'text-rose-400' : isMod ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {person.stressScore}
                      </span>
                    </div>

                    {person.hasActiveAction && (
                      <div className="mt-1 text-[9px] font-mono text-blue-300 bg-blue-950/80 px-1 py-0.5 rounded border border-blue-800 truncate">
                        ✓ {person.activeActionType}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{person.dutyHours}h Duty</span>
                    <span className="uppercase font-semibold tracking-wider">
                      {isHigh ? 'Action Req' : isMod ? 'Fatigue' : 'Ready'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Anonymized Token Detail & Action Bar (when clicked) */}
          {selectedAnonPersonnel && (
            <div className="p-4 bg-slate-950 border border-blue-900/80 rounded-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-blue-400">
                    {selectedAnonPersonnel.anonId}
                  </span>
                  <span className="text-xs text-slate-400">· {selectedAnonPersonnel.squadRole}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      selectedAnonPersonnel.riskLevel === 'HIGH'
                        ? 'bg-rose-950 text-rose-300'
                        : selectedAnonPersonnel.riskLevel === 'MODERATE'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    {selectedAnonPersonnel.riskLevel} RISK ({selectedAnonPersonnel.stressScore}/100)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAnonPersonnel(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded border border-slate-700 cursor-pointer self-start sm:self-auto"
                >
                  Dismiss
                </button>
              </div>

              {/* Action Buttons for this personnel */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-300 mr-1">
                  Commander Directives:
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenActionModal(selectedAnonPersonnel, 'STAND_DOWN_24H')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-sm"
                >
                  <Bed className="w-3.5 h-3.5" />
                  <span>Issue 24h Mandatory Stand-Down</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenActionModal(selectedAnonPersonnel, 'AUTO_ROTATE_SHIFT')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-sm"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Auto-Rotate Shift</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Distribution Chart & Tactical Action Matrix */}
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Squad Stress Distribution Tier
            </h4>
            <DistributionBarChart
              lowCount={readiness.riskCounts.low}
              moderateCount={readiness.riskCounts.moderate}
              highCount={readiness.riskCounts.high}
              height={200}
            />
          </div>

          {/* Commander Directive Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              Operational Commander Directives
            </h4>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <span className="font-semibold text-rose-300 block">
                1. High-Risk Stand-Down Order
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Click any High-Risk token on the heatmap to execute an administrative 24h rest stand-down.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <span className="font-semibold text-amber-300 block">
                2. Sentry &amp; Patrol Shift Balancing
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Rotate fatigued units before the 12-hour continuous combat patrol mark to prevent reaction-time drop.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: Action History Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Commander Welfare Action History
              </h3>
              <p className="text-xs text-slate-400">
                Log of prototype administrative orders issued across units
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {actions.length} Total Recorded Actions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Target Squad / ID</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Action Issued</th>
                <th className="py-2.5 px-3">Directive Notes</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Issued By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {actions.map((act) => (
                <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {act.dateTime}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                    {act.targetAnonId}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-[160px]">
                    {act.unit}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        act.actionType === 'STAND_DOWN_24H' ? 'text-rose-300' : 'text-blue-300'
                      }`}
                    >
                      {act.actionTitle}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-[280px] truncate">
                    {act.commanderNotes}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {act.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {act.issuedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Prototype Administrative Action Notice:</strong> These actions are demonstration workflow simulations
            designed for SIH evaluation. They do not constitute actual military combat orders.
          </span>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {pendingActionTarget && pendingActionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Confirm Commander Operational Action
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingActionTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Affected Personnel / Squad:</span>
                  <span className="font-mono font-bold text-white">{pendingActionTarget.anonId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Role / Duty:</span>
                  <span className="text-slate-200">{pendingActionTarget.squadRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Stress / Risk:</span>
                  <span className="font-mono text-rose-400 font-bold">
                    {pendingActionTarget.stressScore}/100 ({pendingActionTarget.riskLevel})
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-900 rounded-lg">
                <span className="font-bold text-blue-300 block mb-1">
                  Proposed Action: {pendingActionType === 'STAND_DOWN_24H' ? '24h Mandatory Stand-Down' : 'Auto-Rotate Shift'}
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {pendingActionType === 'STAND_DOWN_24H'
                    ? 'Personnel will be relieved from combat patrol and sentry vigilance for 24 consecutive hours. Physiological duty load will be scaled down and medical monitoring updated.'
                    : 'Personnel duty schedule will be rotated from forward high-stress post to base shelter support, reducing cumulative shift fatigue.'}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Commander Directive Notes (Editable):
                </label>
                <textarea
                  rows={2}
                  value={commanderCustomNote}
                  onChange={(e) => setCommanderCustomNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * This action will immediately update the prototype database state and record in the Action History ledger.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPendingActionTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isExecutingAction}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isExecutingAction ? 'Executing...' : 'Confirm & Execute Action'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
