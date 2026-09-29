import {
  BiometricLog,
  CommanderAction,
  EnvironmentalCondition,
  InterventionStatus,
  RiskLevel,
  StressAlert,
  User,
} from '../src/types.ts';
import {
  calculateEnvironmentalAdjustment,
  calculateStressScore,
  DEFAULT_THRESHOLDS,
  DEFAULT_WEIGHTS,
} from '../src/utils/stressCalculator.ts';

export const DEMO_USERS: User[] = [
  // 8 DEMO SOLDIERS (soldier01 through soldier08)
  {
    id: 'user-soldier-1',
    soldierId: 'SDR-1042',
    username: 'soldier01',
    password: 'demo123',
    name: 'Sep. Vikram Rawat',
    role: 'SOLDIER',
    unit: '14 Rajputana Rifles (Alpha Coy)',
    squad: '1st Rifle Section',
    rank: 'Sepoy',
    email: 'soldier01@defence.sih.gov.in',
  },
  {
    id: 'user-soldier-2',
    soldierId: 'SDR-1043',
    username: 'soldier02',
    password: 'demo123',
    name: 'L/Nk. Arvind Gurung',
    role: 'SOLDIER',
    unit: '14 Rajputana Rifles (Alpha Coy)',
    squad: '1st Rifle Section',
    rank: 'Lance Naik',
    email: 'soldier02@defence.sih.gov.in',
  },
  {
    id: 'user-soldier-3',
    soldierId: 'SDR-1044',
    username: 'soldier03',
    password: 'demo123',
    name: 'Nk. Gurpreet Singh',
    role: 'SOLDIER',
    unit: '14 Rajputana Rifles (Alpha Coy)',
    squad: '1st Rifle Section',
    rank: 'Naik',
    email: 'soldier03@defence.sih.gov.in',
  },
  {
    id: 'user-soldier-4',
    soldierId: 'SDR-1045',
    username: 'soldier04',
    password: 'demo123',
    name: 'Sep. Ramesh Patil',
    role: 'SOLDIER',
    unit: '14 Rajputana Rifles (Alpha Coy)',
    squad: 'Comms / Support Section',
    rank: 'Sepoy',
    email: 'soldier04@defence.sih.gov.in',
  },
  {
    id: 'user-soldier-5',
    soldierId: 'SDR-2088',
    username: 'soldier05',
    password: 'demo123',
    name: 'Hav. Rajesh Thapa',
    role: 'SOLDIER',
    unit: '9 Parachute SF (Bravo Team)',
    squad: 'Special Assault Team 1',
    rank: 'Havildar',
    email: 'soldier05@defence.sih.gov.in',
  },
  {
    id: 'user-soldier-6',
    soldierId: 'SDR-2089',
    username: 'soldier06',
    password: 'demo123',
    name: 'Sep. Manjeet Singh',
    role: 'SOLDIER',
    unit: '9 Parachute SF (Bravo Team)',
    squad: 'Special Assault Team 1',
    rank: 'Sepoy',
    email: 'soldier06@defence.sih.gov.in',
  },
  {
    id: 'user-soldier-7',
    soldierId: 'SDR-3014',
    username: 'soldier07',
    password: 'demo123',
    name: 'Hav. Tanaji Shinde',
    role: 'SOLDIER',
    unit: '21 Maratha Light Infantry (Charlie Sqd)',
    squad: 'Ghatak Platoon',
    rank: 'Havildar',
    email: 'soldier07@defence.sih.gov.in',
  },
  {
    id: 'user-soldier-8',
    soldierId: 'SDR-4051',
    username: 'soldier08',
    password: 'demo123',
    name: 'Sep. Stanzin Norbu',
    role: 'SOLDIER',
    unit: '7 Ladakh Scouts (Delta Patrol)',
    squad: 'High-Altitude Sentinel Post',
    rank: 'Sepoy',
    email: 'soldier08@defence.sih.gov.in',
  },

  // COMMANDER ACCOUNTS
  {
    id: 'user-commander-1',
    soldierId: 'CMD-501',
    username: 'commander01',
    password: 'demo123',
    name: 'Major Aditya Chauhan',
    role: 'COMMANDER',
    unit: '14 Rajputana Rifles (Alpha Coy)',
    squad: 'Company Headquarters',
    rank: 'Major (Commanding Officer)',
    email: 'commander01@defence.sih.gov.in',
  },
  {
    id: 'user-commander-2',
    soldierId: 'CMD-502',
    username: 'commander02',
    password: 'demo123',
    name: 'Col. Vikramaditya Singh',
    role: 'COMMANDER',
    unit: '9 Parachute SF (Bravo Team)',
    squad: 'Special Operations Task Force HQ',
    rank: 'Colonel (Task Force Commander)',
    email: 'commander02@defence.sih.gov.in',
  },

  // DOCTOR / MEDICAL OFFICER ACCOUNTS
  {
    id: 'user-doctor-1',
    soldierId: 'MED-802',
    username: 'doctor01',
    password: 'demo123',
    name: 'Dr. Maj. Ritu Sharma',
    role: 'DOCTOR',
    unit: 'Military Hospital & Field Ambulance Base',
    squad: 'Regimental Medical Inspection Room',
    rank: 'Major (Regimental Medical Officer)',
    email: 'doctor01@defence.sih.gov.in',
  },
  {
    id: 'user-doctor-2',
    soldierId: 'MED-803',
    username: 'doctor02',
    password: 'demo123',
    name: 'Lt. Col. Dr. A. Sen',
    role: 'DOCTOR',
    unit: 'Base Hospital & High-Altitude Physiology Center',
    squad: 'Clinical Triage Review Board',
    rank: 'Lt. Colonel (Chief Medical Specialist)',
    email: 'doctor02@defence.sih.gov.in',
  },
];

