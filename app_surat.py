import sqlite3
import sys
import questionary
import csv

def init_db():
    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS surat (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jenis_surat TEXT, -- 'MASUK' atau 'KELUAR'
            nomor_surat TEXT,
            perihal TEXT,
            bulan TEXT,        -- 'Januari' s/d 'Desember'
            uploaded_by TEXT
        )
    ''')

    try:
        cursor.execute("INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'Admin')")
        cursor.execute("INSERT INTO users (username, password, role) VALUES ('staf', 'staf123', 'Staf')")
        conn.commit()
    except sqlite3.IntegrityError:
        pass

    conn.commit()
    conn.close()

DAFTAR_BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

def login():
    while True:
        print("=" * 45)
        print(" 🔐 LOGIN SISTEM AGENDA SURAT KANTOR")
        print("=" * 45)
        username = input("Username : ")
        password = input("Password : ")

        conn = sqlite3.connect('arsip_kantor.db')
        cursor = conn.cursor()
        cursor.execute("SELECT username, role FROM users WHERE username=? AND password=?", (username, password))
        user = cursor.fetchone()
        conn.close()

        if user:
            print(f"\n😏 Login Berhasil! Selamat Datang, {user[0]} ({user[1]})\n")
            return user[0]
        else:
            print("\n🤡 Username atau Password Salah Bang!\n")

def input_surat(jenis, username):
    print(f"\n--- 📋 INPUT AGENDA SURAT {jenis} ---")

    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()

    while True:
        no_surat = input("Masukkan Nomor Surat : ").strip()

        if not no_surat:
            print("⚠️ [ANTI-BEBAL ALERT] Nomor Surat kagak boleh kosong cok! Isi yang bener!")
            continue

        cursor.execute("SELECT id FROM surat WHERE jenis_surat = ? AND nomor_surat = ?", (jenis, no_surat,))
        if cursor.fetchone():
            print(f"⚠️ [ANTI-BEBAL ALERT] Nomor Surat '{no_surat}' SUDAH ADA di Arsip Surat {jenis}! Cek lagi berkasnya!")
            continue

        break

    while True:
        perihal = input("Masukkan Perihal/Judul : ").strip()
        if not perihal:
            print("⚠️ [ANTI-BEBAL ALERT] Perihal/Judul surat kagak boleh kosong nyot!")
            continue

        break

    bulan_terpilih = questionary.select(
        "Pilih Bulan Arsip (Gunakan Panah Atas/Bawah + Enter):",
        choices=DAFTAR_BULAN
    ).ask()
    
    cursor.execute("""
        INSERT INTO surat (jenis_surat, nomor_surat, perihal, bulan, uploaded_by)
        VALUES (?, ?, ?, ?, ?)
    """, (jenis, no_surat, perihal, bulan_terpilih, username))
    conn.commit()
    conn.close()

    print(f"\n 🤓 SUCCES: Surat {jenis} berhasil disimpan di Arsip Bulan **{bulan_terpilih}**!\n")

def lihat_surat(jenis):
    print(f"\n--- 📒 DAFTAR AGENDA SURAT {jenis} ---")
    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()
    cursor.execute("SELECT nomor_surat, perihal, bulan, uploaded_by FROM surat WHERE jenis_surat=?", (jenis,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        print(f"Belum ada agenda surat {jenis.lower()} nyot.\n")
    else:
        for r in rows:
            print(f"📌 [Bulan: {r[2]}] | No: {r[0]} | Perihal: {r[1]} | By: {r[3]}")
        print()

def search_surat():
    print("\n--- 🔍FITUR CARI SURAT (SEARCH ENGINE) ---")
    keyword = input("Masukkan kata kunci perihal (misal: unair) : ").strip()

    if not keyword:
        print("⚠️ Kata kunci kagak boleh kosong nyot!\n")
        return

    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()

    query = """
        SELECT jenis_surat, nomor_surat, perihal, bulan, uploaded_by
        FROM surat
        WHERE perihal LIKE ? OR nomor_surat LIKE ?
    """
    search_pattern = f"%{keyword}%"
    cursor.execute(query, (search_pattern, search_pattern))
    rows = cursor.fetchall()
    conn.close()

    print(f"\n🔍 --- HASIL PENCARIAN UNTUK: '{keyword}' ---")
    if not rows:
        print(f"❌ Kagak nemu surat yang ada kata '{keyword}' cok.\n")
    else:
        for r in rows:
            print(f"📌 [{r[0]}] | [Bulan: {r[3]}] | No: {r[1]} | Perihal: {r[2]} | By: {r[4]}")
        print(f"✅ Ditemukan {len(rows)} data surat!\n")

def edit_surat():
    print("\n--- 📝 FITUR EDIT / SUNTING SURAT ---")

    jenis = questionary.select(
        "Pilih Jenis Surat yang mau diedit:",
        choices=["MASUK", "KELUAR"]
    ).ask()

    no_surat = input(f"Masukkan Nomor Surat {jenis} yang mau diedit: ").strip()

    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()

    cursor.execute("SELECT id, jenis_surat, nomor_surat, perihal, bulan FROM surat WHERE jenis_surat = ? AND nomor_surat =?", (jenis, no_surat,))
    surat = cursor.fetchone()

    if not surat:
        print(f"❌ Surat dengan nomor '{no_surat}' kagak ditemukan nyot!\n")
        conn.close()
        return

    print(f"\n📌 Surat Ditemukan: [{surat[1]}] No: {surat[2]} | Perihal: {surat[3]} | Bulan: {surat[4]}")

    no_baru = input(f"Nomor Surat Baru (Tekan Enter jika tetap '{surat[2]}'): ").strip() or surat[2]
    perihal_baru = input(f"Perihal Baru (Tekan Enter jika tetap '{surat[3]}'): ").strip() or surat[3]

    ganti_bulan = questionary.confirm(f"Mau ganti bulan arsip? (Saat ini: {surat[4]})").ask()
    if ganti_bulan:
        bulan_baru = questionary.select("Pilih Bulan Baru:", choices=DAFTAR_BULAN).ask()
    else:
        bulan_baru = surat[4]

    cursor.execute("""
        UPDATE surat
        SET nomor_surat = ?, perihal = ?, bulan = ?
        WHERE id = ?
    """, (no_baru, perihal_baru, bulan_baru, surat[0]))

    conn.commit()
    conn.close()
    print("✅ SUCCESS: Data surat berhasil di-update/disunting nyot!\n")

def delete_surat():
    print("\n--- 🚮 FITUR HAPUS SURAT ---")

    jenis = questionary.select(
        "Pilih Jenis Surat yang mau dihapus:",
        choices=["MASUK", "KELUAR"]
    ).ask()

    no_surat = input(f"Masukkan Nomor Surat {jenis} yang mau DIHAPUS: ").strip()

    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()

    cursor.execute("SELECT id, jenis_surat, nomor_surat, perihal FROM surat WHERE jenis_surat = ? AND nomor_surat = ?", (jenis, no_surat,))
    surat = cursor.fetchone()

    if not surat:
        print(f"❌ Surat dengan nomor '{no_surat}' kagak ditemukan nyot!\n")
        conn.close()
        return

    print(f"\n⚠️ AKAN MENGHAPUS: [{surat[1]}] No: {surat[2]} | Perihal: {surat[3]}")

    yakin = questionary.confirm("⚠️ YAKIN MAU HAPUS SURAT INI COK? (Data gak bisa balik lagi!)").ask()

    if yakin:
        cursor.execute("DELETE FROM surat WHERE id= ?", (surat[0],))
        conn.commit()
        print(f"🗑️ SUCCESS: Surat '{no_surat}' resmi dimusnahkan dari database!\n")
    else:
        print("🛡️ GAK JADI DIHAPUS SEYENG!\n")

    conn.close()

def statistik_arsip():
    print("\n" + "=" * 45)
    print("       🤡 STATISTIK & REKAP ARSIP KANTOR")
    print("\n" + "=" * 45)

    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM surat WHERE jenis_surat = 'MASUK'")
    total_masuk = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM surat WHERE jenis_surat = 'KELUAR'")
    total_keluar = cursor.fetchone()[0]

    total_semua = total_masuk + total_keluar

    print(f"📥 Total Surat Masuk  : {total_masuk} Surat")
    print(f"📤 Total Surat Keluar : {total_keluar} Surat")
    print(f"📒 Total Keseluruhan  : {total_semua} Surat")
    print("-" * 45)

    print("📆 RINCIAN SURAT PER BULAN:")
    cursor.execute("SELECT bulan, COUNT(*) FROM surat GROUP BY bulan")
    rekap_bulan = cursor.fetchall()
    conn.close()

    if not rekap_bulan:
        print(" (Belum ada data arsip surat cok)")
    else:
        for b, jumlah in rekap_bulan:
            print(f"  • {b:<10} : {jumlah} Surat")

    print("=" * 45 + "\n")

def export_to_excel():
    print("\n--- 🖨️ EXPORT REKAP SURAT KE EXCEL/CSV ---")

    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()

    cursor.execute("SELECT id, jenis_surat, nomor_surat, perihal, bulan, uploaded_by FROM surat")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        print("⚠️ Database masih kosong nyot, kagak ada yang bisa di-export!\n")
        return

    nama_file = "rekap_arsip_surat.csv"

    with open(nama_file, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['ID', 'Jenis Surat', 'Nomor Surat', 'Perihal/Judul', 'Bulan Arsip', 'Uploaded By'])
        writer.writerows(rows)

    print(f"📝 SUCCESS: Data berhasil di-export ke file **'{nama_file}'**!")
    print("🤡 Cek folder project lu, tinggal double-click filenya langsung kebuka di Excel! 🔢\n")

def manajemen_user(username_aktif):
    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()

    cursor.execute("SELECT role FROM users WHERE username = ?", (username_aktif,))
    role_aktif = cursor.fetchone()[0]

    if role_aktif != 'Admin':
        print("\n🚫 [AKSES DITOLAK] Fitur ini khusus ADMIN nyot! Staf biasa dilarang masuk!\n")
        conn.close()
        return

    while True:
        sub_user = questionary.select(
            "     👥 MENU MANAJEMEN USER (KHUSUS ADMIN)",
            choices=[
                "a. ➕ Tambah User / Staf Baru",
                "b. 🔑 Reset / Ganti Password User",
                "c. 📋 Lihat Daftar User",
                "⬅️ Kembali ke Dashboard Utama"
            ]
        ).ask()

        if "a." in sub_user:
            print("\n--- ➕ TAMBAH USER BARU ---")
            new_user = input("Masukkan Username Baru : ").strip()
            if not new_user:
                print("⚠️ Username kagak boleh kosong!\n")
                continue

            new_pass = input("Masukkan Password : ").strip()
            new_role = questionary.select("Pilih Role User:", choices=["Admin", "Staf"]).ask()

            try:
                cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", (new_user, new_pass, new_role))
                conn.commit()
                print(f"✅ SUCCESS: User '{new_user}' ({new_role}) berhasil dibuat!\n")
            except sqlite3.IntegrityError:
                print(f"❌ Username '{new_user}' UDAH ADA di database nyot!\n")

        # OPSI B: RESET PASSWORD
        elif "b." in sub_user:
            print("\n--- 🔑 RESET PASSWORD USER ---")
            target_user = input("Masukkan Username yang mau diganti passwordnya : ").strip()
            
            cursor.execute("SELECT id FROM users WHERE username = ?", (target_user,))
            if not cursor.fetchone():
                print(f"❌ User '{target_user}' kagak ditemukan nyot!\n")
                continue

            pass_baru = input(f"Masukkan Password Baru untuk '{target_user}' : ").strip()
            cursor.execute("UPDATE users SET password = ? WHERE username = ?", (pass_baru, target_user))
            conn.commit()
            print(f"✅ SUCCESS: Password untuk '{target_user}' berhasil diubah!\n")

        # OPSI C: LIHAT DAFTAR USER
        elif "c." in sub_user:
            print("\n--- 📋 DAFTAR USER TERDAFTAR ---")
            cursor.execute("SELECT username, role FROM users")
            users = cursor.fetchall()
            for u in users:
                print(f"👤 Username: {u[0]:<15} | Role: {u[1]}")
            print()

        elif "Kembali" in sub_user:
            break

    conn.close()            

def main_menu(username):
    while True:
        pilihan = questionary.select(
            "     📒 DASHBOARD UTAMA AGENDA SURAT 😏",
            choices=[
                "1. 📥 Agenda Surat Masuk",
                "2. 📤 Agenda Surat Keluar",
                "3. 🔍 Cari Surat",
                "4. 📝 Edit / Sunting Surat",
                "5. 🗑️ Hapus Surat (Delete)",
                "6. 📊 Statistik & Rekap Arsip",
                "7. 🖨️ Export Data ke Excel (CSV)",
                "8. 👥 Manajemen User (Admin Only)",
                "9. 🤡🚬 Logout / Keluar"
            ]
        ).ask()

        if "1." in pilihan:
            sub = questionary.select(
                " [ SURAT MASUK ]",
                choices=["a. Input Surat Masuk Baru", "b. Lihat Daftar Surat Masuk", "⬅️ Kembali"]
            ).ask()

            if "a." in sub:
                input_surat("MASUK", username)
            elif "b." in sub:
                lihat_surat("MASUK")

        elif "2." in pilihan:
            sub = questionary.select(
                " [ SURAT KELUAR ]",
                choices=["a. Input Surat Keluar Baru", "b. Lihat Daftar Surat Keluar", "⬅️ Kembali"]
            ).ask()

            if "a." in sub:
                input_surat("KELUAR", username)
            elif "b." in sub:
                lihat_surat("KELUAR")

        elif "3." in pilihan:
            search_surat()

        elif "4." in pilihan:
            edit_surat()

        elif "5." in pilihan:
            delete_surat()

        elif "6." in pilihan:
            statistik_arsip()

        elif "7." in pilihan:
            export_to_excel()

        elif "8." in pilihan:
            manajemen_user(username)

        elif '9.' in pilihan:
            print("\n😏 Sampai jumpa, Sayang!\n")
            sys.exit()

if __name__ == "__main__":
    init_db()
    user_active = login()
    if user_active:
        main_menu(user_active)