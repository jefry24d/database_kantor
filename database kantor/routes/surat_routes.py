from flask import Blueprint, jsonify, request, session, render_template, redirect, url_for, current_app, send_from_directory
import sqlite3
import os
import time
from werkzeug.utils import secure_filename

surat_bp = Blueprint('surat_bp', __name__)

# Opsi format file yang dibolehkan untuk upload
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# KONEKSI DATABASE TUNGGAL (KAGAK DOBEL LAGI)
def get_db():
    conn = sqlite3.connect('arsip_kantor.db')
    conn.row_factory = sqlite3.Row
    return conn

# ==========================================
# 1. ROUTE CETAK / VIEW SURAT DINAMIS
# ==========================================
@surat_bp.route('/cetak/<int:surat_id>')
def cetak_surat(surat_id):
    if 'username' not in session:
        return redirect(url_for('auth_bp.login_page'))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM surat WHERE id = ?", (surat_id,))
    surat = cursor.fetchone()
    conn.close()

    if not surat:
        return "Surat tidak ditemukan nyot!", 404

    if surat['jenis_surat'] == 'KETERANGAN':
        return render_template('cetak_keterangan.html', surat=surat)
    elif surat['jenis_surat'] == 'TUGAS':
        return render_template('cetak_tugas.html', surat=surat)
    elif surat['jenis_surat'] == 'UNDANGAN':
        return render_template('cetak_undangan.html', surat=surat)
    elif surat['jenis_surat'] == 'CUSTOM_EDITOR':
        return render_template('cetak_custom.html', surat=surat)
    
    return render_template('cetak_surat.html', surat=surat)

# ==========================================
# 2. API SURAT KELUAR & CUSTOM (ADD & GET)
# ==========================================
@surat_bp.route('/api/surat', methods=['POST'])
def add_surat():
    if request.content_type and 'multipart/form-data' in request.content_type:
        jenis = request.form.get('jenis', 'CUSTOM_FILE')
        no_surat = request.form.get('nomor_surat', '').strip()
        perihal = request.form.get('perihal', '').strip()
        bulan = request.form.get('bulan', 'Januari')
        tgl_surat = request.form.get('tgl_surat', '')

        if not no_surat or not perihal:
            return jsonify({'success': False, 'message': 'Nomor Surat & Perihal kagak boleh kosong!'})

        file = request.files.get('file_surat')
        filename_saved = '-'

        if file and file.filename != '':
            if allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filename_saved = f"custom_{no_surat.replace('/', '_')}_{filename}"
                upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                file.save(os.path.join(upload_folder, filename_saved))
            else:
                return jsonify({'success': False, 'message': 'Format file kagak didukung nyot!'})

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO surat (jenis_surat, nomor_surat, perihal, bulan, uploaded_by, tgl_surat, file_custom_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (jenis, no_surat, perihal, bulan, session.get('username', 'Admin'), tgl_surat, filename_saved))

        new_id = cursor.lastrowid
        conn.commit()
        conn.close()

        log_activity(session.get('username', 'Admin'), 'TAMBAH_SURAT', f'Mengunggah Custom File: {no_surat} - {perihal}')

        return jsonify({'success': True, 'message': 'File Custom Surat berhasil diupload!', 'surat_id': new_id})

    else:
        data = request.json
        jenis = data.get('jenis')
        no_surat = data.get('nomor_surat', '').strip()
        perihal = data.get('perihal', '').strip()
        bulan = data.get('bulan')

        nama_penerima = data.get('nama_penerima', '')
        unit = data.get('unit', '')
        no_pegawai = data.get('no_pegawai', '')
        ttl = data.get('ttl', '')
        alamat = data.get('alamat', '')
        isi_keterangan = data.get('isi_keterangan', '')
        
        tgl_surat = data.get('tgl_surat', '')
        lampiran = data.get('lampiran', '-')
        waktu = data.get('waktu', '')
        alamat_tempat = data.get('alamat_tempat', '')

        nama_event = data.get('nama_event', '')
        hari_tanggal = data.get('hari_tanggal', '')
        tempat = data.get('tempat', '')
        isi_custom_html = data.get('isi_custom_html', '-')

        if not no_surat or not perihal:
            return jsonify({'success': False, 'message': 'Nomor Surat & Perihal kagak boleh kosong!'})

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO surat (jenis_surat, nomor_surat, perihal, bulan, uploaded_by, nama_penerima, unit, no_pegawai, ttl, alamat, isi_keterangan, nama_event, hari_tanggal, tempat, tgl_surat, lampiran, waktu, alamat_tempat, isi_custom_html)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (jenis, no_surat, perihal, bulan, session.get('username', 'Admin'), nama_penerima, unit, no_pegawai, ttl, alamat, isi_keterangan, nama_event, hari_tanggal, tempat, tgl_surat, lampiran, waktu, alamat_tempat, isi_custom_html))

        new_id = cursor.lastrowid
        conn.commit()
        conn.close()

        log_activity(session.get('username', 'Admin'), 'TAMBAH_SURAT', f'Membuat Surat [{jenis}]: {no_surat} - {perihal}')

        return jsonify({'success': True, 'message': 'Surat berhasil disimpan!', 'surat_id': new_id})

