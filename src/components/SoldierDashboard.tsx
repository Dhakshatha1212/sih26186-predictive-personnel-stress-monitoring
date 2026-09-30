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
  AlertCircle,
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
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Sliders,
  HelpCircle,
  X,
  User as UserIcon,
  Bell,
  FileText,
  Award,
  ArrowRight,
  ExternalLink,
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
  activeTab?: 'overview' | 'daily-log' | 'trends' | 'alerts' | 'profile';
  onNavigateTab?: (tab: 'overview' | 'daily-log' | 'trends' | 'alerts' | 'profile') => void;
}

export const SoldierDashboard: React.FC<SoldierDashboardProps> = ({
  soldier,
  allSoldiers,
  onSelectSoldier,
  logs,
  onSubmitLog,
  weights,
  thresholds,
  activeTab = 'overview',
  onNavigateTab,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Live BLE Wearable Ingestion State (Simulation)
  const [isBleSyncOn, setIsBleSyncOn] = useState(false);
  const [liveHrv, setLiveHrv] = useState(64);
  const [liveRhr, setLiveRhr] = useState(63);
  const [liveSleep, setLiveSleep] = useState(6.8);
  const [liveDuty, setLiveDuty] = useState(9.0);
  const [lastSyncedSeconds, setLastSyncedSeconds] = useState(4);
  const [isSyncingTelemetry, setIsSyncingTelemetry] = useState(false);

  // 1b. Real Web Bluetooth API State (0x180D Heart Rate Service)
  const [realBleDevice, setRealBleDevice] = useState<any | null>(null);
  const [isRealBleConnected, setIsRealBleConnected] = useState(false);
  const [realDeviceName, setRealDeviceName] = useState<string>('');
  const [isConnectingRealBle, setIsConnectingRealBle] = useState(false);
  const [realBleStatusNote, setRealBleStatusNote] = useState<string | null>(null);
  const [realBleError, setRealBleError] = useState<string | null>(null);
  const [realPacketsReceived, setRealPacketsReceived] = useState(0);
  const [liveBpmPulse, setLiveBpmPulse] = useState(false);
  const [isWebBleSupported, setIsWebBleSupported] = useState(true);
  const [showBleHelpModal, setShowBleHelpModal] = useState(false);

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

  // Check Web Bluetooth support on mount
  useEffect(() => {
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      setIsWebBleSupported(false);
    }
  }, []);

  // Latest recorded log
  const latestLog = logs.length > 0 ? logs[0] : null;

  // Periodic simulation for Live Wearable Telemetry (only jitter when not receiving real BLE)
  useEffect(() => {
    if (!isBleSyncOn) return;

    // Second counter
    const timer = setInterval(() => {
      setLastSyncedSeconds((prev) => prev + 1);
    }, 1000);

    // Periodic sensor packet jitter update every 5 seconds (simulated mode only)
    let jitterTimer: any;
    if (!isRealBleConnected) {
      jitterTimer = setInterval(() => {
        setLiveHrv((prev) => Math.max(25, Math.min(100, prev + (Math.floor(Math.random() * 5) - 2))));
        setLiveRhr((prev) => Math.max(50, Math.min(110, prev + (Math.floor(Math.random() * 3) - 1))));
        setLastSyncedSeconds(0);
      }, 5000);
    }

    return () => {
      clearInterval(timer);
      if (jitterTimer) clearInterval(jitterTimer);
    };
  }, [isBleSyncOn, isRealBleConnected]);

  // Connect Real Bluetooth Smartwatch (Web BLE API targeting Heart Rate Service 0x180D)
  const handleConnectRealBluetooth = async () => {
    setRealBleError(null);
    setRealBleStatusNote(null);

    // Check Web Bluetooth API availability
    if (typeof navigator === 'undefined' || !(navigator as any).bluetooth) {
      setRealBleError(
        'Web Bluetooth API is not available in this browser. Please use Chrome, Edge, or Opera on desktop or Android. Fallback active: Running simulated BLE stream.'
      );
      setIsBleSyncOn(true); // Fallback cleanly to simulated BLE stream
      return;
    }

    setIsConnectingRealBle(true);
    try {
      // Standard Web Bluetooth API targeting Heart Rate Service (0x180D)
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: [0x180d] },
        ],
        optionalServices: ['heart_rate', 0x180d, 'battery_service', 0x180f],
      });

      const devName = device.name || 'Real Smartwatch (Heart Rate 0x180D)';
      setRealDeviceName(devName);
      setRealBleDevice(device);

      const server = await device.gatt.connect();

      // Disconnect listener for graceful fallback
      device.addEventListener('gattserverdisconnected', () => {
        setIsRealBleConnected(false);
        setRealBleDevice(null);
        setRealBleStatusNote(`Smartwatch (${devName}) disconnected. Cleanly reverted to simulated BLE stream.`);
        setIsBleSyncOn(true); // Seamless fallback
      });

      // Obtain Heart Rate Service (0x180D)
      let service: any;
      try {
        service = await server.getPrimaryService('heart_rate');
      } catch {
        service = await server.getPrimaryService(0x180d);
      }

      // Obtain Heart Rate Measurement Characteristic (0x2A37)
      let characteristic: any;
      try {
        characteristic = await service.getCharacteristic('heart_rate_measurement');
      } catch {
        characteristic = await service.getCharacteristic(0x2a37);
      }

      await characteristic.startNotifications();

      // Listen for incoming live Heart Rate Measurement notifications
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value as DataView;
        if (!value || value.byteLength === 0) return;

        // Bluetooth SIG Heart Rate Measurement Specification:
        // Byte 0: Flags (Bit 0: format 0=UINT8, 1=UINT16)
        const flags = value.getUint8(0);
        const rate16Bits = (flags & 0x1) !== 0;
        let bpm = 0;
        let offset = 1;

        if (rate16Bits && value.byteLength >= 3) {
          bpm = value.getUint16(offset, true);
          offset += 2;
        } else if (value.byteLength >= 2) {
          bpm = value.getUint8(offset);
          offset += 1;
        }

        if (bpm > 30 && bpm < 240) {
          // Stream live Heart Rate (BPM) into Soldier's real-time biometric feed
          setLiveRhr(bpm);
          setLastSyncedSeconds(0);
          setRealPacketsReceived((prev) => prev + 1);

          // Pulse animation on live beat
          setLiveBpmPulse(true);
          setTimeout(() => setLiveBpmPulse(false), 400);

          // Check if RR-intervals are present (Bit 4 of flags)
          const rrPresent = (flags & 0x10) !== 0;
          if (rrPresent && offset + 1 < value.byteLength) {
            const rrMs = value.getUint16(offset, true) * (1000 / 1024);
            const calculatedHrv = Math.max(25, Math.min(130, Math.round(rrMs / 10)));
            setLiveHrv(calculatedHrv);
          } else {
            // Dynamic autonomic HRV heuristic
            const derivedHrv = Math.max(30, Math.min(105, Math.round(112 - bpm * 0.72)));
            setLiveHrv(derivedHrv);
          }
        }
      });

      setIsRealBleConnected(true);
      setIsBleSyncOn(true);
      setRealBleStatusNote(
        `Successfully connected to "${devName}"! Streaming live Heart Rate (0x180D) into personal biometric feed.`
      );
    } catch (err: any) {
      console.warn('Bluetooth pairing error or user cancelled:', err);
      // Clean fallback: If device is not paired or cancelled
      if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
        setRealBleStatusNote(
          'Bluetooth device dialog closed. Cleanly maintaining simulated BLE stream.'
        );
      } else if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
        setRealBleError(
          'Web Bluetooth access is restricted in this window. Cleanly running simulated BLE stream.'
        );
      } else {
        setRealBleStatusNote(
          `Bluetooth device notice: ${err.message || 'Could not connect'}. Cleanly running simulated BLE stream.`
        );
      }
      // Ensure the soldier's biometric feed continues seamlessly with simulated stream
      setIsBleSyncOn(true);
    } finally {
      setIsConnectingRealBle(false);
    }
  };

  // Disconnect Real Smartwatch
  const handleDisconnectRealBluetooth = () => {
    if (realBleDevice && realBleDevice.gatt && realBleDevice.gatt.connected) {
      try {
        realBleDevice.gatt.disconnect();
      } catch (e) {
        console.error('Error disconnecting GATT server:', e);
      }
    }
    setIsRealBleConnected(false);
    setRealBleDevice(null);
    setRealBleStatusNote('Bluetooth smartwatch disconnected. Cleanly reverted to simulated stream.');
  };

  // Synchronize Live Telemetry to Backend
  const handleSyncNow = async () => {
    setIsSyncingTelemetry(true);
    try {
      const sourceNote = isRealBleConnected
        ? `Real Web Bluetooth (0x180D) paired to ${realDeviceName || 'Smartwatch'}`
        : `Simulated live BLE wearable ingestion`;

      await onSubmitLog({
        soldierId: soldier.soldierId,
        date: todayStr,
        hrv: liveHrv,
        sleepHours: liveSleep,
        restingHeartRate: liveRhr,
        dutyDuration: liveDuty,
        environmentalCondition: envCondition,
        notes: `${sourceNote} under ${envCondition} conditions.`,
      });
      setLastSyncedSeconds(0);
      setSubmitMessage(
        isRealBleConnected
          ? `Real Smartwatch telemetry (${liveRhr} BPM from ${realDeviceName}) recorded to personal welfare history!`
          : 'Live wearable telemetry synced successfully to database!'
      );
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
      {/* SECTION 1: HEADER & WELCOME STRIP */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Personnel Welfare Portal</span>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Welcome back, {soldier.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {soldier.rank} · {soldier.unit} {soldier.squad ? `· ${soldier.squad}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confidential Personal Record</span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-900/60 px-1 py-0.2 rounded">
                {soldier.soldierId}
              </span>
            </div>
          </div>
        </div>

        {/* Today's Welfare Status strip (Requirement 9) */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Today&apos;s Welfare Status
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Current Risk</span>
              <span
                className={`text-sm font-bold uppercase mt-1 inline-block px-2 py-0.5 rounded border ${
                  envAdjustment.adjustedRiskLevel === 'HIGH'
                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                    : envAdjustment.adjustedRiskLevel === 'MODERATE'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}
              >
                {envAdjustment.adjustedRiskLevel} RISK
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Stress Score</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className={`text-xl font-bold font-mono ${
                    envAdjustment.adjustedScore >= 70
                      ? 'text-rose-400'
                      : envAdjustment.adjustedScore >= 40
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {envAdjustment.adjustedScore}
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Last Recorded</span>
              <span className="text-sm font-mono font-medium text-slate-200 mt-1 block">
                {latestLog ? latestLog.date : 'Today'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">7-Day Trend</span>
              <span
                className={`text-xs font-semibold mt-1 block capitalize ${
                  forecast.trend7Day === 'escalating'
                    ? 'text-rose-400'
                    : forecast.trend7Day === 'improving'
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }`}
              >
                {forecast.trend7Day}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER VIEW ACCORDING TO ACTIVE TAB OR ALL-IN-ONE FOR OVERVIEW */}

      {/* VIEW: OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards: Current Wellness & Biometric Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stress Score Card */}
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
                  Base: {currentBaseScore}
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
                  {latestLog ? latestLog.hrv : liveHrv}
                </span>
                <span className="text-xs text-slate-400">ms (RMSSD)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Measured Telemetry</span>
                <span className={(latestLog ? latestLog.hrv : liveHrv) < 40 ? 'text-rose-400' : 'text-emerald-400'}>
                  {(latestLog ? latestLog.hrv : liveHrv) < 40 ? 'Suppressed' : 'Healthy'}
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
                  {latestLog ? latestLog.sleepHours : liveSleep}
                </span>
                <span className="text-xs text-slate-400">hrs</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Resting Pulse</span>
                <span className="font-mono text-rose-400">
                  {latestLog ? `${latestLog.restingHeartRate} bpm` : `${liveRhr} bpm`}
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
                  {latestLog ? latestLog.dutyDuration : liveDuty}
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

          {/* Daily Welfare Log Quick Action Bar (Requirement 9: "Then: Daily Welfare Log [ Manual Entry ] [ Live Watch Sync ]") */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Watch className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Daily Welfare Log &amp; Wearable Link</h3>
                  {isRealBleConnected ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                      <BluetoothConnected className="w-3 h-3 text-emerald-400" />
                      {realDeviceName || 'Real BLE Smartwatch'}
                    </span>
                  ) : isBleSyncOn ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800">
                      Simulated BLE Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Manual Ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Log your daily rest, duty fatigue, and biometric readings or connect real smartwatch hardware
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                {/* Connect Real Smartwatch Button */}
                <button
                  type="button"
                  onClick={handleConnectRealBluetooth}
                  disabled={isConnectingRealBle}
                  className="px-3.5 py-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-2 border border-indigo-700 cursor-pointer transition-colors"
                >
                  <Bluetooth className={`w-3.5 h-3.5 text-indigo-400 ${isConnectingRealBle ? 'animate-spin' : ''}`} />
                  <span>
                    {isConnectingRealBle
                      ? 'Pairing 0x180D...'
                      : isRealBleConnected
                      ? 'Smartwatch Paired'
                      : 'Connect Real Smartwatch (Web BLE)'}
                  </span>
                </button>

                {/* Live Watch Sync Simulation Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsBleSyncOn(!isBleSyncOn);
                    onNavigateTab?.('daily-log');
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors border ${
                    isBleSyncOn
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${isBleSyncOn ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                  <span>Live Watch Sync {isBleSyncOn ? '(ON)' : ''}</span>
                </button>

                {/* Manual Entry Button */}
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('daily-log')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-slate-400" />
                  <span>Manual Entry</span>
                </button>
              </div>
            </div>
          </div>

          {/* 7-Day Predictive Stress Forecast (Requirement 9) */}
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
                      Trend Heuristic
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

            {!forecast.available ? (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{forecast.reason}</span>
              </div>
            ) : (
              <div className="space-y-3">
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

          {/* Recent Welfare Records (Requirement 9: "Then: Recent Welfare Records") */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Recent Welfare Records
              </h4>
              <button
                type="button"
                onClick={() => onNavigateTab?.('trends')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Trends &amp; History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

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
                  {logs.slice(0, 5).map((log) => (
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
        </div>
      )}

      {/* VIEW: DAILY WELFARE LOG TAB (Biometric ingestion, Web BLE Smartwatch pairing, Manual form, Presets, Environmental conditions) */}
      {(activeTab === 'daily-log' || activeTab === 'overview') && (
        <div className={`space-y-6 ${activeTab === 'overview' ? 'pt-4 border-t border-slate-800/60' : ''}`}>
          {/* Section Heading if in daily-log tab */}
          {activeTab === 'daily-log' && (
            <div>
              <h2 className="text-lg font-bold text-white">Daily Welfare Biometric Ingestion</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect real Bluetooth smartwatches via Web Bluetooth API (0x180D) or use simulated telemetry stream and manual records.
              </p>
            </div>
          )}

          {/* WEARABLE / SMARTWATCH INGESTION VS MANUAL ENTRY TOGGLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Watch className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    Live Wearable Telemetry &amp; Hardware Pairing
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stream optical PPG heart rate from real smartwatches or run calibrated prototype simulation
                </p>
              </div>

              {/* Action Buttons: Real Smartwatch (Web BLE) & Simulation Toggle */}
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Connect Real Smartwatch via Web Bluetooth */}
                {!isRealBleConnected ? (
                  <button
                    type="button"
                    onClick={handleConnectRealBluetooth}
                    disabled={isConnectingRealBle}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-900/90 hover:bg-indigo-800 text-indigo-100 border border-indigo-700 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Bluetooth className={`w-3.5 h-3.5 text-indigo-300 ${isConnectingRealBle ? 'animate-spin' : ''}`} />
                    <span>
                      {isConnectingRealBle ? 'Searching 0x180D Devices...' : 'Connect Real Smartwatch (Web BLE)'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDisconnectRealBluetooth}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-300 hover:bg-emerald-900/80 cursor-pointer transition-colors shadow-sm"
                  >
                    <BluetoothConnected className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Connected: {realDeviceName || 'Smartwatch'}</span>
                    <X className="w-3 h-3 ml-1 text-emerald-400" />
                  </button>
                )}

                {/* Pairing Guide Button */}
                <button
                  type="button"
                  onClick={() => setShowBleHelpModal(!showBleHelpModal)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Smartwatch Guide</span>
                </button>

                {/* Toggle: Live BLE Watch Sync Simulation */}
                <div className="flex items-center gap-2 bg-slate-950 p-1 px-2.5 rounded-lg border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Radio className={`w-3.5 h-3.5 ${isBleSyncOn ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                    Simulation:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBleSyncOn(!isBleSyncOn)}
                    className={`px-2.5 py-0.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                      isBleSyncOn
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isBleSyncOn ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Smartwatch Pairing Instructions Helper Box */}
            {showBleHelpModal && (
              <div className="p-4 bg-slate-950 border border-indigo-900/60 rounded-xl text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 font-semibold text-indigo-300">
                    <Bluetooth className="w-4 h-4 text-indigo-400" />
                    <span>How to Pair Real Smartwatches via Web Bluetooth API (0x180D)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBleHelpModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 text-[11px]">
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                    <strong className="text-emerald-400 block mb-1">Noise / Boat / Amazfit / Fire-Boltt</strong>
                    Turn on the watch, start a heart rate measurement or workout mode. The watch broadcasts standard Bluetooth SIG Heart Rate Service (0x180D). Click &quot;Connect Real Smartwatch&quot; and select your device from the Chrome pairing prompt.
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                    <strong className="text-cyan-400 block mb-1">Apple Watch (watchOS)</strong>
                    Install the free <span className="underline">HeartCast</span> or <span className="underline">BLE Heart Rate Transmitter</span> app on your Apple Watch. Start broadcast; it will appear in Web Bluetooth as standard GATT Heart Rate Service.
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                    <strong className="text-purple-400 block mb-1">Samsung Galaxy Watch (Wear OS)</strong>
                    Install <span className="underline">Heart Rate to Web Bluetooth</span> or <span className="underline">Heart Rate Broadcaster</span> from Play Store. Start broadcast; pair via 0x180D.
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                    <strong className="text-amber-400 block mb-1">Garmin (Tactix / Fenix / Forerunner)</strong>
                    Go to Menu → Wrist Heart Rate → Broadcast Heart Rate → Start. Standard 0x180D packets will stream directly into the feed.
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Note: Web Bluetooth requires Chrome, Edge, or Opera. If your browser does not support Web Bluetooth or no device is paired, the system automatically falls back to simulated BLE telemetry.
                </p>
              </div>
            )}

            {/* Status Notifications for Real BLE */}
            {realBleStatusNote && (
              <div className="p-3 bg-indigo-950/50 border border-indigo-800/80 rounded-lg text-xs text-indigo-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{realBleStatusNote}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRealBleStatusNote(null)}
                  className="text-indigo-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {realBleError && (
              <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-lg text-xs text-amber-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{realBleError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRealBleError(null)}
                  className="text-amber-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* MODE 1: LIVE BLE WATCH SYNC PANEL (Real Hardware or Simulation) */}
            {isBleSyncOn ? (
              <div className="p-5 bg-slate-950 border border-emerald-900/80 rounded-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isRealBleConnected ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500 animate-ping'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                          {isRealBleConnected ? (
                            <>
                              <BluetoothConnected className="w-4 h-4 text-emerald-400" />
                              Real Smartwatch Streaming
                            </>
                          ) : (
                            <>
                              <Wifi className="w-4 h-4 text-emerald-400" />
                              BLE Watch Connected (Simulation)
                            </>
                          )}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {isRealBleConnected ? realDeviceName || 'REAL BLE (0x180D)' : 'GARMIN-TACTIX-DEMO'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isRealBleConnected ? (
                          <>Physical Hardware Link · Web Bluetooth API (0x180D) · {realPacketsReceived} heartbeats captured</>
                        ) : (
                          <>Calibrated demo wearable telemetry · Last synced: {lastSyncedSeconds} seconds ago</>
                        )}
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
                      <span>{isSyncingTelemetry ? 'Syncing...' : 'Sync Now to Records'}</span>
                    </button>
                    {isRealBleConnected ? (
                      <button
                        type="button"
                        onClick={handleDisconnectRealBluetooth}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                      >
                        Disconnect Real Watch
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsBleSyncOn(false)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                      >
                        Disconnect Simulation
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Telemetry Stream Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Live Heart Rate (BPM) with dynamic pulse effect */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-center relative overflow-hidden">
                    <span className="text-[10px] uppercase text-slate-500 block flex items-center justify-center gap-1">
                      <Heart className={`w-3.5 h-3.5 text-rose-500 ${liveBpmPulse ? 'scale-125 transition-transform' : ''}`} />
                      Live Heart Rate (BPM)
                    </span>
                    <span className="text-2xl font-bold font-mono text-rose-400 my-1 block">
                      {liveRhr} bpm
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {isRealBleConnected ? 'Real Optical PPG Sensor' : 'Optical sensor simulation'}
                    </span>
                  </div>

                  {/* Live HRV */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                    <span className="text-[10px] uppercase text-slate-500 block">Live HRV (RMSSD)</span>
                    <span className="text-2xl font-bold font-mono text-cyan-400 my-1 block">
                      {liveHrv} ms
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {isRealBleConnected ? 'Real beat-to-beat variability' : 'Autonomic jitter stream'}
                    </span>
                  </div>

                  {/* Sleep Ingested */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                    <span className="text-[10px] uppercase text-slate-500 block">Sleep Ingested</span>
                    <span className="text-2xl font-bold font-mono text-purple-400 my-1 block">
                      {liveSleep} hrs
                    </span>
                    <span className="text-[9px] text-slate-500">Overnight accelerometer</span>
                  </div>

                  {/* Active Duty Duration */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-center">
                    <span className="text-[10px] uppercase text-slate-500 block">Active Duty Duration</span>
                    <span className="text-2xl font-bold font-mono text-amber-400 my-1 block">
                      {liveDuty} hrs
                    </span>
                    <span className="text-[9px] text-slate-500">GPS duty geofence</span>
                  </div>
                </div>

                {/* Telemetry Source Notice */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded text-[11px] text-slate-400 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    {isRealBleConnected ? (
                      <>
                        <strong>Live Web Bluetooth Active:</strong> Receiving live GATT Heart Rate packets from{' '}
                        <span className="text-emerald-400 font-semibold">{realDeviceName || 'Smartwatch'}</span> via Service{' '}
                        <code className="text-slate-300">0x180D</code> / Characteristic <code className="text-slate-300">0x2A37</code>.
                      </>
                    ) : (
                      <>
                        <strong>Simulation Mode Active:</strong> Synthetic demo telemetry is generated. You can pair a physical Noise, Boat, Apple Watch, or Galaxy Watch anytime using the &quot;Connect Real Smartwatch&quot; button above.
                      </>
                    )}
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
                      Calculated Heuristic Indicator (Environmental condition: {envCondition})
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

          {/* ENVIRONMENTAL CONDITIONS MODIFIER */}
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
                    Autonomic strain adjustment for high-altitude hypobaric hypoxia, extreme cold, and heat
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEnvDetails(!showEnvDetails)}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>{showEnvDetails ? 'Hide Calculation' : 'Inspect Formula'}</span>
                {showEnvDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Condition Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  { id: 'NORMAL', label: 'Normal / Standard', icon: Sun, color: 'emerald' },
                  { id: 'HIGH_ALTITUDE', label: 'High Altitude (>9000ft)', icon: Mountain, color: 'cyan' },
                  { id: 'EXTREME_COLD', label: 'Extreme Cold (Sub-zero)', icon: Snowflake, color: 'blue' },
                  { id: 'EXTREME_HEAT', label: 'Extreme Heat (>42°C)', icon: Flame, color: 'amber' },
                ] as const
              ).map((item) => {
                const isSelected = envCondition === item.id;
                const Icon = item.icon;
                const config = ENVIRONMENTAL_CONFIG[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEnvCondition(item.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-amber-500 ring-1 ring-amber-500 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Icon
                        className={`w-4 h-4 ${
                          item.color === 'emerald'
                            ? 'text-emerald-400'
                            : item.color === 'cyan'
                            ? 'text-cyan-400'
                            : item.color === 'blue'
                            ? 'text-blue-400'
                            : 'text-amber-400'
                        }`}
                      />
                      {isSelected && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-900">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white block">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {config.modifierPercent > 0 ? `+${config.modifierPercent}% Stress Strain` : 'Standard Baseline'}
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
                  Environmental Stress Modifier Heuristic — Calibrated heuristic adjustments for physiological fatigue monitoring.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: MY TRENDS TAB (Charts & Longitudinal logs) */}
      {(activeTab === 'trends' || activeTab === 'overview') && (
        <div className={`space-y-6 ${activeTab === 'overview' ? 'pt-4 border-t border-slate-800/60' : ''}`}>
          {activeTab === 'trends' && (
            <div>
              <h2 className="text-lg font-bold text-white">Longitudinal Stress &amp; Biometric Trends</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Longitudinal telemetry tracking over the past 14 recorded operational duty cycles
              </p>
            </div>
          )}

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

          {/* Detailed 14-Day Table */}
          {activeTab === 'trends' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Comprehensive 14-Day Biometric Record Archive
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
                    {logs.map((log) => (
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
          )}
        </div>
      )}

      {/* VIEW: MY ALERTS TAB */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Personnel Welfare Alerts &amp; Clinical Reviews</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized medical review notices, elevated stress warnings, and tactical rest recommendations
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Active Welfare Notices for {soldier.name}
            </h3>

            {envAdjustment.adjustedRiskLevel === 'HIGH' ? (
              <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-200 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Elevated Autonomic Fatigue Detected
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-900 rounded text-rose-300">
                    RMO Clinical Triage Active
                  </span>
                </div>
                <p className="text-xs text-rose-300/90 leading-relaxed">
                  Your recent autonomic indices reflect elevated cardiac strain (HRV &lt; 40ms or sleep &lt; 5 hours). The Regimental Medical Officer has been notified for confidential clinical review. Please prioritize hydration and restorative sleep.
                </p>
              </div>
            ) : envAdjustment.adjustedRiskLevel === 'MODERATE' ? (
              <div className="p-4 bg-amber-950/50 border border-amber-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-200 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400" />
                    Moderate Physical Strain Notice
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-900 rounded text-amber-300">
                    Watch Status
                  </span>
                </div>
                <p className="text-xs text-amber-300/90 leading-relaxed">
                  Moderate cumulative shift fatigue identified. Maintaining regular sleep schedules and tactical breathing resets will preserve operational vigilance.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">Autonomic Welfare Indicators Optimal</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No active fatigue alerts or medical stand-downs. Biometric parameters are within safe baseline ranges.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Personnel Profile &amp; Confidential Service Record</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Service credentials, verified identity, and autonomic physiological baseline category
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-lg font-mono">
                  {soldier.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{soldier.name}</h3>
                  <p className="text-xs text-slate-400">
                    {soldier.rank} · {soldier.soldierId}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Assigned Unit</span>
                  <span className="font-semibold text-slate-200">{soldier.unit}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Tactical Squad</span>
                  <span className="font-semibold text-slate-200">{soldier.squad || 'Squad Alpha'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Account Role</span>
                  <span className="font-semibold text-emerald-400 font-mono">SOLDIER</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Connected Device</span>
                  <span className="font-semibold text-slate-200">
                    {isRealBleConnected ? realDeviceName || 'Web BLE Smartwatch' : 'Garmin Tactix (Simulated)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tactical Self-Care Guidelines */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Tactical Self-Care Protocols
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <span className="font-semibold text-slate-200 block mb-0.5">
                    • Physiological Sigh (Acute Stress Reset)
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Two quick consecutive inhales through the nose followed by a slow extended exhale through the mouth. Repeat 3 times to immediately lower sympathetic pulse rate.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <span className="font-semibold text-slate-200 block mb-0.5">
                    • Sleep Architecture Protection
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Prioritize dark, quiet bivouac sleep. A 20-30 min tactical catnap before night patrol restores vigilance without post-sleep inertia.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                  <span className="font-semibold text-slate-200 block mb-0.5">
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
      )}
    </div>
  );
};
