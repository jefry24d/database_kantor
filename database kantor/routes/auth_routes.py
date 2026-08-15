from flask import Blueprint, jsonify, request, session, render_template, redirect, url_for
import sqlite3

auth_bp = Blueprint('auth_bp', __name__)

def get_db():
    conn = sqlite3.connect('arsip_kantor.db')
    conn.row_factory = sqlite3.Row
    return conn

# 🔑 LOGIN / LOGOUT
@auth_bp.route('/login', methods=['GET', 'POST'])
def login_page():
    if request.method == 'POST':
        data = request.json
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT username, role FROM users WHERE username=? AND password=?", (username, password))
        user = cursor.fetchone()
        conn.close()

        if user:
            session['username'] = user['username']
            session['role'] = user['role']
            return jsonify({'success': True, 'message': f"Selamat datang, {user['username']}!"})
        else:
            return jsonify({'success': False, 'message': 'Username atau Password Salah Cok!'})

    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth_bp.login_page'))

# 👤 PROFILE & USER MANAGEMENT API
@auth_bp.route('/api/profile', methods=['GET'])
def get_profile():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Belum login'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, jabatan, unit_kerja, bio FROM users WHERE username = ?", (session['username'],))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify(dict(user))
    return jsonify({'success': False, 'message': 'User tidak ditemukan'}), 404

@auth_bp.route('/api/profile/update-info', methods=['POST'])
def update_profile_info():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Belum login'}), 401
        
    data = request.json
    new_username = data.get('username', '').strip()
    jabatan = data.get('jabatan', '').strip()
    unit_kerja = data.get('unit_kerja', '').strip()
    bio = data.get('bio', '').strip()

    if len(new_username) < 3:
        return jsonify({'success': False, 'message': '⚠️ Username minimal 3 karakter asli cok!'})

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET username = ?, jabatan = ?, unit_kerja = ?, bio = ? WHERE username = ?",
                       (new_username, jabatan, unit_kerja, bio, session['username']))
        conn.commit()
        session['username'] = new_username
        conn.close()
        return jsonify({'success': True, 'message': '✅ Profil & Nama akun berhasil diperbarui!'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': '❌ Username sudah terpakai user lain!'})

@auth_bp.route('/api/profile/change-password', methods=['POST'])
def change_password():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Belum login'}), 401

    data = request.json
    pass_lama = data.get('pass_lama', '').strip()
    pass_baru = data.get('pass_baru', '').strip()

    if not pass_lama or not pass_baru:
        return jsonify({'success': False, 'message': 'Password lama dan baru wajib diisi!'})

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM users WHERE username = ?", (session['username'],))
    user = cursor.fetchone()

    if not user or user['password'] != pass_lama:
        conn.close()
        return jsonify({'success': False, 'message': '❌ Password lama Anda SALAH!'})

    cursor.execute("UPDATE users SET password = ? WHERE username = ?", (pass_baru, session['username']))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': '✅ Password berhasil diperbarui!'})

# 👑 ADMIN API
@auth_bp.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    if 'username' not in session or session.get('role') != 'Admin':
        return jsonify({'success': False, 'message': 'Akses khusus Admin Godmode!'}), 403

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, password, role, jabatan, unit_kerja FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(users)

@auth_bp.route('/api/admin/user/update', methods=['POST'])
def admin_update_user():
    if 'username' not in session or session.get('role') != 'Admin':
        return jsonify({'success': False, 'message': 'Akses khusus Admin Godmode!'}), 403

    data = request.json
    user_id = data.get('id')
    new_username = data.get('username', '').strip()
    new_password = data.get('password', '').strip()
    new_role = data.get('role', 'Staf')

    if not new_username or not new_password:
        return jsonify({'success': False, 'message': 'Username & Password tidak boleh kosong!'})

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?",
                       (new_username, new_password, new_role, user_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': f'Akun ID {user_id} berhasil diupdate jadi {new_role}!'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Username sudah digunakan!'})

@auth_bp.route('/api/admin/user/add', methods=['POST'])
def admin_add_user():
    if 'username' not in session or session.get('role') != 'Admin':
        return jsonify({'success': False, 'message': 'Akses khusus Admin!'}), 403

    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    role = data.get('role', 'Staf')
    jabatan = data.get('jabatan', '-').strip()
    unit_kerja = data.get('unit_kerja', '-').strip()

    if len(username) < 3 or len(password) < 3:
        return jsonify({'success': False, 'message': 'Username & Password minimal 3 karakter!'})

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password, role, jabatan, unit_kerja) VALUES (?, ?, ?, ?, ?)",
                       (username, password, role, jabatan, unit_kerja))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': f'✅ Member baru ({username}) berhasil ditambahkan!'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Username sudah terpakai!'})