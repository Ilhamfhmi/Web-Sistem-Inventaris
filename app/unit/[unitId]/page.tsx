'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  Eye, 
  Trash2, 
  FileText, 
  Loader2, 
  RefreshCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  ChevronRight,
  Sparkles,
  Info,
  ImageIcon,
  FileSpreadsheet,
  Clock,
  X
} from 'lucide-react';
import MemoryMap, { type AuditDocument } from '@/components/MemoryMap';
import FileUpload from '@/components/FileUpload';
import { clsx } from 'clsx';

export default function UnitPage() {
  const { unitId } = useParams();
  const [items, setItems] = useState<AuditDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AuditDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotification, setShowNotification] = useState<string | null>(null);
  
  // State untuk Modal Tambah Dokumen
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ nama: '', format: 'PDF' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: itemsData } = await supabase
        .from('audit_documents')
        .select('*')
        .eq('unit', unitId)
        .order('id', { ascending: true });
      
      const mappedData = itemsData || [];
      setItems(mappedData);
      
      // Auto select first item if none selected
      if (!selectedItem && mappedData.length > 0) {
        setSelectedItem(mappedData[0]);
      } else if (selectedItem) {
        const updated = mappedData.find(i => i.id === selectedItem.id);
        if (updated) setSelectedItem(updated);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unitId]);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.nama) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('audit_documents')
        .insert([{
          unit: unitId,
          nama_eviden: newDoc.nama,
          format_req: newDoc.format,
          is_uploaded: false,
          status: 'missing'
        }]);

      if (error) throw error;
      
      handleQuickAction('Dokumen baru berhasil ditambahkan');
      setShowAddModal(false);
      setNewDoc({ nama: '', format: 'PDF' });
      fetchData();
    } catch (err: any) {
      handleQuickAction('Gagal: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const uploaded = items.filter(i => i.is_uploaded).length;
    const missing = total - uploaded;
    return { 
      total, 
      uploaded, 
      missing,
      percent: total > 0 ? Math.round((uploaded / total) * 100) : 0 
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.nama_eviden.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.format_req.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleQuickAction = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#1E3A8A]/20" size={64} />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in relative pb-20">
      {/* Notifikasi Toast */}
      {showNotification && (
        <div className="fixed top-24 right-10 bg-[#1E3A8A] text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-slide-up">
           <Info size={20} />
           <span className="text-sm font-black uppercase tracking-widest">{showNotification}</span>
        </div>
      )}

      {/* Modal Tambah Dokumen */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#1A1C1E]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-[#1E3A8A]">Tambah Item Dokumen</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddDocument} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Dokumen Eviden</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newDoc.nama}
                  onChange={(e) => setNewDoc({...newDoc, nama: e.target.value})}
                  placeholder="Contoh: Surat Perintah Tugas..."
                  className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Syarat Format Berkas</label>
                <div className="grid grid-cols-3 gap-3">
                  {['PDF', 'JPG', 'EXCEL', 'MP4'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setNewDoc({...newDoc, format: fmt})}
                      className={clsx(
                        "py-3 rounded-xl text-[11px] font-black border transition-all",
                        newDoc.format === fmt ? "bg-[#1E3A8A] text-white border-[#1E3A8A]" : "bg-white text-slate-400 border-[#E9ECEF] hover:bg-slate-50"
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSaving || !newDoc.nama}
                className="w-full bg-[#1E3A8A] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />} Simpan ke Inventaris
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-[#1E3A8A] tracking-tight">
            Dasbor {unitId === 'UP' ? 'Unit Pengolah' : 'Unit Kearsipan'}
          </h1>
          <p className="text-lg font-medium text-slate-400 mt-2">Kelola dan pantau inventaris dokumen eviden Anda.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2.5 bg-[#1E3A8A] text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#1E3A8A]/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} /> Tambah Item Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Statistik Block */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-[#E9ECEF] p-10 shadow-sm">
          <div className="flex justify-between items-start mb-10">
            <h3 className="text-2xl font-black text-[#1A1C1E]">Statistik Dokumen</h3>
            <div className="flex gap-3">
              <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-black rounded-xl uppercase tracking-widest">Tersedia: {stats.uploaded}</span>
              <span className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[11px] font-black rounded-xl uppercase tracking-widest">Kurang: {stats.missing}</span>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Progres Kesiapan Audit</span>
                <span className="text-xl font-black text-[#1E3A8A]">{stats.percent}%</span>
              </div>
              <div className="h-4 bg-[#F8F9FB] rounded-full overflow-hidden p-0.5 border border-[#E9ECEF]">
                <div className="h-full bg-[#1E3A8A] rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${stats.percent}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-2">
              <StatsTile label="TOTAL DOKUMEN" value={stats.total} />
              <StatsTile label="SUDAH DIUNGGAH" value={stats.uploaded} color="emerald" />
              <StatsTile label="BELUM TERSEDIA" value={stats.missing} color="rose" />
            </div>
          </div>
        </div>

        {/* Informasi Status Operasional */}
        <div className="bg-[#1E3A8A] rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-[#1E3A8A]/30">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 mb-8">
              <CheckCircle2 size={28} className="text-white" />
            </div>
            <div>
              <h4 className="text-2xl font-black mb-4 tracking-tight">Status Operasional</h4>
              <p className="text-sm text-white/60 leading-relaxed font-medium">
                Gunakan tombol "Tambah Item Baru" untuk memasukkan daftar dokumen yang diwajibkan oleh tim audit.
              </p>
            </div>
            <button 
              onClick={fetchData}
              className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-emerald-400 mt-10 hover:translate-x-1 transition-all"
            >
               <RefreshCcw size={14} /> 
               Sinkronisasi Database
            </button>
          </div>
          <div className="absolute -bottom-10 -right-10 text-white/[0.03] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
            <RefreshCcw size={320} strokeWidth={0.5} />
          </div>
        </div>
      </div>

      {/* Daftar Inventaris (Tabel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-[#E9ECEF] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-[#E9ECEF] flex flex-col sm:flex-row items-center justify-between gap-6">
              <h3 className="text-2xl font-black text-[#1A1C1E]">Inventaris Eviden</h3>
              
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari nama atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F8F9FB] rounded-xl py-3 pl-12 pr-4 text-xs font-bold border-none focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[200px]">
              {filteredItems.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-[#E9ECEF]">
                      <th className="px-8 py-5">NAMA DOKUMEN</th>
                      <th className="px-8 py-5">SYARAT FORMAT</th>
                      <th className="px-8 py-5">STATUS</th>
                      <th className="px-8 py-5 text-right">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF]">
                    {filteredItems.map((item) => (
                      <tr 
                        key={item.id} 
                        className={clsx(
                          "hover:bg-[#F8F9FB] transition-colors cursor-pointer group",
                          selectedItem?.id === item.id && "bg-[#F0F4FF]"
                        )}
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={clsx(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                              item.format_req === 'PDF' && "bg-rose-50 text-rose-500",
                              item.format_req === 'JPG' && "bg-blue-50 text-blue-500",
                              item.format_req === 'EXCEL' && "bg-emerald-50 text-emerald-600"
                            )}>
                              {item.format_req === 'PDF' ? <FileText size={22} /> : 
                               item.format_req === 'JPG' ? <ImageIcon size={22} /> : 
                               <FileSpreadsheet size={22} />}
                            </div>
                            <span className="text-sm font-black text-[#1A1C1E]">{item.nama_eviden}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-[#F8F9FB] text-slate-400 text-[10px] font-black rounded-lg uppercase border border-[#E9ECEF]">{item.format_req}</span>
                        </td>
                        <td className="px-8 py-6">
                          <StatusPill status={item.status} isUploaded={item.is_uploaded} />
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-5 text-slate-200 group-hover:text-slate-400 transition-colors">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }} title="Pratinjau Berkas">
                              <Eye size={22} className="hover:text-[#1E3A8A] transition-colors" />
                            </button>
                            <button onClick={async (e) => {
                              e.stopPropagation();
                              if(confirm('Hapus item daftar ini?')) {
                                await supabase.from('audit_documents').delete().eq('id', item.id);
                                fetchData();
                              }
                            }} title="Hapus Item">
                              <Trash2 size={22} className="hover:text-rose-500 transition-colors" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-20 text-center flex flex-col items-center gap-6 opacity-30">
                   <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-[#E9ECEF]">
                     <FileText size={48} strokeWidth={1} />
                   </div>
                   <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Inventaris Kosong</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel Samping */}
        <div className="lg:col-span-4 space-y-8">
           {selectedItem ? (
             <FileUpload 
               documentId={selectedItem.id}
               itemName={selectedItem.nama_eviden}
               requiredFormat={selectedItem.format_req}
               status={selectedItem.status}
               existingFile={selectedItem.is_uploaded && selectedItem.file_url ? {
                 url: selectedItem.file_url,
                 name: 'ID: ' + selectedItem.id,
                 format: selectedItem.format_req
               } : undefined}
               onComplete={fetchData}
             />
           ) : (
             <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-[#E9ECEF] p-20 text-center opacity-30 flex flex-col items-center gap-4">
                <FileText size={64} strokeWidth={1} className="text-slate-300" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pilih Item</p>
             </div>
           )}

           <div className="bg-white rounded-[2.5rem] border border-[#E9ECEF] p-10 shadow-sm">
              <h4 className="text-xl font-black text-[#1A1C1E] mb-8">Peta Visual Eviden</h4>
              <MemoryMap 
                items={items} 
                onSelect={(item) => setSelectedItem(item)}
                selectedId={selectedItem?.id}
              />
           </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#1E3A8A]/40 hover:scale-110 active:scale-95 transition-all z-[60]"
      >
        <Plus size={32} strokeWidth={3} />
      </button>
    </div>
  );
}

function StatsTile({ label, value, color = "indigo" }: any) {
  const colors: any = {
    indigo: "bg-[#F8F9FB] text-[#1E3A8A]",
    rose: "bg-rose-50/50 text-rose-600",
    emerald: "bg-emerald-50/50 text-emerald-600"
  };
  return (
    <div className={clsx("p-6 rounded-[2rem] border border-[#E9ECEF] shadow-sm", colors[color])}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-3">{label}</p>
      <p className="text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function StatusPill({ status, isUploaded }: any) {
  if (!isUploaded) return (
    <div className="flex items-center gap-2.5 text-slate-300">
      <div className="w-2 h-2 bg-slate-200 rounded-full" />
      <span className="text-[11px] font-black uppercase tracking-widest">Belum Ada</span>
    </div>
  );
  if (status === 'revision') return (
    <div className="flex items-center gap-2.5 text-amber-500 font-black">
      <div className="w-2 h-2 bg-amber-500 rounded-full" />
      <span className="text-[11px] font-black uppercase tracking-widest">Diproses</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2.5 text-emerald-500 font-black">
      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
      <span className="text-[11px] font-black uppercase tracking-widest">Tersedia</span>
    </div>
  );
}

function BottomCard({ title, icon, color, children }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600"
  };
  return (
    <div className="bg-white rounded-[2.5rem] border border-[#E9ECEF] p-10 shadow-sm h-full">
       <h4 className="text-xl font-black text-[#1A1C1E] mb-8 flex items-center gap-4">
         <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center border border-opacity-10", colors[color])}>
           {icon}
         </div>
         {title}
       </h4>
       {children}
    </div>
  );
}
