import React, { useState, useMemo, useEffect } from 'react';
import {
  BiometricLog,
  CalculationThresholds,
  CalculationWeights,
  EnvironmentalCondition,
  User,
} from '../types.ts';
import {
  calculateEnvironmentalAdjustment,
  calculatePredictiveForecast,
  calculateStressScore,
  ENVIRONMENTAL_CONFIG,
} from '../utils/stressCalculator.ts';
import { TrendLineChart, MultiMetricChart } from './StressChart.tsx';
import {
  Heart,
  Moon,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calendar,
  Sparkles,
  Info,
  Shield,
  Zap,
  Watch,
  Wifi,
  WifiOff,
  RefreshCw,
  Mountain,
  Sun,
  Snowflake,
  ChevronDown,
  ChevronUp,
  Flame,
  Radio,
  TrendingUp,
} from 'lucide-react';

interface SoldierDashboardProps {
  soldier: User;
  allSoldiers?: Array<{ soldierId: string; name: string; rank: string; unit: string }>;
  onSelectSoldier?: (soldierId: string) => void;
  logs: BiometricLog[];
  onSubmitLog: (data: {
    soldierId: string;
    date: string;
    hrv: number;
    sleepHours: number;
    restingHeartRate: number;
    dutyDuration: number;
    environmentalCondition?: EnvironmentalCondition;
    notes?: string;
  }) => Promise<void>;
  weights: CalculationWeights;
  thresholds: CalculationThresholds;
}

