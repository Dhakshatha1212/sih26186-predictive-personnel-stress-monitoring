import React from 'react';
import { DatabaseStatus } from '../types.ts';
import { Database, CheckCircle2, AlertCircle, Server, ShieldCheck, X, RotateCcw } from 'lucide-react';

interface MongoStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DatabaseStatus | null;
  onResetData: () => void;
  isResetting: boolean;
}

export const MongoStatusModal: React.FC<MongoStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  onResetData,
  isResetting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Database Architecture &amp; MongoDB Atlas M0 Status
              </h3>
              <p className="text-xs text-slate-400">
                ₹0 Cost Guarantee • Free Tier M0 &amp; In-Memory Fallback Engine
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
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-lg border flex items-start gap-3.5 ${
              status?.connected
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : 'bg-slate-800/80 border-slate-700 text-slate-200'
            }`}
          >
            {status?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Server className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <span>
                  {status?.connected ? 'Connected to MongoDB Atlas M0' : 'High-Performance Local Demo Mode ($0 Cost)'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900/80 rounded border border-slate-700">
                  {status?.databaseName}
                </span>
              </div>
              <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                {status?.message}
              </p>
            </div>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Total Soldiers</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{status?.totalSoldiers || 24}</div>
              <span className="text-[10px] text-slate-500">4 Operational Units</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Biometric Logs</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{status?.totalLogs || 336}</div>
              <span className="text-[10px] text-slate-500">14 Days History</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Total Alerts</span>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">{status?.totalAlerts || 12}</div>
              <span className="text-[10px] text-slate-500">Heuristic Flags</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Pending Review</span>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">{status?.activeHighRiskCount || 3}</div>
              <span className="text-[10px] text-slate-500">Doctor Attention</span>
            </div>
          </div>

          {/* Database Schema & Models */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified Schema Collections (SIH26186)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded border border-slate-800">
                <span className="font-mono text-cyan-400 font-bold block mb-1">users</span>
                <ul className="text-[11px] text-slate-400 space-y-0.5">
                  <li>• soldierId (Index)</li>
                  <li>• name</li>
                  <li>• role (Soldier/Cmd/Doc)</li>
                  <li>• unit</li>
                  <li>• rank</li>
                  <li>• email</li>
                </ul>
              </div>
              <div className="bg-slate-900 p-3 rounded border border-slate-800">
                <span className="font-mono text-emerald-400 font-bold block mb-1">biometric_logs</span>
                <ul className="text-[11px] text-slate-400 space-y-0.5">
                  <li>• soldierId</li>
                  <li>• date &amp; timestamp</li>
                  <li>• HRV (RMSSD in ms)</li>
                  <li>• sleepHours</li>
                  <li>• restingHeartRate</li>
                  <li>• dutyDuration</li>
                  <li>• stressScore</li>
                </ul>
              </div>
              <div className="bg-slate-900 p-3 rounded border border-slate-800">
                <span className="font-mono text-rose-400 font-bold block mb-1">stress_alerts</span>
                <ul className="text-[11px] text-slate-400 space-y-0.5">
                  <li>• soldierId &amp; unit</li>
                  <li>• stressScore</li>
                  <li>• riskLevel (HIGH/MOD)</li>
                  <li>• status (PENDING/...)</li>
                  <li>• message</li>
                  <li>• doctorNotes &amp; reviewer</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Zero Cost MongoDB Atlas M0 Integration Instructions */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-400" />
              How MongoDB Atlas M0 Connects ($0 Cost)
            </h4>
            <p className="text-slate-400 leading-relaxed">
              This application is pre-configured to automatically connect to any free MongoDB Atlas M0 cluster when the
              environment variable <code className="text-cyan-300 font-mono">MONGO_URI</code> is supplied:
            </p>
            <div className="bg-slate-900 p-2.5 rounded font-mono text-[11px] text-slate-300 border border-slate-800 break-all select-all">
              MONGO_URI="mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/sih_personnel_welfare?retryWrites=true&amp;w=majority"
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              During preview or local hackathon demonstration, the system runs with 100% functionality out-of-the-box
              without needing any database setup or credentials.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onResetData}
            disabled={isResetting}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/80 rounded transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Synthetic Dataset</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
