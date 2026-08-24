import sqlite3

conn = sqlite3.connect('arsip_kantor.db')
cursor = conn.cursor()

cursor.execute('''
    CREATE TABLE IF NOT EXISTS riwayat_telepon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT NOT NULL,
        nama_penelepon TEXT NOT NULL,
        nama_instansi TEXT NOT NULL,
        no_telepon TEXT NOT NULL,
        keperluan TEXT NOT NULL,
        status TEXT NOT NULL
    )
''')

conn.commit()
conn.close()
print("Tabel riwayat_telepon berhasil dibuat bwuosss!")