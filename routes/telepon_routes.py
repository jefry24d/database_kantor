from flask import Blueprint, render_template, request, redirect, url_for, flash
import sqlite3
from datetime import datetime

telepon_bp = Blueprint('telepon', __name__)

def get_db():
    conn = sqlite3.connect('arsip_kantor.db')
    conn.row_factory = sqlite3.Row
    return conn

# 1. Halaman Riwayat Telepon (Read)
@telepon_bp.route('/telepon')
def index():
    conn = get_db()
    logs = conn.execute('SELECT * FROM riwayat_telepon ORDER BY id DESC').fetchall()
    conn.close()
    return render_template('riwayat_telepon.html', logs=logs)

# 2. Process Simpan Telepon Masuk (Create)
@telepon_bp.route('/telepon/tambah', methods=['POST'])
def tambah_telepon():
    # Ambil tanggal & waktu otomatis kalau inputan kosong
    tanggal = request.form.get('tanggal') or datetime.now().strftime('%Y-%m-%d %H:%M')
    nama_penelepon = request.form['nama_penelepon']
    nama_instansi = request.form['nama_instansi']
    no_telepon = request.form['no_telepon']
    keperluan = request.form['keperluan']
    status = request.form['status']

    conn = get_db()
    conn.execute('''
        INSERT INTO riwayat_telepon (tanggal, nama_penelepon, nama_instansi, no_telepon, keperluan, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (tanggal, nama_penelepon, nama_instansi, no_telepon, keperluan, status))
    conn.commit()
    conn.close()
    
    return redirect(url_for('telepon.index'))

# 3. Process Hapus Log Telepon (Delete)
@telepon_bp.route('/telepon/hapus/<int:id>', methods=['POST'])
def hapus_telepon(id):
    conn = get_db()
    conn.execute('DELETE FROM riwayat_telepon WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return redirect(url_for('telepon.index'))