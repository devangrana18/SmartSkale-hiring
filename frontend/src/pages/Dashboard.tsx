import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, employeesApi } from '../api/services';
import { DashboardStats, Employee } from '../types';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import AssignIdModal from '../components/AssignIdModal';
import { useToast } from '../components/Toast';
import {
  Users,
  UserCheck,
  AlertTriangle,
  FileText,
  FileCheck2,
  GraduationCap,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Building2,
  Mail,
  IdCard
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedEmpForId, setSelectedEmpForId] = useState<Employee | null>(null);
  const { showToast } = useToast();

  const fetchStats = async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await employeesApi.sync();
      showToast(res.message, 'success', 'Google Drive Sync');
      await fetchStats();
    } catch (err: any) {
      showToast(err.message || 'Sync failed.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-smartskale-indigo animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading SmartSkale HR Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">HR Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time candidate statistics, Google Form sync & document issuance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-dashboard-sync"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync with Google Drive'}</span>
          </button>
          
          <Link
            to="/generate"
            id="btn-dashboard-generate"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-900 transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate Document</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Active Employees"
          value={stats?.active_employees ?? 0}
          subtitle="Currently active / working"
          icon={UserCheck}
          colorScheme="emerald"
          trend="Live Count"
        />
        <StatCard
          title="Total Records"
          value={stats?.total_employees ?? 0}
          subtitle="All imported & manual entries"
          icon={Users}
          colorScheme="indigo"
        />
        <StatCard
          title="Pending Employee IDs"
          value={stats?.pending_employee_ids ?? 0}
          subtitle="Awaiting manual HR assignment"
          icon={AlertTriangle}
          colorScheme="amber"
          alert={(stats?.pending_employee_ids ?? 0) > 0}
        />
        <StatCard
          title="Generated Documents"
          value={stats?.documents_generated_count ?? 0}
          subtitle="PDFs created & downloaded"
          icon={FileText}
          colorScheme="purple"
        />
      </div>

      {/* Document Shortcuts Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-smartskale-navy via-indigo-900 to-smartskale-indigo text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-3 border border-white/10">
            <span>Instant Template Generator</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">
            Create Official SmartSkale HR Documents
          </h2>
          <p className="text-xs text-indigo-100/80 leading-relaxed mb-5">
            Select candidate details, preview the exact SmartSkale HTML template live with dynamic replacements, and download print-ready PDFs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/generate?type=offer_letter"
              id="btn-quick-offer-letter"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-xs font-bold"
            >
              <FileCheck2 className="w-5 h-5 text-indigo-300 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-white">Offer Letter</p>
                <p className="text-[10px] text-indigo-200 font-normal">Onboarding terms</p>
              </div>
            </Link>

            <Link
              to="/generate?type=internship_certificate"
              id="btn-quick-certificate"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-xs font-bold"
            >
              <GraduationCap className="w-5 h-5 text-emerald-300 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-white">Internship Cert.</p>
                <p className="text-[10px] text-indigo-200 font-normal">With verify URL</p>
              </div>
            </Link>

            <Link
              to="/generate?type=nda"
              id="btn-quick-nda"
              className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-xs font-bold"
            >
              <ShieldAlert className="w-5 h-5 text-purple-300 shrink-0" />
              <div className="text-left">
                <p className="font-bold text-white">NDA Agreement</p>
                <p className="text-[10px] text-indigo-200 font-normal">Confidentiality</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Employees & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Employees Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Employee Records</h3>
              <p className="text-xs text-slate-500">Recently synced form submissions</p>
            </div>
            <Link
              to="/employees"
              className="inline-flex items-center gap-1 text-xs font-bold text-smartskale-indigo hover:text-indigo-900"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Employee ID</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recent_employees && stats.recent_employees.length > 0 ? (
                  stats.recent_employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3">
                        <p className="font-bold text-slate-900">{emp.full_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{emp.email}</p>
                      </td>
                      <td className="py-3">
                        <span className="font-medium text-slate-700">{emp.role || 'Intern'}</span>
                        <p className="text-[10px] text-slate-400">{emp.department || 'Technical'}</p>
                      </td>
                      <td className="py-3 font-mono">
                        {emp.employee_id ? (
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {emp.employee_id}
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedEmpForId(emp)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors"
                          >
                            <span>+ Assign ID</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/generate?employee_id=${emp.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-smartskale-indigo hover:text-indigo-900"
                        >
                          <span>Generate</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No employees found. Click "Sync with Google Drive" to import candidates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Distribution (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Department Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown across teams</p>

            <div className="space-y-3">
              {stats?.department_distribution && Object.keys(stats.department_distribution).length > 0 ? (
                Object.entries(stats.department_distribution).map(([dept, count]) => {
                  const total = stats.total_employees || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{dept}</span>
                        <span className="text-slate-500 font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-smartskale-indigo rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">No department data recorded.</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Google Sheet ID</span>
            <span className="font-mono text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">
              1fXKpV71...COwn
            </span>
          </div>
        </div>
      </div>

      {/* Manual Assign ID Modal */}
      <AssignIdModal
        isOpen={!!selectedEmpForId}
        employee={selectedEmpForId}
        onClose={() => setSelectedEmpForId(null)}
        onSuccess={() => {
          setSelectedEmpForId(null);
          fetchStats();
        }}
      />
    </div>
  );
};

export default Dashboard;
