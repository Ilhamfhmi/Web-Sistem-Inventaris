-- Schema for Audit Readiness Dashboard (Updated)

-- 1. Create the main table for audit documents
CREATE TABLE audit_documents (
  id SERIAL PRIMARY KEY,
  unit TEXT NOT NULL, -- 'UP' or 'UK'
  nama_eviden TEXT NOT NULL,
  format_req TEXT NOT NULL, -- 'PDF', 'JPG', 'EXCEL', 'MP4'
  is_uploaded BOOLEAN DEFAULT FALSE,
  file_url TEXT,
  status TEXT DEFAULT 'missing', -- 'completed', 'missing', 'revision'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert initial checklist data
INSERT INTO audit_documents (unit, nama_eviden, format_req) VALUES
-- Unit UP (Unit Pengolah)
('UP', 'Surat Perintah Tugas', 'PDF'),
('UP', 'Laporan Kinerja Bulanan', 'EXCEL'),
('UP', 'Dokumentasi Penataan Arsip', 'JPG'),
('UP', 'Rencana Kerja Tahunan', 'PDF'),
('UP', 'Daftar Inventaris Barang', 'EXCEL'),
('UP', 'Laporan Keuangan Triwulan', 'EXCEL'),
('UP', 'Foto Kegiatan Musrenbang', 'JPG'),
('UP', 'SK Pembentukan Tim', 'PDF'),

-- Unit UK (Unit Kearsipan)
('UK', 'Berita Acara Pemusnahan', 'PDF'),
('UK', 'Video Sosialisasi Kearsipan', 'MP4'),
('UK', 'Daftar Arsip Dinamis', 'EXCEL'),
('UK', 'Pedoman Tata Naskah Dinas', 'PDF'),
('UK', 'Jadwal Retensi Arsip (JRA)', 'PDF'),
('UK', 'Daftar Arsip Aktif', 'EXCEL'),
('UK', 'Foto Ruang Simpan Arsip', 'JPG'),
('UK', 'Sertifikat Pengelolaan Arsip', 'JPG');

-- 3. Enable RLS and public access
ALTER TABLE audit_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and write" ON audit_documents FOR ALL USING (true);
