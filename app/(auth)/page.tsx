'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DocRow {
  unit: string;
  category_code: string;
  category_name: string;
  item_code: string;
  nama_eviden: string;
  format_req: string;
  kebutuhan_file: number;
  tahun?: string;           // ✅ ditambahkan
  is_uploaded: boolean;
  status: string;
}

interface CategoryStat {
  code: string;
  name: string;
  total: number;
  done: number;
  partial: number;
  missing: number;
  percent: number;
}

interface UnitStats {
  total: number;
  done: number;
  partial: number;
  missing: number;
  percent: number;
  categories: Record<string, CategoryStat>;
}

interface DashboardData {
  UP: UnitStats;
  UK: UnitStats;
  totalAll: number;
  doneAll: number;
  partialAll: number;
  missingAll: number;
  emptyItems: DocRow[];
}

// ─── Category metadata ────────────────────────────────────────────────────────
const UP_CATEGORIES = [
  { code: '1.1', label: 'Penciptaan Arsip' },
  { code: '1.2', label: 'Penggunaan Arsip' },
  { code: '1.3', label: 'Pemeliharaan Arsip' },
  { code: '1.4', label: 'Penyusutan Arsip' },
  { code: '2.1', label: 'SDM Kearsipan' },
  { code: '2.2', label: 'Sarana & Prasarana' },
];

