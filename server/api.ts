import express, { Request, Response } from 'express';
import {
  addBiometricLog,
  addCommanderAction,
  getAlerts,
  getCommanderActions,
  getConfig,
  getDatabaseStatus,
  getLogs,
  getSoldierById,
  getSoldiers,
  getSquadReadiness,
  getUsers,
  resetDemoData,
  updateAlert,
  updateConfig,
  authenticateUser,
  getDemoAccounts,
  getUserByUsername,
  registerUser,
} from './db.ts';
import { calculateStressScore, calculateEnvironmentalAdjustment } from '../src/utils/stressCalculator.ts';
import { EnvironmentalCondition, InterventionStatus } from '../src/types.ts';

export const apiRouter = express.Router();

apiRouter.use(express.json());

// Auth: Login Endpoint
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Email or Username is required' });
    }

    const user = authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials. Please verify your email/username and password.',
      });
    }

    // Return safe user profile
    const { password: _p, ...safeUser } = user;
    res.json({
      success: true,
      message: `Authenticated successfully as ${user.rank} ${user.name}`,
      user: safeUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Registration Endpoint
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, role, unit, squad, soldierId, rank } = req.body;

    if (!name || !email || !password || !role || !unit) {
      return res.status(400).json({ error: 'Please provide all required fields (Name, Email, Password, Role, Unit).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    if (!['SOLDIER', 'COMMANDER', 'DOCTOR'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role selected.' });
    }

    const result = registerUser({
      name,
      email,
      password,
      role,
      unit,
      squad,
      soldierId,
      rank,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now sign in.',
      user: result.user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Forgot Password Request
apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = getUserByUsername(email);
    // Don't leak existence, return professional response
    res.json({
      success: true,
      message: user
        ? 'Password reset instructions have been dispatched to your official registered address.'
        : 'If an account exists with this address, password reset instructions have been dispatched.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Demo Accounts List (for quick login & judges showcase)
apiRouter.get('/auth/demo-accounts', (_req: Request, res: Response) => {
  try {
    const accounts = getDemoAccounts();
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// System and Database Status
apiRouter.get('/status', (_req: Request, res: Response) => {
  try {
    const status = getDatabaseStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Demo Users
apiRouter.get('/users', (_req: Request, res: Response) => {
  try {
    const users = getUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// All Soldiers Roster
apiRouter.get('/soldiers', (_req: Request, res: Response) => {
  try {
    const soldiers = getSoldiers();
    res.json(soldiers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Individual Soldier Profile
apiRouter.get('/soldiers/:soldierId', (req: Request, res: Response) => {
  try {
    const soldier = getSoldierById(req.params.soldierId);
    if (!soldier) {
      return res.status(404).json({ error: 'Personnel record not found' });
    }
    res.json(soldier);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Biometric Logs Query
apiRouter.get('/logs', (req: Request, res: Response) => {
  try {
    const soldierId = req.query.soldierId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const logs = getLogs(soldierId, limit);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Daily Biometric Log (supports environmental condition)
apiRouter.post('/logs', (req: Request, res: Response) => {
  try {
    const {
      soldierId,
      date,
      hrv,
      sleepHours,
      restingHeartRate,
      dutyDuration,
      environmentalCondition,
      notes,
    } = req.body;

    if (!soldierId) {
      return res.status(400).json({ error: 'soldierId is required' });
    }

    const numHrv = Number(hrv);
    const numSleep = Number(sleepHours);
    const numRhr = Number(restingHeartRate);
    const numDuty = Number(dutyDuration);

    if (isNaN(numHrv) || isNaN(numSleep) || isNaN(numRhr) || isNaN(numDuty)) {
      return res.status(400).json({ error: 'Valid numerical biometric readings are required' });
    }

    if (numHrv < 10 || numHrv > 150) {
      return res.status(400).json({ error: 'HRV must be between 10 ms and 150 ms' });
    }
    if (numSleep < 1 || numSleep > 16) {
      return res.status(400).json({ error: 'Sleep hours must be between 1 and 16 hours' });
    }
    if (numRhr < 35 || numRhr > 160) {
      return res.status(400).json({ error: 'Resting Heart Rate must be between 35 and 160 bpm' });
    }
    if (numDuty < 0 || numDuty > 24) {
      return res.status(400).json({ error: 'Duty duration must be between 0 and 24 hours' });
    }

    const envCond: EnvironmentalCondition = environmentalCondition || 'NORMAL';

    const result = addBiometricLog({
      soldierId,
      date,
      hrv: numHrv,
      sleepHours: numSleep,
      restingHeartRate: numRhr,
      dutyDuration: numDuty,
      environmentalCondition: envCond,
      notes,
    });

    const config = getConfig();
    const breakdown = calculateStressScore(
      {
        hrv: numHrv,
        sleepHours: numSleep,
        restingHeartRate: numRhr,
        dutyDuration: numDuty,
      },
      config.weights,
      config.thresholds
    );

    const envAdj = calculateEnvironmentalAdjustment(breakdown.score, envCond, config.thresholds);

    res.status(201).json({
      success: true,
      log: result.log,
      alert: result.alert,
      breakdown,
      environmentalAdjustment: envAdj,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Commander: Squad Readiness
apiRouter.get('/commander/readiness', (req: Request, res: Response) => {
  try {
    const unit = req.query.unit as string | undefined;
    const summary = getSquadReadiness(unit);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Commander: Action History
apiRouter.get('/commander/actions', (_req: Request, res: Response) => {
  try {
    const actions = getCommanderActions();
    res.json(actions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Commander: Issue Action (Stand-Down / Shift Rotation)
apiRouter.post('/commander/actions', (req: Request, res: Response) => {
  try {
    const { targetAnonId, soldierId, soldierName, unit, actionType, commanderNotes, issuedBy } = req.body;
    if (!targetAnonId || !soldierId || !actionType) {
      return res.status(400).json({ error: 'targetAnonId, soldierId, and actionType are required' });
    }

    const action = addCommanderAction({
      targetAnonId,
      soldierId,
      soldierName,
      unit: unit || 'Operational Formations',
      actionType,
      commanderNotes,
      issuedBy,
    });

    res.status(201).json({ success: true, action });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Doctor: High-Risk Alerts with Filtering
apiRouter.get('/doctor/alerts', (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const interventionStatus = req.query.interventionStatus as string | undefined;
    const unit = req.query.unit as string | undefined;
    const riskLevel = req.query.riskLevel as string | undefined;

    const alerts = getAlerts({
      status,
      interventionStatus,
      unit,
      riskLevel,
    });
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Doctor: Update / Resolve Alert
apiRouter.patch('/doctor/alerts/:id', (req: Request, res: Response) => {
  try {
    const { status, interventionStatus, doctorNotes, reviewedBy, recommendedRestPeriod } = req.body;
    const alert = updateAlert(req.params.id, {
      status,
      interventionStatus: interventionStatus as InterventionStatus | undefined,
      doctorNotes,
      reviewedBy,
      recommendedRestPeriod,
    });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json({ success: true, alert });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Config: Calculation Weights & Thresholds
apiRouter.get('/config', (_req: Request, res: Response) => {
  try {
    const config = getConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/config', (req: Request, res: Response) => {
  try {
    const { weights, thresholds } = req.body;
    const updated = updateConfig(weights, thresholds);
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Demo Data
apiRouter.post('/reset-demo', (_req: Request, res: Response) => {
  try {
    const result = resetDemoData();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
