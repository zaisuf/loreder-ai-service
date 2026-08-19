'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Zap, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AnalyticsData {
  totalRequests: number;
  totalTokens: number;
  avgLatency: number;
  activeKeysCount: number;
  activeModelsCount: number;
  modelStats: Record<string, number>;
}

interface LogEntry {
  id: string;
  keyName: string;
  model: string;
  totalTokens: number;
  latencyMs: number;
  timestamp: string;
  status: 'success' | 'error';
}

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [resAna, resLogs] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/logs')
      ]);
      const anaJson = await resAna.json();
      const logsJson = await resLogs.json();
      setData(anaJson);
      setLogs(logsJson);
    } catch (e) {
      console.error('Failed to fetch analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mr-3"></div>
        Loading metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Requests</span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data?.totalRequests.toLocaleString() || 0}</h3>
            <p className="text-xs text-teal-400 mt-1 font-medium flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-1.5 animate-pulse"></span>
              Live tracking
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total Tokens</span>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data?.totalTokens.toLocaleString() || 0}</h3>
            <p className="text-xs text-sky-400 mt-1 font-medium">Prompt + Completion</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Avg Latency</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data?.avgLatency || 0} <span className="text-lg font-normal text-slate-400">ms</span></h3>
            <p className="text-xs text-indigo-400 mt-1 font-medium">OpenCode Zen Response</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Active Models / Keys</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data?.activeModelsCount || 0} <span className="text-lg font-normal text-slate-400">/ {data?.activeKeysCount || 0} keys</span></h3>
            <p className="text-xs text-emerald-400 mt-1 font-medium">Free Tier Active</p>
          </div>
        </div>
      </div>

      {/* Model Distribution & Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-1">
          <h4 className="text-base font-bold text-white mb-4 flex items-center">
            <Cpu className="w-4 h-4 mr-2 text-teal-400" />
            Model Usage Breakdown
          </h4>

          {data?.modelStats && Object.keys(data.modelStats).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(data.modelStats).map(([model, count]) => {
                const percentage = Math.round((count / (data.totalRequests || 1)) * 100);
                return (
                  <div key={model} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300 truncate max-w-[180px]">{model}</span>
                      <span className="text-teal-400">{count} reqs ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No request traffic logged yet. Test a model in the Playground!
            </div>
          )}
        </div>

        {/* Live Requests Log Table */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-bold text-white flex items-center">
              <Activity className="w-4 h-4 mr-2 text-teal-400" />
              Recent Request Stream
            </h4>
            <span className="text-xs text-slate-400">Auto-refreshing (4s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 bg-slate-900/80 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3">API Key</th>
                  <th className="py-3 px-3">Tokens</th>
                  <th className="py-3 px-3">Latency</th>
                  <th className="py-3 px-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length > 0 ? (
                  logs.slice(0, 8).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 200 OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-400 font-medium">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Error
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-teal-300 max-w-[140px] truncate">{log.model}</td>
                      <td className="py-3 px-3 text-slate-300 font-medium">{log.keyName}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{log.totalTokens}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{log.latencyMs}ms</td>
                      <td className="py-3 px-3 text-right text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No logs available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
