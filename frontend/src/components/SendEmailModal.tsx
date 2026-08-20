import React, { useState, useEffect } from 'react';
import { documentsApi } from '../api/services';
import { GeneratedDocument } from '../types';
import { useToast } from './Toast';
import {
  X,
  Mail,
  Send,
  User,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  FileCheck2,
  ShieldAlert,
} from 'lucide-react';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GeneratedDocument | null;
  /** Pre-fill recipient details from the employee associated with this document */
  defaultEmail?: string;
  defaultName?: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  offer_letter: 'Internship Offer Letter',
  internship_certificate: 'Internship Completion Certificate',
  nda: 'Non-Disclosure Agreement (NDA)',
  letterhead: 'Official SmartSkale Letter',
};

const DOC_TYPE_ICONS: Record<string, React.ReactNode> = {
  offer_letter: <FileCheck2 className="w-4 h-4 text-indigo-600" />,
  internship_certificate: <GraduationCap className="w-4 h-4 text-emerald-600" />,
  nda: <ShieldAlert className="w-4 h-4 text-purple-600" />,
  letterhead: <FileText className="w-4 h-4 text-slate-600" />,
};

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  defaultEmail = '',
  defaultName = '',
}) => {
  const { showToast } = useToast();

  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [recipientName, setRecipientName] = useState(defaultName);
  const [subject, setSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reset form when modal opens with new document
  useEffect(() => {
    if (isOpen && doc) {
      setRecipientEmail(defaultEmail);
      setRecipientName(defaultName);
      const label = DOC_TYPE_LABELS[doc.document_type] || doc.document_type;
      setSubject(`SmartSkale — Your ${label}`);
      setCustomMessage('');
      setResult(null);
    }
  }, [isOpen, doc, defaultEmail, defaultName]);

  if (!isOpen || !doc) return null;

  const docLabel = DOC_TYPE_LABELS[doc.document_type] || doc.document_type;
  const docIcon = DOC_TYPE_ICONS[doc.document_type] || <FileText className="w-4 h-4" />;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientName) return;

    setSending(true);
    setResult(null);

    try {
      const res = await documentsApi.sendEmail(doc.id, {
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: subject || undefined,
        custom_message: customMessage || undefined,
      });

      setResult(res);
      if (res.success) {
        showToast(`Document emailed to ${recipientEmail}`, 'success', 'Email Sent');
      } else {
        showToast(res.message, 'error', 'Email Failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to send email.';
      setResult({ success: false, message: msg });
      showToast(msg, 'error', 'Email Error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-smartskale-navy text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Send Document via Email</h3>
              <p className="text-xs text-slate-500 mt-0.5">Deliver the PDF to the employee's inbox</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Info Pill */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
              {docIcon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{docLabel}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                {doc.file_name || `Document #${doc.id}`}
                {doc.document_number && ` · Ref: ${doc.document_number}`}
              </p>
            </div>
            <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-indigo-50 text-smartskale-indigo border border-indigo-100">
              PDF
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="px-6 py-5 space-y-4">

          {/* Result Banner */}
          {result && (
            <div
              className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-medium ${
                result.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          {/* Recipient Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Recipient Full Name <span className="text-rose-500">*</span>
              </span>
            </label>
            <input
              id="input-email-recipient-name"
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
            />
          </div>

          {/* Recipient Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Recipient Email <span className="text-rose-500">*</span>
              </span>
            </label>
            <input
              id="input-email-recipient-email"
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. rahul.sharma@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
            />
          </div>

          {/* Email Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Subject
            </label>
            <input
              id="input-email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="SmartSkale — Your Document"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo"
            />
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Personal Message <span className="text-slate-400 font-normal">(optional)</span>
              </span>
            </label>
            <textarea
              id="input-email-custom-message"
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal note to the email body (leave blank for the default SmartSkale message)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-smartskale-indigo/30 focus:border-smartskale-indigo resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px]">
              The PDF will be attached automatically. Requires SMTP settings in <span className="font-mono">.env</span>
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-send-email-submit"
                type="submit"
                disabled={sending || !recipientEmail || !recipientName}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-smartskale-navy hover:bg-indigo-900 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendEmailModal;
