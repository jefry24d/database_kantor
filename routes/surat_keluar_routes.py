from flask import Blueprint, jsonify, request, session, render_template, redirect, url_for, current_app, send_from_directory
import os
import time
import re
from werkzeug.utils import secure_filename
from .utils import get_db, allowed_file, format_tanggal_indo, log_activity

surat_keluar_bp = Blueprint('surat_keluar_bp', __name__)

@surat_keluar_bp.route('/surat/cetak/<int:surat_id>')
def cetak_surat(surat_id):
    if 'username' not in session:
        return redirect(url_for('auth_bp.login_page'))

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM surat WHERE id = ?", (surat_id,))
    surat = cursor.fetchone()
    conn.close()

    if not surat:
        return "Surat tidak ditemukan!", 404

    surat_dict = dict(surat)
    surat_dict['tgl_surat_indo'] = format_tanggal_indo(surat_dict.get('tgl_surat'))

    if surat_dict.get('jenis_surat') == 'CUSTOM_FILE' and surat_dict.get('file_custom_path') != '-':
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        return send_from_directory(upload_folder, surat_dict['file_custom_path'])

    if surat_dict['jenis_surat'] == 'REKOMENDASI_KOLEKTIF':
        raw_siswa = surat_dict.get('isi_keterangan', '') or ''
        siswa_list = []
        for line in raw_siswa.strip().split('\n'):
            if line.strip():
                parts = [p.strip() for p in line.split(',')]
                siswa_list.append({
                    'nama': parts[0] if len(parts) > 0 else '-',
                    'kelas': parts[1] if len(parts) > 1 else '-',
                    'nis': parts[2] if len(parts) > 2 else '-'
                })
        surat_dict['siswa_list'] = siswa_list
        return render_template('cetak_rekomendasi_kolektif.html', surat=surat_dict)

    elif surat['jenis_surat'] == 'KETERANGAN':
        return render_template('cetak_keterangan.html', surat=surat_dict)
    elif surat['jenis_surat'] == 'TUGAS':
        return render_template('cetak_tugas.html', surat=surat_dict)
    elif surat['jenis_surat'] == 'UNDANGAN':
        return render_template('cetak_undangan.html', surat=surat_dict)
    elif surat_dict['jenis_surat'] == 'KETERANGAN_PIP':
        return render_template('cetak_keterangan_pip.html', surat=surat_dict)
    elif surat['jenis_surat'] == 'SARPRAS':
        return render_template('cetak_sarpras.html', surat=surat_dict)
    elif surat['jenis_surat'] == 'CUSTOM_EDITOR':
        return render_template('cetak_custom.html', surat=surat_dict)
    
    return render_template('cetak_surat.html', surat=surat_dict)

@surat_keluar_bp.route('/surat/add', methods=['POST'])
def add_surat():
    pembuat_surat = session.get('nama_lengkap') or session.get('username', 'Admin')

    if request.content_type and 'multipart/form-data' in request.content_type:
        jenis = request.form.get('jenis', 'CUSTOM_FILE')
        no_surat = request.form.get('nomor_surat', '').strip()
        perihal = request.form.get('perihal', '').strip()
        nama_penerima = request.form.get('nama_penerima', '').strip()
        tgl_surat = request.form.get('tgl_surat', '')

        if not no_surat or not perihal:
            return jsonify({'success': False, 'message': 'Nomor Surat & Perihal kagak boleh kosong!'})

        file = request.files.get('file_surat')
        filename_saved = '-'

        if file and file.filename != '':
            if allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filename_saved = f"custom_{int(time.time())}_{filename}"
                upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                file.save(os.path.join(upload_folder, filename_saved))
            else:
                return jsonify({'success': False, 'message': 'Format file kagak didukung nyot!'})

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO surat (jenis_surat, nomor_surat, perihal, nama_penerima, uploaded_by, tgl_surat, file_custom_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (jenis, no_surat, perihal, nama_penerima, pembuat_surat, tgl_surat, filename_saved))

        new_id = cursor.lastrowid
        conn.commit()
        conn.close()

        log_activity(pembuat_surat, 'TAMBAH_SURAT', f'Mengunggah Custom File: {no_surat} - {perihal}')
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
        kelas = data.get('kelas', '')
        no_induk_siswa = data.get('no_induk_siswa', '')
        
        ttl = data.get('ttl', '')
        alamat = data.get('alamat', '')
        isi_keterangan = data.get('isi_keterangan', '')
        keterangan_acara = data.get('keterangan_acara', '')
        
        tgl_surat = data.get('tgl_surat', '')
        lampiran = data.get('lampiran', '-')
        waktu = data.get('waktu', '')
        alamat_tempat = data.get('alamat_tempat', '')

        nama_event = data.get('nama_event', '')
        hari_tanggal = data.get('hari_tanggal', '')
        tempat = data.get('tempat', '')
        isi_custom_html = data.get('isi_custom_html', '-')

        nama_bank = data.get('nama_bank', '')
        no_rekening = data.get('no_rekening', '')
        virtual_account = data.get('virtual_account', '')

        if not no_surat or not perihal:
            return jsonify({'success': False, 'message': 'Nomor Surat & Perihal kagak boleh kosong!'})

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO surat (
                jenis_surat, nomor_surat, perihal, bulan, uploaded_by, 
                nama_penerima, unit, no_pegawai, kelas, no_induk_siswa, 
                ttl, alamat, isi_keterangan, keterangan_acara, nama_event, 
                hari_tanggal, tempat, tgl_surat, lampiran, waktu, 
                alamat_tempat, isi_custom_html, nama_bank, no_rekening, virtual_account
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            jenis, no_surat, perihal, bulan, pembuat_surat, 
            nama_penerima, unit, no_pegawai, kelas, no_induk_siswa, 
            ttl, alamat, isi_keterangan, keterangan_acara, nama_event, 
            hari_tanggal, tempat, tgl_surat, lampiran, waktu, 
            alamat_tempat, isi_custom_html, nama_bank, no_rekening, virtual_account
        ))
        
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()

        log_activity(pembuat_surat, 'TAMBAH_SURAT', f'Membuat Surat [{jenis}]: {no_surat} - {perihal}')
        return jsonify({'success': True, 'message': 'Surat berhasil disimpan!', 'surat_id': new_id})

