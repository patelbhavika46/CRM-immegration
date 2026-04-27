import { useState } from 'react';
import { useApplicantDocuments, useUploadApplicantDocument, useDeleteApplicantDocument } from '../../../hooks/useApplicants';
import { applicantsApi } from '../../../api/applicants.api';
import { useAuthStore } from '../../../store/authStore';
import { ClientDocument } from '../../../types/client.types';

const DOC_TYPES = [
  'Passport', 'Birth Certificate', 'Marriage Certificate', 'Work Permit',
  'Study Permit', 'PR Card', 'Medical Exam', 'Police Clearance',
  'Employment Letter', 'Bank Statement', 'Application Form', 'Other',
];

function FileIcon({ mimeType }: { mimeType: string | null }) {
  const isPdf = mimeType?.includes('pdf');
  const isImg = mimeType?.startsWith('image/');
  const isDoc = mimeType?.includes('word') || mimeType?.includes('document');
  const cls = 'w-8 h-8 flex items-center justify-center rounded text-xs font-bold';
  if (isPdf) return <div className={`${cls} bg-red-100 text-red-600`}>PDF</div>;
  if (isImg) return <div className={`${cls} bg-blue-100 text-blue-600`}>IMG</div>;
  if (isDoc) return <div className={`${cls} bg-indigo-100 text-indigo-600`}>DOC</div>;
  return <div className={`${cls} bg-slate-100 text-slate-500`}>FILE</div>;
}

function UploadModal({ applicantId, onClose }: { applicantId: number; onClose: () => void }) {
  const [file, setFile]       = useState<File | null>(null);
  const [docType, setDocType] = useState('');
  const [error, setError]     = useState('');
  const upload = useUploadApplicantDocument(applicantId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please select a file.'); return; }
    const fd = new FormData();
    fd.append('file',              file);
    fd.append('documentable_type', 'applicant');
    fd.append('documentable_id',   String(applicantId));
    if (docType) fd.append('document_type', docType);
    try {
      await upload.mutateAsync(fd);
      onClose();
    } catch {
      setError('Upload failed. Please try again.');
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Upload Document</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">File <span className="text-red-500">*</span></label>
            <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
            {file && <p className="mt-1 text-xs text-slate-400">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className={inputCls}>
              <option value="">— Select type —</option>
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={upload.isPending}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {upload.isPending ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DocumentRow({ doc, applicantId, onDelete }: { doc: ClientDocument; applicantId: number; onDelete: (id: number) => void }) {
  const [downloading, setDownloading] = useState(false);
  const { can } = useAuthStore();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await applicantsApi.downloadDocument(doc.id);
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement('a');
      a.href = url; a.download = doc.original_name ?? doc.name; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
      <FileIcon mimeType={doc.mime_type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{doc.original_name ?? doc.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {doc.document_type && <span className="text-indigo-600 mr-2">{doc.document_type}</span>}
          {doc.file_size_formatted}
          {doc.uploaded_by && ` · ${doc.uploaded_by.full_name}`}
          {' · '}
          {new Date(doc.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={handleDownload} disabled={downloading}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors" title="Download">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        {can('applicants.edit') && (
          <button onClick={() => { if (window.confirm('Delete this document? This cannot be undone.')) onDelete(doc.id); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

interface Props { applicantId: number }

export default function DocumentsTab({ applicantId }: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { can } = useAuthStore();
  const { data: docs, isLoading } = useApplicantDocuments(applicantId);
  const deleteDoc = useDeleteApplicantDocument(applicantId);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{docs ? `${docs.length} documents` : '…'}</p>
        {can('applicants.edit') && (
          <button onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Document
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !docs?.length ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-400 text-sm">No documents uploaded yet.</p>
          {can('applicants.edit') && (
            <button onClick={() => setUploadOpen(true)} className="mt-2 text-sm text-indigo-600 hover:underline">
              Upload the first document →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc: ClientDocument) => (
            <DocumentRow key={doc.id} doc={doc} applicantId={applicantId} onDelete={id => deleteDoc.mutate(id)} />
          ))}
        </div>
      )}

      {uploadOpen && <UploadModal applicantId={applicantId} onClose={() => setUploadOpen(false)} />}
    </div>
  );
}
