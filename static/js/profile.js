// 📄 PROFIL VIEW
async function renderProfileView(content) {
    content.innerHTML = `<p>Sedang memuat profil...</p>`;
    const res = await fetch('/api/profile');
    const user = await res.json();

    content.innerHTML = `
        <h2>📄 PROFIL SAYA (${user.role ? user.role.toUpperCase() : 'USER'})</h2>
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; max-width: 600px; line-height: 2;">
            <p><b>Nama Lengkap / Gelar :</b> <span style="color:#00fff0; font-weight:bold; font-size:1.1rem;">${user.nama_lengkap || '-'}</span></p>
            <p><b>Username Login :</b> <code>${user.username}</code></p>
            <p><b>Role / Hak Akses :</b> <span style="background:#0984e3; color:white; padding:2px 8px; border-radius:4px; font-weight:bold;">${user.role}</span></p>
            <p><b>Unit Kerja / Divisi :</b> ${user.unit_kerja}</p>
            <p><b>Jabatan :</b> ${user.jabatan}</p>
            <p><b>Bio / Catatan :</b> ${user.bio || '-'}</p>
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
            <label style="display:block; margin-top:10px;">Nama Lengkap / Gelar:</label>
            <input type="text" id="editNamaLengkap" value="${user.nama_lengkap || ''}" placeholder="Contoh: Jefry Oktavianto, S.Kom." style="width:100%; padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">

            <label style="display:block; margin-top:10px;">Username Login:</label>
            <input type="text" id="editUsername" value="${user.username}" style="width:100%; padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">

            <label style="display:block; margin-top:10px;">Unit Kerja / Divisi:</label>
            <input type="text" id="editUnit" value="${user.unit_kerja}" style="width:100%; padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">

            <label style="display:block; margin-top:10px;">Jabatan:</label>
            <input type="text" id="editJabatan" value="${user.jabatan}" style="width:100%; padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">

            <label style="display:block; margin-top:10px;">Bio / Catatan:</label>
            <textarea id="editBio" rows="3" style="width:100%; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:10px;">${user.bio || ''}</textarea>

            <button onclick="simpanInfoProfil()" class="btn-primary" style="margin-top: 15px;">💾 Save Perubahan</button>
            <p id="msgEdit" style="margin-top: 10px;"></p>
        </div>
    `;
}

async function simpanInfoProfil() {
    const nama_lengkap = document.getElementById('editNamaLengkap').value;
    const username = document.getElementById('editUsername').value;
    const unit_kerja = document.getElementById('editUnit').value;
    const jabatan = document.getElementById('editJabatan').value;
    const bio = document.getElementById('editBio').value;

    const res = await fetch('/api/profile/update-info', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nama_lengkap, username, unit_kerja, jabatan, bio })
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
            <label style="display:block; margin-top:10px;">Masukkan Password Lama :</label>
            <input type="password" id="passLama" placeholder="Wajib diisi!" style="width:100%; padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">

            <label style="display:block; margin-top:10px;">Masukkan Password Baru :</label>
            <input type="password" id="passBaru" placeholder="Masukkan password baru" style="width:100%; padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">

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

// 👑 ADMIN KELOLA USER (SUPPORT 4 LEVEL HIRARKI)
function renderAdminUsers(content) {
    content.innerHTML = `
        <h2>👑 KHUSUS ADMIN: KELOLA & TAMBAH MEMBER BARU</h2>
        
        <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; margin-bottom: 25px; max-width: 600px;">
            <h3>➕ Tambah Member Baru</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <input type="text" id="newAccNama" placeholder="Nama Lengkap / Gelar" style="padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">
                <input type="text" id="newAccUser" placeholder="Username Login" style="padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">
                <input type="password" id="newAccPass" placeholder="Password Member" style="padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">
                <input type="text" id="newAccJabatan" placeholder="Jabatan" style="padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">
            </div>
            <input type="text" id="newAccUnit" placeholder="Unit Kerja / Divisi" style="margin-top: 10px; width:100%; padding:8px; border-radius:6px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2);">
            <select id="newAccRole" style="margin-top: 10px; width:100%; padding:8px; border-radius:6px; background:#222; color:white; border:1px solid rgba(255,255,255,0.2);">
                <option value="admin">👑 Admin (Full Access / Godmode)</option>
                <option value="kepsek">🦅 Kepala Sekolah (Approve, Buat, Hapus Surat)</option>
                <option value="staf">📋 Staf Administrasi (Buat & Hapus Surat)</option>
                <option value="guru" selected>👨‍🏫 Guru (Buat Surat Saja)</option>
            </select>
            <br>
            <button onclick="adminTambahMember()" class="btn-primary" style="margin-top: 10px;">➕ Buat Akun Member</button>
            <p id="msgAddMember" style="margin-top: 5px;"></p>
        </div>

        <h3>📋 Daftar Seluruh Akun Staf & Guru Kantor</h3>
        <div id="tabelAdminUsers">Loading data user...</div>
    `;
    loadAdminUserTable();
}