@surat_keluar_bp.route('/api/eksplorasi')
@surat_keluar_bp.route('/api/surat-keluar')
def get_eksplorasi():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            s.id,
            s.jenis_surat,
            s.nomor_surat,
            s.perihal,
            s.bulan,

            COALESCE(u.nama_lengkap, s.uploaded_by) AS uploaded_by,

            s.nama_penerima,
            s.unit,
            s.no_pegawai,
            s.hari_tanggal,
            s.tempat,
            s.file_custom_path,
            s.tgl_surat
        FROM surat s
        LEFT JOIN users u
            ON u.username = s.uploaded_by
        ORDER BY s.id DESC
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(rows)

@surat_keluar_bp.route('/api/last-number', methods=['GET'])
def get_last_number():
    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT nomor_surat FROM surat ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()

        if row and row[0]:
            match = re.search(r'/(\d+)\.', row[0])
            if match:
                last_no = match.group(1)
                next_no = str(int(last_no) + 1).zfill(len(last_no))
                return jsonify({
                    "success": True,
                    "last_number": last_no,
                    "suggested_number": next_no
                })
            return jsonify({"success": True, "last_number": row[0], "suggested_number": "001"})

        return jsonify({"success": True, "last_number": "Belum ada", "suggested_number": "001"})

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "last_number": "Error",
            "suggested_number": "001"
        }), 500

@surat_keluar_bp.route('/api/surat/approve/<int:surat_id>', methods=['POST'])
def approve_surat(surat_id):
    current_role = str(session.get('role','')).lower()
    if 'username' not in session or current_role not in ['admin', 'kepsek']:
        pembuat_action = session.get('nama_lengkap') or session.get('username', 'ANONYMOUS')
        log_activity(pembuat_action, 'UNAUTHORIZED_ACCESS', f'Mencoba approve Surat Keluar ID: {surat_id}')
        return jsonify({"success": False, "message": "❗ AKSES DITOLAK!"}), 403

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT jenis_surat, nomor_surat FROM surat WHERE id = ?", (surat_id,))
        row = cursor.fetchone()

        if not row:
            conn.close()
            return jsonify({"success": False, "message": "Surat tidak ditemukan!"}), 404

        if row['jenis_surat'] == 'CUSTOM_EDITOR':
            conn.close()
            return jsonify({"success": False, "message": "Surat Custom tidak memerlukan approval!"}), 400

        cursor.execute("UPDATE surat SET is_approved = 1 WHERE id = ?", (surat_id,))
        conn.commit()
        conn.close()

        pembuat_action = session.get('nama_lengkap') or session.get('username')
        log_activity(pembuat_action, 'APPROVE_SURAT', f"Menyetujui Surat Keluar No: {row['nomor_surat']} (ID: {surat_id})")
        return jsonify({"success": True, "message": "Surat berhasil di-approve!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@surat_keluar_bp.route('/api/surat/<int:id>', methods=['DELETE'])
def delete_surat_keluar(id):
    current_role = str(session.get('role','')).lower()
    pembuat_action = session.get('nama_lengkap') or session.get('username', 'ANONYMOUS')

    if 'username' not in session or current_role not in ['admin', 'kepsek']:
        log_activity(pembuat_action, 'UNAUTHORIZED_ACCESS', f'Mencoba hapus Surat Keluar ID: {id}')
        return jsonify({"success": False, "message": "❗ AKSES DITOLAK!"}), 403
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT nomor_surat, perihal FROM surat WHERE id = ?", (id,))
    row = cursor.fetchone()

    if row:
        no_surat, perihal = row['nomor_surat'], row['perihal']
        cursor.execute("DELETE FROM surat WHERE id = ?", (id,))
        conn.commit()
        conn.close()

        log_activity(pembuat_action, 'HAPUS_SURAT', f'Menghapus Surat Keluar ID: {id} | No: {no_surat} | Perihal: {perihal}')
        return jsonify({'status': 'success', 'message': 'Surat keluar berhasil dihapus nyot!'})
    
    conn.close()
    return jsonify({'status': 'error', 'message': 'Surat tidak ditemukan!'}), 404