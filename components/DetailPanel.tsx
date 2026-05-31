'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MessageSquare, Calendar, Send, Trash2, Loader2,
  Clock, AlertTriangle, CheckCircle2, Pencil, X,
  CalendarDays, Bell
} from 'lucide-react';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuditDocument {
  id: number;
  unit: string;
  item_code: string;
  nama_eviden: string;
  category_name: string;
  tahun?: string;
  status: string;
  kebutuhan_file: number;
  is_uploaded: boolean;
  deadline?: string;
  deadline_label?: string;
}

interface Catatan {
  id: number;
  document_id: number;
  penulis: string;
  isi: string;
  created_at: string;
}

interface Props {
  item: AuditDocument | null;
  onClose: () => void;
  onUpdate: () => void;
  unitLabel: string;
  selectedCatCode: string;
  currentGroupName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatusInfo(status: string) {
  if (status === 'done')    return { label: 'Lengkap',       color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (status === 'partial') return { label: 'Belum Lengkap', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return                           { label: 'Kosong',        color: 'text-red-600 bg-red-50 border-red-200' };
}

function getDeadlineInfo(deadline?: string) {
  if (!deadline) return null;
  const now   = new Date();
  const due   = new Date(deadline);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return { label: `Lewat ${Math.abs(diffDays)} hari`,   color: 'text-red-700 bg-red-50 border-red-200',     icon: 'red',   urgent: true  };
  if (diffDays <= 3) return { label: `${diffDays} hari lagi`,              color: 'text-red-600 bg-red-50 border-red-200',     icon: 'red',   urgent: true  };
  if (diffDays <= 7) return { label: `${diffDays} hari lagi`,              color: 'text-amber-700 bg-amber-50 border-amber-200', icon: 'amber', urgent: false };
  return               { label: `${diffDays} hari lagi`,                   color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: 'green', urgent: false };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDeadlineInput(iso?: string) {
  if (!iso) return '';
  return iso.slice(0, 10); // YYYY-MM-DD
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DetailPanel({ item, onClose, onUpdate, unitLabel, selectedCatCode, currentGroupName }: Props) {
  const [tab, setTab] = useState<'detail' | 'catatan'>('detail');

  // catatan
  const [catatan, setCatatan]       = useState<Catatan[]>([]);
  const [loadingCat, setLoadingCat] = useState(false);
  const [newCatatan, setNewCatatan] = useState('');
  const [penulis, setPenulis]       = useState('Operator');
  const [sendingCat, setSendingCat] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // deadline
  const [editDeadline, setEditDeadline]         = useState(false);
  const [deadlineVal, setDeadlineVal]           = useState('');
  const [deadlineLabelVal, setDeadlineLabelVal] = useState('Normal');
  const [savingDeadline, setSavingDeadline]     = useState(false);
  const [deadlineMsg, setDeadlineMsg]           = useState('');

  // deskripsi
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue]     = useState('');
  const [savingDesc, setSavingDesc]   = useState(false);

  // Load catatan saat item berubah
  useEffect(() => {
    if (!item) return;
    setTab('detail');
    setEditDeadline(false);
    setEditingDesc(false);
    setDescValue(item.nama_eviden);
    setDeadlineVal(formatDeadlineInput(item.deadline));
    setDeadlineLabelVal(item.deadline_label || 'Normal');
    fetchCatatan(item.id);
  }, [item?.id]);

  async function fetchCatatan(documentId: number) {
    setLoadingCat(true);
    try {
      const { data } = await supabase
        .from('item_catatan')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });
      setCatatan(data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingCat(false); }
  }

  async function handleSendCatatan() {
    if (!item || !newCatatan.trim()) return;
    setSendingCat(true);
    try {
      const { error } = await supabase.from('item_catatan').insert([{
        document_id: item.id,
        penulis: penulis || 'Operator',
        isi: newCatatan.trim(),
      }]);
      if (error) throw error;
      setNewCatatan('');
      fetchCatatan(item.id);
    } catch (err: any) { console.error(err); }
    finally { setSendingCat(false); }
  }

  async function handleDeleteCatatan(id: number) {
    setDeletingId(id);
    try {
      await supabase.from('item_catatan').delete().eq('id', id);
      setCatatan(p => p.filter(c => c.id !== id));
    } catch (err: any) { console.error(err); }
    finally { setDeletingId(null); }
  }

  async function handleSaveDeadline() {
    if (!item) return;
    setSavingDeadline(true);
    try {
      const { error } = await supabase
        .from('audit_documents')
        .update({ deadline: deadlineVal || null, deadline_label: deadlineLabelVal })
        .eq('id', item.id);
      if (error) throw error;
      setDeadlineMsg('✓ Deadline disimpan');
      setEditDeadline(false);
      onUpdate();
      setTimeout(() => setDeadlineMsg(''), 3000);
    } catch (err: any) { setDeadlineMsg('Gagal: ' + err.message); }
    finally { setSavingDeadline(false); }
  }

  async function handleSaveDesc() {
    if (!item || !descValue.trim()) return;
    setSavingDesc(true);
    try {
      const { error } = await supabase
        .from('audit_documents')
        .update({ nama_eviden: descValue.trim() })
        .eq('id', item.id);
      if (error) throw error;
      setEditingDesc(false);
      onUpdate();
    } catch (err: any) { console.error(err); }
    finally { setSavingDesc(false); }
  }

  async function handleRemoveDeadline() {
    if (!item) return;
    await supabase.from('audit_documents').update({ deadline: null, deadline_label: null }).eq('id', item.id);
    setDeadlineVal('');
    setDeadlineLabelVal('Normal');
    setEditDeadline(false);
    onUpdate();
  }

  if (!item) {
    // Default state — tidak ada item dipilih
    return (
      <div className="bg-white rounded-2xl border border-[#E9ECEF] shadow-sm overflow-hidden flex-1">
        <div className="px-4 py-3.5 border-b border-[#E9ECEF]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Folder</p>
        </div>
        <div className="p-4 space-y-4">
          <InfoRow label="Nama Folder" value={`${selectedCatCode} ${currentGroupName}`} />
          <InfoRow label="Unit" value={unitLabel} />
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Deskripsi</p>
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
              Dokumen yang berkaitan dengan {currentGroupName?.toLowerCase()} dalam kegiatan administrasi.
            </p>
          </div>
          <div className="pt-2 border-t border-[#F1F3F5]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Keterangan</p>
            <div className="space-y-2">
              {[
                { label: 'Lengkap',       desc: '100% file terpenuhi',    color: 'bg-emerald-500' },
                { label: 'Belum Lengkap', desc: '1–99% file terpenuhi',   color: 'bg-amber-400' },
                { label: 'Kosong',        desc: 'Belum ada file diupload', color: 'bg-red-400' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', s.color)} />
                  <div>
                    <p className="text-[10px] font-black text-slate-600">{s.label}</p>
                    <p className="text-[9px] text-slate-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const st = getStatusInfo(item.status);
  const dl = getDeadlineInfo(item.deadline);

  return (
    <div className="bg-white rounded-2xl border border-[#E9ECEF] shadow-sm overflow-hidden flex flex-col flex-1">

      {/* Header + tab */}
      <div className="border-b border-[#E9ECEF]">
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Folder</p>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
            <X size={14} />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex border-t border-[#F1F3F5]">
          {[
            { key: 'detail'  as const, label: 'Info' },
            { key: 'catatan' as const, label: `Catatan${catatan.length > 0 ? ` (${catatan.length})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={clsx('flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors',
                tab === t.key ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A] bg-blue-50/40' : 'text-slate-400 hover:text-slate-600'
              )}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Tab: Detail ───────────────────────────────────────────────────── */}
        {tab === 'detail' && (
          <div className="p-4 space-y-4">
            <InfoRow label="Nama Folder" value={item.item_code} />
            <InfoRow label="Unit" value={item.unit === 'UP' ? 'Unit Pengolah (UP)' : 'Unit Kearsipan (UK)'} />
            {item.tahun && <InfoRow label="Tahun" value={item.tahun} />}

            {/* Deskripsi editable */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deskripsi</p>
                {!editingDesc && (
                  <button onClick={() => setEditingDesc(true)} className="text-[9px] font-black text-[#1E3A8A] flex items-center gap-1">
                    <Pencil size={10} /> Edit
                  </button>
                )}
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea autoFocus value={descValue} onChange={e => setDescValue(e.target.value)} rows={3}
                    className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-3 py-2 text-[11px] font-medium focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingDesc(false)} className="flex-1 py-1.5 rounded-lg border border-[#E9ECEF] text-[10px] font-black text-slate-400 hover:bg-slate-50">Batal</button>
                    <button onClick={handleSaveDesc} disabled={savingDesc}
                      className="flex-1 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-[10px] font-black flex items-center justify-center gap-1 disabled:opacity-50">
                      {savingDesc ? <Loader2 size={11} className="animate-spin" /> : null} Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed">{item.nama_eviden}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
              <span className={clsx('text-[9px] font-black px-2.5 py-1 rounded-lg border', st.color)}>{st.label}</span>
            </div>

            {/* File progress */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">File Terupload</p>
                <p className="text-[9px] font-black text-[#1E3A8A]">{item.is_uploaded ? 1 : 0}/{item.kebutuhan_file} file</p>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={clsx('h-full rounded-full transition-all duration-500',
                  item.status === 'done' ? 'bg-emerald-500' : item.status === 'partial' ? 'bg-amber-400' : 'bg-slate-200'
                )} style={{ width: item.is_uploaded ? `${Math.min(100, Math.round(100 / item.kebutuhan_file))}%` : '0%' }} />
              </div>
            </div>

            {/* ── DEADLINE ──────────────────────────────────────────────────── */}
            <div className="border-t border-[#F1F3F5] pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarDays size={11} /> Deadline
                </p>
                <button onClick={() => setEditDeadline(v => !v)}
                  className="text-[9px] font-black text-[#1E3A8A] flex items-center gap-1">
                  <Pencil size={10} /> {item.deadline ? 'Ubah' : 'Set Deadline'}
                </button>
              </div>

              {/* Tampilkan deadline aktif */}
              {item.deadline && !editDeadline && dl && (
                <div className={clsx('flex items-center gap-2.5 px-3 py-2.5 rounded-xl border', dl.color)}>
                  <div className="flex-shrink-0">
                    {dl.urgent ? <AlertTriangle size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black">
                      {new Date(item.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[9px] font-bold opacity-80">{dl.label} · {item.deadline_label}</p>
                  </div>
                  <button onClick={handleRemoveDeadline} className="opacity-60 hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Tidak ada deadline */}
              {!item.deadline && !editDeadline && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-300">
                  <Calendar size={13} />
                  <p className="text-[10px] font-bold">Belum ada deadline</p>
                </div>
              )}

              {/* Form edit deadline */}
              {editDeadline && (
                <div className="space-y-2.5 mt-1">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Deadline</label>
                    <input type="date" value={deadlineVal} onChange={e => setDeadlineVal(e.target.value)}
                      className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Prioritas</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Opsional', 'Normal', 'Mendesak'].map(lbl => (
                        <button key={lbl} onClick={() => setDeadlineLabelVal(lbl)}
                          className={clsx('py-1.5 rounded-lg text-[9px] font-black border transition-all',
                            deadlineLabelVal === lbl
                              ? lbl === 'Mendesak' ? 'bg-red-500 text-white border-red-500'
                                : lbl === 'Normal' ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                                : 'bg-slate-500 text-white border-slate-500'
                              : 'bg-white text-slate-400 border-[#E9ECEF] hover:bg-slate-50'
                          )}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  {deadlineMsg && <p className={clsx('text-[10px] font-black', deadlineMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500')}>{deadlineMsg}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setEditDeadline(false)} className="flex-1 py-1.5 rounded-lg border border-[#E9ECEF] text-[10px] font-black text-slate-400 hover:bg-slate-50">Batal</button>
                    <button onClick={handleSaveDeadline} disabled={savingDeadline || !deadlineVal}
                      className="flex-1 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-[10px] font-black flex items-center justify-center gap-1 disabled:opacity-50">
                      {savingDeadline ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Catatan ──────────────────────────────────────────────────── */}
        {tab === 'catatan' && (
          <div className="flex flex-col h-full">
            {/* List catatan */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '280px' }}>
              {loadingCat ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-slate-300" />
                </div>
              ) : catatan.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-30">
                  <MessageSquare size={28} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Belum ada catatan</p>
                </div>
              ) : (
                catatan.map(c => (
                  <div key={c.id} className="group">
                    <div className="bg-[#F8F9FB] rounded-xl border border-[#E9ECEF] p-3">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#1E3A8A] flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-black text-white">{c.penulis.charAt(0).toUpperCase()}</span>
                          </div>
                          <p className="text-[10px] font-black text-[#1A1C1E]">{c.penulis}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[9px] text-slate-400">{formatDate(c.created_at)}</p>
                          <button
                            onClick={() => handleDeleteCatatan(c.id)}
                            disabled={deletingId === c.id}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"
                          >
                            {deletingId === c.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{c.isi}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input catatan baru */}
            <div className="border-t border-[#F1F3F5] p-3 space-y-2">
              <input
                type="text"
                value={penulis}
                onChange={e => setPenulis(e.target.value)}
                placeholder="Nama penulis"
                className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-lg px-3 py-1.5 text-[10px] font-bold focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none"
              />
              <div className="flex gap-2">
                <textarea
                  value={newCatatan}
                  onChange={e => setNewCatatan(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendCatatan(); } }}
                  placeholder="Tulis catatan... (Enter untuk kirim)"
                  rows={2}
                  className="flex-1 bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-3 py-2 text-[11px] font-medium focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none resize-none"
                />
                <button
                  onClick={handleSendCatatan}
                  disabled={sendingCat || !newCatatan.trim()}
                  className="w-9 h-full flex items-center justify-center rounded-xl bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 transition-all disabled:opacity-40 flex-shrink-0"
                >
                  {sendingCat ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-[11px] font-bold text-[#1A1C1E] leading-relaxed">{value}</p>
    </div>
  );
}