@surat_bp.route('/api/eksplorasi')
def get_eksplorasi():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, jenis_surat, nomor_surat, perihal, bulan, uploaded_by, nama_penerima, unit, no_pegawai, hari_tanggal, tempat, file_custom_path, tgl_surat
        FROM surat
        ORDER BY id DESC
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(rows)

@surat_bp.route('/api/search')
def search_surat():
    keyword = request.args.get('keyword', '').strip()
    if not keyword:
        return jsonify([])
        
    conn = get_db()
    cursor = conn.cursor()
    pattern = f"%{keyword}%"
    
    # SEARCH BODO AMAT: Hajar semua kolom Surat Keluar & Surat Masuk
    cursor.execute("""
        SELECT 'KELUAR' as tipe, id, jenis_surat, nomor_surat, perihal, 
               COALESCE(nama_penerima, '-') as pihak, uploaded_by as petugas, tgl_surat
        FROM surat 
        WHERE nomor_surat LIKE ? OR perihal LIKE ? OR nama_penerima LIKE ? 
           OR unit LIKE ? OR no_pegawai LIKE ? OR ttl LIKE ? OR alamat LIKE ? 
           OR isi_keterangan LIKE ? OR nama_event LIKE ? OR tempat LIKE ? OR uploaded_by LIKE ?

        UNION ALL

        SELECT 'MASUK' as tipe, id, kode_surat as jenis_surat, no_surat_pengirim as nomor_surat, perihal, 
               pengirim as pihak, petugas, tgl_surat
        FROM surat_masuk 
        WHERE no_surat_pengirim LIKE ? OR perihal LIKE ? OR pengirim LIKE ? 
           OR no_disposisi LIKE ? OR petugas LIKE ? OR instruksi_pimpinan LIKE ? OR kode_surat LIKE ?

        LIMIT 15
    """, (pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern,
          pattern, pattern, pattern, pattern, pattern, pattern, pattern))
    
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(rows)

@surat_bp.route('/api/statistik')
def get_statistik():
    conn = get_db()
    cursor = conn.cursor()
    c_masuk = cursor.execute("SELECT COUNT(*) FROM surat_masuk").fetchone()[0]
    c_keluar = cursor.execute("SELECT COUNT(*) FROM surat").fetchone()[0]
    conn.close()
    return jsonify({'masuk': c_masuk, 'keluar': c_keluar, 'total': c_masuk + c_keluar})

