from flask import Blueprint, jsonify, request
from .utils import get_db

common_bp = Blueprint('common_bp', __name__)

@common_bp.route('/api/search')
def search_surat():
    keyword = request.args.get('keyword', '').strip()
    if not keyword:
        return jsonify([])
        
    conn = get_db()
    cursor = conn.cursor()
    pattern = f"%{keyword}%"
    
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

@common_bp.route('/api/statistik')
def get_statistik():
    conn = get_db()
    cursor = conn.cursor()
    c_masuk = cursor.execute("SELECT COUNT(*) FROM surat_masuk").fetchone()[0]
    c_keluar = cursor.execute("SELECT COUNT(*) FROM surat").fetchone()[0]
    conn.close()
    return jsonify({'masuk': c_masuk, 'keluar': c_keluar, 'total': c_masuk + c_keluar})

@common_bp.route('/api/admin/logs', methods=['GET'])
def get_activity_logs():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT username, action, detail, datetime(created_at, "localtime") FROM activity_logs ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    
    logs = [{'username': r[0], 'action': r[1], 'detail': r[2], 'created_at': r[3]} for r in rows]
    return jsonify(logs)