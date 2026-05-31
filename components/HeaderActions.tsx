'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Bell, Settings, X, CheckCircle2, AlertTriangle,
  FolderOpen, Clock, ChevronRight,
  User, Shield, Database, HelpCircle, LogOut,
  Eye, EyeOff, Download, Loader2, Save, KeyRound
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

interface Notif {
  id: number; type: string; read: boolean;
  title: string; desc: string; time: string; href: string;
}
type SettingsTab = 'profil' | 'keamanan' | 'backup' | 'bantuan' | null;

function NotifIcon({ type }: { type: string }) {
  if (type === 'success') return <CheckCircle2 size={15} className="text-emerald-500" />;
  if (type === 'warning') return <AlertTriangle size={15} className="text-amber-500" />;
  return <FolderOpen size={15} className="text-[#1E3A8A]" />;
}

export default function HeaderActions() {
  const [showNotif, setShowNotif]       = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab]       = useState<SettingsTab>(null);

  // ── Profil state (sumber kebenaran untuk nama di header) ──────────────────
  const [profil, setProfil] = useState({
    nama: 'Operator',
    jabatan: 'Pengolah Dokumen',
    email: 'operator@sidoku.id',
  });
  const [profilEdit, setProfilEdit] = useState({ ...profil });
  const [savingProfil, setSavingProfil] = useState(false);
  const [profilMsg, setProfilMsg] = useState('');

  // ── Password ──────────────────────────────────────────────────────────────
  const [pwd, setPwd] = useState({ lama: '', baru: '', konfirmasi: '' });
  const [showPwd, setShowPwd] = useState({ lama: false, baru: false, konfirmasi: false });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  // ── Backup ────────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  // ── Notifikasi ────────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState<Notif[]>([
    { id:1, type:'warning', read:false, title:'Item Kosong Ditemukan',   desc:'Banyak item di Unit Kearsipan belum memiliki file.', time:'Baru saja', href:'/unit/UK' },
    { id:2, type:'success', read:false, title:'Upload Berhasil',          desc:'File eviden berhasil diunggah ke sistem.',          time:'1 jam lalu', href:'/unit/UP' },
    { id:3, type:'info',    read:true,  title:'Folder Baru Ditambahkan',  desc:'Item baru berhasil dibuat di Penciptaan Arsip.',   time:'3 jam lalu', href:'/unit/UP' },
    { id:4, type:'warning', read:true,  title:'Progress UP Masih Rendah', desc:'Unit Pengolah baru mencapai kepatuhan rendah.',    time:'Kemarin',    href:'/'        },
  ]);
  const unreadCount = notifs.filter(n => !n.read).length;

  const notifRef    = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const router      = useRouter();

  // ── Load localStorage saat mount (client only) ────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidoku_profil');
      if (saved) {
        const p = JSON.parse(saved);
        setProfil(p);
        setProfilEdit(p);
      }
    } catch {}
  }, []);

  // ── Tutup panel klik luar ─────────────────────────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false); setActiveTab(null);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── Notif ─────────────────────────────────────────────────────────────────
  function markAllRead() { setNotifs(p => p.map(n => ({ ...n, read: true }))); }
  function markRead(id: number) { setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n)); }

  // ── Simpan profil ─────────────────────────────────────────────────────────
  async function handleSaveProfil() {
    if (!profilEdit.nama.trim()) return;
    setSavingProfil(true);
    await new Promise(r => setTimeout(r, 500));
    // ✅ Update state profil → nama di header langsung berubah
    setProfil({ ...profilEdit });
    localStorage.setItem('sidoku_profil', JSON.stringify(profilEdit));
    setProfilMsg('✓ Profil berhasil disimpan!');
    setSavingProfil(false);
    setTimeout(() => setProfilMsg(''), 3000);
  }

  // ── Ganti password (Supabase Auth) ───────────────────────────────────────
  async function handleGantiPassword() {
    setPwdMsg('');
    if (!pwd.baru || !pwd.konfirmasi) { setPwdMsg('Password baru wajib diisi.'); return; }
    if (pwd.baru.length < 8) { setPwdMsg('Password baru minimal 8 karakter.'); return; }
    if (pwd.baru !== pwd.konfirmasi) { setPwdMsg('Konfirmasi password tidak cocok.'); return; }
    setSavingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd.baru });
      if (error) throw error;
      setPwdMsg('✓ Password berhasil diperbarui!');
      setPwd({ lama: '', baru: '', konfirmasi: '' });
    } catch (err: any) {
      setPwdMsg('Gagal: ' + err.message);
    } finally {
      setSavingPwd(false);
      setTimeout(() => setPwdMsg(''), 4000);
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // ── Export backup ─────────────────────────────────────────────────────────
  async function handleExport(type: 'csv' | 'json') {
    setExporting(true); setExportMsg('');
    try {
      const { data, error } = await supabase.from('audit_documents').select('*').order('item_code', { ascending: true });
      if (error) throw error;
      let content = '', filename = '', mime = '';
      if (type === 'csv') {
        const headers = ['id','unit','category_code','category_name','item_code','nama_eviden','format_req','kebutuhan_file','tahun','is_uploaded','uploaded_count','status','file_url','updated_at'];
        const rows = (data||[]).map(r => headers.map(h => JSON.stringify((r as any)[h] ?? '')).join(','));
        content = [headers.join(','), ...rows].join('\n');
        filename = `sidoku_backup_${new Date().toISOString().slice(0,10)}.csv`;
        mime = 'text/csv';
      } else {
        content = JSON.stringify(data, null, 2);
        filename = `sidoku_backup_${new Date().toISOString().slice(0,10)}.json`;
        mime = 'application/json';
      }
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setExportMsg(`✓ ${(data||[]).length} item diekspor sebagai ${type.toUpperCase()}`);
    } catch (err: any) {
      setExportMsg('Gagal: ' + err.message);
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(''), 4000);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-shrink-0">

      {/* ── Bell ──────────────────────────────────────────────────────────── */}
      <div className="relative" ref={notifRef}>
        <button onClick={() => { setShowNotif(v => !v); setShowSettings(false); setActiveTab(null); }}
          className="relative text-slate-400 hover:text-[#1E3A8A] transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] font-black text-white leading-none">{unreadCount}</span>
            </span>
          )}
        </button>

        {showNotif && (
          <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-[#E9ECEF] shadow-2xl z-[200] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#E9ECEF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-[#1A1C1E]">Notifikasi</p>
                {unreadCount > 0 && <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && <button onClick={markAllRead} className="text-[10px] font-black text-[#1E3A8A] hover:underline">Tandai semua</button>}
                <button onClick={() => setShowNotif(false)} className="text-slate-300 hover:text-slate-500"><X size={14} /></button>
              </div>
            </div>
            <div className="divide-y divide-[#F1F3F5] max-h-72 overflow-y-auto">
              {notifs.map(n => (
                <div key={n.id}
                  className={clsx('flex items-start gap-3 px-4 py-3 hover:bg-[#F8F9FB] transition-colors cursor-pointer', !n.read && 'bg-blue-50/40')}
                  onClick={() => { markRead(n.id); setShowNotif(false); router.push(n.href); }}>
                  <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border',
                    n.type === 'success' ? 'bg-emerald-50 border-emerald-100' : n.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100')}>
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-black text-[#1A1C1E]">{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#1E3A8A] flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{n.desc}</p>
                    <p className="text-[9px] text-slate-300 font-bold mt-1 flex items-center gap-1"><Clock size={9} />{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-[#F1F3F5]">
              <Link href="/pencarian" onClick={() => setShowNotif(false)}
                className="flex items-center justify-center gap-1 text-[10px] font-black text-[#1E3A8A] hover:underline">
                Lihat semua aktivitas <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Settings gear ─────────────────────────────────────────────────── */}
      <div className="relative hidden sm:block" ref={settingsRef}>
        <button onClick={() => { setShowSettings(v => !v); setShowNotif(false); if (showSettings) setActiveTab(null); }}
          className="text-slate-400 hover:text-[#1E3A8A] transition-colors">
          <Settings size={20} />
        </button>

        {showSettings && (
          <div className="absolute right-0 top-11 bg-white rounded-2xl border border-[#E9ECEF] shadow-2xl z-[200] overflow-hidden flex"
            style={{ width: activeTab ? '520px' : '272px' }}>

            {/* Kolom kiri menu */}
            <div className={clsx('flex flex-col', activeTab ? 'w-52 border-r border-[#F1F3F5] flex-shrink-0' : 'w-full')}>
              <div className="px-4 py-3.5 border-b border-[#E9ECEF] flex items-center justify-between">
                <p className="text-sm font-black text-[#1A1C1E]">Pengaturan</p>
                <button onClick={() => { setShowSettings(false); setActiveTab(null); }} className="text-slate-300 hover:text-slate-500"><X size={14} /></button>
              </div>

              {/* ✅ User info — pakai profil state, bukan hardcode */}
              <div className="px-4 py-3.5 border-b border-[#F1F3F5]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-[#E9ECEF] overflow-hidden flex-shrink-0">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="User" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#1A1C1E] truncate">{profil.nama}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{profil.jabatan}</p>
                  </div>
                </div>
              </div>

              <div className="py-2 flex-1">
                {([
                  { tab: 'profil'   as SettingsTab, icon: <User       size={13} className="text-[#1E3A8A]"    />, bg: 'bg-blue-50 border-blue-100',     label: 'Profil Saya',    sub: 'Ubah nama dan informasi akun' },
                  { tab: 'keamanan' as SettingsTab, icon: <Shield     size={13} className="text-emerald-600"  />, bg: 'bg-emerald-50 border-emerald-100', label: 'Keamanan',       sub: 'Ganti kata sandi akun' },
                  { tab: 'backup'   as SettingsTab, icon: <Database   size={13} className="text-amber-600"    />, bg: 'bg-amber-50 border-amber-100',     label: 'Data & Backup',  sub: 'Export dan backup data inventaris' },
                  { tab: 'bantuan'  as SettingsTab, icon: <HelpCircle size={13} className="text-purple-500"   />, bg: 'bg-purple-50 border-purple-100',   label: 'Bantuan',        sub: 'Panduan penggunaan SIDOKU' },
                ]).map(({ tab, icon, bg, label, sub }) => (
                  <button key={tab} onClick={() => setActiveTab(activeTab === tab ? null : tab)}
                    className={clsx('w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left',
                      activeTab === tab ? 'bg-[#EEF2FF]' : 'hover:bg-[#F8F9FB]')}>
                    <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border', bg)}>{icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className={clsx('text-[11px] font-black', activeTab === tab ? 'text-[#1E3A8A]' : 'text-[#1A1C1E]')}>{label}</p>
                      {!activeTab && <p className="text-[9px] text-slate-400">{sub}</p>}
                    </div>
                    {activeTab === tab && <ChevronRight size={12} className="text-[#1E3A8A] flex-shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-[#F1F3F5]">
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all">
                  <LogOut size={14} /><span className="text-[11px] font-black">Keluar dari SIDOKU</span>
                </button>
              </div>
            </div>

            {/* Kolom kanan konten */}
            {activeTab && (
              <div className="flex-1 flex flex-col min-w-0">
                <div className="px-5 py-3.5 border-b border-[#E9ECEF] flex items-center justify-between">
                  <p className="text-sm font-black text-[#1A1C1E]">
                    {{ profil:'Profil Saya', keamanan:'Keamanan', backup:'Data & Backup', bantuan:'Bantuan' }[activeTab]}
                  </p>
                  <button onClick={() => setActiveTab(null)} className="text-slate-300 hover:text-slate-500"><X size={14} /></button>
                </div>

                <div className="p-5 flex-1 overflow-y-auto" style={{ maxHeight: '360px' }}>

                  {/* PROFIL */}
                  {activeTab === 'profil' && (
                    <div className="space-y-4">
                      {([
                        { key:'nama',    label:'Nama Lengkap', type:'text',  placeholder:'Nama operator' },
                        { key:'jabatan', label:'Jabatan',      type:'text',  placeholder:'Jabatan/posisi' },
                        { key:'email',   label:'Email',        type:'email', placeholder:'email@sidoku.id' },
                      ] as {key:keyof typeof profilEdit; label:string; type:string; placeholder:string}[]).map(f => (
                        <div key={f.key}>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                          <input type={f.type} value={profilEdit[f.key]}
                            onChange={e => setProfilEdit(p => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none" />
                        </div>
                      ))}
                      {profilMsg && <p className={clsx('text-[10px] font-black', profilMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500')}>{profilMsg}</p>}
                      <button onClick={handleSaveProfil} disabled={savingProfil}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-[10px] font-black disabled:opacity-50 hover:bg-[#1E3A8A]/90 transition-all">
                        {savingProfil ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Simpan Profil
                      </button>
                    </div>
                  )}

                  {/* KEAMANAN */}
                  {activeTab === 'keamanan' && (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-[10px] font-black text-amber-700">Password minimal 8 karakter.</p>
                      </div>
                      {([
                        { key:'lama',       label:'Password Lama' },
                        { key:'baru',       label:'Password Baru' },
                        { key:'konfirmasi', label:'Konfirmasi Password' },
                      ] as {key:keyof typeof pwd; label:string}[]).map(f => (
                        <div key={f.key}>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                          <div className="relative">
                            <input type={showPwd[f.key] ? 'text' : 'password'} value={pwd[f.key]}
                              onChange={e => setPwd(p => ({ ...p, [f.key]: e.target.value }))}
                              placeholder="••••••••"
                              className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl px-3 py-2.5 pr-9 text-xs font-bold focus:ring-2 focus:ring-[#1E3A8A]/10 outline-none" />
                            <button type="button" onClick={() => setShowPwd(p => ({ ...p, [f.key]: !p[f.key] }))}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                              {showPwd[f.key] ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </div>
                      ))}
                      {pwdMsg && <p className={clsx('text-[10px] font-black', pwdMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500')}>{pwdMsg}</p>}
                      <button onClick={handleGantiPassword} disabled={savingPwd}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-[10px] font-black disabled:opacity-50 hover:bg-[#1E3A8A]/90 transition-all">
                        {savingPwd ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />} Perbarui Password
                      </button>
                    </div>
                  )}

                  {/* BACKUP */}
                  {activeTab === 'backup' && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed">Export seluruh data inventaris dari database ke file lokal.</p>
                      {([
                        { type:'csv'  as const, color:'emerald', label:'Export CSV',  desc:'Buka di Excel / Google Sheets' },
                        { type:'json' as const, color:'blue',    label:'Export JSON', desc:'Backup teknis / import ulang' },
                      ]).map(({ type, color, label, desc }) => (
                        <div key={type} className="border border-[#E9ECEF] rounded-xl p-4 space-y-2">
                          <p className="text-[11px] font-black text-[#1A1C1E]">{label}</p>
                          <p className="text-[9px] text-slate-400">{desc}</p>
                          <button onClick={() => handleExport(type)} disabled={exporting}
                            className={clsx('w-full py-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all',
                              color === 'emerald' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                                 : 'bg-blue-50 border border-blue-100 text-[#1E3A8A] hover:bg-blue-100')}>
                            {exporting ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} Download {type.toUpperCase()}
                          </button>
                        </div>
                      ))}
                      {exportMsg && <p className={clsx('text-[10px] font-black text-center', exportMsg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500')}>{exportMsg}</p>}
                    </div>
                  )}

                  {/* BANTUAN */}
                  {activeTab === 'bantuan' && (
                    <div className="space-y-3">
                      {[
                        { q:'Bagaimana cara upload file?',      a:'Klik tombol Upload pada kolom Aksi di halaman Explorer, lalu pilih file sesuai format yang diminta.' },
                        { q:'Mengapa status belum berubah?',    a:'Status berubah otomatis berdasarkan jumlah file yang diupload dibanding kebutuhan_file item tersebut.' },
                        { q:'Apa perbedaan UP dan UK?',        a:'Unit Pengolah (UP) mengelola arsip aktif. Unit Kearsipan (UK) mengelola arsip inaktif dan statis.' },
                        { q:'Bagaimana cara mencari dokumen?', a:'Gunakan halaman Pencarian di sidebar — filter berdasarkan unit, kategori, format, atau status.' },
                        { q:'Bagaimana cara backup data?',     a:'Buka Pengaturan → Data & Backup, lalu pilih format CSV atau JSON.' },
                      ].map((item, i) => (
                        <div key={i} className="border border-[#E9ECEF] rounded-xl p-3.5">
                          <p className="text-[10px] font-black text-[#1A1C1E] mb-1">{item.q}</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">{item.a}</p>
                        </div>
                      ))}
                      <div className="bg-[#EEF2FF] rounded-xl p-3.5 border border-blue-100">
                        <p className="text-[10px] font-black text-[#1E3A8A] mb-0.5">Butuh bantuan lebih?</p>
                        <p className="text-[9px] text-[#1E3A8A]/70">Hubungi administrator sistem atau tim teknis kecamatan.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── User info — ✅ reaktif dari profil state ───────────────────────── */}
      <div className="h-8 w-px bg-[#E9ECEF] hidden sm:block" />
      <div className="flex items-center gap-3">
        <div className="text-right hidden md:block">
          <p className="text-sm font-black text-[#1A1C1E] leading-none">{profil.nama}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{profil.jabatan}</p>
        </div>
        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-slate-100 border border-[#E9ECEF] flex items-center justify-center overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="User" />
        </div>
      </div>
    </div>
  );
}