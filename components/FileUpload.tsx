'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Upload, CheckCircle2, XCircle, Loader2, Trash2,
  FileText, ShieldCheck, Eye, Plus, X
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  documentId: number;
  itemName: string;
  requiredFormat: string;
  kebutuhan_file: number;
  uploaded_count?: number;
  status?: string;
  existingFile?: { url: string; name: string; format: string; };
  file_urls?: string[];
  onComplete: () => void;
}

export default function FileUpload({
  documentId, itemName, requiredFormat,
  kebutuhan_file = 1, uploaded_count = 0,
  status, existingFile, file_urls = [], onComplete
}: Props) {
  const [uploading, setUploading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [dragActive, setDragActive]   = useState(false);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const strictReq = requiredFormat.split(' ')[0].toUpperCase();

  function computeStatus(count: number): string {
    if (count <= 0) return 'missing';
    if (count >= kebutuhan_file) return 'done';
    return 'partial';
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const ext = file.name.split('.').pop()?.toUpperCase() || '';
    let isValid = false;
    if (strictReq === 'PDF' && ext === 'PDF') isValid = true;
    else if ((strictReq === 'JPG' || strictReq === 'JPEG') && (ext === 'JPG' || ext === 'JPEG')) isValid = true;
    else if (strictReq === 'MP4' && ext === 'MP4') isValid = true;
    else if (strictReq === 'MPEG' && (ext === 'MPEG' || ext === 'MPG' || ext === 'MP4')) isValid = true;
    else if (strictReq === ext) isValid = true;

    if (!isValid) {
      setError(`Format salah. Wajib format ${strictReq}.`);
      setUploading(false);
      return;
    }

    try {
      const fileName = `${documentId}_${Date.now()}.${ext.toLowerCase()}`;
      const filePath = `audits/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audit-files')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audit-files')
        .getPublicUrl(filePath);

      const newCount  = uploaded_count + 1;
      const newStatus = computeStatus(newCount);
      const newUrls   = [...file_urls, publicUrl];

      const { error: dbError } = await supabase
        .from('audit_documents')
        .update({
          file_url:       publicUrl,
          file_urls:      newUrls,
          is_uploaded:    true,
          uploaded_count: newCount,
          status:         newStatus,
          updated_at:     new Date().toISOString(),
        })
        .eq('id', documentId);
      if (dbError) throw dbError;
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah dokumen.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Hapus satu file ────────────────────────────────────────────────────────
  const handleDeleteOneFile = async (urlToDelete: string) => {
    if (!confirm('Hapus file ini?')) return;
    setUploading(true);
    try {
      // Hapus dari storage
      const path = urlToDelete.split('/storage/v1/object/public/')[1];
      if (path) {
        const bucket   = path.split('/')[0];
        const filePath = path.split('/').slice(1).join('/');
        await supabase.storage.from(bucket).remove([filePath]);
      }

      const newUrls   = file_urls.filter(u => u !== urlToDelete);
      const newCount  = newUrls.length;
      const newStatus = computeStatus(newCount);

      const { error: dbError } = await supabase
        .from('audit_documents')
        .update({
          file_url:       newUrls[newUrls.length - 1] ?? null,
          file_urls:      newUrls,
          is_uploaded:    newCount > 0,
          uploaded_count: newCount,
          status:         newStatus,
        })
        .eq('id', documentId);
      if (dbError) throw dbError;
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Hapus semua file ───────────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    if (!confirm('Hapus semua file untuk item ini?')) return;
    setUploading(true);
    try {
      // Hapus semua dari storage
      for (const url of file_urls) {
        const path = url.split('/storage/v1/object/public/')[1];
        if (path) {
          const bucket   = path.split('/')[0];
          const filePath = path.split('/').slice(1).join('/');
          await supabase.storage.from(bucket).remove([filePath]);
        }
      }

      const { error: dbError } = await supabase
        .from('audit_documents')
        .update({
          file_url:       null,
          file_urls:      [],
          is_uploaded:    false,
          uploaded_count: 0,
          status:         'missing',
        })
        .eq('id', documentId);
      if (dbError) throw dbError;
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
  };

  const isFull = uploaded_count >= kebutuhan_file;

  return (
    <div className="bg-white rounded-[2.5rem] border border-[#E9ECEF] p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">

      {/* Preview Overlay */}
      {showPreview && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <span className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Pratinjau</span>
            <button onClick={() => setShowPreview(null)} className="bg-rose-500 text-white p-2 rounded-xl">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 bg-slate-100 overflow-hidden">
            {strictReq === 'PDF' ? (
              <iframe src={showPreview} className="w-full h-full border-none" />
            ) : (strictReq === 'JPG' || strictReq === 'JPEG' || strictReq === 'PNG') ? (
              <div className="w-full h-full flex items-center justify-center p-8">
                <img src={showPreview} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                <FileText size={48} />
                <a href={showPreview} target="_blank" rel="noreferrer" className="text-[#1E3A8A] font-black underline text-sm">Buka di Tab Baru</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0',
          isFull          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
          : uploaded_count > 0 ? 'bg-amber-50 text-amber-600 border-amber-100'
          : 'bg-[#F8F9FB] text-slate-300 border-[#E9ECEF]'
        )}>
          <FileText size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-black text-[#1A1C1E] leading-tight truncate">{itemName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={clsx(
              'text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider',
              isFull          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : uploaded_count > 0 ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-red-600 bg-red-50 border-red-200'
            )}>
              {isFull ? 'Lengkap' : uploaded_count > 0 ? 'Belum Lengkap' : 'Kosong'}
            </span>
            <span className="text-[10px] font-black text-slate-400">{uploaded_count}/{kebutuhan_file} file</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-500',
          isFull ? 'bg-emerald-500' : uploaded_count > 0 ? 'bg-amber-400' : 'bg-slate-200'
        )} style={{ width: kebutuhan_file > 0 ? `${Math.min(100, Math.round((uploaded_count / kebutuhan_file) * 100))}%` : '0%' }} />
      </div>

      {/* Daftar file */}
      {file_urls.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">File Terupload</p>
          {file_urls.map((url, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-[#F8F9FB] rounded-xl border border-[#E9ECEF]">
              <div className="w-7 h-7 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={14} className="text-emerald-600" />
              </div>
              <span className="text-[10px] font-black text-slate-500 flex-1 truncate">File {i + 1} · {strictReq}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => setShowPreview(url)}
                  className="w-6 h-6 rounded-lg text-slate-400 hover:text-[#1E3A8A] hover:bg-blue-50 flex items-center justify-center transition-all">
                  <Eye size={12} />
                </button>
                <button onClick={() => handleDeleteOneFile(url)} disabled={uploading}
                  className="w-6 h-6 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all disabled:opacity-40">
                  {uploading ? <Loader2 size={11} className="animate-spin" /> : <X size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {!isFull && (
        <div
          className={clsx(
            'cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center',
            dragActive ? 'border-[#1E3A8A] bg-blue-50' : 'border-[#E9ECEF] hover:border-[#1E3A8A]/30 hover:bg-[#F8F9FB]',
            error ? 'border-rose-300 bg-rose-50' : ''
          )}
          onDragEnter={handleDrag} onDragLeave={handleDrag}
          onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input type="file" className="hidden" ref={fileInputRef}
            onChange={e => e.target.files && handleUpload(e.target.files[0])} disabled={uploading} />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-[#1E3A8A]" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1E3A8A]">Mengunggah...</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 text-slate-300 border border-[#E9ECEF] shadow-sm">
                <Plus size={22} />
              </div>
              <p className="text-sm font-black text-[#1A1C1E]">
                {uploaded_count > 0 ? `Tambah File (${kebutuhan_file - uploaded_count} lagi)` : 'Unggah Dokumen'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                Format <span className="text-[#1E3A8A]">{strictReq}</span>
              </p>
            </>
          )}

          {error && (
            <div className="mt-4 p-3 bg-rose-600 text-white text-[10px] font-black rounded-xl flex items-center gap-2">
              <XCircle size={14} /> {error}
            </div>
          )}
        </div>
      )}

      {/* Hapus semua */}
      {file_urls.length > 0 && (
        <button onClick={handleDeleteAll} disabled={uploading}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E9ECEF] text-[10px] font-black text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all disabled:opacity-50">
          <Trash2 size={13} /> Hapus Semua File
        </button>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-[#F1F3F5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-slate-300" />
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Enkripsi AES-256</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-500">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest">Server SIDOKU Aktif</span>
        </div>
      </div>
    </div>
  );
}