# ==========================================
# 3. API MODUL SURAT MASUK & DISPOSISI
# ==========================================
@surat_bp.route('/api/surat-masuk', methods=['POST'])
def add_surat_masuk():
    try:
        conn = get_db()
        cursor = conn.cursor()

        no_disposisi = request.form.get('no_disposisi')
        pengirim = request.form.get('pengirim')
        tgl_diterima = request.form.get('tgl_diterima')
        tgl_surat = request.form.get('tgl_surat')
        no_surat_pengirim = request.form.get('no_surat_pengirim')
        perihal = request.form.get('perihal')
        petugas = request.form.get('petugas')
        kode_surat = request.form.get('kode_surat', 'DP')
        instruksi_pimpinan = request.form.get('instruksi_pimpinan', '-')

        # Upload file scan diseragamkan ke static/uploads
        file_scan_path = '-'
        if 'file_scan' in request.files:
            file = request.files['file_scan']
            if file and file.filename != '':
                filename = secure_filename(f"masuk_{int(time.time())}_{file.filename}")
                upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                file.save(os.path.join(upload_folder, filename))
                file_scan_path = filename

        cursor.execute('''
            INSERT INTO surat_masuk (
                no_disposisi, pengirim, tgl_diterima, tgl_surat, 
                no_surat_pengirim, perihal, petugas, kode_surat, 
                file_scan_path, instruksi_pimpinan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (no_disposisi, pengirim, tgl_diterima, tgl_surat, 
              no_surat_pengirim, perihal, petugas, kode_surat, 
              file_scan_path, instruksi_pimpinan))

        conn.commit()
        conn.close()

        log_activity(session.get('username', 'Admin'), 'TAMBAH_SURAT_MASUK', f'Menambah Surat Masuk No Disposisi: {no_disposisi} dari {pengirim}')

        return jsonify({"status": "success", "message": "Surat Masuk berhasil disimpan!"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@surat_bp.route('/api/surat-masuk', methods=['GET'])
def get_surat_masuk():
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM surat_masuk ORDER BY id DESC")
        rows = cursor.fetchall()
        
        surat_list = []
        for row in rows:
            surat_list.append({
                "id": row["id"],
                "no_disposisi": row["no_disposisi"],
                "pengirim": row["pengirim"],
                "tgl_diterima": row["tgl_diterima"],
                "tgl_surat": row["tgl_surat"],
                "no_surat_pengirim": row["no_surat_pengirim"],
                "perihal": row["perihal"],
                "petugas": row["petugas"],
                "kode_surat": row["kode_surat"],
                "file_scan_path": row["file_scan_path"],
                "instruksi_pimpinan": row["instruksi_pimpinan"]
            })
            
        conn.close()
        return jsonify(surat_list)

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# 🖨️ ROUTE CETAK LEMBAR DISPOSISI SURAT MASUK (PASANG DI SINI NYOT!)
@surat_bp.route('/cetak-disposisi/<int:surat_id>')
def cetak_disposisi(surat_id):
    if 'username' not in session:
        return redirect(url_for('auth_bp.login_page'))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM surat_masuk WHERE id = ?", (surat_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return "Surat Masuk kagak nemu nyot!", 404

    # Convert row SQLite ke Dictionary
    surat = dict(row)
    return render_template('disposisi_print.html', surat=surat)

# 🗑️ DELETE SURAT MASUK
@surat_bp.route('/api/surat-masuk/<int:id>', methods=['DELETE'])
def delete_surat_masuk(id):
    if 'username' not in session:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM surat_masuk WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    log_activity(session.get('username', 'Admin'), 'HAPUS_SURAT_MASUK', f'Menghapus Surat Masuk ID: {id}')
    
    return jsonify({'status': 'success', 'message': 'Surat masuk berhasil dihapus nyot!'})

# 🗑️ DELETE SURAT KELUAR / CUSTOM
@surat_bp.route('/api/surat/<int:id>', methods=['DELETE'])
def delete_surat_keluar(id):
    if 'username' not in session:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM surat WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    log_activity(session.get('username', 'Admin'), 'HAPUS_SURAT', f'Menghapus Surat Keluar ID: {id}')
    
    return jsonify({'status': 'success', 'message': 'Surat keluar berhasil dihapus nyot!'})

def log_activity(username, action, detail):
    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO activity_logs (username, action, detail) VALUES (?, ?, ?)',
        (username, action, detail)
    )
    conn.commit()
    conn.close()

@surat_bp.route('/api/admin/logs', methods=['GET'])
def get_activity_logs():
    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()
    cursor.execute('SELECT username, action, detail, datetime(created_at, "localtime") FROM activity_logs ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    
    logs = [{'username': r[0], 'action': r[1], 'detail': r[2], 'created_at': r[3]} for r in rows]
    return jsonify(logs)