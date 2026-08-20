import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentsApi } from '../api/services';
import { GeneratedDocument } from '../types';
import { useToast } from '../components/Toast';
import SendEmailModal from '../components/SendEmailModal';
import {
  History,
  Download,
  FileText,
  FileCheck2,
  GraduationCap,
  ShieldAlert,
  Search,
  Calendar,
  User,
  ExternalLink,
  Mail
} from 'lucide-react';

export const DocumentHistory: React.FC = () => {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedDocForEmail, setSelectedDocForEmail] = useState<GeneratedDocument | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const { showToast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await documentsApi.getHistory();
      setDocuments(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch document history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDownload = async (doc: GeneratedDocument) => {
    try {
      await documentsApi.downloadDocument(doc.id, doc.file_name);
      showToast(`Downloading ${doc.file_name || 'document'}...`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Download failed.', 'error');
    }
  };

  const handleOpenEmailModal = (doc: GeneratedDocument) => {
    setSelectedDocForEmail(doc);
    setIsEmailModalOpen(true);
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      (doc.employee_name && doc.employee_name.toLowerCase().includes(search.toLowerCase())) ||
      (doc.file_name && doc.file_name.toLowerCase().includes(search.toLowerCase())) ||
      (doc.document_number && doc.document_number.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'All' || doc.document_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'offer_letter':
        return <FileCheck2 className="w-4 h-4 text-indigo-600" />;
      case 'internship_certificate':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      case 'nda':
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Document Generation History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all generated PDFs with download access and metadata.
          </p>
        </div>

        <Link
          to="/generate"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-900 transition-all shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>New Document</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate name, doc number or file..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30"
          >
            <option value="All">All Types</option>
            <option value="offer_letter">Offer Letter</option>
            <option value="internship_certificate">Internship Certificate</option>
            <option value="nda">Non-Disclosure (NDA)</option>
            <option value="letterhead">Letterhead</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Candidate / Employee</th>
                <th className="py-3.5 px-4">Reference / Cert No</th>
                <th className="py-3.5 px-4">Generated By</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading document generation history...
                  </td>
                </tr>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Doc Type */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getDocIcon(doc.document_type)}
                        <span className="font-bold text-slate-900 capitalize">
                          {doc.document_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.file_name}</p>
                    </td>

                    {/* Candidate Name */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {doc.employee_name || `Employee #${doc.employee_id}`}
                    </td>

                    {/* Doc Number */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {doc.document_number || '—'}
                    </td>

                    {/* Generated By */}
                    <td className="py-3 px-4 text-slate-600">
                      {doc.generated_by || 'HR Admin'}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEmailModal(doc)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs transition-colors border border-emerald-200"
                          title="Send document to employee email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send Email</span>
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-smartskale-indigo hover:bg-indigo-100 font-bold text-xs transition-colors border border-indigo-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No documents generated yet. Use the Document Generator to create documents.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        document={selectedDocForEmail}
        defaultEmail=""
        defaultName={selectedDocForEmail?.employee_name || ''}
      />
    </div>
  );
};

export default DocumentHistory;
