import sqlite3

conn = sqlite3.connect('arsip_kantor.db')
cursor = conn.cursor()

try:
    # 1. Tambah kolom role ke tabel users (default untuk user lama adalah 'guru')
    cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'guru'")
    conn.commit()
    print("✅ Kolom 'role' berhasil ditambahkan ke tabel users!")
except sqlite3.OperationalError:
    print("⚠️ Kolom 'role' sudah ada di tabel users.")

# 2. Pastikan minimal ada 1 user dengan role 'admin' untuk ujicoba
# Ubah 'admin' di bawah sesuai username admin kamu kalau beda
cursor.execute("UPDATE users SET role = 'admin' WHERE username = 'admin'")
conn.commit()

print("✅ User 'admin' berhasil diset sebagai role 'admin'!")
conn.close()