const UK_CATEGORIES = [
  { code: '1.1', label: 'Pengendalian Naskah' },
  { code: '1.2', label: 'Penggunaan Arsip' },
  { code: '1.3', label: 'Pemeliharaan Arsip' },
  { code: '1.4', label: 'Penyusutan Arsip' },
  { code: '2.1', label: 'SDM Kearsipan' },
  { code: '2.2', label: 'Sarana & Prasarana' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeUnitStats(docs: DocRow[]): UnitStats {
  const categories: Record<string, CategoryStat> = {};
  for (const doc of docs) {
    const key = doc.category_code;
    if (!categories[key]) {
      categories[key] = { code: key, name: doc.category_name, total: 0, done: 0, partial: 0, missing: 0, percent: 0 };
    }
    const cat = categories[key];
    cat.total++;
    if (doc.status === 'done') cat.done++;
    else if (doc.status === 'partial') cat.partial++;
    else cat.missing++;
  }
  for (const cat of Object.values(categories)) {
    cat.percent = cat.total > 0 ? Math.round((cat.done / cat.total) * 100) : 0;
  }
  const total   = docs.length;
  const done    = docs.filter(d => d.status === 'done').length;
  const partial = docs.filter(d => d.status === 'partial').length;
  const missing = docs.filter(d => d.status === 'missing').length;
  return { total, done, partial, missing, percent: total > 0 ? Math.round((done / total) * 100) : 0, categories };
}

function barColor(percent: number) {
  if (percent === 100) return 'bg-emerald-500';
  if (percent > 0)     return 'bg-amber-400';
  return 'bg-red-400';
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
      'text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider flex-shrink-0',
      colors[base] ?? 'bg-slate-50 text-slate-500 border-slate-100'
    )}>
      {base}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => { fetchDashboard(); }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      // ✅ tambah 'tahun' di select
      const { data: docs, error } = await supabase
        .from('audit_documents')
        .select('unit, category_code, category_name, item_code, nama_eviden, format_req, kebutuhan_file, tahun, is_uploaded, status');
      if (error || !docs) throw error;

      const upDocs = docs.filter(d => d.unit === 'UP');
      const ukDocs = docs.filter(d => d.unit === 'UK');
      const UP = computeUnitStats(upDocs);
      const UK = computeUnitStats(ukDocs);
      const doneAll    = docs.filter(d => d.status === 'done').length;
      const partialAll = docs.filter(d => d.status === 'partial').length;
      const missingAll = docs.filter(d => d.status === 'missing').length;
      const emptyItems = docs.filter(d => d.status === 'missing').slice(0, 10);

      setData({ UP, UK, totalAll: docs.length, doneAll, partialAll, missingAll, emptyItems });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#1E3A8A]" size={40} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat Data Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const overallPercent = data.totalAll > 0 ? Math.round((data.doneAll / data.totalAll) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1E3A8A] tracking-tight">Dashboard</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">Ringkasan Inventaris Dokumen Eviden</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 bg-white border border-[#E9ECEF] text-slate-500 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <div className="flex items-center gap-2 bg-white border border-[#E9ECEF] px-4 py-2.5 rounded-xl shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-xs font-black text-[#1A1C1E]">Tahun</span>
            <span className="text-xs font-black text-[#1E3A8A]">{year}</span>
          </div>
        </div>
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UnitProgressCard title="Unit Pengolah (UP)" stats={data.UP} href="/unit/UP" />
        <UnitProgressCard title="Unit Kearsipan (UK)" stats={data.UK} href="/unit/UK" />
        <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Ringkasan Keseluruhan</h3>
          <div className="grid grid-cols-2 gap-3">
            <SummaryBox label="Total Item"    value={data.totalAll}   icon={<FolderOpen   size={16} />} color="blue"  />
            <SummaryBox label="Selesai"       value={data.doneAll}    icon={<CheckCircle2 size={16} />} color="green" />
            <SummaryBox label="Belum Lengkap" value={data.partialAll} icon={<Clock        size={16} />} color="amber" />
            <SummaryBox label="Kosong"        value={data.missingAll} icon={<AlertCircle  size={16} />} color="red"   />
          </div>
        </div>
      </div>

      {/* Memory Map */}
      <div className="bg-white rounded-2xl border border-[#E9ECEF] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-[#E9ECEF] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-black text-[#1A1C1E] uppercase tracking-widest">Peta Direktori (Memory Map)</h3>
          <div className="flex items-center gap-5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />Lengkap (100%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Belum Lengkap</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-300 inline-block" />Kosong (0%)</span>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* UP */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FolderOpen size={13} /> Unit Pengolah (UP)
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {UP_CATEGORIES.map(cat => (
                // ✅ FolderCard sekarang bisa diklik → navigasi ke unit/UP dengan kategori
                <Link key={cat.code} href={`/unit/UP`}>
                  <FolderCard cat={cat} stat={data.UP.categories[cat.code]} />
                </Link>
              ))}
            </div>
          </div>
          <div className="border-t border-[#F1F3F5]" />
          {/* UK */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FolderOpen size={13} /> Unit Kearsipan (UK)
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {UK_CATEGORIES.map(cat => (
                <Link key={cat.code} href={`/unit/UK`}>
                  <FolderCard cat={cat} stat={data.UK.categories[cat.code]} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Table + Item Kosong */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Progress Per Unit */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E9ECEF] overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-[#E9ECEF]">
            <h3 className="text-sm font-black text-[#1A1C1E] uppercase tracking-widest">Progress Per Unit (Rincian Per Kategori)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="border-b border-[#E9ECEF] bg-slate-50/50">
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Selesai</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Belum</th>
                  <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kosong</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                <ProgressRows unit="UP" unitStats={data.UP} categories={UP_CATEGORIES} />
                <ProgressRows unit="UK" unitStats={data.UK} categories={UK_CATEGORIES} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Item Kosong */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E9ECEF] overflow-hidden shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-[#E9ECEF] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#1A1C1E] uppercase tracking-widest">Item Kosong</h3>
              <span className="text-[9px] font-black text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                Perlu Perhatian
              </span>
            </div>
            {/* ✅ Link diperbaiki — arahkan ke unit UP karena /pencarian belum ada */}
            <Link href="/unit/UP" className="text-[10px] font-black text-[#1E3A8A] hover:underline uppercase tracking-wider">
              Lihat Semua →
            </Link>
          </div>

          <div className="divide-y divide-[#F1F3F5] flex-1 overflow-y-auto max-h-[420px]">
            {data.emptyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-30">
                <CheckCircle2 size={36} strokeWidth={1} className="text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-widest">Semua item terisi</p>
              </div>
            ) : (
              data.emptyItems.map(item => (
                // ✅ setiap item kosong bisa diklik → navigasi ke unit yang sesuai
                <Link
                  key={item.item_code}
                  href={`/unit/${item.unit}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8F9FB] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={13} className="text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-[#1A1C1E] truncate">{item.nama_eviden}</p>
                      {/* ✅ tampilkan item_code + tahun */}
                      <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                        {item.item_code}
                        {item.tahun && <span className="ml-1.5 text-slate-300">· {item.tahun}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <FormatBadge fmt={item.format_req} />
                    <span className="text-[9px] font-black text-slate-400 w-4 text-center">{item.kebutuhan_file}</span>
                    <ChevronRight size={13} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Compliance Footer */}
      <div className="bg-[#1E3A8A] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-[#1E3A8A]/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Tingkat Kepatuhan Keseluruhan</p>
            <p className="text-2xl font-black mt-0.5">{overallPercent}%</p>
          </div>
        </div>
        <div className="flex-1 max-w-md">
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${overallPercent}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">{data.doneAll} Selesai</span>
            <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">{data.totalAll} Total</span>
          </div>
        </div>
        <Link href="/unit/UP" className="bg-white text-[#1E3A8A] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex-shrink-0">
          Kelola Inventaris →
        </Link>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FolderCard({ cat, stat }: { cat: { code: string; label: string }; stat: CategoryStat | undefined }) {
  const pct   = stat?.percent ?? 0;
  const done  = stat?.done    ?? 0;
  const total = stat?.total   ?? 0;
  const is100   = pct === 100;
  const isEmpty = pct === 0;

  const tabColor = is100 ? 'bg-emerald-400' : isEmpty ? 'bg-red-300'  : 'bg-amber-400';
  const bodyBg   = is100 ? 'bg-emerald-50'  : isEmpty ? 'bg-red-50'   : 'bg-amber-50';
  const bodyBd   = is100 ? 'border-emerald-200' : isEmpty ? 'border-red-200' : 'border-amber-200';
  const textMain = is100 ? 'text-emerald-800'   : isEmpty ? 'text-red-800'   : 'text-amber-800';
  const textSub  = is100 ? 'text-emerald-600'   : isEmpty ? 'text-red-500'   : 'text-amber-600';
  const dotBg    = is100 ? 'bg-emerald-500'     : isEmpty ? 'bg-red-400'     : 'bg-amber-400';

  return (
    <div className="flex flex-col items-center group cursor-pointer select-none">
      <div className="w-full relative pt-2">
        <div className={clsx('absolute top-0 left-2 w-10 h-2.5 rounded-t-md', tabColor)} />
        <div className={clsx(
          'relative w-full border rounded-b-xl rounded-tr-xl rounded-tl-sm pt-4 pb-3 px-2 flex flex-col items-center gap-1 transition-transform duration-150 group-hover:-translate-y-1',
          bodyBg, bodyBd
        )}>
          <span className={clsx('absolute top-2 right-2 w-2 h-2 rounded-full', dotBg)} />
          <FolderOpen size={26} strokeWidth={1.5} className={textSub} />
          <p className={clsx('text-[11px] font-black tracking-wide', textMain)}>{cat.code}</p>
          <p className={clsx('text-[9px] font-medium text-center leading-tight px-1', textSub)}>{cat.label}</p>
          <p className={clsx('text-base font-black mt-0.5', textMain)}>{pct}%</p>
          <p className={clsx('text-[9px] font-medium', textSub)}>{done}/{total}</p>
        </div>
      </div>
    </div>
  );
}

function UnitProgressCard({ title, stats, href }: { title: string; stats: UnitStats; href: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E9ECEF] p-6 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-black text-[#1E3A8A]">{stats.percent}%</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Progress Keseluruhan</span>
          </div>
        </div>
        <Link href={href} className="text-slate-300 hover:text-[#1E3A8A] transition-colors">
          <ChevronRight size={20} />
        </Link>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all duration-1000', barColor(stats.percent))} style={{ width: `${stats.percent}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Total',   val: stats.total,   cls: 'text-[#1A1C1E]' },
          { label: 'Selesai', val: stats.done,    cls: 'text-emerald-600' },
          { label: 'Belum',   val: stats.partial, cls: 'text-amber-500' },
          { label: 'Kosong',  val: stats.missing, cls: 'text-red-500' },
        ].map(s => (
          <div key={s.label}>
            <p className={clsx('text-lg font-black', s.cls)}>{s.val}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryBox({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const ring: Record<string, string> = {
    blue:  'text-[#1E3A8A] bg-blue-50 border-blue-100',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    red:   'text-red-500 bg-red-50 border-red-100',
  };
  const ico: Record<string, string> = {
    blue:  'bg-[#1E3A8A]/10 text-[#1E3A8A]',
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red:   'bg-red-100 text-red-500',
  };
  return (
    <div className={clsx('rounded-xl border p-3.5 flex items-center gap-3', ring[color])}>
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', ico[color])}>{icon}</div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</p>
        <p className="text-xl font-black mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ProgressRows({ unit, unitStats, categories }: {
  unit: string;
  unitStats: UnitStats;
  categories: { code: string; label: string }[];
}) {
  return (
    <>
      {categories.map((cat, i) => {
        const c = unitStats.categories[cat.code];
        const pct = c?.percent ?? 0;
        return (
          <tr key={`${unit}-${cat.code}`} className="hover:bg-[#F8F9FB] transition-colors">
            {i === 0 && (
              <td className="px-5 py-3 align-middle" rowSpan={categories.length}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center">
                    <FolderOpen size={15} className="text-[#1E3A8A]" />
                  </div>
                  <span className="text-[9px] font-black text-[#1E3A8A] uppercase tracking-wider text-center leading-tight">
                    {unit === 'UP' ? 'Unit\nPengolah' : 'Unit\nKearsipan'}
                  </span>
                  <span className="text-[9px] font-black text-slate-400">({unit})</span>
                </div>
              </td>
            )}
            <td className="px-4 py-3">
              <p className="text-[11px] font-black text-[#1A1C1E]">{cat.code} {cat.label}</p>
              <p className="text-[9px] text-slate-400">{c?.total ?? 0} item</p>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                  <div className={clsx('h-full rounded-full transition-all duration-700', barColor(pct))} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-black text-slate-400">{pct}%</span>
              </div>
            </td>
            <td className="px-3 py-3 text-center"><span className="text-xs font-black text-emerald-600">{c?.done ?? 0}</span></td>
            <td className="px-3 py-3 text-center"><span className="text-xs font-black text-amber-500">{c?.partial ?? 0}</span></td>
            <td className="px-3 py-3 text-center"><span className="text-xs font-black text-red-500">{c?.missing ?? 0}</span></td>
          </tr>
        );
      })}
    </>
  );
}