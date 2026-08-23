from flask import Blueprint, jsonify, request, session, render_template, redirect, url_for
import sqlite3
from .utils import get_db, log_activity

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login_page():
    if request.method == 'POST':
        data = request.json or {}
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT username, role, nama_lengkap FROM users WHERE username=? AND password=?", (username, password))
        user = cursor.fetchone()
        conn.close()

        if user:
            nama_asli = user['nama_lengkap'] if user['nama_lengkap'] and user['nama_lengkap'].strip() != '' else user['username']
            session['username'] = user['username']
            session['role'] = user['role']
            session['nama_lengkap'] = nama_asli
            
            log_activity(nama_asli, 'LOGIN_SUCCESS', f"User {nama_asli} ({user['role']}) berhasil login.")
            return jsonify({'success': True, 'message': f"Selamat datang, {nama_asli}!"})
        else:
            log_activity(username or 'ANONYMOUS', 'LOGIN_FAILED', f"Percobaan login gagal untuk username: '{username}'")
            return jsonify({'success': False, 'message': 'Username atau Password Salah Cok!'})

    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    nama_user = session.get('nama_lengkap', session.get('username', 'ANONYMOUS'))
    log_activity(nama_user, 'LOGOUT', f"User {nama_user} telah logout.")
    session.clear()
    return redirect(url_for('auth_bp.login_page'))

@auth_bp.route('/api/profile', methods=['GET'])
def get_profile():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Belum login'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, nama_lengkap, role, jabatan, unit_kerja, bio FROM users WHERE username = ?", (session['username'],))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify(dict(user))
    return jsonify({'success': False, 'message': 'User tidak ditemukan'}), 404

@auth_bp.route('/api/profile/update-info', methods=['POST'])
def update_profile_info():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Belum login'}), 401
        
    data = request.json or {}
    new_username = data.get('username', '').strip()
    nama_lengkap = data.get('nama_lengkap', '').strip()
    jabatan = data.get('jabatan', '').strip()
    unit_kerja = data.get('unit_kerja', '').strip()
    bio = data.get('bio', '').strip()

    if len(new_username) < 3:
        return jsonify({'success': False, 'message': '⚠️ Username minimal 3 karakter asli cok!'})

    old_username = session['username']
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET username = ?, nama_lengkap = ?, jabatan = ?, unit_kerja = ?, bio = ? WHERE username = ?",
                       (new_username, nama_lengkap, jabatan, unit_kerja, bio, old_username))
        conn.commit()
        
        session['username'] = new_username
        session['nama_lengkap'] = nama_lengkap if nama_lengkap else new_username
        conn.close()
        
        log_activity(session['nama_lengkap'], 'UPDATE_PROFILE', f"Mengubah profil. Username: {new_username}, Nama Asli: {nama_lengkap}")
        return jsonify({'success': True, 'message': '✅ Profil & Nama akun berhasil diperbarui!'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': '❌ Username sudah terpakai user lain!'})

@auth_bp.route('/api/profile/change-password', methods=['POST'])
def change_password():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Belum login'}), 401

    data = request.json or {}
    pass_lama = data.get('pass_lama', '').strip()
    pass_baru = data.get('pass_baru', '').strip()

    if not pass_lama or not pass_baru:
        return jsonify({'success': False, 'message': 'Password lama dan baru wajib diisi!'})

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM users WHERE username = ?", (session['username'],))
    user = cursor.fetchone()

    nama_user = session.get('nama_lengkap', session.get('username'))

    if not user or user['password'] != pass_lama:
        conn.close()
        log_activity(nama_user, 'CHANGE_PASSWORD_FAILED', 'Gagal ganti password (Password lama salah).')
        return jsonify({'success': False, 'message': '❌ Password lama Anda SALAH!'})

    cursor.execute("UPDATE users SET password = ? WHERE username = ?", (pass_baru, session['username']))
    conn.commit()
    conn.close()
    
    log_activity(nama_user, 'CHANGE_PASSWORD_SUCCESS', 'Berhasil memperbarui password akun.')
    return jsonify({'success': True, 'message': '✅ Password berhasil diperbarui!'})

# 👑 ADMIN API
@auth_bp.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    if 'username' not in session or session.get('role') != 'admin':
        log_activity(session.get('nama_lengkap', 'ANONYMOUS'), 'UNAUTHORIZED_ACCESS', 'Mencoba mengakses API Admin User Management')
        return jsonify({'success': False, 'message': 'Akses khusus Admin Godmode!'}), 403

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, nama_lengkap, password, role, jabatan, unit_kerja FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(users)

@auth_bp.route('/api/admin/user/update', methods=['POST'])
def admin_update_user():
    if 'username' not in session or session.get('role') != 'admin':
        log_activity(session.get('nama_lengkap', 'ANONYMOUS'), 'UNAUTHORIZED_ACCESS', 'Mencoba update user via Admin API')
        return jsonify({'success': False, 'message': 'Akses khusus Admin Godmode!'}), 403

    data = request.json or {}
    user_id = data.get('id')
    new_username = data.get('username', '').strip()
    nama_lengkap = data.get('nama_lengkap', '').strip()
    new_password = data.get('password', '').strip()
    new_role = data.get('role', 'Staf')

    if not new_username or not new_password:
        return jsonify({'success': False, 'message': 'Username & Password tidak boleh kosong!'})

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET username = ?, nama_lengkap = ?, password = ?, role = ? WHERE id = ?",
                       (new_username, nama_lengkap, new_password, new_role, user_id))
        conn.commit()
        conn.close()
        
        log_activity(session.get('nama_lengkap', 'Admin'), 'ADMIN_UPDATE_USER', f"Mengedit Akun ID {user_id}: Username={new_username}, Nama={nama_lengkap}, Role={new_role}")
        return jsonify({'success': True, 'message': f'Akun ID {user_id} berhasil diupdate!'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Username sudah digunakan!'})

@auth_bp.route('/api/admin/user/add', methods=['POST'])
def admin_add_user():
    if 'username' not in session or session.get('role') != 'admin':
        log_activity(session.get('nama_lengkap', 'ANONYMOUS'), 'UNAUTHORIZED_ACCESS', 'Mencoba tambah user via Admin API')
        return jsonify({'success': False, 'message': 'Akses khusus Admin!'}), 403

    data = request.json or {}
    username = data.get('username', '').strip()
    nama_lengkap = data.get('nama_lengkap', '').strip()
    password = data.get('password', '').strip()
    role = data.get('role', 'Staf')
    jabatan = data.get('jabatan', '-').strip()
    unit_kerja = data.get('unit_kerja', '-').strip()

    if len(username) < 3 or len(password) < 3:
        return jsonify({'success': False, 'message': 'Username & Password minimal 3 karakter!'})

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, nama_lengkap, password, role, jabatan, unit_kerja) VALUES (?, ?, ?, ?, ?, ?)",
                       (username, nama_lengkap, password, role, jabatan, unit_kerja))
        conn.commit()
        conn.close()
        
        log_activity(session.get('nama_lengkap', 'Admin'), 'ADMIN_ADD_USER', f"Menambahkan user baru: {nama_lengkap or username} ({role})")
        return jsonify({'success': True, 'message': f'✅ Member baru ({username}) berhasil ditambahkan!'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Username sudah terpakai!'})

@auth_bp.route('/api/user/me', methods=['GET'])
def get_current_user():
    if 'username' not in session:
        return jsonify({'logged_in': False}), 401
        
    return jsonify({
        'logged_in': True,
        'username': session.get('username'),
        'nama_lengkap': session.get('nama_lengkap', session.get('username')),
        'role': session.get('role', 'guru')
    })