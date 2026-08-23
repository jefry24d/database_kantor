import sqlite3
import os

DB_NAME = 'arsip_kantor.db'

def fix_database():
    if not os.path.exists(DB_NAME):
        print(f"❌ File database {DB_NAME} gak ditemukan, Cok!")
        return

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    print("🛠️ Memulai proses auto-fix database...\n")

    # 1. FIX TABEL SURAT (Cek & Tambah kolom is_approved jika belum ada)
    cursor.execute("PRAGMA table_info(surat)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'is_approved' not in columns:
        try:
            cursor.execute("ALTER TABLE surat ADD COLUMN is_approved INTEGER DEFAULT 0")
            print("✅ Kolom 'is_approved' berhasil ditambahkan ke tabel 'surat'!")
        except Exception as e:
            print(f"⚠️ Gagal migrasi kolom is_approved: {e}")
    else:
        print("ℹ️ Kolom 'is_approved' sudah ada di tabel 'surat' (Aman).")

    # 2. FIX TABEL USERS (Cek & Tambah kolom nama_lengkap jika belum ada)
    cursor.execute("PRAGMA table_info(users)")
    user_columns = [col[1] for col in cursor.fetchall()]

    if 'nama_lengkap' not in user_columns:
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN nama_lengkap TEXT DEFAULT '-'")
            print("✅ Kolom 'nama_lengkap' berhasil ditambahkan ke tabel 'users'!")
        except Exception as e:
            print(f"⚠️ Gagal migrasi kolom nama_lengkap: {e}")
    else:
        print("ℹ️ Kolom 'nama_lengkap' sudah ada di tabel 'users' (Aman).")

    # 3. AUTO-UPDATE NAMA ASLI DEFAULT (Biar data user awal gak kosong)
    user_updates = [
        ('Kepala Sekolah Utama', 'admin'),
        ('Dwi Adhika Mintardi, S.Pd.', 'kepsek'),
        ('Staf Tata Usaha', 'staf'),
        ('Naili Mufarohah', 'guru')
    ]

    for nama, username in user_updates:
        cursor.execute(
            "UPDATE users SET nama_lengkap = ? WHERE username = ? AND (nama_lengkap IS NULL OR nama_lengkap = '-' OR nama_lengkap = '')",
            (nama, username)
        )

    conn.commit()
    conn.close()
    print("\n🎉 JOSS! Database kamu udah aman, konsisten, dan siap pakai!")

if __name__ == '__main__':
    fix_database()