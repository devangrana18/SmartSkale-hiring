import React, { useState } from 'react';
import { SyncResponse } from '../types';
import { employeesApi } from '../api/services';
import { useToast } from './Toast';
import { RefreshCw, UploadCloud, CheckCircle2, AlertCircle, X, FileSpreadsheet } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (res: SyncResponse) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleDriveSync = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await employeesApi.sync();
      setResult(res);
      showToast(res.message, 'success', 'Google Drive Sync');
      onSuccess(res);
    } catch (err: any) {
      showToast(err.message || 'Google Drive sync failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await employeesApi.uploadExcel(selectedFile);
      setResult(res);
      showToast(res.message, 'success', 'Spreadsheet Uploaded');
      onSuccess(res);
    } catch (err: any) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-smartskale-indigo">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Synchronize Employee Data</h3>
              <p className="text-xs text-slate-500">Fetch form responses from Google Drive or upload</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Option A: Direct Drive Sync */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Google Drive Spreadsheet Sync</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronizes candidates who submitted the Google Form. Preserves existing Employee IDs.
                </p>
              </div>
            </div>
            <button
              id="btn-sync-drive-now"
              onClick={handleDriveSync}
              disabled={loading}
              className="mt-3.5 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-smartskale-navy text-white text-xs font-bold hover:bg-indigo-900 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Fetching from Google Drive...' : 'Sync with Google Drive Now'}</span>
            </button>
          </div>

          {/* Option B: Local Excel / CSV File Upload */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="text-sm font-bold text-slate-900">Upload Excel / CSV File</h4>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">
              Alternatively upload an exported `.xlsx` or `.csv` spreadsheet file directly.
            </p>
            <form onSubmit={handleFileUpload} className="space-y-3">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-smartskale-indigo hover:file:bg-indigo-100 cursor-pointer"
              />
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-40"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload & Import Records</span>
              </button>
            </form>
          </div>

          {/* Result Banner */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{result.message}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 text-center">
                <div className="bg-white/60 p-2 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-emerald-700">Added</p>
                  <p className="text-base font-extrabold text-slate-900">{result.new_employees_count}</p>
                </div>
                <div className="bg-white/60 p-2 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-indigo-700">Updated</p>
                  <p className="text-base font-extrabold text-slate-900">{result.updated_employees_count}</p>
                </div>
                <div className="bg-white/60 p-2 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-slate-600">Skipped</p>
                  <p className="text-base font-extrabold text-slate-900">{result.skipped_employees_count}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
