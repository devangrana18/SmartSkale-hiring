import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { employeesApi } from '../api/services';
import { useToast } from './Toast';
import { IdCard, X, AlertCircle, Check } from 'lucide-react';

interface AssignIdModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Employee) => void;
}

export const AssignIdModal: React.FC<AssignIdModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (employee) {
      setEmployeeId(employee.employee_id || '');
      setError(null);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('Employee ID cannot be blank. Please enter a valid ID.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updated = await employeesApi.assignId(employee.id, employeeId.trim());
      showToast(
        `Employee ID '${employeeId.trim()}' successfully assigned to ${employee.full_name}.`,
        'success',
        'ID Assigned'
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign Employee ID.');
      showToast(err.message || 'Failed to assign Employee ID.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-smartskale-indigo">
              <span className="font-bold text-lg">ID</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Manual Employee ID</h3>
              <p className="text-xs text-slate-500">Assign official HR identifier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Employee Name:</span>
              <span className="font-bold text-slate-900">{employee.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Email:</span>
              <span className="font-mono text-slate-800">{employee.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Role:</span>
              <span>{employee.role || 'Not specified'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee ID <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-assign-employee-id"
              type="text"
              required
              placeholder="e.g. SKL-EMP-1042 or SKL-2026-1001"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
              autoFocus
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Rule: Employee ID is strictly manual and must be globally unique.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-assign-id"
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-900 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Assign Employee ID</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignIdModal;
