'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Eye,
  Plus,
  Loader2,
  Users,
  Wallet,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Info,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface Stats {
  total: number;
  verified: number;
  up_total: number;
  up_done: number;
  uk_total: number;
  uk_done: number;
  compliance: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    total: 0, verified: 0, up_total: 0, up_done: 0, uk_total: 0, uk_done: 0, compliance: 0
  });
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: documents } = await supabase
          .from('audit_documents')
          .select('unit, is_uploaded, status');

        if (!documents) {
          setLoading(false);
          return;
        }

        const total = documents.length;
        const verified = documents.filter(d => d.is_uploaded && d.status !== 'revision').length;
        
        const upDocs = documents.filter(d => d.unit === 'UP');
        const ukDocs = documents.filter(d => d.unit === 'UK');

        setStats({
          total,
          verified,
          up_total: upDocs.length,
          up_done: upDocs.filter(d => d.is_uploaded && d.status !== 'revision').length,
          uk_total: ukDocs.length,
          uk_done: ukDocs.filter(d => d.is_uploaded && d.status !== 'revision').length,
          compliance: total > 0 ? Math.round((verified / total) * 100) : 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const handleAction = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#1E3A8A]/20" size={64} />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20 relative">
      {/* Notifikasi Toast */}
      {showNotification && (
        <div className="fixed top-24 right-10 bg-[#1E3A8A] text-white px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-slide-up">
           <Info size={20} />
           <span className="text-sm font-black uppercase tracking-widest">{showNotification}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div>
          <h1 className="text-4xl font-black text-[#1E3A8A] tracking-tight">
            Laporan Audit & Kepatuhan
          </h1>
          <p className="text-lg font-medium text-slate-400 mt-2 max-w-2xl">
            Monitor progres standarisasi dokumen dan tingkat kepatuhan kearsipan lintas unit secara real-time.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => handleAction('Menyiapkan file rekapitulasi...')}
            className="flex items-center gap-2.5 bg-white border border-[#E9ECEF] text-slate-600 px-6 py-4 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={20} /> Unduh Rekapitulasi
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2.5 bg-[#1E3A8A] text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#1E3A8A]/20"
          >
            <Printer size={20} /> Cetak Laporan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Statistik Kepatuhan Card */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-[#E9ECEF] p-10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black text-[#1A1C1E]">Statistik Dokumen</h3>
              <p className="text-sm font-medium text-slate-400 mt-1">Perbandingan Kepatuhan Unit</p>
            </div>
            {/* Periode removed as requested */}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
            {/* Donut Chart */}
            <div className="relative w-48 h-48 flex-shrink-0">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="20" fill="transparent" className="text-slate-50" />
                 <circle 
                   cx="96" cy="96" r="80" 
                   stroke="currentColor" strokeWidth="20" fill="transparent" 
                   strokeDasharray="502.4"
                   strokeDashoffset={502.4 - (502.4 * stats.compliance) / 100}
                   strokeLinecap="round"
                   className="text-[#1E3A8A] transition-all duration-1000"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-4xl font-black text-[#1A1C1E]">{stats.compliance}%</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Kepatuhan Total</span>
               </div>
            </div>

            {/* Progress Bars */}
            <div className="flex-1 w-full space-y-8">
               <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Unit Pengolah (UP)</span>
                    <span className="text-sm font-black text-[#1E3A8A]">{stats.up_total > 0 ? Math.round((stats.up_done / stats.up_total) * 100) : 0}%</span>
                  </div>
                  <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-[#E9ECEF]">
                    <div className="h-full bg-[#1E3A8A] rounded-full transition-all duration-1000" style={{ width: `${stats.up_total > 0 ? Math.round((stats.up_done / stats.up_total) * 100) : 0}%` }} />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Unit Kearsipan (UK)</span>
                    <span className="text-sm font-black text-[#1E3A8A]">{stats.uk_total > 0 ? Math.round((stats.uk_done / stats.uk_total) * 100) : 0}%</span>
                  </div>
                  <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-[#E9ECEF]">
                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${stats.uk_total > 0 ? Math.round((stats.uk_done / stats.uk_total) * 100) : 0}%` }} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-[#F8F9FB] p-4 rounded-2xl border border-[#E9ECEF]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Dokumen</p>
                    <p className="text-xl font-black text-[#1A1C1E]">{stats.total}</p>
                  </div>
                  <div className="bg-[#F8F9FB] p-4 rounded-2xl border border-[#E9ECEF]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Terverifikasi</p>
                    <p className="text-xl font-black text-emerald-600">{stats.verified}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Status Audit Card */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-[#E9ECEF] p-10 shadow-sm flex flex-col">
          <h3 className="text-2xl font-black text-[#1A1C1E] mb-8">Status Audit</h3>
          
          <div className="flex-1 space-y-6">
             {stats.total > 0 ? (
               <>
                 <AuditStatusRow 
                   icon={<CheckCircle2 className="text-white" size={20} />} 
                   title="Kepatuhan Sistem" 
                   sub={`Total ${stats.verified} dokumen terverifikasi`}
                   status="AKTIF"
                   color="emerald"
                 />
                 <AuditStatusRow 
                   icon={<Clock className="text-white" size={20} />} 
                   title="Proses Audit" 
                   sub={`${stats.total - stats.verified} item dalam peninjauan`}
                   status="PROSES"
                   color="amber"
                 />
               </>
             ) : (
               <div className="flex flex-col items-center justify-center py-10 opacity-20 text-center gap-4">
                  <ShieldCheck size={48} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Belum ada data audit</p>
               </div>
             )}
          </div>

          <Link href="/unit/UP" className="mt-10 w-full bg-[#1E3A8A] text-white py-5 rounded-[1.25rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
            <Plus size={20} strokeWidth={3} /> Kelola Inventaris
          </Link>
        </div>
      </div>

      {/* Rincian Kepatuhan Table */}
      <div className="bg-white rounded-[2.5rem] border border-[#E9ECEF] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-[#E9ECEF] flex flex-col sm:flex-row justify-between items-center gap-6">
          <h3 className="text-2xl font-black text-[#1A1C1E]">Rincian Kepatuhan Per Unit</h3>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Cari unit..."
              className="w-full bg-[#F8F9FB] rounded-xl py-2.5 pl-12 pr-4 text-xs font-bold border-none focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[150px]">
           {stats.total > 0 ? (
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-[#E9ECEF]">
                    <th className="px-10 py-5">UNIT KERJA</th>
                    <th className="px-10 py-5">TOTAL ITEM</th>
                    <th className="px-10 py-5">TERVERIFIKASI</th>
                    <th className="px-10 py-5">KEPATUHAN</th>
                    <th className="px-10 py-5">STATUS</th>
                    <th className="px-10 py-5 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  <UnitStatRow 
                    title="Unit Pengolah (UP)" 
                    total={stats.up_total} 
                    done={stats.up_done} 
                    percent={stats.up_total > 0 ? Math.round((stats.up_done / stats.up_total) * 100) : 0} 
                  />
                  <UnitStatRow 
                    title="Unit Kearsipan (UK)" 
                    total={stats.uk_total} 
                    done={stats.uk_done} 
                    percent={stats.uk_total > 0 ? Math.round((stats.uk_done / stats.uk_total) * 100) : 0} 
                  />
                </tbody>
             </table>
           ) : (
             <div className="py-20 text-center flex flex-col items-center gap-6 opacity-30">
                <Users size={48} strokeWidth={1} className="text-slate-300" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em]">Data unit belum tersedia</p>
             </div>
           )}
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="bg-[#1E3A8A] rounded-[2.5rem] p-12 text-white relative overflow-hidden group shadow-2xl shadow-[#1E3A8A]/20">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4">
              <div className="px-4 py-1 bg-white/10 rounded-lg w-fit text-[11px] font-black uppercase tracking-widest">Komitmen Standarisasi 2024</div>
              <p className="text-xl font-medium max-w-2xl leading-relaxed">
                Sistem Informasi Dokumen Kecamatan (SIDOKU) berkomitmen untuk menciptakan tata kelola administrasi yang transparan, akuntabel, dan berbasis digital.
              </p>
            </div>
            <button 
              onClick={() => handleAction('Membuka portal panduan...')}
              className="bg-white text-[#1E3A8A] px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              Pelajari Standar
            </button>
         </div>
         <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

function AuditStatusRow({ icon, title, sub, status, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500"
  };
  return (
    <div className="p-6 rounded-[1.5rem] border border-[#E9ECEF] flex items-center justify-between group hover:bg-[#F8F9FB] transition-all">
      <div className="flex items-center gap-4">
        <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", colors[color])}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-black text-[#1A1C1E]">{title}</p>
          <p className="text-[10px] font-medium text-slate-400 mt-1">{sub}</p>
        </div>
      </div>
      <span className={clsx(
        "text-[9px] font-black px-2.5 py-1 rounded-lg border",
        color === 'emerald' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'
      )}>{status}</span>
    </div>
  );
}

function UnitStatRow({ title, total, done, percent }: any) {
  return (
    <tr className="hover:bg-[#F8F9FB] transition-colors group cursor-pointer">
      <td className="px-10 py-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 text-[#1E3A8A] rounded-xl flex items-center justify-center border border-[#E9ECEF]">
            <Building2 size={20} />
          </div>
          <span className="text-sm font-black text-[#1A1C1E]">{title}</span>
        </div>
      </td>
      <td className="px-10 py-6 text-sm font-bold text-slate-400">{total} Items</td>
      <td className="px-10 py-6 text-sm font-bold text-emerald-600">{done} Items</td>
      <td className="px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 bg-slate-50 rounded-full overflow-hidden border border-[#E9ECEF]">
            <div className={clsx("h-full rounded-full transition-all duration-1000", percent > 80 ? 'bg-emerald-400' : 'bg-[#1E3A8A]')} style={{ width: `${percent}%` }} />
          </div>
          <span className="text-[10px] font-black text-slate-400">{percent}%</span>
        </div>
      </td>
      <td className="px-10 py-6">
        <span className={clsx(
          "text-[9px] font-black px-2 py-1 rounded-lg",
          percent === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-[#F8F9FB] text-slate-400'
        )}>{percent === 100 ? 'LENGKAP' : 'PROSES'}</span>
      </td>
      <td className="px-10 py-6 text-right">
        <Link href={`/unit/${title.includes('UP') ? 'UP' : 'UK'}`}><ArrowUpRight size={20} className="text-slate-300 hover:text-[#1E3A8A] transition-colors inline" /></Link>
      </td>
    </tr>
  );
}
