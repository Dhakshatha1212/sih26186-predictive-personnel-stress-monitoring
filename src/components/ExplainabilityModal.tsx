import React, { useState } from 'react';
import { CalculationThresholds, CalculationWeights } from '../types.ts';
import { calculateStressScore, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS } from '../utils/stressCalculator.ts';
import { X, Calculator, Sliders, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: CalculationWeights;
  thresholds: CalculationThresholds;
  onSaveConfig: (weights: CalculationWeights, thresholds: CalculationThresholds) => void;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  isOpen,
  onClose,
  weights,
  thresholds,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  // Simulator state
  const [simHrv, setSimHrv] = useState(48);
  const [simSleep, setSimSleep] = useState(5.5);
  const [simRhr, setSimRhr] = useState(72);
  const [simDuty, setSimDuty] = useState(11.0);

  // Edit config state
  const [customWeights, setCustomWeights] = useState<CalculationWeights>({ ...weights });
  const [customThresholds, setCustomThresholds] = useState<CalculationThresholds>({ ...thresholds });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const breakdown = calculateStressScore(
    {
      hrv: simHrv,
      sleepHours: simSleep,
      restingHeartRate: simRhr,
      dutyDuration: simDuty,
    },
    customWeights,
    customThresholds
  );

  const handleSave = () => {
    onSaveConfig(customWeights, customThresholds);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setCustomWeights({ ...DEFAULT_WEIGHTS });
    setCustomThresholds({ ...DEFAULT_THRESHOLDS });
    onSaveConfig(DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl my-8 overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Stress Calculation Model &amp; Explainability Inspector
              </h3>
              <p className="text-xs text-slate-400">
                SIH26186 Transparent Multi-Factor Biometric &amp; Duty Heuristic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* SIH Mandatory Medical Disclaimer */}
          <div className="p-3.5 bg-amber-950/30 border border-amber-800/60 rounded-lg flex items-start gap-3 text-xs text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Mandatory SIH Demonstration Notice:</p>
              <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                This calculation produces a <strong>prototype risk/welfare indicator (0–100)</strong> designed to
                assist commanders with anonymized squad readiness and prompt authorized medical officers for early review.
                <strong> It does not claim or constitute a clinical medical diagnosis.</strong>
              </p>
            </div>
          </div>

          {/* Section 1: Mathematical Formula Breakdown */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Transparent Heuristic Formulation</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The overall Stress Score $S \in [0, 100]$ is computed as a weighted linear combination of normalized
              physiological strain components, each clamped between 0 and 100:
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded p-3 font-mono text-xs text-cyan-300 overflow-x-auto">
              Stress Score = (HRV_Strain × {customWeights.hrvWeight}) + (Sleep_Strain × {customWeights.sleepWeight}) +
              (RHR_Strain × {customWeights.rhrWeight}) + (Duty_Strain × {customWeights.dutyWeight})
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800/80">
                <span className="font-semibold text-slate-200">1. HRV Autonomic Strain (Weight: {Math.round(customWeights.hrvWeight * 100)}%)</span>
                <p className="text-slate-400 mt-1">
                  Range: 25ms (High strain = 100) to 75ms (Optimal = 0). Lower HRV indicates parasympathetic suppression and acute stress.
                </p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800/80">
                <span className="font-semibold text-slate-200">2. Sleep Debt Strain (Weight: {Math.round(customWeights.sleepWeight * 100)}%)</span>
                <p className="text-slate-400 mt-1">
                  Range: 4.0 hrs (Critical deficit = 100) to 8.0 hrs (Optimal = 0). Sleep debt directly degrades cognitive reaction and physical recovery.
                </p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800/80">
                <span className="font-semibold text-slate-200">3. Resting Heart Rate Strain (Weight: {Math.round(customWeights.rhrWeight * 100)}%)</span>
                <p className="text-slate-400 mt-1">
                  Range: 58 bpm (Resting baseline = 0) to 90 bpm (Elevated cardiovascular load = 100).
                </p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded border border-slate-800/80">
                <span className="font-semibold text-slate-200">4. Duty Duration Strain (Weight: {Math.round(customWeights.dutyWeight * 100)}%)</span>
                <p className="text-slate-400 mt-1">
                  Range: 8.0 hrs (Standard duty = 0) to 16.0 hrs (Extreme sustained patrol = 100).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Real-Time Simulator */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Live Interactive Heuristic Simulator</span>
              </div>
              <span className="text-xs text-slate-400">
                Test any biometric combinations live
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">HRV (ms):</span>
                    <span className="font-mono text-cyan-400 font-bold">{simHrv} ms</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="110"
                    value={simHrv}
                    onChange={(e) => setSimHrv(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>15 ms (Strained)</span>
                    <span>65 ms (Normal)</span>
                    <span>110 ms (High)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Sleep Duration (hrs):</span>
                    <span className="font-mono text-purple-400 font-bold">{simSleep} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="0.5"
                    value={simSleep}
                    onChange={(e) => setSimSleep(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>2 hrs (Severe debt)</span>
                    <span>7.5 hrs (Target)</span>
                    <span>12 hrs</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Resting Heart Rate (bpm):</span>
                    <span className="font-mono text-rose-400 font-bold">{simRhr} bpm</span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="120"
                    value={simRhr}
                    onChange={(e) => setSimRhr(Number(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>45 bpm (Athletic)</span>
                    <span>65 bpm (Standard)</span>
                    <span>120 bpm (High)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Duty Duration (hrs):</span>
                    <span className="font-mono text-amber-400 font-bold">{simDuty} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="22"
                    step="0.5"
                    value={simDuty}
                    onChange={(e) => setSimDuty(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>4 hrs</span>
                    <span>8 hrs (Standard)</span>
                    <span>22 hrs (Extreme)</span>
                  </div>
                </div>
              </div>

              {/* Real-time Calculation Result Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Calculated Stress Score
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        breakdown.riskLevel === 'HIGH'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : breakdown.riskLevel === 'MODERATE'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {breakdown.riskLevel} Risk
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-extrabold font-mono ${
                        breakdown.riskLevel === 'HIGH'
                          ? 'text-rose-400'
                          : breakdown.riskLevel === 'MODERATE'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {breakdown.score}
                    </span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>

                  {/* Component Contributions breakdown */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>HRV Contribution ({breakdown.components.hrvScore} × {customWeights.hrvWeight}):</span>
                      <span className="font-mono text-cyan-400">+{breakdown.weightedContributions.hrvContribution}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Sleep Contribution ({breakdown.components.sleepScore} × {customWeights.sleepWeight}):</span>
                      <span className="font-mono text-purple-400">+{breakdown.weightedContributions.sleepContribution}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>RHR Contribution ({breakdown.components.rhrScore} × {customWeights.rhrWeight}):</span>
                      <span className="font-mono text-rose-400">+{breakdown.weightedContributions.rhrContribution}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Duty Contribution ({breakdown.components.dutyScore} × {customWeights.dutyWeight}):</span>
                      <span className="font-mono text-amber-400">+{breakdown.weightedContributions.dutyContribution}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-normal">
                  <strong className="text-slate-300">Triggered Recommendation:</strong> {breakdown.recommendation}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Configurable Weights & Thresholds */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                Configurable Weight Distribution &amp; Risk Thresholds
              </h4>
              <button
                onClick={handleResetDefaults}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset to Standard Defaults
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">HRV Weight</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="0.80"
                  value={customWeights.hrvWeight}
                  onChange={(e) =>
                    setCustomWeights({ ...customWeights, hrvWeight: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Sleep Weight</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="0.80"
                  value={customWeights.sleepWeight}
                  onChange={(e) =>
                    setCustomWeights({ ...customWeights, sleepWeight: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Resting HR Weight</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="0.80"
                  value={customWeights.rhrWeight}
                  onChange={(e) =>
                    setCustomWeights({ ...customWeights, rhrWeight: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Duty Weight</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="0.80"
                  value={customWeights.dutyWeight}
                  onChange={(e) =>
                    setCustomWeights({ ...customWeights, dutyWeight: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="text-slate-400 block mb-1">Low Risk Upper Bound (Current: {customThresholds.lowMax})</label>
                <input
                  type="number"
                  min="20"
                  max="50"
                  value={customThresholds.lowMax}
                  onChange={(e) =>
                    setCustomThresholds({ ...customThresholds, lowMax: parseInt(e.target.value, 10) || 39 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                />
                <span className="text-[10px] text-slate-500">Scores 0 to {customThresholds.lowMax} are tagged LOW</span>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Moderate Risk Upper Bound (Current: {customThresholds.moderateMax})</label>
                <input
                  type="number"
                  min="51"
                  max="85"
                  value={customThresholds.moderateMax}
                  onChange={(e) =>
                    setCustomThresholds({ ...customThresholds, moderateMax: parseInt(e.target.value, 10) || 69 })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-xs"
                />
                <span className="text-[10px] text-slate-500">Scores &gt; {customThresholds.moderateMax} trigger HIGH risk alerts</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Configuration saved and applied across app!
                </span>
              )}
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Save &amp; Apply Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
