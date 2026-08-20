import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { employeesApi, documentsApi } from '../api/services';
import { Employee, GeneratedDocument } from '../types';
import StatusBadge from '../components/StatusBadge';
import AssignIdModal from '../components/AssignIdModal';
import EmployeeModal from '../components/EmployeeModal';
import SendEmailModal from '../components/SendEmailModal';
import { useToast } from '../components/Toast';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Edit2,
  Download,
  Plus,
  Building,
  FileCheck2,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

export const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [assignIdOpen, setAssignIdOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDocForEmail, setSelectedDocForEmail] = useState<GeneratedDocument | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const empId = parseInt(id, 10);
      const empData = await employeesApi.get(empId);
      setEmployee(empData);

      const docsData = await documentsApi.getEmployeeHistory(empId);
      setDocuments(docsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load employee details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDownload = async (doc: GeneratedDocument) => {
    try {
      await documentsApi.downloadDocument(doc.id, doc.file_name);
      showToast(`Downloading ${doc.file_name}...`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Download failed.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400">
        Loading employee profile...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm font-bold text-slate-700">Employee not found.</p>
        <Link
          to="/employees"
          className="text-xs font-semibold text-smartskale-indigo hover:underline"
        >
          Return to Employee Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/employees"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {employee.full_name}
              </h1>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{employee.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>

          <Link
            to={`/generate?employee_id=${employee.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-900 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Document</span>
          </Link>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Full Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Employment & Candidate Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Employee ID */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Employee ID
                </p>
                {employee.employee_id ? (
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-sm text-slate-900">
                      {employee.employee_id}
                    </span>
                    <button
                      onClick={() => setAssignIdOpen(true)}
                      className="text-xs font-bold text-smartskale-indigo hover:underline"
                    >
                      Edit ID
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-amber-600 font-semibold italic">No ID Assigned</span>
                    <button
                      onClick={() => setAssignIdOpen(true)}
                      className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md hover:bg-amber-200"
                    >
                      + Assign Now
                    </button>
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Role / Position
                </p>
                <p className="font-bold text-slate-900">{employee.role || 'Not assigned'}</p>
              </div>

              {/* Department */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Department
                </p>
                <p className="font-bold text-slate-900">{employee.department || 'Technical'}</p>
              </div>

              {/* Joining Date */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Joining / Start Date
                </p>
                <p className="font-bold text-slate-900">{employee.joining_date || '—'}</p>
              </div>

              {/* Phone */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Phone Contact
                </p>
                <p className="font-medium text-slate-800">{employee.phone || '—'}</p>
              </div>

              {/* Tenure / Duration */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Internship Duration
                </p>
                <p className="font-medium text-slate-800">{employee.duration || '3 Months'}</p>
              </div>

              {/* Residential Address */}
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Permanent Address
                </p>
                <p className="font-medium text-slate-800 leading-relaxed">
                  {employee.address || 'Noida, Uttar Pradesh, India'}
                </p>
              </div>
            </div>
          </div>

          {/* Generated Documents for this candidate */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Generated Documents History ({documents.length})
              </h3>
              <Link
                to={`/generate?employee_id=${employee.id}`}
                className="text-xs font-bold text-smartskale-indigo hover:underline"
              >
                + Generate New
              </Link>
            </div>

            {documents.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {documents.map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-smartskale-indigo" />
                        <span className="font-bold text-slate-900 capitalize">
                          {doc.document_type.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {doc.document_number}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Generated by {doc.generated_by} on {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDocForEmail(doc);
                          setIsEmailModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors border border-emerald-200"
                        title="Send document via email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send Email</span>
                      </button>

                      <button
                        onClick={() => handleDownload(doc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-smartskale-indigo font-bold hover:bg-indigo-100 transition-colors border border-indigo-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No documents have been generated yet for this candidate.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Action Cards */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-smartskale-navy to-indigo-900 text-white shadow-md">
            <h4 className="text-sm font-bold mb-1">Issue HR Documents</h4>
            <p className="text-xs text-indigo-100/80 mb-4">
              Directly launch template generator pre-filled with {employee.full_name}'s data.
            </p>

            <div className="space-y-2">
              <Link
                to={`/generate?employee_id=${employee.id}&type=offer_letter`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-indigo-300" />
                  <span>Offer Letter</span>
                </div>
                <span>→</span>
              </Link>

              <Link
                to={`/generate?employee_id=${employee.id}&type=internship_certificate`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-300" />
                  <span>Certificate</span>
                </div>
                <span>→</span>
              </Link>

              <Link
                to={`/generate?employee_id=${employee.id}&type=nda`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-300" />
                  <span>NDA Agreement</span>
                </div>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Assign ID Modal */}
      <AssignIdModal
        isOpen={assignIdOpen}
        employee={employee}
        onClose={() => setAssignIdOpen(false)}
        onSuccess={() => {
          setAssignIdOpen(false);
          fetchDetails();
        }}
      />

      {/* Edit Profile Modal */}
      <EmployeeModal
        isOpen={editModalOpen}
        employee={employee}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          setEditModalOpen(false);
          fetchDetails();
        }}
      />

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        document={selectedDocForEmail}
        defaultEmail={employee?.email || ''}
        defaultName={employee?.full_name || ''}
      />
    </div>
  );
};

export default EmployeeDetails;
