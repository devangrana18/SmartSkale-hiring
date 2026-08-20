import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { employeesApi, documentsApi, templatesApi } from '../api/services';
import { Employee, DocumentFormData, DocumentTemplate, GeneratedDocument } from '../types';
import { useToast } from '../components/Toast';
import SendEmailModal from '../components/SendEmailModal';
import {
  FileText,
  FileCheck2,
  GraduationCap,
  ShieldAlert,
  Database,
  UserPlus,
  Search,
  Download,
  Printer,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Mail,
  MapPin,
  Briefcase,
  FileCode2
} from 'lucide-react';

export const DocumentGenerator: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Document & Source Selection
  const initialType = searchParams.get('type') || 'offer_letter';
  const initialEmployeeId = searchParams.get('employee_id');

  const [documentType, setDocumentType] = useState<string>(initialType);
  const [dataSource, setDataSource] = useState<'excel' | 'manual'>('excel');

  // Generated document state for emailing
  const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  // Employee list for dropdown
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    initialEmployeeId ? parseInt(initialEmployeeId, 10) : null
  );

  // Form Data State
  const [formData, setFormData] = useState<DocumentFormData>({
    document_type: documentType,
    name: 'Rahul Sharma',
    intern_id: 'SKL-EMP-1001',
    email: 'rahul.sharma@example.com',
    intern_address: '100, Sector 10, Noida, Uttar Pradesh, India',
    role: 'Full Stack Gen AI Intern',
    department: 'Technical Development',
    date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    duration: '3 Months',
    start_date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    end_date: '3 Months from Start Date',
    issue_date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    certificate_no: '2026-001',
    verify_url: 'https://smartskale.com/verify',
    stipend: 'Unpaid / Performance Stipend',
    reference_number: 'SKL-2026-1001',
    custom_content: '',
  });

  // Preview State
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(0.65);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch employees list
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await employeesApi.list({ limit: 200 });
        setEmployees(res.items);
        
        // If employee_id passed in URL, pre-populate
        const currentEmpId = searchParams.get('employee_id');
        if (currentEmpId) {
          const emp = res.items.find((e) => e.id === parseInt(currentEmpId, 10));
          if (emp) {
            handleSelectEmployee(emp);
          }
        }
      } catch (err) {
        console.error('Failed to load employee directory:', err);
      }
    };
    loadEmployees();
  }, []);

  // Sync documentType from URL query params (e.g. clicking sidebar or navigation links)
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl && typeFromUrl !== documentType) {
      setDocumentType(typeFromUrl);
    }
  }, [searchParams, documentType]);

  // Sync employee_id from URL query params
  useEffect(() => {
    const empIdFromUrl = searchParams.get('employee_id');
    if (empIdFromUrl) {
      const parsedId = parseInt(empIdFromUrl, 10);
      if (!isNaN(parsedId) && parsedId !== selectedEmployeeId) {
        setSelectedEmployeeId(parsedId);
        if (employees.length > 0) {
          const emp = employees.find((e) => e.id === parsedId);
          if (emp) {
            handleSelectEmployee(emp);
          }
        }
      }
    }
  }, [searchParams, employees, selectedEmployeeId]);

  // Sync documentType changes to formData
  useEffect(() => {
    setFormData((prev) => ({ ...prev, document_type: documentType }));
  }, [documentType]);

  // Handle in-page document type change and update URL query params
  const handleDocumentTypeChange = (type: string) => {
    setDocumentType(type);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('type', type);
    setSearchParams(newParams);
  };

  // Handle Employee selection from searchable dropdown
  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployeeId(emp.id);
    setFormData((prev) => ({
      ...prev,
      employee_id: emp.id,
      name: emp.full_name,
      intern_id: emp.employee_id || emp.reference_number || 'PENDING-ID',
      email: emp.email,
      intern_address: emp.address || 'Noida, Uttar Pradesh, India',
      role: emp.role || 'Full Stack Gen AI Intern',
      department: emp.department || 'Technical Development',
      date: emp.joining_date || prev.date,
      start_date: emp.joining_date || prev.start_date,
      duration: emp.duration || '3 Months',
      reference_number: emp.reference_number || emp.employee_id || '',
      certificate_no: (emp.employee_id || emp.reference_number || '2026-001').replace('SKL-', ''),
    }));
    showToast(`Loaded details for ${emp.full_name}`, 'info');
  };

  // Form input change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Debounced live preview fetch
  useEffect(() => {
    let isCancelled = false;
    const updatePreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await documentsApi.preview({
          ...formData,
          document_type: documentType,
        });
        if (!isCancelled) {
          setPreviewHtml(res.html);
        }
      } catch (err: any) {
        console.error('Preview error:', err);
      } finally {
        if (!isCancelled) {
          setPreviewLoading(false);
        }
      }
    };

    const timer = setTimeout(updatePreview, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [formData, documentType]);

  // Generate and download final document
  const handleGenerate = async () => {
    setGenerateLoading(true);
    try {
      const generated = await documentsApi.generate({
        ...formData,
        document_type: documentType,
        save_history: true,
      });

      setGeneratedDoc(generated);

      showToast(
        `Generated ${generated.file_name} successfully! PDF downloading...`,
        'success',
        'Document Generated'
      );

      // Trigger download
      await documentsApi.downloadDocument(generated.id, generated.file_name);

      // Automatically open email modal so HR can send to employee
      setIsEmailModalOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate document.', 'error');
    } finally {
      setGenerateLoading(false);
    }
  };

  // Print directly from iframe
  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  // Filtered employees for dropdown
  const filteredEmployees = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      e.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (e.employee_id && e.employee_id.toLowerCase().includes(employeeSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Document Generator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select candidate details, preview template in real time, and generate official documents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {generatedDoc && (
            <button
              id="btn-send-email-top"
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email to Candidate</span>
            </button>
          )}

          <button
            id="btn-print-doc"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Preview</span>
          </button>

          <button
            id="btn-generate-main"
            onClick={handleGenerate}
            disabled={generateLoading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-900 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {generateLoading ? (
              <span>Generating PDF...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Generate & Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Post Generation Success Banner */}
      {generatedDoc && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-950">
                Document Generated: {generatedDoc.file_name}
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                The document has been created and saved. You can send it directly to{' '}
                <span className="font-semibold">{formData.name}</span> ({formData.email}) via email.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send via Email Now</span>
            </button>
            <button
              onClick={() => documentsApi.downloadDocument(generatedDoc.id, generatedDoc.file_name)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout (Matching handwritten wireframe structure!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Controls, Selection, Data Source & Form Inputs (5 Cols)     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          {/* SECTION 1: DOCUMENT TYPE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1. Document Type
              </label>
              <span className="text-[10px] text-slate-400 font-medium">SmartSkale HTML Templates</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="doc-opt-offer-letter"
                onClick={() => handleDocumentTypeChange('offer_letter')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  documentType === 'offer_letter'
                    ? 'bg-smartskale-navy text-white border-smartskale-navy shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileCheck2 className="w-5 h-5 mb-1.5" />
                <span className="text-xs font-bold">Offer Letter</span>
              </button>

              <button
                type="button"
                id="doc-opt-certificate"
                onClick={() => handleDocumentTypeChange('internship_certificate')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  documentType === 'internship_certificate'
                    ? 'bg-smartskale-navy text-white border-smartskale-navy shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-5 h-5 mb-1.5" />
                <span className="text-xs font-bold">Certificate</span>
              </button>

              <button
                type="button"
                id="doc-opt-nda"
                onClick={() => handleDocumentTypeChange('nda')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  documentType === 'nda'
                    ? 'bg-smartskale-navy text-white border-smartskale-navy shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className="w-5 h-5 mb-1.5" />
                <span className="text-xs font-bold">NDA</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* SECTION 2: DATA SOURCE */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              2. Data Source
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="source-opt-excel"
                onClick={() => setDataSource('excel')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  dataSource === 'excel'
                    ? 'bg-indigo-50 border-smartskale-indigo text-smartskale-indigo shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Excel / Sheet Records</span>
              </button>

              <button
                type="button"
                id="source-opt-manual"
                onClick={() => {
                  setDataSource('manual');
                  setSelectedEmployeeId(null);
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  dataSource === 'manual'
                    ? 'bg-indigo-50 border-smartskale-indigo text-smartskale-indigo shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Manual Entry</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: SELECT INTERN / EMPLOYEE (If Excel Records mode) */}
          {dataSource === 'excel' && (
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                3. Select Intern / Employee
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Filter by candidate name or email..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-smartskale-indigo"
                  />
                </div>

                <select
                  id="select-employee-dropdown"
                  value={selectedEmployeeId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    const emp = employees.find((x) => x.id === id);
                    if (emp) handleSelectEmployee(emp);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                >
                  <option value="">-- Choose Candidate ({filteredEmployees.length} available) --</option>
                  {filteredEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.email}) {emp.employee_id ? `[${emp.employee_id}]` : '[No ID Assigned]'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="h-px bg-slate-100" />

          {/* SECTION 4: EMPLOYEE DETAILS FORM */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Employee & Document Details
              </label>
              <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Preview
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-doc-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
              </div>

              {/* Employee ID */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Employee ID <span className="text-slate-400 font-normal">(HR Manual Assignment)</span>
                </label>
                <input
                  id="input-doc-intern-id"
                  type="text"
                  name="intern_id"
                  value={formData.intern_id || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. SKL-EMP-1042"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
              </div>

              {/* Document Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Date</label>
                <input
                  id="input-doc-date"
                  type="text"
                  name="date"
                  value={formData.date || ''}
                  onChange={handleInputChange}
                  placeholder="DD-MM-YYYY"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  id="input-doc-email"
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. rahul.sharma@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
              </div>

              {/* Role & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role / Designation</label>
                  <input
                    id="input-doc-role"
                    type="text"
                    name="role"
                    value={formData.role || ''}
                    onChange={handleInputChange}
                    placeholder="Full Stack Intern"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    id="input-doc-dept"
                    type="text"
                    name="department"
                    value={formData.department || ''}
                    onChange={handleInputChange}
                    placeholder="Technical Development"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                  />
                </div>
              </div>

              {/* Duration / Additional Fields based on Document Type */}
              {documentType === 'internship_certificate' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Internship Duration</label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 3 Months"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Certificate No.</label>
                    <input
                      type="text"
                      name="certificate_no"
                      value={formData.certificate_no || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 2026-001"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                    />
                  </div>
                </div>
              )}

              {/* Permanent Address */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  id="input-doc-address"
                  rows={2}
                  name="intern_address"
                  value={formData.intern_address || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. 100, Sector 10, Noida, Uttar Pradesh, India"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
                />
              </div>
            </div>
          </div>

          {/* Generate Document Bottom CTA */}
          <div className="pt-3">
            <button
              id="btn-generate-bottom"
              type="button"
              onClick={handleGenerate}
              disabled={generateLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-smartskale-navy hover:bg-indigo-900 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {generateLoading ? (
                <span>Generating PDF...</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate Final Document (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Live Responsive Document Preview (7 Cols)                  */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">
                Live Document Preview
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                {documentType.replace('_', ' ')}
              </span>
            </div>

            {/* Zoom & Screen Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.1))}
                title="Zoom Out"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-600 px-1">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(1.3, prev + 0.1))}
                title="Zoom In"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <button
                onClick={() => setIsFullscreen(true)}
                title="Fullscreen Preview"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Iframe Preview Container */}
          {/* Outer scroll container — always grows to fit scaled content */}
          <div className="bg-slate-200/90 rounded-2xl border border-slate-300/80 shadow-inner overflow-auto relative" style={{ minHeight: '600px' }}>
            {previewLoading && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 shadow-md text-xs font-bold text-smartskale-indigo">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating preview...</span>
              </div>
            )}

            {/*
              Shrink-wrapper pattern:
              - Outer div physically occupies (794 * scale) x (1123 * scale) px in layout
              - Inner div is 794x1123 and scaled via transform with origin top-left
              - This means NO overflow / clipping — the container exactly fits the visible area
            */}
            <div
              style={{
                width: `${Math.round(794 * zoomScale)}px`,
                height: `${Math.round(1123 * zoomScale)}px`,
                margin: '24px auto',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div
                className="shadow-2xl rounded-sm overflow-hidden bg-white"
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transition: 'transform 0.15s ease',
                }}
              >
                <iframe
                  id="iframe-document-preview"
                  ref={iframeRef}
                  title="Live Document Template Preview"
                  srcDoc={previewHtml}
                  className="border-0 bg-white block"
                  style={{ width: '794px', minHeight: '1123px' }}
                  sandbox="allow-same-origin allow-scripts allow-modals"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col p-4">
          <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl mb-3 shadow-lg">
            <span className="text-sm font-bold text-slate-800">
              Fullscreen Template Preview — {documentType.replace('_', ' ').toUpperCase()}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (fullscreenIframeRef.current?.contentWindow) {
                    fullscreenIframeRef.current.contentWindow.print();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-smartskale-indigo font-bold text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Close Fullscreen
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <iframe
              ref={fullscreenIframeRef}
              srcDoc={previewHtml}
              className="w-[794px] min-h-[1123px] bg-white shadow-2xl rounded-sm border-0"
              sandbox="allow-same-origin allow-scripts allow-modals"
            />
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        document={generatedDoc}
        defaultEmail={formData.email || ''}
        defaultName={formData.name || ''}
      />
    </div>
  );
};

export default DocumentGenerator;
