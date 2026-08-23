import sqlite3
import os
import time

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'}

def get_db():
    conn = sqlite3.connect('arsip_kantor.db')
    conn.row_factory = sqlite3.Row
    return conn

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def format_tanggal_indo(tgl_str):
    if not tgl_str or tgl_str == '-':
        return '18 Agustus 2026'
    
    bulan_indo = {
        '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
        '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
        '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    }
    
    try:
        parts = tgl_str.split('-')
        if len(parts) == 3:
            thn, bln, tgl = parts
            return f"{int(tgl)} {bulan_indo.get(bln, bln)} {thn}"
    except Exception:
        pass
        
    return tgl_str

def log_activity(username, action, detail):
    conn = sqlite3.connect('arsip_kantor.db')
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO activity_logs (username, action, detail) VALUES (?, ?, ?)',
        (username, action, detail)
    )
    conn.commit()
    conn.close()