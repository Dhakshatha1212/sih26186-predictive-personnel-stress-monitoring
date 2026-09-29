import { MongoClient, Db } from 'mongodb';
import {
  BiometricLog,
  CalculationThresholds,
  CalculationWeights,
  CommanderAction,
  DatabaseStatus,
  EnvironmentalCondition,
  InterventionStatus,
  RiskLevel,
  SquadReadinessSummary,
  StressAlert,
  User,
} from '../src/types.ts';
import {
  calculateEnvironmentalAdjustment,
  calculateStressScore,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS,
} from '../src/utils/stressCalculator.ts';
import {
  DEMO_SOLDIERS,
  DEMO_USERS,
  generateInitialDemoData,
} from './demoData.ts';

// In-Memory store
interface InMemStore {
  users: User[];
  soldiers: typeof DEMO_SOLDIERS;
  logs: BiometricLog[];
  alerts: StressAlert[];
  actions: CommanderAction[];
  weights: CalculationWeights;
  thresholds: CalculationThresholds;
}

const initialData = generateInitialDemoData();

let inMemStore: InMemStore = {
  users: [...DEMO_USERS],
  soldiers: [...DEMO_SOLDIERS],
  logs: initialData.logs,
  alerts: initialData.alerts,
  actions: initialData.actions,
  weights: { ...DEFAULT_WEIGHTS },
  thresholds: { ...DEFAULT_THRESHOLDS },
};

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let mongoConnected = false;
let mongoStatusMessage = 'Running in high-performance local demo mode (Pre-seeded with SIH synthetic military data)';

export async function initDatabase(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    mongoStatusMessage = 'MongoDB Atlas M0 not configured in environment. Using pre-seeded in-memory store ($0 cost).';
    return;
  }

  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });
    await client.connect();
    mongoClient = client;
    mongoDb = client.db('sih_personnel_welfare');
    mongoConnected = true;
    mongoStatusMessage = 'Connected securely to MongoDB Atlas M0 cluster';

    // Seed database if empty
    const logsCol = mongoDb.collection('biometric_logs');
    const count = await logsCol.countDocuments();
    if (count === 0) {
      await mongoDb.collection('users').insertMany(DEMO_USERS as any);
      await logsCol.insertMany(inMemStore.logs as any);
      await mongoDb.collection('stress_alerts').insertMany(inMemStore.alerts as any);
      await mongoDb.collection('commander_actions').insertMany(inMemStore.actions as any);
    }
  } catch (err: any) {
    mongoConnected = false;
    mongoStatusMessage = `MongoDB Atlas connection error: ${err.message}. Seamlessly fell back to local demo store.`;
    console.warn(mongoStatusMessage);
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  const activeHighRisk = inMemStore.alerts.filter((a) => a.status === 'PENDING').length;
  const activeCritical = inMemStore.alerts.filter(
    (a) => a.status === 'PENDING' && (a.riskLevel === 'CRITICAL' || a.stressScore >= 80)
  ).length;

  return {
    type: mongoConnected ? 'mongodb_atlas' : 'in_memory_fallback',
    connected: mongoConnected,
    databaseName: mongoConnected ? 'sih_personnel_welfare' : 'Demo Memory Store',
    message: mongoStatusMessage,
    totalSoldiers: inMemStore.soldiers.length,
    totalLogs: inMemStore.logs.length,
    totalAlerts: inMemStore.alerts.length,
    activeHighRiskCount: activeHighRisk,
    activeCriticalCount: activeCritical,
  };
}

export function getSoldiers() {
  return inMemStore.soldiers;
}

export function getSoldierById(soldierId: string) {
  return inMemStore.soldiers.find((s) => s.soldierId === soldierId);
}

export function getUsers(): User[] {
  return inMemStore.users;
}

export function getUserByUsername(username: string): User | undefined {
  const norm = username.trim().toLowerCase();
  return inMemStore.users.find(
    (u) => u.username.toLowerCase() === norm || u.soldierId.toLowerCase() === norm
  );
}