export const SoldierDashboard: React.FC<SoldierDashboardProps> = ({
  soldier,
  allSoldiers,
  onSelectSoldier,
  logs,
  onSubmitLog,
  weights,
  thresholds,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Live BLE Wearable Ingestion State
  const [isBleSyncOn, setIsBleSyncOn] = useState(false);
  const [liveHrv, setLiveHrv] = useState(64);
  const [liveRhr, setLiveRhr] = useState(63);
  const [liveSleep, setLiveSleep] = useState(6.8);
  const [liveDuty, setLiveDuty] = useState(9.0);
  const [lastSyncedSeconds, setLastSyncedSeconds] = useState(4);
  const [isSyncingTelemetry, setIsSyncingTelemetry] = useState(false);

  // 2. Manual Form State
  const [logDate, setLogDate] = useState(todayStr);
  const [hrv, setHrv] = useState<number>(68);
  const [sleepHours, setSleepHours] = useState<number>(7.2);
  const [restingHeartRate, setRestingHeartRate] = useState<number>(62);
  const [dutyDuration, setDutyDuration] = useState<number>(8.5);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // 3. Environmental Conditions Modifier State
  const [envCondition, setEnvCondition] = useState<EnvironmentalCondition>('NORMAL');
  const [showEnvDetails, setShowEnvDetails] = useState(false);
  const [showForecastExplainer, setShowForecastExplainer] = useState(false);

  // Latest recorded log
  const latestLog = logs.length > 0 ? logs[0] : null;

  // Periodic simulation for Live Wearable Telemetry
  useEffect(() => {
    if (!isBleSyncOn) return;

    // Second counter
    const timer = setInterval(() => {
      setLastSyncedSeconds((prev) => prev + 1);
    }, 1000);

    // Periodic sensor packet jitter update every 5 seconds
    const jitterTimer = setInterval(() => {
      setLiveHrv((prev) => Math.max(25, Math.min(100, prev + (Math.floor(Math.random() * 5) - 2))));
      setLiveRhr((prev) => Math.max(50, Math.min(110, prev + (Math.floor(Math.random() * 3) - 1))));
      setLastSyncedSeconds(0);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(jitterTimer);
    };
  }, [isBleSyncOn]);

  // Synchronize Live Telemetry to Backend
  const handleSyncNow = async () => {
    setIsSyncingTelemetry(true);
    try {
      await onSubmitLog({
        soldierId: soldier.soldierId,
        date: todayStr,
        hrv: liveHrv,
        sleepHours: liveSleep,
        restingHeartRate: liveRhr,
        dutyDuration: liveDuty,
        environmentalCondition: envCondition,
        notes: `Simulated live BLE wearable ingestion under ${envCondition} conditions.`,
      });
      setLastSyncedSeconds(0);
      setSubmitMessage('Live wearable telemetry synced successfully to database!');
      setTimeout(() => setSubmitMessage(null), 3500);
    } catch (err: any) {
      setSubmitMessage(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncingTelemetry(false);
    }
  };

  // Environmental Adjustment on current score
  const currentBaseScore = latestLog ? latestLog.stressScore : 35;
  const envAdjustment = useMemo(() => {
    return calculateEnvironmentalAdjustment(currentBaseScore, envCondition, thresholds);
  }, [currentBaseScore, envCondition, thresholds]);

  // Predictive Stress Forecast
  const forecast = useMemo(() => {
    return calculatePredictiveForecast(logs, thresholds);
  }, [logs, thresholds]);

  // Live calculation preview for manual form
  const liveBreakdown = useMemo(() => {
    return calculateStressScore(
      {
        hrv: Number(hrv) || 60,
        sleepHours: Number(sleepHours) || 7,
        restingHeartRate: Number(restingHeartRate) || 60,
        dutyDuration: Number(dutyDuration) || 8,
      },
      weights,
      thresholds
    );
  }, [hrv, sleepHours, restingHeartRate, dutyDuration, weights, thresholds]);

  // Presets
  const applyPreset = (preset: 'standard' | 'strenuous' | 'night_ops' | 'recovery') => {
    if (preset === 'standard') {
      setHrv(72);
      setSleepHours(7.5);
      setRestingHeartRate(59);
      setDutyDuration(8.0);
      setNotes('Routine border patrol and physical conditioning.');
    } else if (preset === 'strenuous') {
      setHrv(48);
      setSleepHours(5.5);
      setRestingHeartRate(73);
      setDutyDuration(12.0);
      setNotes('High-tempo tactical exercise in rugged terrain.');
    } else if (preset === 'night_ops') {
      setHrv(30);
      setSleepHours(3.8);
      setRestingHeartRate(86);
      setDutyDuration(15.5);
      setNotes('Prolonged night-patrol vigil; high autonomic fatigue.');
    } else if (preset === 'recovery') {
      setHrv(84);
      setSleepHours(8.5);
      setRestingHeartRate(54);
      setDutyDuration(4.0);
      setNotes('Scheduled stand-down day; deep restorative sleep.');
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      await onSubmitLog({
        soldierId: soldier.soldierId,
        date: logDate,
        hrv,
        sleepHours,
        restingHeartRate,
        dutyDuration,
        environmentalCondition: envCondition,
        notes: notes.trim() || undefined,
      });
      setSubmitMessage('Biometric log submitted successfully! Stress score updated.');
      setTimeout(() => setSubmitMessage(null), 4000);
    } catch (err: any) {
      setSubmitMessage(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare chart data (chronological order)
  const chronologicalLogs = [...logs].reverse();
  const chartLabels = chronologicalLogs.map((l) => l.date.slice(5));
  const stressScores = chronologicalLogs.map((l) => l.stressScore);
  const hrvValues = chronologicalLogs.map((l) => l.hrv);
  const sleepValues = chronologicalLogs.map((l) => l.sleepHours);
  const rhrValues = chronologicalLogs.map((l) => l.restingHeartRate);

  return (
    <div className="space-y-6">
      {/* Soldier Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center font-mono font-bold text-emerald-400 text-lg">
              {soldier.rank.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {soldier.name}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {soldier.soldierId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {soldier.rank} · {soldier.unit}
              </p>
            </div>
          </div>

          {/* Strict Isolation & Security Status Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Isolated Personnel Record</span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-900/60 px-1 py-0.2 rounded">
                SECURE
              </span>
            </div>

            {soldier.squad && (
              <span className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono">
                {soldier.squad}
              </span>
            )}

            {allSoldiers && onSelectSoldier && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] text-slate-500">Debug Switch:</span>
                <select
                  value={soldier.soldierId}
                  onChange={(e) => onSelectSoldier(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none cursor-pointer"
                >
                  {allSoldiers.map((s) => (
                    <option key={s.soldierId} value={s.soldierId}>
                      {s.rank} {s.name} ({s.soldierId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards: Current Wellness & Biometric Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stress Score Card with Environmental Overlay */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Stress Index
            </span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`text-4xl font-extrabold font-mono ${
                envAdjustment.adjustedScore >= 70
                  ? 'text-rose-400'
                  : envAdjustment.adjustedScore >= 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {envAdjustment.adjustedScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
            {envAdjustment.modifierPercent > 0 && (
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900/60">
                +{envAdjustment.modifierPercent}% env
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                envAdjustment.adjustedRiskLevel === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : envAdjustment.adjustedRiskLevel === 'MODERATE'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {envAdjustment.adjustedRiskLevel} RISK
            </span>
            <span className="text-slate-500 text-[10px]">
              Base Score: {currentBaseScore}
            </span>
          </div>
        </div>

        {/* HRV Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Heart Rate Var. (HRV)
            </span>
            <Heart className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-cyan-400">
              {latestLog ? latestLog.hrv : '--'}
            </span>
            <span className="text-xs text-slate-400">ms (RMSSD)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Measured Telemetry</span>
            <span className={latestLog && latestLog.hrv < 40 ? 'text-rose-400' : 'text-emerald-400'}>
              {latestLog && latestLog.hrv < 40 ? 'Suppressed' : 'Healthy'}
            </span>
          </div>
        </div>

        {/* Sleep Hours Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Sleep Duration
            </span>
            <Moon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-purple-400">
              {latestLog ? latestLog.sleepHours : '--'}
            </span>
            <span className="text-xs text-slate-400">hrs</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Resting Pulse</span>
            <span className="font-mono text-rose-400">
              {latestLog ? `${latestLog.restingHeartRate} bpm` : '--'}
            </span>
          </div>
        </div>

        {/* Duty Duration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Duty / Shift Duration
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-amber-400">
              {latestLog ? latestLog.dutyDuration : '--'}
            </span>
            <span className="text-xs text-slate-400">hrs</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Condition</span>
            <span className="font-mono text-slate-300">
              {envCondition.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* NEW SECTION: 7-Day Predictive Stress Forecast */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  7-Day Predictive Stress Forecast
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  AI Trend Heuristic
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Forecasted risk estimation based on longitudinal autonomic and sleep trajectories
              </p>
            </div>
          </div>

          {forecast.available && (
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${
                forecast.forecastRiskPercent >= 70
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : forecast.forecastRiskPercent >= 40
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{forecast.badgeText}</span>
              <span className="font-mono px-1.5 py-0.2 bg-slate-900/60 rounded">
                {forecast.forecastRiskPercent}% Risk
              </span>
            </div>
          )}
        </div>

        {/* Forecast Content or Insufficient Data State */}
        {!forecast.available ? (
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{forecast.reason}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Grid of Forecast Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Current Score</span>
                <span className="text-base font-bold font-mono text-white">
                  {forecast.currentScore} / 100
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Latest entry</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">7-Day Trend</span>
                <span
                  className={`text-base font-bold uppercase font-mono ${
                    forecast.trend7Day === 'escalating'
                      ? 'text-rose-400'
                      : forecast.trend7Day === 'improving'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {forecast.trend7Day}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{forecast.trendDirection}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Forecast Risk</span>
                <span
                  className={`text-base font-bold font-mono ${
                    forecast.forecastRiskPercent >= 70
                      ? 'text-rose-400'
                      : forecast.forecastRiskPercent >= 40
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {forecast.forecastRiskPercent}% probability
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Tier: {forecast.forecastRiskLevel}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Forecast Window</span>
                <span className="text-base font-bold font-mono text-cyan-400">
                  {forecast.forecastWindow}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Predictive Horizon</span>
              </div>
            </div>

            {/* Disclaimer & Explainer Toggle */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-slate-400 italic">
                {forecast.methodologyNote}
              </span>
              <button
                type="button"
                onClick={() => setShowForecastExplainer(!showForecastExplainer)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>How is this calculated?</span>
                {showForecastExplainer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Expandable Explanation of Predictive Factors */}
            {showForecastExplainer && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Predictive Burnout Indicator Factors:
                </h4>
                <ul className="text-slate-400 text-[11px] space-y-1">
                  <li>• <strong>HRV Slope:</strong> {forecast.factors.hrvDegradation}</li>
                  <li>• <strong>Sleep Deficit:</strong> {forecast.factors.sleepDeficit}</li>
                  <li>• <strong>Resting HR Elevation:</strong> {forecast.factors.rhrElevation}</li>
                  <li>• <strong>Duty Fatigue:</strong> {forecast.factors.dutyFatigue}</li>
                  <li>• <strong>7-Day Delta:</strong> {forecast.factors.recentTrend}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NEW SECTION: Environmental Conditions Modifier */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400">
              <Mountain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Environmental Conditions Modifier
              </h3>
              <p className="text-xs text-slate-400">
                Incorporate climate and terrain stressors into the prototype risk calculation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEnvDetails(!showEnvDetails)}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{showEnvDetails ? 'Hide calculation' : 'View calculation'}</span>
            {showEnvDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Condition Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(
            [
              { id: 'NORMAL', label: 'Normal / Temperate', icon: Shield, mod: '+0%' },
              { id: 'HIGH_ALTITUDE', label: 'High Altitude (>3,000m)', icon: Mountain, mod: '+15%' },
              { id: 'EXTREME_COLD', label: 'Extreme Cold (<-10°C)', icon: Snowflake, mod: '+12%' },
              { id: 'EXTREME_HEAT', label: 'Extreme Heat (>40°C)', icon: Sun, mod: '+18%' },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isSelected = envCondition === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setEnvCondition(item.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="font-mono text-[10px] font-bold text-amber-400">{item.mod}</span>
                </div>
                <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Environmental Calculation Breakdown Panel */}
        {showEnvDetails && (
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <span className="text-slate-300">
                Base Risk: <strong className="font-mono text-white">{currentBaseScore}</strong>
              </span>
              <span className="text-amber-400 font-mono">
                Environmental Modifier: <strong>+{envAdjustment.modifierPercent}%</strong>
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                Adjusted Risk: <strong>{envAdjustment.adjustedScore} / 100 ({envAdjustment.adjustedRiskLevel})</strong>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {envAdjustment.explanation}
            </p>
            <p className="text-[10px] text-amber-300/80 italic">
              Prototype Environmental Stress Modifier — This is a demonstration heuristic and is not a clinical measurement.
            </p>
          </div>
        )}
      </div>

      {/* WEARABLE / SMARTWATCH INGESTION VS MANUAL ENTRY TOGGLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Watch className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Biometric &amp; Duty Welfare Ingestion
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Toggle between simulated Bluetooth wearable telemetry and manual log entry
            </p>
          </div>

          {/* Toggle: Live BLE Watch Sync */}
          <div className="flex items-center gap-3 bg-slate-950 p-1.5 px-3 rounded-lg border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${isBleSyncOn ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              Live BLE Watch Sync:
            </span>
            <button
              type="button"
              onClick={() => setIsBleSyncOn(!isBleSyncOn)}
              className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                isBleSyncOn
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isBleSyncOn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* MODE 1: LIVE BLE WATCH SYNC PANEL */}
        {isBleSyncOn ? (
          <div className="p-5 bg-slate-950 border border-emerald-900/80 rounded-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                      <Wifi className="w-4 h-4 text-emerald-400" />
                      BLE Watch Connected
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      GARMIN-TACTIX-DEMO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Demo wearable telemetry · Last synced: {lastSyncedSeconds} seconds ago
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncingTelemetry}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTelemetry ? 'animate-spin' : ''}`} />
                  <span>{isSyncingTelemetry ? 'Syncing...' : 'Sync Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBleSyncOn(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                >
                  Disconnect Watch
                </button>
              </div>
            </div>

            {/* Simulated Live Telemetry Stream */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                <span className="text-[10px] uppercase text-slate-500 block">Live HRV</span>
                <span className="text-2xl font-bold font-mono text-cyan-400 my-1 block">
                  {liveHrv} ms
                </span>
                <span className="text-[9px] text-slate-500">Demo wearable stream</span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                <span className="text-[10px] uppercase text-slate-500 block">Resting Heart Rate</span>
                <span className="text-2xl font-bold font-mono text-rose-400 my-1 block">
                  {liveRhr} bpm
                </span>
                <span className="text-[9px] text-slate-500">Optical sensor simulation</span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                <span className="text-[10px] uppercase text-slate-500 block">Sleep Ingested</span>
                <span className="text-2xl font-bold font-mono text-purple-400 my-1 block">
                  {liveSleep} hrs
                </span>
                <span className="text-[9px] text-slate-500">Overnight accelerometer</span>
              </div>
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                <span className="text-[10px] uppercase text-slate-500 block">Active Duty Duration</span>
                <span className="text-2xl font-bold font-mono text-amber-400 my-1 block">
                  {liveDuty} hrs
                </span>
                <span className="text-[9px] text-slate-500">GPS duty geofence</span>
              </div>
            </div>

            {/* Mandatory Demonstration Notice */}
            <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                <strong>Demo wearable telemetry notice:</strong> This is a prototype simulation. Values reflect synthetic
                demo telemetry generated for testing without requiring a physical BLE hardware link.
              </span>
            </div>
          </div>
        ) : (
          /* MODE 2: MANUAL ENTRY FORM FALLBACK */
          <form onSubmit={handleSubmitManual} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-slate-400 font-semibold">
                Manual Biometric Entry Fallback:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 mr-1 hidden md:inline">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('standard')}
                  className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('strenuous')}
                  className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 cursor-pointer"
                >
                  Strenuous
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('night_ops')}
                  className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded border border-slate-700 cursor-pointer"
                >
                  Night Ops
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('recovery')}
                  className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 cursor-pointer"
                >
                  Rest Day
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>HRV (RMSSD)</span>
                  <span className="text-[10px] text-slate-500">10-150 ms</span>
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="150"
                  value={hrv}
                  onChange={(e) => setHrv(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Sleep Hours</span>
                  <span className="text-[10px] text-slate-500">1-16 hrs</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="1"
                  max="16"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Resting Heart Rate</span>
                  <span className="text-[10px] text-slate-500">35-160 bpm</span>
                </label>
                <input
                  type="number"
                  required
                  min="35"
                  max="160"
                  value={restingHeartRate}
                  onChange={(e) => setRestingHeartRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Duty Duration</span>
                  <span className="text-[10px] text-slate-500">0-24 hrs</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0"
                  max="24"
                  value={dutyDuration}
                  onChange={(e) => setDutyDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Field Notes / Environmental Factors (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Ridge climb patrol, night sentry shift, heavy ruck carry..."
              />
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                    liveBreakdown.riskLevel === 'HIGH'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : liveBreakdown.riskLevel === 'MODERATE'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  Projected Base Score: {liveBreakdown.score}/100 ({liveBreakdown.riskLevel} RISK)
                </div>
                <span className="text-xs text-slate-400">
                  Calculated Prototype Indicator (Environmental condition: {envCondition})
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Logging...' : 'Submit Manual Biometric Log'}</span>
              </button>
            </div>
          </form>
        )}

        {submitMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{submitMessage}</span>
          </div>
        )}
      </div>

      {/* Interactive Charts: Longitudinal Stress & Multi-metric Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <TrendLineChart
            labels={chartLabels}
            stressScores={stressScores}
            title={`${soldier.name} - 14-Day Stress Score Trend`}
            height={260}
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              Multi-Metric Correlation (HRV vs Sleep vs Pulse)
            </h4>
          </div>
          <MultiMetricChart
            labels={chartLabels}
            hrv={hrvValues}
            sleep={sleepValues}
            rhr={rhrValues}
            height={260}
          />
        </div>
      </div>

      {/* Recent History Table & Self-Care Protocols */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Biometric Log History (Last 14 Days)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">HRV (ms)</th>
                  <th className="py-2.5 px-3">Sleep</th>
                  <th className="py-2.5 px-3">RHR</th>
                  <th className="py-2.5 px-3">Duty</th>
                  <th className="py-2.5 px-3">Stress Score</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{log.date}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400">{log.hrv} ms</td>
                    <td className="py-2.5 px-3 font-mono text-purple-400">{log.sleepHours}h</td>
                    <td className="py-2.5 px-3 font-mono text-rose-400">{log.restingHeartRate} bpm</td>
                    <td className="py-2.5 px-3 font-mono text-amber-400">{log.dutyDuration}h</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span
                        className={
                          log.stressScore >= 70
                            ? 'text-rose-400'
                            : log.stressScore >= 40
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {log.stressScore}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          log.riskLevel === 'HIGH'
                            ? 'bg-rose-950 text-rose-300'
                            : log.riskLevel === 'MODERATE'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-emerald-950 text-emerald-300'
                        }`}
                      >
                        {log.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Self-Care & Operational Welfare Guidelines */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Tactical Self-Care Guidelines
          </h4>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-slate-200 block mb-1">
                • Physiological Sigh (Acute Stress Reset)
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Two quick consecutive inhales through the nose followed by a slow extended exhale through the mouth. Repeat 3 times to immediately lower sympathetic pulse rate.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-slate-200 block mb-1">
                • Sleep Architecture Protection
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Prioritize dark, quiet bivouac sleep. A 20-30 min tactical catnap before night patrol restores vigilance without post-sleep inertia.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-slate-200 block mb-1">
                • Thermal &amp; Hydration Protocol
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Minimum 3.5L fluids in high altitude / heat. Electrolyte replenishment is vital to prevent tachycardia and autonomic fatigue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
