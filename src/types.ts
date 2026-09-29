export type Role = 'SOLDIER' | 'COMMANDER' | 'DOCTOR';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type DataSource = 'Manual Entry' | 'Wearable Sync';

export type EnvironmentalCondition =
  | 'NORMAL'
  | 'HIGH_ALTITUDE'
  | 'EXTREME_COLD'
  | 'EXTREME_HEAT';

export type InterventionStatus =
  | 'New'
  | 'Under Review'
  | 'Monitoring'
  | 'Rest Recommended'
  | 'Resolved';

export interface User {
  id: string;
  soldierId: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
  unit: string;
  squad?: string;
  rank: string;
  email: string;
  avatar?: string;
}

export interface BiometricLog {
  id: string;
  soldierId: string;
  date: string; // ISO date YYYY-MM-DD
  timestamp: number;
  hrv: number; // ms (Heart Rate Variability - RMSSD)
  sleepHours: number; // hours
  restingHeartRate: number; // bpm
  dutyDuration: number; // hours on duty
  stressScore: number; // 0 - 100
  riskLevel: RiskLevel;
  environmentalCondition?: EnvironmentalCondition;
  adjustedStressScore?: number;
  dataSource?: DataSource;
  notes?: string;
}

export interface InterventionHistoryItem {
  id: string;
  timestamp: number;
  date: string;
  action: string;
  status: InterventionStatus;
  notes: string;
  officer: string;
}

export interface StressAlert {
  id: string;
  soldierId: string;
  soldierName?: string;
  soldierRank?: string;
  soldierUnit?: string;
  soldierSquad?: string;
  date: string;
  timestamp: number;
  stressScore: number;
  riskLevel: RiskLevel;
  status: 'PENDING' | 'UNDER_OBSERVATION' | 'RESOLVED';
  interventionStatus: InterventionStatus;
  predictiveRiskPercent: number;
  message: string;
  dataSource?: DataSource;
  biometrics: {
    hrv: number;
    sleepHours: number;
    restingHeartRate: number;
    dutyDuration: number;
  };
  doctorNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  recommendedRestPeriod?: string;
  interventionHistory?: InterventionHistoryItem[];
}

export interface CalculationWeights {
  hrvWeight: number; // e.g. 0.30
  sleepWeight: number; // e.g. 0.30
  rhrWeight: number; // e.g. 0.20
  dutyWeight: number; // e.g. 0.20
}

export interface CalculationThresholds {
  lowMax: number; // 39
  moderateMax: number; // 59
  highMax: number; // 79
  // 80-100 is CRITICAL
}

export interface StressBreakdown {
  score: number;
  riskLevel: RiskLevel;
  components: {
    hrvScore: number;
    sleepScore: number;
    rhrScore: number;
    dutyScore: number;
  };
  weightedContributions: {
    hrvContribution: number;
    sleepContribution: number;
    rhrContribution: number;
    dutyContribution: number;
  };
  factors: string[];
  recommendation: string;
}

export type CalculationBreakdown = StressBreakdown;

export interface EnvironmentalAdjustment {
  condition: EnvironmentalCondition;
  label: string;
  modifierPercent: number;
  baseScore: number;
  adjustedScore: number;
  adjustedRiskLevel: RiskLevel;
  explanation: string;
}

export interface PredictiveForecast {
  available: boolean;
  reason?: string;
  currentScore: number;
  trend7Day: 'escalating' | 'stable' | 'improving';
  forecastRiskPercent: number; // Dynamic percentage 0-100
  forecastRiskLevel: RiskLevel;
  forecastWindow: string; // e.g. "Next 48 Hours"
  badgeText: string; // e.g. "Elevated Risk in Next 48 Hours"
  trendDirection: string; // e.g. "Upward strain (+14 pts/week)"
  factors: {
    hrvDegradation: string;
    sleepDeficit: string;
    rhrElevation: string;
    dutyFatigue: string;
    recentTrend: string;
  };
  methodologyNote: string;
}

export interface CommanderAction {
  id: string;
  timestamp: number;
  dateTime: string;
  targetAnonId: string;
  soldierId: string;
  soldierName?: string;
  unit: string;
  actionType: 'STAND_DOWN_24H' | 'AUTO_ROTATE_SHIFT';
  actionTitle: string;
  status: 'EXECUTED_PROTOTYPE' | 'PENDING';
  commanderNotes: string;
  issuedBy: string;
}

export interface TacticalRestPass {
  documentId: string;
  soldierId: string;
  soldierName: string;
  soldierRank: string;
  unit: string;
  squad?: string;
  generatedAt: string;
  reviewDate: string;
  riskLevel: RiskLevel;
  stressScore: number;
  biometricSummary: {
    hrv: number;
    sleepHours: number;
    restingHeartRate: number;
    dutyDuration: number;
  };
  recommendedRestPeriod: string;
  medicalOfficerNotes: string;
  documentStatus: 'PROTOTYPE_ADVISORY' | 'ACTIVE_REST';
  attendingOfficer: string;
}

export interface SquadReadinessSummary {
  unit: string;
  totalPersonnel: number;
  averageStressScore: number;
  combatReadinessRate: number; // Percentage in Low risk
  riskCounts: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  averageSleep: number;
  averageDutyHours: number;
  averageHrv: number;
  anonymizedPersonnel: Array<{
    anonId: string;
    soldierId: string; // Internal id
    squadRole: string;
    stressScore: number;
    riskLevel: RiskLevel;
    lastLogDate: string;
    dutyHours: number;
    hasActiveAction?: boolean;
    activeActionType?: string;
  }>;
  squadWelfareActionsSummary?: {
    highRiskSquadsCount: number;
    elevatedRiskSquadsCount: number;
    activeStandDownCount: number;
    activeShiftRotationCount: number;
    totalRecentInterventions: number;
  };
}

export interface DatabaseStatus {
  type: 'mongodb_atlas' | 'in_memory_fallback';
  connected: boolean;
  databaseName: string;
  message: string;
  totalSoldiers: number;
  totalLogs: number;
  totalAlerts: number;
  activeHighRiskCount: number;
  activeCriticalCount: number;
}