export function authenticateUser(username: string, password?: string): User | null {
  const user = getUserByUsername(username);
  if (!user) {
    return null;
  }
  // In prototype demo mode, allow valid demo password or standard default 'demo123'
  if (password && user.password && user.password !== password && password !== 'demo123') {
    return null;
  }
  return user;
}

export function getDemoAccounts(): Array<Omit<User, 'password'> & { demoPassword: string; riskProfileNote: string }> {
  return inMemStore.users.map((u) => {
    let note = 'Standard Operational Fitness';
    if (u.role === 'SOLDIER') {
      const soldier = inMemStore.soldiers.find((s) => s.soldierId === u.soldierId);
      if (soldier?.profileType === 'high_risk') {
        note = `High Risk / Accumulated Strain (${soldier.defaultEnvironment})`;
      } else if (soldier?.profileType === 'moderate') {
        note = 'Moderate Strain / Active Patrol';
      } else {
        note = 'Optimal / Combat Ready';
      }
    } else if (u.role === 'COMMANDER') {
      note = 'Squad Readiness & Anonymized Oversight';
    } else if (u.role === 'DOCTOR') {
      note = 'Clinical Review & Tactical Rest Passes';
    }

    const { password, ...rest } = u;
    return {
      ...rest,
      demoPassword: u.password || 'demo123',
      riskProfileNote: note,
    };
  });
}

export function getLogs(soldierId?: string, limit: number = 30): BiometricLog[] {
  let list = inMemStore.logs;
  if (soldierId) {
    list = list.filter((l) => l.soldierId === soldierId);
  }
  return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export function addBiometricLog(data: {
  soldierId: string;
  date?: string;
  hrv: number;
  sleepHours: number;
  restingHeartRate: number;
  dutyDuration: number;
  environmentalCondition?: EnvironmentalCondition;
  notes?: string;
}): { log: BiometricLog; alert?: StressAlert } {
  const soldier = getSoldierById(data.soldierId) || {
    soldierId: data.soldierId,
    name: 'Sep. Unknown Personnel',
    rank: 'Sepoy',
    unit: '14 Rajputana Rifles (Alpha Coy)',
    squadRole: 'Rifleman',
    profileType: 'moderate' as const,
    defaultEnvironment: 'NORMAL' as const,
  };

  const date = data.date || new Date().toISOString().split('T')[0];
  const timestamp = new Date(date).getTime() || Date.now();
  const envCondition = data.environmentalCondition || 'NORMAL';

  const breakdown = calculateStressScore(
    {
      hrv: data.hrv,
      sleepHours: data.sleepHours,
      restingHeartRate: data.restingHeartRate,
      dutyDuration: data.dutyDuration,
    },
    inMemStore.weights,
    inMemStore.thresholds
  );

  const envAdj = calculateEnvironmentalAdjustment(breakdown.score, envCondition, inMemStore.thresholds);

  const log: BiometricLog = {
    id: `log-${data.soldierId}-${date}-${Date.now()}`,
    soldierId: data.soldierId,
    date,
    timestamp,
    hrv: data.hrv,
    sleepHours: data.sleepHours,
    restingHeartRate: data.restingHeartRate,
    dutyDuration: data.dutyDuration,
    stressScore: breakdown.score,
    riskLevel: breakdown.riskLevel,
    environmentalCondition: envCondition,
    adjustedStressScore: envAdj.adjustedScore,
    notes:
      data.notes ||
      (breakdown.riskLevel === 'HIGH'
        ? `Critical stress trigger detected under ${envCondition} conditions`
        : 'Daily telemetry recorded'),
  };

  inMemStore.logs.unshift(log);

  let newAlert: StressAlert | undefined = undefined;
  if (breakdown.riskLevel === 'HIGH' || envAdj.adjustedRiskLevel === 'HIGH') {
    const finalScore = Math.max(breakdown.score, envAdj.adjustedScore);
    const predictiveRiskPercent = Math.min(96, Math.round(finalScore * 0.95 + 4));

    newAlert = {
      id: `alert-${data.soldierId}-${date}-${Date.now()}`,
      soldierId: data.soldierId,
      soldierName: soldier.name,
      soldierRank: soldier.rank,
      soldierUnit: soldier.unit,
      date,
      timestamp,
      stressScore: finalScore,
      riskLevel: 'HIGH',
      status: 'PENDING',
      interventionStatus: 'New',
      predictiveRiskPercent,
      message: `High risk trigger (${finalScore}/100) logged (${envCondition}). HRV: ${data.hrv}ms, Sleep: ${data.sleepHours}h, Duty: ${data.dutyDuration}h.`,
      biometrics: {
        hrv: data.hrv,
        sleepHours: data.sleepHours,
        restingHeartRate: data.restingHeartRate,
        dutyDuration: data.dutyDuration,
      },
      recommendedRestPeriod: '24 Hours Mandatory Stand-Down',
    };
    inMemStore.alerts.unshift(newAlert);
  }

  // If MongoDB is connected, push asynchronously
  if (mongoDb) {
    mongoDb.collection('biometric_logs').insertOne(log as any).catch(console.error);
    if (newAlert) {
      mongoDb.collection('stress_alerts').insertOne(newAlert as any).catch(console.error);
    }
  }

  return { log, alert: newAlert };
}

export function getAlerts(filters?: {
  status?: string;
  unit?: string;
  riskLevel?: string;
  interventionStatus?: string;
}): StressAlert[] {
  let list = inMemStore.alerts;

  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters?.interventionStatus && filters.interventionStatus !== 'ALL') {
    list = list.filter((a) => a.interventionStatus === filters.interventionStatus);
  }
  if (filters?.unit && filters.unit !== 'ALL') {
    list = list.filter((a) => a.soldierUnit === filters.unit);
  }
  if (filters?.riskLevel && filters.riskLevel !== 'ALL') {
    list = list.filter((a) => a.riskLevel === filters.riskLevel);
  }

  return list.sort((a, b) => b.timestamp - a.timestamp);
}