export const DEMO_SOLDIERS: Array<{
  soldierId: string;
  name: string;
  rank: string;
  unit: string;
  squadRole: string;
  profileType: 'optimal' | 'moderate' | 'high_risk' | 'variable';
  defaultEnvironment: EnvironmentalCondition;
}> = [
  // Unit 1: 14 Rajputana Rifles (Alpha Coy) - Arid / Heat Zone
  { soldierId: 'SDR-1042', name: 'Sep. Vikram Rawat', rank: 'Sepoy', unit: '14 Rajputana Rifles (Alpha Coy)', squadRole: 'Rifleman / Scout', profileType: 'high_risk', defaultEnvironment: 'EXTREME_HEAT' },
  { soldierId: 'SDR-1043', name: 'L/Nk. Arvind Gurung', rank: 'Lance Naik', unit: '14 Rajputana Rifles (Alpha Coy)', squadRole: 'Section 2IC', profileType: 'moderate', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-1044', name: 'Nk. Gurpreet Singh', rank: 'Naik', unit: '14 Rajputana Rifles (Alpha Coy)', squadRole: 'LMG Gunner', profileType: 'optimal', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-1045', name: 'Sep. Ramesh Patil', rank: 'Sepoy', unit: '14 Rajputana Rifles (Alpha Coy)', squadRole: 'Radio Operator', profileType: 'optimal', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-1046', name: 'Hav. Devender Kumar', rank: 'Havildar', unit: '14 Rajputana Rifles (Alpha Coy)', squadRole: 'Section Commander', profileType: 'moderate', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-1047', name: 'Sep. Amit Sharma', rank: 'Sepoy', unit: '14 Rajputana Rifles (Alpha Coy)', squadRole: 'Marksman', profileType: 'optimal', defaultEnvironment: 'NORMAL' },

  // Unit 2: 9 Parachute SF (Bravo Team) - Special Operations High-Tempo
  { soldierId: 'SDR-2088', name: 'Hav. Rajesh Thapa', rank: 'Havildar', unit: '9 Parachute SF (Bravo Team)', squadRole: 'Combat Specialist', profileType: 'high_risk', defaultEnvironment: 'HIGH_ALTITUDE' },
  { soldierId: 'SDR-2089', name: 'Sep. Manjeet Singh', rank: 'Sepoy', unit: '9 Parachute SF (Bravo Team)', squadRole: 'Pointman', profileType: 'moderate', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-2090', name: 'Nk. Suresh Yadav', rank: 'Naik', unit: '9 Parachute SF (Bravo Team)', squadRole: 'Assault Lead', profileType: 'optimal', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-2091', name: 'Sep. Pradeep Nair', rank: 'Sepoy', unit: '9 Parachute SF (Bravo Team)', squadRole: 'Demolition Specialist', profileType: 'optimal', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-2092', name: 'L/Nk. Dinesh Reddy', rank: 'Lance Naik', unit: '9 Parachute SF (Bravo Team)', squadRole: 'Sniper', profileType: 'moderate', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-2093', name: 'Sep. Rohit Meena', rank: 'Sepoy', unit: '9 Parachute SF (Bravo Team)', squadRole: 'Support Gunner', profileType: 'optimal', defaultEnvironment: 'NORMAL' },

  // Unit 3: 21 Maratha Light Infantry (Charlie Sqd) - Jungle / Terrain Patrol
  { soldierId: 'SDR-3011', name: 'Nk. Sachin Kadam', rank: 'Naik', unit: '21 Maratha Light Infantry (Charlie Sqd)', squadRole: 'Section 2IC', profileType: 'optimal', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-3012', name: 'Sep. Aniket Jadhav', rank: 'Sepoy', unit: '21 Maratha Light Infantry (Charlie Sqd)', squadRole: 'Rifleman', profileType: 'moderate', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-3013', name: 'Sep. Mahendra Deshmukh', rank: 'Sepoy', unit: '21 Maratha Light Infantry (Charlie Sqd)', squadRole: 'Grenadier', profileType: 'optimal', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-3014', name: 'Hav. Tanaji Shinde', rank: 'Havildar', unit: '21 Maratha Light Infantry (Charlie Sqd)', squadRole: 'Section Commander', profileType: 'high_risk', defaultEnvironment: 'EXTREME_HEAT' },
  { soldierId: 'SDR-3015', name: 'Sep. Vijay Salunkhe', rank: 'Sepoy', unit: '21 Maratha Light Infantry (Charlie Sqd)', squadRole: 'Rifleman', profileType: 'optimal', defaultEnvironment: 'NORMAL' },
  { soldierId: 'SDR-3016', name: 'L/Nk. Nilesh Pawar', rank: 'Lance Naik', unit: '21 Maratha Light Infantry (Charlie Sqd)', squadRole: 'Medic', profileType: 'optimal', defaultEnvironment: 'NORMAL' },

  // Unit 4: 7 Ladakh Scouts (Delta Patrol) - High Altitude & Extreme Cold
  { soldierId: 'SDR-4050', name: 'Nk. Tsering Dorjay', rank: 'Naik', unit: '7 Ladakh Scouts (Delta Patrol)', squadRole: 'High-Altitude Guide', profileType: 'optimal', defaultEnvironment: 'HIGH_ALTITUDE' },
  { soldierId: 'SDR-4051', name: 'Sep. Stanzin Norbu', rank: 'Sepoy', unit: '7 Ladakh Scouts (Delta Patrol)', squadRole: 'Forward Scout', profileType: 'high_risk', defaultEnvironment: 'EXTREME_COLD' },
  { soldierId: 'SDR-4052', name: 'Sep. Rigzin Namgyal', rank: 'Sepoy', unit: '7 Ladakh Scouts (Delta Patrol)', squadRole: 'Observation Post Sentinal', profileType: 'moderate', defaultEnvironment: 'HIGH_ALTITUDE' },
  { soldierId: 'SDR-4053', name: 'Hav. Lobzang Lundup', rank: 'Havildar', unit: '7 Ladakh Scouts (Delta Patrol)', squadRole: 'Patrol Commander', profileType: 'optimal', defaultEnvironment: 'HIGH_ALTITUDE' },
  { soldierId: 'SDR-4054', name: 'L/Nk. Sonam Wangchuk', rank: 'Lance Naik', unit: '7 Ladakh Scouts (Delta Patrol)', squadRole: 'Comms Tech', profileType: 'moderate', defaultEnvironment: 'EXTREME_COLD' },
  { soldierId: 'SDR-4055', name: 'Sep. Phuntsog Angchok', rank: 'Sepoy', unit: '7 Ladakh Scouts (Delta Patrol)', squadRole: 'Rifleman', profileType: 'optimal', defaultEnvironment: 'HIGH_ALTITUDE' },
];

export const INITIAL_COMMANDER_ACTIONS: CommanderAction[] = [
  {
    id: 'cmd-act-001',
    timestamp: Date.now() - 3600 * 18 * 1000,
    dateTime: '2026-09-28 14:30',
    targetAnonId: 'SQUAD-BRAVO-07',
    soldierId: 'SDR-2088',
    soldierName: 'Hav. Rajesh Thapa',
    unit: '9 Parachute SF (Bravo Team)',
    actionType: 'STAND_DOWN_24H',
    actionTitle: 'Issue 24h Mandatory Stand-Down',
    status: 'EXECUTED_PROTOTYPE',
    commanderNotes: 'Precautionary operational stand-down ordered following prolonged night reconnaissance drill.',
    issuedBy: 'Major Aditya Chauhan (Commanding Officer)',
  },
  {
    id: 'cmd-act-002',
    timestamp: Date.now() - 3600 * 36 * 1000,
    dateTime: '2026-09-27 09:15',
    targetAnonId: 'SQUAD-DELTA-20',
    soldierId: 'SDR-4051',
    soldierName: 'Sep. Stanzin Norbu',
    unit: '7 Ladakh Scouts (Delta Patrol)',
    actionType: 'AUTO_ROTATE_SHIFT',
    actionTitle: 'Auto-Rotate Shift',
    status: 'EXECUTED_PROTOTYPE',
    commanderNotes: 'Rotated forward ridge observation shift to lower base shelter for 12 hours.',
    issuedBy: 'Major Aditya Chauhan (Commanding Officer)',
  },
];

export function generateInitialDemoData(): {
  logs: BiometricLog[];
  alerts: StressAlert[];
  actions: CommanderAction[];
} {
  const logs: BiometricLog[] = [];
  const alerts: StressAlert[] = [];
  const actions: CommanderAction[] = [...INITIAL_COMMANDER_ACTIONS];

  const baseDate = new Date();

  DEMO_SOLDIERS.forEach((soldier) => {
    // Generate 14 days of logs
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];
      const timestamp = d.getTime();

      let hrv = 70;
      let sleepHours = 7.5;
      let restingHeartRate = 60;
      let dutyDuration = 8.0;

      const noise = ((soldier.soldierId.charCodeAt(4) * (dayOffset + 1)) % 11) - 5;

      if (soldier.profileType === 'optimal') {
        hrv = Math.round(72 + noise * 1.5);
        sleepHours = Number((7.8 + noise * 0.1).toFixed(1));
        restingHeartRate = Math.round(58 + noise * 0.8);
        dutyDuration = Number((8.0 + (dayOffset % 3 === 0 ? 1.5 : 0)).toFixed(1));
      } else if (soldier.profileType === 'moderate') {
        hrv = Math.round(48 + noise * 1.2);
        sleepHours = Number((6.0 + noise * 0.15).toFixed(1));
        restingHeartRate = Math.round(68 + noise * 1.0);
        dutyDuration = Number((10.5 + noise * 0.2).toFixed(1));
      } else if (soldier.profileType === 'high_risk') {
        if (dayOffset <= 3) {
          hrv = Math.round(30 + noise * 0.8);
          sleepHours = Number((4.0 + Math.max(0, noise * 0.1)).toFixed(1));
          restingHeartRate = Math.round(84 + noise * 1.1);
          dutyDuration = Number((14.5 + (dayOffset === 0 ? 1.5 : 0)).toFixed(1));
        } else {
          hrv = Math.round(52 + noise);
          sleepHours = Number((5.8 + noise * 0.1).toFixed(1));
          restingHeartRate = Math.round(70 + noise);
          dutyDuration = Number((11.0).toFixed(1));
        }
      }

      hrv = Math.max(22, Math.min(105, hrv));
      sleepHours = Math.max(3.0, Math.min(10.0, sleepHours));
      restingHeartRate = Math.max(48, Math.min(105, restingHeartRate));
      dutyDuration = Math.max(4.0, Math.min(18.0, dutyDuration));

      const breakdown = calculateStressScore(
        { hrv, sleepHours, restingHeartRate, dutyDuration },
        DEFAULT_WEIGHTS,
        DEFAULT_THRESHOLDS
      );

      const envCondition: EnvironmentalCondition = soldier.defaultEnvironment;
      const envAdj = calculateEnvironmentalAdjustment(breakdown.score, envCondition, DEFAULT_THRESHOLDS);

      const logId = `log-${soldier.soldierId}-${dateStr}`;
      const logEntry: BiometricLog = {
        id: logId,
        soldierId: soldier.soldierId,
        date: dateStr,
        timestamp,
        hrv,
        sleepHours,
        restingHeartRate,
        dutyDuration,
        stressScore: breakdown.score,
        riskLevel: breakdown.riskLevel,
        environmentalCondition: envCondition,
        adjustedStressScore: envAdj.adjustedScore,
        notes:
          breakdown.riskLevel === 'HIGH'
            ? 'Reported sustained high-altitude patrol fatigue and reduced REM sleep.'
            : breakdown.riskLevel === 'MODERATE'
            ? 'Long shift observed, normal recovery protocol suggested.'
            : 'Standard operational fitness maintained.',
      };

      logs.push(logEntry);

      // Create alert for high risk logs
      if (breakdown.riskLevel === 'HIGH') {
        const isRecent = dayOffset <= 2;
        const alertId = `alert-${soldier.soldierId}-${dateStr}`;

        let status: StressAlert['status'] = 'PENDING';
        let interventionStatus: InterventionStatus = 'New';
        let doctorNotes: string | undefined = undefined;
        let reviewedBy: string | undefined = undefined;
        let reviewedAt: string | undefined = undefined;
        let recommendedRestPeriod: string | undefined = '24 Hours Mandatory Stand-Down';

        if (!isRecent) {
          status = 'RESOLVED';
          interventionStatus = 'Resolved';
          doctorNotes = 'Prescribed 24hr stand-down; hydration and 8hr sleep observed. Biometrics normalized.';
          reviewedBy = 'Dr. Maj. Ritu Sharma (RMO)';
          reviewedAt = new Date(timestamp + 3600 * 24 * 1000).toISOString().split('T')[0];
        } else if (dayOffset === 1) {
          status = 'UNDER_OBSERVATION';
          interventionStatus = 'Monitoring';
          doctorNotes = 'Temporary duty restriction issued. Monitoring overnight HRV rebound and blood pressure.';
          reviewedBy = 'Dr. Maj. Ritu Sharma (RMO)';
          reviewedAt = dateStr;
        } else {
          // Today's high risk alert
          status = 'PENDING';
          interventionStatus = dayOffset === 0 && soldier.soldierId === 'SDR-1042' ? 'New' : 'Under Review';
        }

        // Dynamic predictive risk percentage
        const predictiveRiskPercent = Math.min(95, Math.round(breakdown.score * 0.95 + (14 - dayOffset) * 0.5));

        alerts.push({
          id: alertId,
          soldierId: soldier.soldierId,
          soldierName: soldier.name,
          soldierRank: soldier.rank,
          soldierUnit: soldier.unit,
          date: dateStr,
          timestamp,
          stressScore: breakdown.score,
          riskLevel: breakdown.riskLevel,
          status,
          interventionStatus,
          predictiveRiskPercent,
          message: `Elevated physiological stress score (${breakdown.score}/100) detected: HRV ${hrv}ms, Sleep ${sleepHours}h, Duty ${dutyDuration}h.`,
          biometrics: {
            hrv,
            sleepHours,
            restingHeartRate,
            dutyDuration,
          },
          doctorNotes,
          reviewedBy,
          reviewedAt,
          recommendedRestPeriod,
        });
      }
    }
  });

  return { logs, alerts, actions };
}
