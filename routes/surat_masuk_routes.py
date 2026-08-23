from flask import Blueprint, jsonify, request, session, render_template, redirect, url_for, current_app
import os
import time
import re
from datetime import datetime
from werkzeug.utils import secure_filename
from .utils import get_db, log_activity

surat_masuk_bp = Blueprint('surat_masuk_bp', __name__)

@surat_masuk_bp.route('/api/last-disposisi-number', methods=['GET'])
def get_last_disposisi_number():
    kode = request.args.get('kode', 'DP')
    tahun = datetime.now().year
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT no_disposisi FROM surat_masuk ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()

        next_no = 1
        if row and row['no_disposisi']:
            match = re.search(r'(\d+)', str(row['no_disposisi']))
            if match:
                next_no = int(match.group(1)) + 1

        formatted_no = f"{next_no:03d}/{kode}/{tahun}"
        return jsonify({'success': True, 'suggested_number': formatted_no})
    except Exception as e:
        return jsonify({'success': True, 'suggested_number': f"001/{kode}/{tahun}"})

@surat_masuk_bp.route('/api/surat-masuk', methods=['POST'])
def add_surat_masuk():
    nama_petugas = session.get('nama_lengkap') or request.form.get('petugas') or session.get('username', 'Admin')

    current_role = str(session.get('role','')).lower()
    if 'username' not in session or current_role == 'guru':
        log_activity(session.get('username', 'ANONYMOUS'), 'UNAUTHORIZED_ACCESS', 'Role GURU mencoba menginput Surat Masuk!')
        return jsonify({"status": "error", "message": "❗ AKSES DITOLAK: Guru tidak memiliki izin melihat/menginput Surat Masuk!"}), 403
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
        sifat_surat = request.form.get('sifat_surat', 'Segera')
        diteruskan_ke = request.form.get('diteruskan_ke', '-')
        instruksi_pimpinan = request.form.get('instruksi_pimpinan', '-')

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
                sifat_surat, diteruskan_ke, file_scan_path, instruksi_pimpinan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (no_disposisi, pengirim, tgl_diterima, tgl_surat, 
            no_surat_pengirim, perihal, nama_petugas, kode_surat, 
            sifat_surat, diteruskan_ke, file_scan_path, instruksi_pimpinan))

        conn.commit()
        conn.close()

        log_activity(
            nama_petugas, 
            'TAMBAH_SURAT_MASUK', 
            f'Menambah Surat Masuk No Disposisi: {no_disposisi} | Pengirim: {pengirim} | Perihal: {perihal}'
        )

        return jsonify({"status": "success", "message": "Surat Masuk berhasil disimpan!"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@surat_masuk_bp.route('/api/surat-masuk', methods=['GET'])
def get_surat_masuk():
    current_role = str(session.get('role','')).lower()
    if 'username' not in session or current_role == 'guru':
        log_activity(session.get('username', 'ANONYMOUS'), 'UNAUTHORIZED_ACCESS', 'Role GURU mencoba mengambil data Surat Masuk!')
        return jsonify({"status": "error", "message": "❗ AKSES DITOLAK: Guru tidak memiliki izin melihat Surat Masuk!"}), 403
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM surat_masuk ORDER BY id DESC")
        rows = cursor.fetchall()
        
        surat_list = [dict(row) for row in rows]
        conn.close()
        return jsonify(surat_list)

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@surat_masuk_bp.route('/cetak-disposisi/<int:surat_id>')
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

    log_activity(session.get('username'), 'CETAK_DISPOSISI', f"Mencetak Disposisi No: {row['no_disposisi']} (Pengirim: {row['pengirim']})")
    return render_template('disposisi_print.html', surat=dict(row))

@surat_masuk_bp.route('/api/surat-masuk/<int:id>', methods=['DELETE'])
def delete_surat_masuk(id):
    if 'username' not in session:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT no_disposisi, perihal FROM surat_masuk WHERE id = ?", (id,))
    row = cursor.fetchone()

    if row:
        no_disp, perihal = row['no_disposisi'], row['perihal']
        cursor.execute("DELETE FROM surat_masuk WHERE id = ?", (id,))
        conn.commit()
        conn.close()

        log_activity(session.get('username', 'Admin'), 'HAPUS_SURAT_MASUK', f'Menghapus Surat Masuk ID: {id} | No Disp: {no_disp} | Perihal: {perihal}')
        return jsonify({'status': 'success', 'message': 'Surat masuk berhasil dihapus nyot!'})
    
    conn.close()
    return jsonify({'status': 'error', 'message': 'Surat masuk tidak ditemukan!'}), 404