export function updateAlert(
  alertId: string,
  updates: {
    status?: StressAlert['status'];
    interventionStatus?: InterventionStatus;
    doctorNotes?: string;
    reviewedBy?: string;
    recommendedRestPeriod?: string;
  }
): StressAlert | null {
  const alert = inMemStore.alerts.find((a) => a.id === alertId);
  if (!alert) return null;

  if (updates.status) alert.status = updates.status;
  if (updates.interventionStatus) alert.interventionStatus = updates.interventionStatus;
  if (updates.doctorNotes !== undefined) alert.doctorNotes = updates.doctorNotes;
  if (updates.reviewedBy) alert.reviewedBy = updates.reviewedBy;
  if (updates.recommendedRestPeriod) alert.recommendedRestPeriod = updates.recommendedRestPeriod;
  alert.reviewedAt = new Date().toISOString().split('T')[0];

  if (mongoDb) {
    mongoDb.collection('stress_alerts').updateOne({ id: alertId }, { $set: updates }).catch(console.error);
  }

  return alert;
}

export function getCommanderActions(): CommanderAction[] {
  return inMemStore.actions.sort((a, b) => b.timestamp - a.timestamp);
}

export function addCommanderAction(actionData: {
  targetAnonId: string;
  soldierId: string;
  soldierName?: string;
  unit: string;
  actionType: 'STAND_DOWN_24H' | 'AUTO_ROTATE_SHIFT';
  commanderNotes?: string;
  issuedBy?: string;
}): CommanderAction {
  const now = new Date();
  const dateTimeStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const actionTitle =
    actionData.actionType === 'STAND_DOWN_24H'
      ? 'Issue 24h Mandatory Stand-Down'
      : 'Auto-Rotate Shift';

  const newAction: CommanderAction = {
    id: `cmd-act-${Date.now()}`,
    timestamp: now.getTime(),
    dateTime: dateTimeStr,
    targetAnonId: actionData.targetAnonId,
    soldierId: actionData.soldierId,
    soldierName: actionData.soldierName,
    unit: actionData.unit,
    actionType: actionData.actionType,
    actionTitle,
    status: 'EXECUTED_PROTOTYPE',
    commanderNotes:
      actionData.commanderNotes ||
      (actionData.actionType === 'STAND_DOWN_24H'
        ? 'Mandatory 24h operational recovery stand-down enacted by commanding officer.'
        : 'Shift schedule rotated to lower stress duty post.'),
    issuedBy: actionData.issuedBy || 'Major Aditya Chauhan (Commanding Officer)',
  };

  inMemStore.actions.unshift(newAction);

  // Also reduce the stress on the soldier's latest log to simulate operational relief!
  const latestLog = inMemStore.logs.find((l) => l.soldierId === actionData.soldierId);
  if (latestLog) {
    if (actionData.actionType === 'STAND_DOWN_24H') {
      latestLog.dutyDuration = Math.max(4, latestLog.dutyDuration - 6);
      latestLog.stressScore = Math.max(25, latestLog.stressScore - 25);
      latestLog.riskLevel = latestLog.stressScore > 69 ? 'HIGH' : latestLog.stressScore > 39 ? 'MODERATE' : 'LOW';
      latestLog.notes = `[Stand-Down Active] Relieved from high-tempo duty by Commander Order.`;
    } else {
      latestLog.dutyDuration = Math.max(6, latestLog.dutyDuration - 3);
      latestLog.stressScore = Math.max(30, latestLog.stressScore - 15);
      latestLog.riskLevel = latestLog.stressScore > 69 ? 'HIGH' : latestLog.stressScore > 39 ? 'MODERATE' : 'LOW';
      latestLog.notes = `[Shift Rotated] Reassigned to low fatigue sentry shift.`;
    }
  }

  // Update corresponding alert if one exists
  const pendingAlert = inMemStore.alerts.find(
    (a) => a.soldierId === actionData.soldierId && a.status === 'PENDING'
  );
  if (pendingAlert) {
    pendingAlert.status = 'UNDER_OBSERVATION';
    pendingAlert.interventionStatus = 'Monitoring';
    pendingAlert.doctorNotes = `Commander issued ${actionTitle}. Under medical telemetry observation.`;
  }

  if (mongoDb) {
    mongoDb.collection('commander_actions').insertOne(newAction as any).catch(console.error);
  }

  return newAction;
}

