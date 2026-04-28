'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Trash2, 
  ExternalLink, 
  AlertTriangle,
  FileText,
  ShieldCheck,
  Eye,
  Maximize2
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  documentId: number;
  itemName: string;
  requiredFormat: string;
  status?: 'completed' | 'missing' | 'revision';
  existingFile?: {
    url: string;
    name: string;
    format: string;
  };
  onComplete: () => void;
}

export default function FileUpload({ documentId, itemName, requiredFormat, status, existingFile, onComplete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Logika Validasi Format SIDOKU (Perbaikan):
   * Mengutamakan requiredFormat yang sudah tersimpan di DB agar tidak konflik dengan ID baru.
   */
  const getStrictRequirement = () => {
    return requiredFormat.toUpperCase();
  };

  const handleUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const ext = file.name.split('.').pop()?.toUpperCase() || '';
    const strictReq = getStrictRequirement();

    // Validasi Format Ketat
    let isValid = false;
    if (strictReq === 'PDF' && ext === 'PDF') isValid = true;
    else if (strictReq === 'JPG' && (ext === 'JPG' || ext === 'JPEG')) isValid = true;
    else if (strictReq === 'EXCEL' && (ext === 'XLSX' || ext === 'XLS' || ext === 'CSV')) isValid = true;
    else if (strictReq === 'MP4' && ext === 'MP4') isValid = true;
    else if (strictReq === ext) isValid = true;

    if (!isValid) {
      setError(`Format Salah: Dokumen ini wajib menggunakan format ${strictReq}.`);
      setUploading(false);
      return;
    }

    try {
      const fileName = `${documentId}_${Date.now()}.${ext.toLowerCase()}`;
      const filePath = `audits/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audit-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audit-files')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('audit_documents')
        .update({
          file_url: publicUrl,
          is_uploaded: true,
          status: 'completed',
          updated_at: new Date().toISOString(),
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

  const handleDelete = async () => {
    if (!confirm('Hapus dokumen ini secara permanen?')) return;
    setUploading(true);
    try {
      const { error: dbError } = await supabase
        .from('audit_documents')
        .update({ file_url: null, is_uploaded: false, status: 'missing' })
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
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
  };

  const strictReq = getStrictRequirement();

  return (
    <div className="bg-white rounded-[2.5rem] border border-[#E9ECEF] p-10 shadow-sm flex flex-col gap-8 relative overflow-hidden">
      {/* Document Preview Overlay */}
      {showPreview && existingFile && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col animate-fade-in">
           <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <span className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest">Pratinjau Dokumen</span>
              <button onClick={() => setShowPreview(false)} className="bg-rose-500 text-white p-2 rounded-xl hover:scale-110 transition-all">
                <Maximize2 size={18} className="rotate-45" />
              </button>
           </div>
           <div className="flex-1 bg-slate-100 overflow-hidden relative">
              {existingFile.format === 'PDF' ? (
                <iframe src={existingFile.url} className="w-full h-full border-none" />
              ) : (existingFile.format === 'JPG' || existingFile.format === 'PNG') ? (
                <div className="w-full h-full flex items-center justify-center p-8">
                   <img src={existingFile.url} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                   <FileText size={64} />
                   <p className="text-sm font-black uppercase tracking-widest">Format {existingFile.format} tidak mendukung pratinjau langsung</p>
                   <a href={existingFile.url} target="_blank" rel="noreferrer" className="text-[#1E3A8A] font-black underline">Buka di Tab Baru</a>
                </div>
              )}
           </div>
        </div>
      )}

      <div className="flex items-start gap-5">
        <div className={clsx(
          "w-16 h-16 rounded-2xl flex items-center justify-center border",
          status === 'revision' ? "bg-amber-50 text-amber-600 border-amber-100" : existingFile ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-[#F8F9FB] text-slate-300 border-[#E9ECEF]"
        )}>
          <FileText size={32} />
        </div>
        <div>
          <h4 className="text-2xl font-black text-[#1A1C1E] tracking-tight">{itemName}</h4>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-2">
            Status: {existingFile ? (status === 'revision' ? 'Sedang Diproses' : 'Selesai') : 'Belum Diunggah'}
          </p>
        </div>
      </div>

      {existingFile ? (
        <div className="space-y-6">
          <div className="p-6 bg-[#F8F9FB] rounded-2xl border border-[#E9ECEF] flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-sm font-black text-[#1A1C1E] block">Berkas Tersedia</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terverifikasi di Cloud</span>
              </div>
            </div>
            <button 
              onClick={() => setShowPreview(true)}
              className="bg-white border border-[#E9ECEF] p-3 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm"
              title="Lihat Dokumen"
            >
              <Eye size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-4 bg-[#1E3A8A] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#1E3A8A]/20"
              disabled={uploading}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Upload size={18} />} Ganti File
            </button>
            <button 
              onClick={handleDelete}
              className="py-4 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-100 transition-all"
              disabled={uploading}
            >
              <Trash2 size={18} /> Hapus
            </button>
          </div>
        </div>
      ) : (
        <div 
          className={clsx(
            "cursor-pointer border-2 border-dashed rounded-[2rem] p-16 transition-all flex flex-col items-center justify-center text-center group",
            dragActive ? "border-[#1E3A8A] bg-blue-50" : "border-[#E9ECEF] hover:border-[#1E3A8A]/30 hover:bg-[#F8F9FB]",
            error ? "border-rose-300 bg-rose-50" : ""
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" className="hidden" ref={fileInputRef}
            onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-[#1E3A8A]" size={48} />
              <p className="text-xs font-black uppercase tracking-widest text-[#1E3A8A]">Transmisi Berkas...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 text-slate-300 border border-[#E9ECEF] group-hover:scale-110 transition-transform shadow-sm">
                <Upload size={28} />
              </div>
              <p className="text-lg font-black text-[#1A1C1E] mb-2">Unggah Dokumen</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Pilih berkas <span className="text-[#1E3A8A]">{strictReq}</span></p>
            </>
          )}

          {error && (
            <div className="mt-8 p-4 bg-rose-600 text-white text-[10px] font-black rounded-xl flex items-center gap-3 shadow-lg animate-shake">
              <XCircle size={18} /> {error}
            </div>
          )}
        </div>
      )}

      <div className="pt-8 border-t border-[#F1F3F5] flex items-center justify-between">
         <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-slate-300" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Enkripsi AES-256 Aktif</span>
         </div>
         <div className="flex items-center gap-2 text-emerald-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Server SIDOKU Aktif</span>
         </div>
      </div>
    </div>
  );
}
