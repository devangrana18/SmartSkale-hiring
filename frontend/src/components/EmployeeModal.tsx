import React, { useState, useEffect } from 'react';
import { Employee, EmployeeCreatePayload, EmployeeUpdatePayload } from '../types';
import { employeesApi } from '../api/services';
import { useToast } from './Toast';
import { X, UserCheck, AlertCircle, Save } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  onSuccess: (emp: Employee) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess,
}) => {
  const isEditing = !!employee;
  const { showToast } = useToast();

  const [formData, setFormData] = useState<EmployeeCreatePayload>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    department: '',
    joining_date: '',
    status: 'Active',
    duration: '3 Months',
    start_date: '',
    end_date: '',
    stipend: '',
    reference_number: '',
    employee_id: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        role: employee.role || '',
        department: employee.department || '',
        joining_date: employee.joining_date || '',
        status: employee.status || 'Active',
        duration: employee.duration || '3 Months',
        start_date: employee.start_date || '',
        end_date: employee.end_date || '',
        stipend: employee.stipend || '',
        reference_number: employee.reference_number || '',
        employee_id: employee.employee_id || '',
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        address: 'Noida, Uttar Pradesh, India',
        role: 'Full Stack Gen AI Intern',
        department: 'Technical Development',
        joining_date: new Date().toISOString().split('T')[0],
        status: 'Active',
        duration: '3 Months',
        start_date: '',
        end_date: '',
        stipend: 'Unpaid / Performance Stipend',
        reference_number: '',
        employee_id: '',
      });
    }
    setError(null);
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && employee) {
        const updated = await employeesApi.update(employee.id, formData as EmployeeUpdatePayload);
        showToast(`Employee ${updated.full_name} was updated successfully.`, 'success');
        onSuccess(updated);
      } else {
        const created = await employeesApi.create(formData);
        showToast(`Employee ${created.full_name} created successfully.`, 'success');
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-smartskale-navy text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Employee Details' : 'Add New Employee (Manual Entry)'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Modify employee profile information' : 'Create a new employee record'}
              </p>
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
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. rahul.sharma@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Employee ID <span className="text-slate-400 font-normal">(HR Manual Assignment)</span>
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id || ''}
                onChange={handleChange}
                placeholder="e.g. SKL-EMP-1042"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Role / Title
              </label>
              <input
                type="text"
                name="role"
                value={formData.role || ''}
                onChange={handleChange}
                placeholder="e.g. Full Stack Gen AI Intern"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department || ''}
                onChange={handleChange}
                placeholder="e.g. Technical Development"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Joining / Document Date
              </label>
              <input
                type="text"
                name="joining_date"
                value={formData.joining_date || ''}
                onChange={handleChange}
                placeholder="DD-MM-YYYY or YYYY-MM-DD"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status || 'Active'}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo bg-white"
              >
                <option value="Active">Active</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Permanent / Current Address
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address || ''}
                onChange={handleChange}
                placeholder="e.g. 100, Sector 10, Noida, Uttar Pradesh, India"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-900 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Save Changes' : 'Create Employee'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
