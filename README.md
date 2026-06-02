# SIDOKU — Sistem Informasi Dokumen Kecamatan

Aplikasi web untuk mengelola dan memonitor inventaris dokumen eviden kearsipan di tingkat kecamatan. Dibangun dengan Next.js dan Supabase.

---

## Fitur Utama

- **Dashboard** — ringkasan progress kepatuhan per unit dengan peta direktori (memory map)
- **Explorer Unit** — kelola dokumen eviden Unit Pengolah (UP) dan Unit Kearsipan (UK)
- **Upload Multi-File** — upload, preview, ganti, dan hapus file eviden per item
- **Catatan per Item** — tambahkan catatan/komentar pada setiap dokumen eviden
- **Deadline & Reminder** — set deadline per item dengan prioritas (Opsional / Normal / Mendesak)
- **Pencarian** — cari dokumen berdasarkan nama, unit, kategori, format, dan status
- **Autentikasi** — login/logout dengan Supabase Auth
- **Pengaturan** — ubah profil, ganti password, export data CSV/JSON

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Auth | Supabase Auth + `@supabase/ssr` |

---

## Struktur Folder

```
app/
├── (auth)/                  # Route group — halaman yang butuh sidebar
│   ├── layout.tsx           # Layout dengan sidebar + header
│   ├── page.tsx             # Dashboard
│   ├── unit/[unitId]/       # Explorer UP/UK
│   └── pencarian/           # Halaman pencarian
├── login/
│   └── page.tsx             # Halaman login
├── layout.tsx               # Root layout (html + body)
└── globals.css

components/
├── SidebarNav.tsx           # Navigasi sidebar
├── SidebarLogout.tsx        # Tombol logout
├── HeaderActions.tsx        # Notifikasi + pengaturan
└── FileUpload.tsx           # Komponen upload multi-file

lib/
└── supabase.ts              # Supabase browser client

middleware.ts                # Auth guard (proteksi route)
```

---

## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/Ilhamfhmi/Web-Sistem-Inventaris.git
cd Web-Sistem-Inventaris
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi environment

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Setup database Supabase

Jalankan file SQL berikut di **Supabase SQL Editor** secara berurutan:

1. `migration_final.sql` — data eviden UP dan UK
2. `fix_rls_policy.sql` — RLS policy tabel audit_documents
3. `fix_bucket_auditfiles.sql` — bucket storage + policy
4. `fix_uploaded_count.sql` — kolom uploaded_count dan file_urls
5. `add_catatan_deadline.sql` — tabel catatan + kolom deadline
6. `setup_auth.sql` — tabel profil user

### 5. Buat user admin

Di **Supabase Dashboard → Authentication → Users → Add User**:
- Email: `admin@sidoku.id`
- Password: `sidoku2025`
- Centang **Auto Confirm User**

### 6. Jalankan aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Struktur Database

### Tabel `audit_documents`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | integer | Primary key |
| unit | text | `UP` atau `UK` |
| category_code | text | Kode kategori (1.1 – 2.2) |
| item_code | text | Kode item eviden |
| nama_eviden | text | Nama dokumen |
| format_req | text | Format file (PDF, JPEG, MP4, MPEG) |
| kebutuhan_file | integer | Jumlah file yang dibutuhkan |
| uploaded_count | integer | Jumlah file yang sudah diupload |
| file_urls | text[] | Array URL semua file |
| status | text | `missing`, `partial`, `done` |
| deadline | date | Tanggal deadline |
| deadline_label | text | Prioritas deadline |

### Tabel `item_catatan`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | serial | Primary key |
| document_id | integer | FK ke audit_documents |
| penulis | text | Nama penulis catatan |
| isi | text | Isi catatan |
| created_at | timestamptz | Waktu dibuat |

---

## Screenshot

> Dashboard — ringkasan progress kepatuhan

> Explorer Unit — kelola dokumen per kategori

> Upload File — multi-file dengan tracking progress

---

## Lisensi

Proyek ini dibuat untuk keperluan administrasi kecamatan.  
© 2026 SIDOKU — Sistem Informasi Dokumen Kecamatan