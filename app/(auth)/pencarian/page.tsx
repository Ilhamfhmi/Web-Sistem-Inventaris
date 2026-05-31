'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search, X, Download, Eye, FolderOpen,
  FileText, ImageIcon, Film, FileSpreadsheet,
  ChevronRight, Loader2, Filter
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface DocRow {
  id: number;
  unit: string;
  category_code: string;
  category_name: string;
  item_code: string;
  nama_eviden: string;
  format_req: string;
  kebutuhan_file: number;
  tahun?: string;
  is_uploaded: boolean;
  file_url?: string;
  status: string;
}

function getStatusInfo(status: string) {
  if (status === 'done')    return { label: 'Lengkap',       color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (status === 'partial') return { label: 'Belum Lengkap', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return                           { label: 'Kosong',        color: 'text-red-600 bg-red-50 border-red-200' };
}

function FormatIcon({ fmt }: { fmt: string }) {
  const base = fmt.split(' ')[0];
  if (base === 'PDF')  return <FileText       size={15} className="text-red-400"    />;
  if (base === 'JPEG') return <ImageIcon       size={15} className="text-blue-400"   />;
  if (base === 'MP4' || base === 'MPEG') return <Film size={15} className="text-purple-400" />;
  return                     <FileSpreadsheet size={15} className="text-green-500"  />;
}

function FormatBadge({ fmt }: { fmt: string }) {
  const base = fmt.split(' ')[0];
  const colors: Record<string, string> = {
    PDF:  'bg-red-50 text-red-600 border-red-100',
    JPEG: 'bg-blue-50 text-blue-600 border-blue-100',
    MP4:  'bg-purple-50 text-purple-600 border-purple-100',
    MPEG: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <span className={clsx(
      'text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider',
      colors[base] ?? 'bg-slate-50 text-slate-500 border-slate-100'
    )}>
      {base}
    </span>
  );
}

const ALL_CATEGORIES_UP = [
  { code: '1.1', label: 'Penciptaan Arsip' },
  { code: '1.2', label: 'Penggunaan Arsip' },
  { code: '1.3', label: 'Pemeliharaan Arsip' },
  { code: '1.4', label: 'Penyusutan Arsip' },
  { code: '2.1', label: 'SDM Kearsipan' },
  { code: '2.2', label: 'Sarana & Prasarana' },
];
const ALL_CATEGORIES_UK = [
  { code: '1.1', label: 'Pengendalian Naskah Dinas' },
  { code: '1.2', label: 'Penggunaan Arsip' },
  { code: '1.3', label: 'Pemeliharaan Arsip' },
  { code: '1.4', label: 'Penyusutan Arsip' },
  { code: '2.1', label: 'SDM Kearsipan' },
  { code: '2.2', label: 'Sarana & Prasarana' },
];

export default function PencarianPage() {
  const [query, setQuery]           = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [filterFmt, setFilterFmt]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [results, setResults]       = useState<DocRow[]>([]);
  const [loading, setLoading]       = useState(false);
  const [searched, setSearched]     = useState(false);

  const categories = filterUnit === 'UP' ? ALL_CATEGORIES_UP
    : filterUnit === 'UK' ? ALL_CATEGORIES_UK
    : [...ALL_CATEGORIES_UP, ...ALL_CATEGORIES_UK.filter(c => !ALL_CATEGORIES_UP.find(u => u.code === c.code))];

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    try {
      let q = supabase
        .from('audit_documents')
        .select('*')
        .order('item_code', { ascending: true });

      if (filterUnit)   q = q.eq('unit', filterUnit);
      if (filterCat)    q = q.eq('category_code', filterCat);
      if (filterStatus) q = q.eq('status', filterStatus);
      if (filterFmt)    q = q.ilike('format_req', `${filterFmt}%`);

      const { data, error } = await q;
      if (error) throw error;

      // Filter kata kunci di client (lebih fleksibel)
      let filtered = data || [];
      if (query.trim()) {
        const q2 = query.toLowerCase();
        filtered = filtered.filter(d =>
          d.nama_eviden?.toLowerCase().includes(q2) ||
          d.item_code?.toLowerCase().includes(q2) ||
          d.category_name?.toLowerCase().includes(q2)
        );
      }
      setResults(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setQuery('');
    setFilterUnit('');
    setFilterCat('');
    setFilterFmt('');
    setFilterStatus('');
    setResults([]);
    setSearched(false);
  }

  function handleExport() {
    if (!results.length) return;
    const header = ['No', 'Unit', 'Kategori', 'Kode', 'Nama Eviden', 'Format', 'Kebutuhan', 'Tahun', 'Status', 'Lokasi'];
    const rows = results.map((r, i) => [
      i + 1, r.unit, r.category_name, r.item_code,
      r.nama_eviden, r.format_req, r.kebutuhan_file,
      r.tahun ?? '-', r.status, `${r.unit}-${r.category_code}`
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'hasil_pencarian_eviden.csv';
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1E3A8A] tracking-tight">Pencarian</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">
          Cari dokumen eviden berdasarkan kata kunci, unit, kategori, atau filter lainnya.
        </p>
      </div>

      {/* Search + Filter Card */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] shadow-sm p-6 space-y-4">

        {/* Search bar utama */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Cari nama eviden, kode item, atau kategori..."
              className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X size={15} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 bg-[#1E3A8A] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#1E3A8A]/90 active:scale-95 transition-all shadow-lg shadow-[#1E3A8A]/20"
          >
            <Search size={15} /> Cari
          </button>
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Unit */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pilih Unit</label>
            <select
              value={filterUnit}
              onChange={e => { setFilterUnit(e.target.value); setFilterCat(''); }}
              className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
            >
              <option value="">Semua Unit</option>
              <option value="UP">Unit Pengolah (UP)</option>
              <option value="UK">Unit Kearsipan (UK)</option>
            </select>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pilih Kategori</label>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
            >
              <option value="">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.code} value={c.code}>{c.code} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pilih Format</label>
            <select
              value={filterFmt}
              onChange={e => setFilterFmt(e.target.value)}
              className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
            >
              <option value="">Semua Format</option>
              <option value="PDF">PDF</option>
              <option value="JPEG">JPEG</option>
              <option value="MP4">MP4</option>
              <option value="MPEG">MPEG</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
            >
              <option value="">Semua Status</option>
              <option value="done">Lengkap</option>
              <option value="partial">Belum Lengkap</option>
              <option value="missing">Kosong</option>
            </select>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-[#F8F9FB] rounded-xl p-3 border border-[#E9ECEF]">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tips Pencarian</p>
          <div className="space-y-0.5 text-[10px] text-slate-400 font-medium">
            <p>· Gunakan kata kunci untuk mencari nama dokumen, kode item, atau kategori</p>
            <p>· Contoh: "surat perintah", "UP-1.1", "foto", dll</p>
            <p>· Pencarian tidak membedakan huruf besar/kecil</p>
          </div>
        </div>
      </div>

      {/* Hasil Pencarian */}
      {searched && (
        <div className="bg-white rounded-2xl border border-[#E9ECEF] shadow-sm overflow-hidden">

          {/* Header hasil */}
          <div className="px-6 py-4 border-b border-[#E9ECEF] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Search size={15} className="text-slate-400" />
              <div>
                {query && (
                  <p className="text-xs font-black text-[#1A1C1E]">
                    Hasil pencarian untuk: <span className="text-[#1E3A8A]">"{query}"</span>
                  </p>
                )}
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {loading ? 'Mencari...' : `Ditemukan ${results.length} hasil`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-slate-600 border border-[#E9ECEF] px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all"
              >
                <X size={12} /> Reset
              </button>
              <button
                onClick={handleExport}
                disabled={!results.length}
                className="flex items-center gap-1.5 text-[10px] font-black text-[#1E3A8A] border border-blue-100 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-40"
              >
                <Download size={12} /> Export Hasil
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-[#1E3A8A]" size={24} />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Mencari...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
              <FolderOpen size={40} strokeWidth={1} className="text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Tidak ada hasil ditemukan
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="border-b border-[#E9ECEF] bg-slate-50/60">
                  <tr>
                    {['No', 'Unit', 'Kategori', 'Item / Dokumen', 'Format', 'Kebutuhan', 'Status', 'Lokasi', 'Aksi'].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest first:pl-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F3F5]">
                  {results.map((row, idx) => {
                    const st = getStatusInfo(row.status);
                    return (
                      <tr key={row.id} className="hover:bg-[#F8F9FB] transition-colors group">
                        {/* No */}
                        <td className="px-4 py-3 pl-5">
                          <span className="text-[10px] font-black text-slate-300">{idx + 1}</span>
                        </td>

                        {/* Unit badge */}
                        <td className="px-4 py-3">
                          <span className={clsx(
                            'text-[9px] font-black px-2 py-1 rounded-lg border',
                            row.unit === 'UP'
                              ? 'text-[#1E3A8A] bg-blue-50 border-blue-200'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          )}>
                            {row.unit}
                          </span>
                        </td>

                        {/* Kategori */}
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-black text-slate-600">{row.category_code}</p>
                          <p className="text-[9px] text-slate-400 truncate max-w-[100px]">{row.category_name}</p>
                        </td>

                        {/* Item */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-lg border border-[#E9ECEF] bg-white flex items-center justify-center flex-shrink-0">
                              <FormatIcon fmt={row.format_req} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-[#1A1C1E] truncate max-w-[160px]">{row.nama_eviden}</p>
                              <p className="text-[9px] text-slate-400">
                                {row.tahun ?? '-'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Format */}
                        <td className="px-4 py-3">
                          <FormatBadge fmt={row.format_req} />
                        </td>

                        {/* Kebutuhan */}
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-black text-slate-500">{row.kebutuhan_file} file</span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={clsx('text-[9px] font-black px-2.5 py-1 rounded-lg border', st.color)}>
                            {st.label}
                          </span>
                        </td>

                        {/* Lokasi */}
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-black text-slate-400">
                            {row.unit}-{row.category_code}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3">
                          <Link
                            href={`/unit/${row.unit}`}
                            className="flex items-center gap-1 text-[9px] font-black text-[#1E3A8A] hover:underline"
                          >
                            <Eye size={12} /> Lihat
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && results.length > 0 && (
            <div className="px-5 py-3 border-t border-[#F1F3F5] flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400">
                Menampilkan {results.length} dari {results.length} hasil
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}