async function loadAdminUserTable() {
    const container = document.getElementById('tabelAdminUsers');
    if (!container) return;

    try {
        const res = await fetch('/api/admin/users');
        if (res.status === 403) {
            container.innerHTML = `<p style="color:#ff4757; font-weight:bold;">⛔ Akses Ditolak: Fitur kelola akun hanya untuk Admin Godmode.</p>`;
            return;
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
            container.innerHTML = `<p style="color:#ff4757;">Gagal memuat data user.</p>`;
            return;
        }

        let html = `
            <table style="width:100%; text-align:left; border-collapse:collapse;">
                <tr style="background:rgba(255,255,255,0.1); color:#00fff0;">
                    <th style="padding:10px;">ID</th>
                    <th>Nama Lengkap</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th style="text-align:center;">Aksi Kelola</th>
                </tr>
        `;

        data.forEach(u => {
            const roleLower = String(u.role).toLowerCase();
            html += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                    <td style="padding:10px;">${u.id}</td>
                    <td><input type="text" id="usr_nama_${u.id}" value="${u.nama_lengkap || ''}" placeholder="Nama Asli" style="padding: 4px 8px; width: 130px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:4px;"></td>
                    <td><input type="text" id="usr_name_${u.id}" value="${u.username}" style="padding: 4px 8px; width: 100px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:4px;"></td>
                    <td><input type="text" id="usr_pass_${u.id}" value="${u.password}" style="padding: 4px 8px; width: 100px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:4px;"></td>
                    <td>
                        <select id="usr_role_${u.id}" style="padding: 4px 8px; background:#222; color:white; border:1px solid rgba(255,255,255,0.2); border-radius:4px;">
                            <option value="admin" ${roleLower === 'admin' ? 'selected' : ''}>👑 Admin</option>
                            <option value="kepsek" ${roleLower === 'kepsek' ? 'selected' : ''}>🦅 Kepsek</option>
                            <option value="staf" ${roleLower === 'staf' ? 'selected' : ''}>📋 Staf</option>
                            <option value="guru" ${roleLower === 'guru' ? 'selected' : ''}>👨‍🏫 Guru</option>
                        </select>
                    </td>
                    <td style="text-align:center;">
                        <button onclick="adminSimpanUser(${u.id})" class="btn-primary" style="padding: 4px 10px; font-size: 0.8rem; background:#0984e3; border:none; border-radius:4px; cursor:pointer;">💾 Update</button>
                    </td>
                </tr>
            `;
        });

        html += `</table>`;
        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color:#ff4757;">Terjadi kesalahan sistem saat memuat tabel.</p>`;
    }
}

async function adminTambahMember() {
    const nama_lengkap = document.getElementById('newAccNama').value;
    const username = document.getElementById('newAccUser').value;
    const password = document.getElementById('newAccPass').value;
    const jabatan = document.getElementById('newAccJabatan').value;
    const unit_kerja = document.getElementById('newAccUnit').value;
    const role = document.getElementById('newAccRole').value;

    const res = await fetch('/api/admin/user/add', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nama_lengkap, username, password, jabatan, unit_kerja, role })
    });

    const data = await res.json();
    const msg = document.getElementById('msgAddMember');
    msg.innerText = data.message;
    msg.style.color = data.success ? '#00ff88' : '#ff4757';

    if (data.success) {
        loadAdminUserTable();
        document.getElementById('newAccNama').value = '';
        document.getElementById('newAccUser').value = '';
        document.getElementById('newAccPass').value = '';
    }
}

async function adminSimpanUser(id) {
    const nama_lengkap = document.getElementById(`usr_nama_${id}`).value;
    const username = document.getElementById(`usr_name_${id}`).value;
    const password = document.getElementById(`usr_pass_${id}`).value;
    const role = document.getElementById(`usr_role_${id}`).value;

    const res = await fetch('/api/admin/user/update', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id, nama_lengkap, username, password, role })
    });

    const data = await res.json();
    alert(data.message);
    if (data.success) {
        loadAdminUserTable();
    }
}

// Global Export
window.renderProfileView = renderProfileView;
window.renderProfileEdit = renderProfileEdit;
window.renderProfilePassword = renderProfilePassword;
window.renderAdminUsers = renderAdminUsers;
window.simpanInfoProfil = simpanInfoProfil;
window.simpanPasswordBaru = simpanPasswordBaru;
window.adminTambahMember = adminTambahMember;
window.adminSimpanUser = adminSimpanUser;