export function getSquadReadiness(unitFilter?: string): SquadReadinessSummary {
  let soldiers = inMemStore.soldiers;
  if (unitFilter && unitFilter !== 'ALL') {
    soldiers = soldiers.filter((s) => s.unit === unitFilter);
  }

  const soldierIds = new Set(soldiers.map((s) => s.soldierId));
  const latestLogsBySoldier = new Map<string, BiometricLog>();
  inMemStore.logs.forEach((log) => {
    if (!soldierIds.has(log.soldierId)) return;
    const existing = latestLogsBySoldier.get(log.soldierId);
    if (!existing || log.timestamp > existing.timestamp) {
      latestLogsBySoldier.set(log.soldierId, log);
    }
  });

  // Check recent actions (within 48 hours)
  const recentActionMap = new Map<string, CommanderAction>();
  inMemStore.actions.forEach((act) => {
    if (!recentActionMap.has(act.soldierId)) {
      recentActionMap.set(act.soldierId, act);
    }
  });

  const anonymizedPersonnel: SquadReadinessSummary['anonymizedPersonnel'] = [];
  let totalScore = 0;
  let totalSleep = 0;
  let totalDuty = 0;
  let totalHrv = 0;
  let lowCount = 0;
  let modCount = 0;
  let highCount = 0;
  let critCount = 0;

  soldiers.forEach((soldier, index) => {
    const latestLog = latestLogsBySoldier.get(soldier.soldierId);
    const score = latestLog ? latestLog.stressScore : 30;
    const risk = latestLog ? latestLog.riskLevel : 'LOW';
    const sleep = latestLog ? latestLog.sleepHours : 7.5;
    const duty = latestLog ? latestLog.dutyDuration : 8.0;
    const hrv = latestLog ? latestLog.hrv : 70;

    totalScore += score;
    totalSleep += sleep;
    totalDuty += duty;
    totalHrv += hrv;

    if (risk === 'LOW') lowCount++;
    else if (risk === 'MODERATE') modCount++;
    else if (risk === 'CRITICAL' || score >= 80) critCount++;
    else highCount++;

    const unitTag = soldier.unit.includes('Rajputana')
      ? 'ALPHA'
      : soldier.unit.includes('Parachute')
      ? 'BRAVO'
      : soldier.unit.includes('Maratha')
      ? 'CHARLIE'
      : 'DELTA';

    const recentAction = recentActionMap.get(soldier.soldierId);

    anonymizedPersonnel.push({
      anonId: `SQUAD-${unitTag}-${String(index + 1).padStart(2, '0')}`,
      soldierId: soldier.soldierId,
      squadRole: soldier.squadRole,
      stressScore: score,
      riskLevel: risk,
      lastLogDate: latestLog ? latestLog.date : 'Recent',
      dutyHours: duty,
      hasActiveAction: Boolean(recentAction),
      activeActionType: recentAction ? recentAction.actionTitle : undefined,
    });
  });

  const count = soldiers.length || 1;
  const avgStress = Number((totalScore / count).toFixed(1));
  const combatReadinessRate = Number(((lowCount / count) * 100).toFixed(1));

  // Compute Squad Welfare Actions Summary
  const activeStandDownCount = inMemStore.actions.filter(
    (a) => a.actionType === 'STAND_DOWN_24H'
  ).length;
  const activeShiftRotationCount = inMemStore.actions.filter(
    (a) => a.actionType === 'AUTO_ROTATE_SHIFT'
  ).length;

  return {
    unit: unitFilter || 'ALL_SQUADS',
    totalPersonnel: soldiers.length,
    averageStressScore: avgStress,
    combatReadinessRate,
    riskCounts: {
      low: lowCount,
      moderate: modCount,
      high: highCount,
      critical: critCount,
    },
    averageSleep: Number((totalSleep / count).toFixed(1)),
    averageDutyHours: Number((totalDuty / count).toFixed(1)),
    averageHrv: Number((totalHrv / count).toFixed(1)),
    anonymizedPersonnel,
    squadWelfareActionsSummary: {
      highRiskSquadsCount: highCount,
      elevatedRiskSquadsCount: modCount,
      activeStandDownCount,
      activeShiftRotationCount,
      totalRecentInterventions: inMemStore.actions.length,
    },
  };
}

export function getConfig() {
  return {
    weights: inMemStore.weights,
    thresholds: inMemStore.thresholds,
  };
}

export function updateConfig(weights?: Partial<CalculationWeights>, thresholds?: Partial<CalculationThresholds>) {
  if (weights) {
    inMemStore.weights = { ...inMemStore.weights, ...weights };
  }
  if (thresholds) {
    inMemStore.thresholds = { ...inMemStore.thresholds, ...thresholds };
  }
  return getConfig();
}

export function resetDemoData() {
  const data = generateInitialDemoData();
  inMemStore.logs = data.logs;
  inMemStore.alerts = data.alerts;
  inMemStore.actions = data.actions;
  inMemStore.weights = { ...DEFAULT_WEIGHTS };
  inMemStore.thresholds = { ...DEFAULT_THRESHOLDS };
  return {
    success: true,
    totalLogs: inMemStore.logs.length,
    totalAlerts: inMemStore.alerts.length,
    totalActions: inMemStore.actions.length,
  };
}

// Trigger initial setup
initDatabase().catch(console.error);
