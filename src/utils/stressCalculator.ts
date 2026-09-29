import {
  CalculationBreakdown,
  CalculationThresholds,
  CalculationWeights,
  EnvironmentalAdjustment,
  EnvironmentalCondition,
  PredictiveForecast,
  RiskLevel,
  StressBreakdown,
  BiometricLog,
} from '../types.ts';

export const DEFAULT_WEIGHTS: CalculationWeights = {
  hrvWeight: 0.30,
  sleepWeight: 0.30,
  rhrWeight: 0.20,
  dutyWeight: 0.20,
};

// 4-Tier Prototype Risk Classification:
// 0–39 LOW, 40–59 MODERATE, 60–79 HIGH, 80–100 CRITICAL
export const DEFAULT_THRESHOLDS: CalculationThresholds = {
  lowMax: 39,
  moderateMax: 59,
  highMax: 79,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateStressScore(
  input: {
    hrv: number;
    sleepHours: number;
    restingHeartRate: number;
    dutyDuration: number;
  },
  weights: CalculationWeights = DEFAULT_WEIGHTS,
  thresholds: CalculationThresholds = DEFAULT_THRESHOLDS
): StressBreakdown {
  const { hrv, sleepHours, restingHeartRate, dutyDuration } = input;

  // 1. HRV Strain (lower HRV => higher autonomic strain)
  // Optimal: >= 75ms (strain = 0), Severe: <= 20ms (strain = 100)
  const hrvStrain = clamp(((75 - hrv) / (75 - 20)) * 100, 0, 100);

  // 2. Sleep Strain (fewer hours => higher sleep debt)
  // Optimal: >= 8.0h (strain = 0), Severe: <= 3.5h (strain = 100)
  const sleepStrain = clamp(((8.0 - sleepHours) / (8.0 - 3.5)) * 100, 0, 100);

  // 3. Resting Heart Rate Strain (elevated RHR => cardiovascular/stress strain)
  // Optimal: <= 58bpm (strain = 0), Severe: >= 92bpm (strain = 100)
  const rhrStrain = clamp(((restingHeartRate - 58) / (92 - 58)) * 100, 0, 100);

  // 4. Duty Duration Strain (prolonged operational duty => cumulative fatigue)
  // Standard: <= 8.0h (strain = 0), Severe: >= 16.0h (strain = 100)
  const dutyStrain = clamp(((dutyDuration - 8.0) / (16.0 - 8.0)) * 100, 0, 100);

  // Weighted contributions
  const hrvContribution = Number((hrvStrain * weights.hrvWeight).toFixed(1));
  const sleepContribution = Number((sleepStrain * weights.sleepWeight).toFixed(1));
  const rhrContribution = Number((rhrStrain * weights.rhrWeight).toFixed(1));
  const dutyContribution = Number((dutyStrain * weights.dutyWeight).toFixed(1));

  const rawScore = hrvContribution + sleepContribution + rhrContribution + dutyContribution;
  const score = Math.round(clamp(rawScore, 0, 100));

  let riskLevel: RiskLevel = 'LOW';
  if (score > thresholds.highMax) {
    riskLevel = 'CRITICAL';
  } else if (score > thresholds.moderateMax) {
    riskLevel = 'HIGH';
  } else if (score > thresholds.lowMax) {
    riskLevel = 'MODERATE';
  }

  // Factor identification
  const factors: string[] = [];
  if (hrv < 35) factors.push(`Suppressed HRV (${hrv} ms) indicates high autonomic nervous strain.`);
  else if (hrv < 48) factors.push(`Moderate HRV suppression (${hrv} ms).`);

  if (sleepHours < 4.5) factors.push(`Critical sleep deprivation (${sleepHours} hrs vs 8 hrs target).`);
  else if (sleepHours < 6.0) factors.push(`Cumulative sleep deficit (${sleepHours} hrs).`);

  if (restingHeartRate > 84) factors.push(`Markedly elevated resting pulse (${restingHeartRate} bpm).`);
  else if (restingHeartRate > 74) factors.push(`Elevated resting heart rate (${restingHeartRate} bpm).`);

  if (dutyDuration > 14) factors.push(`Prolonged sustained combat duty (${dutyDuration} hrs).`);
  else if (dutyDuration > 10.5) factors.push(`Extended operational duty shift (${dutyDuration} hrs).`);

  if (factors.length === 0) {
    factors.push('All biometric and duty indicators are within optimal physiological baselines.');
  }

  // Tactical Recommendations
  let recommendation = 'Personnel is fully operational with optimal physiological recovery.';
  if (riskLevel === 'CRITICAL') {
    recommendation =
      'CRITICAL: Immediate operational stand-down required. Medical Officer clinical triage and mandatory 24-hour sleep/recovery protocol initiated.';
  } else if (riskLevel === 'HIGH') {
    recommendation =
      'High Risk: Recommend operational duty rotation, priority 8-hour sleep window, and clinical monitoring.';
  } else if (riskLevel === 'MODERATE') {
    recommendation =
      'Elevated Fatigue: Ensure hydration protocol, prioritize 7+ hours of uninterrupted rest, and adjust heavy physical drill schedule.';
  }

  return {
    score,
    riskLevel,
    components: {
      hrvScore: Math.round(hrvStrain),
      sleepScore: Math.round(sleepStrain),
      rhrScore: Math.round(rhrStrain),
      dutyScore: Math.round(dutyStrain),
    },
    weightedContributions: {
      hrvContribution,
      sleepContribution,
      rhrContribution,
      dutyContribution,
    },
    factors,
    recommendation,
  };
}

// Environmental Condition Modifiers
export const ENVIRONMENTAL_CONFIG: Record<
  EnvironmentalCondition,
  { label: string; modifierPercent: number; explanation: string }
> = {
  NORMAL: {
    label: 'Normal / Temperate',
    modifierPercent: 0,
    explanation: 'Standard baseline environmental conditions; no stress modifier applied.',
  },
  HIGH_ALTITUDE: {
    label: 'High Altitude (>3,000m)',
    modifierPercent: 15,
    explanation:
      'Hypobaric hypoxia increases autonomic sympathetic tone and respiratory workload.',
  },
  EXTREME_COLD: {
    label: 'Extreme Cold (< -10°C)',
    modifierPercent: 12,
    explanation:
      'Peripheral vasoconstriction and metabolic shivering thermogenesis increase physical effort.',
  },
  EXTREME_HEAT: {
    label: 'Extreme Heat (> 40°C)',
    modifierPercent: 18,
    explanation:
      'Elevated thermal load and rapid evaporative hydration loss accelerate cardiovascular strain.',
  },
};

export function calculateEnvironmentalAdjustment(
  baseScore: number,
  condition: EnvironmentalCondition = 'NORMAL',
  thresholds: CalculationThresholds = DEFAULT_THRESHOLDS
): EnvironmentalAdjustment {
  const config = ENVIRONMENTAL_CONFIG[condition] || ENVIRONMENTAL_CONFIG.NORMAL;
  const modifierMultiplier = 1 + config.modifierPercent / 100;
  const adjustedScore = Math.round(clamp(baseScore * modifierMultiplier, 0, 100));

  let adjustedRiskLevel: RiskLevel = 'LOW';
  if (adjustedScore > thresholds.highMax) {
    adjustedRiskLevel = 'CRITICAL';
  } else if (adjustedScore > thresholds.moderateMax) {
    adjustedRiskLevel = 'HIGH';
  } else if (adjustedScore > thresholds.lowMax) {
    adjustedRiskLevel = 'MODERATE';
  }

  return {
    condition,
    label: config.label,
    modifierPercent: config.modifierPercent,
    baseScore,
    adjustedScore,
    adjustedRiskLevel,
    explanation: config.explanation,
  };
}

// 7-Day Predictive Stress Forecast
export function calculatePredictiveForecast(
  logs: BiometricLog[],
  thresholds: CalculationThresholds = DEFAULT_THRESHOLDS
): PredictiveForecast {
  if (!logs || logs.length < 3) {
    return {
      available: false,
      reason: 'Insufficient historical data for reliable forecast (minimum 3 daily logs required).',
      currentScore: logs && logs.length > 0 ? logs[0].stressScore : 0,
      trend7Day: 'stable',
      forecastRiskPercent: 0,
      forecastRiskLevel: 'LOW',
      forecastWindow: 'Next 48 Hours',
      badgeText: 'Insufficient Data',
      trendDirection: 'Baseline unestablished',
      factors: {
        hrvDegradation: 'No historical telemetry',
        sleepDeficit: 'No historical telemetry',
        rhrElevation: 'No historical telemetry',
        dutyFatigue: 'No historical telemetry',
        recentTrend: 'Insufficient data points',
      },
      methodologyNote:
        'Prototype predictive risk estimate — not a medical diagnosis. Requires longitudinal telemetry.',
    };
  }

  const chronological = [...logs].sort((a, b) => a.timestamp - b.timestamp);
  const recentWindow = chronological.slice(-7);
  const oldest = recentWindow[0];
  const latest = recentWindow[recentWindow.length - 1];

  const currentScore = latest.stressScore;

  // Trend deltas
  const scoreDelta = latest.stressScore - oldest.stressScore;
  const hrvDelta = latest.hrv - oldest.hrv;
  const sleepDelta = latest.sleepHours - oldest.sleepHours;
  const rhrDelta = latest.restingHeartRate - oldest.restingHeartRate;
  const dutyDelta = latest.dutyDuration - oldest.dutyDuration;

  let riskAcc = currentScore * 0.60;

  if (scoreDelta > 10) riskAcc += 18;
  else if (scoreDelta > 4) riskAcc += 8;
  else if (scoreDelta < -8) riskAcc -= 12;

  if (hrvDelta < -12) riskAcc += 14;
  else if (hrvDelta < -5) riskAcc += 6;
  else if (hrvDelta > 10) riskAcc -= 10;

  const avgSleep = recentWindow.reduce((acc, l) => acc + l.sleepHours, 0) / recentWindow.length;
  if (avgSleep < 5.0) riskAcc += 16;
  else if (avgSleep < 6.0) riskAcc += 8;
  else if (avgSleep >= 7.5) riskAcc -= 8;

  if (rhrDelta > 6) riskAcc += 10;
  else if (rhrDelta > 3) riskAcc += 4;

  const avgDuty = recentWindow.reduce((acc, l) => acc + l.dutyDuration, 0) / recentWindow.length;
  if (avgDuty > 13.0) riskAcc += 12;
  else if (avgDuty > 10.5) riskAcc += 6;

  const forecastRiskPercent = Math.round(clamp(riskAcc, 5, 96));

  let trend7Day: 'escalating' | 'stable' | 'improving' = 'stable';
  if (scoreDelta >= 6 || (hrvDelta <= -8 && sleepDelta <= -1)) {
    trend7Day = 'escalating';
  } else if (scoreDelta <= -6 || (hrvDelta >= 8 && sleepDelta >= 1)) {
    trend7Day = 'improving';
  }

  let forecastRiskLevel: RiskLevel = 'LOW';
  if (forecastRiskPercent > thresholds.highMax) forecastRiskLevel = 'CRITICAL';
  else if (forecastRiskPercent > thresholds.moderateMax) forecastRiskLevel = 'HIGH';
  else if (forecastRiskPercent > thresholds.lowMax) forecastRiskLevel = 'MODERATE';

  let badgeText = 'Stable Readiness in Next 48 Hours';
  if (forecastRiskLevel === 'CRITICAL') {
    badgeText = 'Critical Forecast Risk in Next 48 Hours';
  } else if (forecastRiskLevel === 'HIGH') {
    badgeText = 'High Forecast Risk in Next 48 Hours';
  } else if (forecastRiskLevel === 'MODERATE') {
    badgeText = 'Elevated Risk in Next 48 Hours';
  }

  const trendDirection =
    scoreDelta > 0
      ? `Upward strain (+${scoreDelta} pts / ${recentWindow.length} days)`
      : scoreDelta < 0
      ? `Recovering trend (${scoreDelta} pts / ${recentWindow.length} days)`
      : `Stable baseline (±0 pts / ${recentWindow.length} days)`;

  return {
    available: true,
    currentScore,
    trend7Day,
    forecastRiskPercent,
    forecastRiskLevel,
    forecastWindow: 'Next 48 Hours',
    badgeText,
    trendDirection,
    factors: {
      hrvDegradation:
        hrvDelta < 0
          ? `HRV suppressed by ${Math.abs(hrvDelta)} ms over ${recentWindow.length} days (autonomic strain).`
          : `HRV stable / rebounding (+${hrvDelta} ms).`,
      sleepDeficit:
        avgSleep < 6.0
          ? `Cumulative sleep deficit: rolling average ${avgSleep.toFixed(1)} hrs vs 8.0 hrs baseline.`
          : `Sleep average healthy at ${avgSleep.toFixed(1)} hrs.`,
      rhrElevation:
        rhrDelta > 3
          ? `Resting pulse elevated by +${rhrDelta} bpm over recent cycle.`
          : `Resting pulse within normal variance (${latest.restingHeartRate} bpm).`,
      dutyFatigue:
        avgDuty > 11.0
          ? `Sustained duty load: average ${avgDuty.toFixed(1)} hrs daily patrol duration.`
          : `Operational duty load balanced (${avgDuty.toFixed(1)} hrs average).`,
      recentTrend:
        scoreDelta > 0
          ? `Stress score escalated from ${oldest.stressScore} to ${latest.stressScore}.`
          : `Stress score improved from ${oldest.stressScore} to ${latest.stressScore}.`,
    },
    methodologyNote:
      'Prototype predictive risk estimate — not a medical diagnosis. Computed using rolling linear slope of sympathetic recovery markers.',
  };
}
