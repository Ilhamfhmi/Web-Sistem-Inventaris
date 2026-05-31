'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Mail } from 'lucide-react';
import { clsx } from 'clsx';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.session) {
        // Set cookie via API route lalu redirect
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        // Hard redirect - paksa browser reload agar middleware baca cookie
        window.location.replace('/');
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login') || err.message?.includes('invalid_grant')) {
        setError('Email atau password salah.');
      } else {
        setError(err.message || 'Gagal masuk. Coba lagi.');
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center">
            <div className="w-14 h-14 bg-[#1E3A8A] rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-[#1E3A8A]/20">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-[#1E3A8A] tracking-tighter">SIDOKU</h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
              Administrasi Kecamatan
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E9ECEF] shadow-sm overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-[#F1F3F5]">
            <h2 className="text-xl font-black text-[#1A1C1E]">Masuk ke Sistem</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">
              Sistem Inventaris Dokumen Kecamatan
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="email"
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="admin@sidoku.id"
                  className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A]/30 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full bg-[#F8F9FB] border border-[#E9ECEF] rounded-xl py-3 pl-10 pr-11 text-sm font-medium focus:ring-2 focus:ring-[#1E3A8A]/10 focus:border-[#1E3A8A]/30 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-[11px] font-black text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E3A8A] text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 hover:bg-[#1E3A8A]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#1E3A8A]/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</>
              ) : (
                <><ShieldCheck size={16} /> Masuk ke SIDOKU</>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Sistem Informasi Dokumen Kecamatan
          </p>
          <p className="text-[10px] text-slate-300 font-medium">
            Hubungi admin jika lupa kata sandi
          </p>
        </div>
      </div>
    </div>
  );
}