import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { employeesApi } from '../api/services';
import { Employee } from '../types';
import StatusBadge from '../components/StatusBadge';
import AssignIdModal from '../components/AssignIdModal';
import EmployeeModal from '../components/EmployeeModal';
import SyncModal from '../components/SyncModal';
import { useToast } from '../components/Toast';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Edit2,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [pendingOnly, setPendingOnly] = useState(false);

  // Modals state
  const [assignIdEmp, setAssignIdEmp] = useState<Employee | null>(null);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeesApi.list({
        search: search.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        department: departmentFilter !== 'All' ? departmentFilter : undefined,
        pending_id_only: pendingOnly,
        limit: 200,
      });
      setEmployees(res.items);
      setTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch employees list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter, departmentFilter, pendingOnly]);

  const handleDelete = async (id: number) => {
    try {
      await employeesApi.delete(id);
      showToast('Employee deleted successfully.', 'success');
      setDeleteConfirmId(null);
      fetchEmployees();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete employee.', 'error');
    }
  };

  // Get distinct departments
  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage candidates, assign Employee IDs, and trigger document generation workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-sync-modal-open"
            onClick={() => setSyncModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Google Sheet</span>
          </button>

          <button
            id="btn-add-employee-manual"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-900 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee (Manual)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-employees"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, role, or Employee ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              id="select-dept-filter"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo bg-white"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Pill for Pending IDs */}
        <div className="flex items-center gap-3 pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              id="checkbox-pending-id-only"
              type="checkbox"
              checked={pendingOnly}
              onChange={(e) => setPendingOnly(e.target.checked)}
              className="rounded border-slate-300 text-smartskale-indigo focus:ring-smartskale-indigo"
            />
            <span className={pendingOnly ? 'text-amber-700 font-bold' : ''}>
              Show Only Pending Employee IDs ({employees.filter((e) => !e.employee_id).length})
            </span>
          </label>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{employees.length}</strong> of{' '}
            <strong className="text-slate-900">{total}</strong> total employees
          </span>
        </div>
      </div>

      {/* Employee Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Candidate / Name</th>
                <th className="py-3.5 px-4">Role & Department</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-smartskale-indigo" />
                    <span>Loading candidate records...</span>
                  </td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee ID Column */}
                    <td className="py-3 px-4 font-mono font-bold">
                      {emp.employee_id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-100 text-slate-900 px-2.5 py-1 rounded-md border border-slate-200">
                            {emp.employee_id}
                          </span>
                          <button
                            onClick={() => setAssignIdEmp(emp)}
                            title="Edit Employee ID"
                            className="text-slate-400 hover:text-smartskale-indigo p-1"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn-assign-id-${emp.id}`}
                          onClick={() => setAssignIdEmp(emp)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Assign ID</span>
                        </button>
                      )}
                    </td>

                    {/* Name & Contact */}
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 text-sm">{emp.full_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{emp.email}</p>
                      {emp.phone && <p className="text-[10px] text-slate-400">{emp.phone}</p>}
                    </td>

                    {/* Role & Dept */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{emp.role || 'Intern'}</p>
                      <p className="text-[11px] text-slate-500">{emp.department || 'Technical'}</p>
                    </td>

                    {/* Joining Date */}
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {emp.joining_date || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={emp.status} />
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {emp.source === 'google_drive' ? 'Google Sheet' : 'Manual'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/generate?employee_id=${emp.id}`}
                          id={`btn-generate-doc-${emp.id}`}
                          title="Generate Document for this employee"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-smartskale-indigo hover:bg-indigo-100 font-bold text-xs transition-colors border border-indigo-200"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Generate</span>
                        </Link>

                        <button
                          onClick={() => setEditEmp(emp)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(emp.id)}
                          title="Delete Employee"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600 mb-1">No employees found</p>
                    <p className="text-xs text-slate-400">
                      Try adjusting your search criteria or click "Sync Google Sheet" to import records.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign ID Modal */}
      <AssignIdModal
        isOpen={!!assignIdEmp}
        employee={assignIdEmp}
        onClose={() => setAssignIdEmp(null)}
        onSuccess={() => {
          setAssignIdEmp(null);
          fetchEmployees();
        }}
      />

      {/* Edit / Create Employee Modal */}
      <EmployeeModal
        isOpen={!!editEmp || createModalOpen}
        employee={editEmp}
        onClose={() => {
          setEditEmp(null);
          setCreateModalOpen(false);
        }}
        onSuccess={() => {
          setEditEmp(null);
          setCreateModalOpen(false);
          fetchEmployees();
        }}
      />

      {/* Sync Modal */}
      <SyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        onSuccess={() => {
          fetchEmployees();
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Delete Employee Record?</h3>
            <p className="text-xs text-slate-500 mb-5">
              Are you sure you want to delete this employee record? Generated documents associated with this employee will also be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
