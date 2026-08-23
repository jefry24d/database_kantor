import sqlite3

conn = sqlite3.connect('arsip_kantor.db')
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE surat ADD COLUMN is_approved INTEGER DEFAULT 0")
    conn.commit()
    print("✅ Berhasil menambahkan kolom is_approved ke database!")
except sqlite3.OperationalError:
    print("⚠️ Kolom is_approved ternyata sudah ada.")

conn.close()