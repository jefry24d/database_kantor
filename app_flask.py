from flask import Flask, render_template, session, redirect, url_for
import sqlite3
from routes.auth_routes import auth_bp
from routes.surat_routes import surat_bp

app = Flask(__name__)
app.secret_key = 'arsip_kantor_rahasia_nyot'

# REGISTER BLUEPRINTS
app.register_blueprint(auth_bp)
app.register_blueprint(surat_bp)

# INITIALIZE DATABASE UTAMA
def init_db():
    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE, password TEXT, role TEXT,
            jabatan TEXT DEFAULT '-', unit_kerja TEXT DEFAULT '-', bio TEXT DEFAULT '-'
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS surat (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jenis_surat TEXT, nomor_surat TEXT, perihal TEXT, bulan TEXT, uploaded_by TEXT,
            nama_penerima TEXT, unit TEXT, no_pegawai TEXT, kelas TEXT DEFAULT '-', no_induk_siswa TEXT DEFAULT '-',
            ttl TEXT DEFAULT '-', alamat TEXT DEFAULT '-', isi_keterangan TEXT DEFAULT '-', nama_event TEXT,
            hari_tanggal TEXT, tempat TEXT, tgl_surat TEXT DEFAULT '-',
            lampiran TEXT DEFAULT '-', waktu TEXT DEFAULT '-', alamat_tempat TEXT DEFAULT '-',
            isi_custom_html TEXT DEFAULT '-', file_custom_path TEXT DEFAULT '-'
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS surat_masuk (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            no_disposisi TEXT,
            pengirim TEXT,
            tgl_diterima TEXT,
            tgl_surat TEXT,
            no_surat_pengirim TEXT,
            perihal TEXT,
            petugas TEXT,
            kode_surat TEXT DEFAULT 'DP',
            file_scan_path TEXT DEFAULT '-',
            instruksi_pimpinan TEXT DEFAULT '-'
            )
        ''')

        # Di dalam init_db() pada file app_flask.py
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            action TEXT NOT NULL,
            detail TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    try:
        cursor.execute("INSERT INTO users (username, password, role, jabatan, unit_kerja, bio) VALUES ('admin', 'admin123', 'Admin', 'Kepala Admin Data', 'Divisi IT / Data', 'Developer Utama Sistem Kearsipan')")
        cursor.execute("INSERT INTO users (username, password, role, jabatan, unit_kerja, bio) VALUES ('staf', 'staf123', 'Staf', 'Staf Administrasi', 'Divisi Kepegawaian', 'Staf Pencatat Surat Masuk & Keluar')")
        conn.commit()
    except sqlite3.IntegrityError:
        pass
    conn.close()

init_db()

@app.route('/')
def index():
    if 'username' not in session:
        return redirect(url_for('auth_bp.login_page'))
    return render_template('dashboard.html', username=session['username'], role=session['role'])

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)