// 📄 PROFIL VIEW
async function renderProfileView(content) {
    content.innerHTML = `<p>Sedang memuat profil...</p>`;
    const res = await fetch('/api/profile');
    const user = await res.json();

    content.innerHTML = `
        <h2>📄 PROFIL SAYA (${user.role.toUpperCase()})</h2>
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; max-width: 600px; line-height: 2;">
            <p><b>Nama / Username :</b> ${user.username}</p>
            <p><b>Unit Kerja / Divisi :</b> ${user.unit_kerja}</p>
            <p><b>Jabatan :</b> ${user.jabatan}</p>
            <p><b>Bio / Catatan :</b> ${user.bio}</p>
        </div>
    `;
}

// ✏️ PROFIL EDIT
async function renderProfileEdit(content) {
    content.innerHTML = `<p>Sedang memuat data...</p>`;
    const res = await fetch('/api/profile');
    const user = await res.json();

    content.innerHTML = `
        <h2>✏️ EDIT PROFIL SAYA</h2>
        <div style="max-width: 500px; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px;">
            <label>Nama / Username:</label>
            <input type="text" id="editUsername" value="${user.username}">

            <label>Unit Kerja / Divisi:</label>
            <input type="text" id="editUnit" value="${user.unit_kerja}">

            <label>Jabatan:</label>
            <input type="text" id="editJabatan" value="${user.jabatan}">

            <label>Bio / Catatan:</label>
            <textarea id="editBio" rows="3" style="width:100%; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:10px;">${user.bio}</textarea>

            <button onclick="simpanInfoProfil()" class="btn-primary" style="margin-top: 15px;">💾 Save Perubahan</button>
            <p id="msgEdit" style="margin-top: 10px;"></p>
        </div>
    `;
}

async function simpanInfoProfil() {
    const username = document.getElementById('editUsername').value;
    const unit_kerja = document.getElementById('editUnit').value;
    const jabatan = document.getElementById('editJabatan').value;
    const bio = document.getElementById('editBio').value;

    const res = await fetch('/api/profile/update-info', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, unit_kerja, jabatan, bio })
    });

    const data = await res.json();
    const msg = document.getElementById('msgEdit');
    msg.innerText = data.message;
    msg.style.color = data.success ? '#00ff88' : '#ff4757';
}

// 🔒 UBAH PASSWORD
function renderProfilePassword(content) {
    content.innerHTML = `
        <h2>🔒 UBAH PASSWORD</h2>
        <div style="max-width: 400px; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px;">
            <label>Masukkan Password Lama :</label>
            <input type="password" id="passLama" placeholder="Wajib diisi!">

            <label>Masukkan Password Baru :</label>
            <input type="password" id="passBaru" placeholder="Masukkan password baru">

            <button onclick="simpanPasswordBaru()" class="btn-primary" style="margin-top: 15px;">💾 Save Password Baru</button>
            <p id="msgPass" style="margin-top: 10px;"></p>
        </div>
    `;
}

async function simpanPasswordBaru() {
    const pass_lama = document.getElementById('passLama').value;
    const pass_baru = document.getElementById('passBaru').value;

    const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ pass_lama, pass_baru })
    });

    const data = await res.json();
    const msg = document.getElementById('msgPass');
    msg.innerText = data.message;
    msg.style.color = data.success ? '#00ff88' : '#ff4757';
    if (data.success) {
        document.getElementById('passLama').value = '';
        document.getElementById('passBaru').value = '';
    }
}

// 👑 ADMIN KELOLA USER
function renderAdminUsers(content) {
    content.innerHTML = `
        <h2>👑 KHUSUS ADMIN: KELOLA & TAMBAH MEMBER BARU</h2>
        
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; margin-bottom: 25px; max-width: 600px;">
            <h3>➕ Tambah Member Baru</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <input type="text" id="newAccUser" placeholder="Username Member Baru">
                <input type="password" id="newAccPass" placeholder="Password Member Baru">
                <input type="text" id="newAccJabatan" placeholder="Jabatan">
                <input type="text" id="newAccUnit" placeholder="Unit Kerja / Divisi">
            </div>
            <select id="newAccRole" style="margin-top: 10px;">
                <option value="Staf">Role: Staf Biasa</option>
                <option value="Admin">Role: Admin Godmode</option>
            </select>
            <br>
            <button onclick="adminTambahMember()" class="btn-primary" style="margin-top: 10px;">➕ Buat Akun Member</button>
            <p id="msgAddMember" style="margin-top: 5px;"></p>
        </div>

        <h3>📋 Daftar Seluruh Akun Staf Kantor</h3>
        <div id="tabelAdminUsers">Loading data user...</div>
    `;
    loadAdminUserTable();
}

async function loadAdminUserTable() {
    const container = document.getElementById('tabelAdminUsers');
    const res = await fetch('/api/admin/users');
    const data = await res.json();

    let html = `
        <table>
            <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Password saat ini</th>
                <th>Role</th>
                <th>Jabatan</th>
                <th>Aksi Kelola</th>
            </tr>
    `;

    data.forEach(u => {
        html += `
            <tr>
                <td>${u.id}</td>
                <td><input type="text" id="usr_name_${u.id}" value="${u.username}" style="padding: 4px 8px; width: 120px;"></td>
                <td><input type="text" id="usr_pass_${u.id}" value="${u.password}" style="padding: 4px 8px; width: 120px;"></td>
                <td>
                    <select id="usr_role_${u.id}" style="padding: 4px 8px;">
                        <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
                        <option value="Staf" ${u.role === 'Staf' ? 'selected' : ''}>Staf</option>
                    </select>
                </td>
                <td>${u.jabatan}</td>
                <td>
                    <button onclick="adminSimpanUser(${u.id})" class="btn-primary" style="padding: 4px 10px; font-size: 0.8rem;">💾 Update Akun</button>
                </td>
            </tr>
        `;
    });

    html += `</table>`;
    container.innerHTML = html;
}

async function adminTambahMember() {
    const username = document.getElementById('newAccUser').value;
    const password = document.getElementById('newAccPass').value;
    const jabatan = document.getElementById('newAccJabatan').value;
    const unit_kerja = document.getElementById('newAccUnit').value;
    const role = document.getElementById('newAccRole').value;

    const res = await fetch('/api/admin/user/add', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username, password, jabatan, unit_kerja, role })
    });

    const data = await res.json();
    const msg = document.getElementById('msgAddMember');
    msg.innerText = data.message;
    msg.style.color = data.success ? '#00ff88' : '#ff4757';

    if (data.success) {
        loadAdminUserTable();
        document.getElementById('newAccUser').value = '';
        document.getElementById('newAccPass').value = '';
    }
}

async function adminSimpanUser(id) {
    const username = document.getElementById(`usr_name_${id}`).value;
    const password = document.getElementById(`usr_pass_${id}`).value;
    const role = document.getElementById(`usr_role_${id}`).value;

    const res = await fetch('/api/admin/user/update', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id, username, password, role })
    });

    const data = await res.json();
    alert(data.message);
    if (data.success) {
        loadAdminUserTable();
    }
}

// Paste di bagian paling bawah static/js/profile.js
window.renderProfileView = renderProfileView;
window.renderProfileEdit = renderProfileEdit;
window.renderProfilePassword = renderProfilePassword;
window.renderAdminUsers = renderAdminUsers;
window.simpanInfoProfil = simpanInfoProfil;
window.simpanPasswordBaru = simpanPasswordBaru;
window.adminTambahMember = adminTambahMember;
window.adminSimpanUser = adminSimpanUser;