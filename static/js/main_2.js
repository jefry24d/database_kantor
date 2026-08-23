window.CURRENT_USER_ROLE = 'guru'; 
window.CURRENT_USER = 'User';
window.CURRENT_USER_NAME = 'User'; // State global untuk nama asli

(async function syncUser() {
    try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
            const user = await res.json();
            if (user.logged_in) {
                window.CURRENT_USER_ROLE = user.role;
                window.CURRENT_USER = user.username;
                window.CURRENT_USER_NAME = user.nama_lengkap || user.username;
            }
        }
    } catch (err) {
        console.error("Gagal sync user info:", err);
    }
})();

// 1. Import semua fungsi modul
import { renderFormSuratMasuk, loadTabelSuratMasuk } from './surat_masuk.js';
import { renderFormSuratKeluar, renderCustomSuratHybrid, loadTabelSuratKeluar } from './surat_keluar.js';
import { switchEksplorasiTab } from './common.js';
import { renderAuditLogPage } from './audit_log.js';

// 2. Fungsi Router Utama (Safe-Handled)
async function loadPage(page, subType = '') {
    const content = document.getElementById('contentArea');
    if (!content) return;

    try {
        if (page === 'audit-log') {
            renderAuditLogPage(content);
        } else if (page === 'input-masuk') {
            renderFormSuratMasuk(content);
        } else if (page === 'input') {
            if (subType === 'custom') {
                renderCustomSuratHybrid(content);
            } else {
                await renderFormSuratKeluar(content, subType);
            }
        } else if (page === 'eksplorasi' || page === 'masuk') {
            renderEksplorasi(content);
        } else if (page === 'stats') {
            renderStatsPage(content);
        } 
        // -------------------------------------------------------------
        // FIX: ROUTER UNTUK MENU PROFIL & KELOLA USER (ADMIN/STAF)
        // -------------------------------------------------------------
        else if (page === 'profile-view') {
            if (window.renderProfileView) window.renderProfileView(content);
        } else if (page === 'profile-edit') {
            if (window.renderProfileEdit) window.renderProfileEdit(content);
        } else if (page === 'profile-password') {
            if (window.renderProfilePassword) window.renderProfilePassword(content);
        } else if (page === 'admin-users') {
            if (window.renderAdminUsers) window.renderAdminUsers(content);
        } 
        else {
            console.warn(`Halaman ${page} belum dikonfigurasi atau dalam pengembangan.`);
        }
    } catch (err) {
        console.error("Error loading page:", err);
        content.innerHTML = `<div style="color: #ff4757; padding: 20px; background: rgba(0,0,0,0.4); border-radius: 8px;">
            ⚠️ Terjadi kesalahan saat memuat halaman: ${err.message}
        </div>`;
    }
}

// 3. Render Halaman Eksplorasi
function renderEksplorasi(content) {
    const userRole = (window.CURRENT_USER_ROLE || 'guru').toLowerCase();
    const isGuru = userRole === 'guru';

    content.innerHTML = `
        <h2>📁 EKSPLORASI ARSIP SURAT</h2>
        
        <!-- 🔍 KOLOM SEARCH AUTO-FIND GLOBAL -->
        <div style="position: relative; margin-bottom: 20px;">
            <input type="text" id="globalSearchInput" placeholder="🔍 Cari apapun (No Surat, Nama, Perihal, Lokasi, Isi Keterangan...)" 
                   style="width: 100%; padding: 14px 20px; font-size: 1rem; border-radius: 12px; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid rgba(0,255,240,0.4);">
            
            <div id="searchSuggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: rgba(20, 20, 25, 0.98); backdrop-filter: blur(10px); border: 1px solid rgba(0,255,240,0.3); border-radius: 12px; max-height: 350px; overflow-y: auto; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.8); margin-top: 5px;"></div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            ${!isGuru ? `<button id="btnEksMasuk" class="btn-primary" style="background: #00b894; flex: 1; cursor:pointer;">📥 Surat Masuk</button>` : ''}
            <button id="btnEksKeluar" class="btn-primary" style="background: ${isGuru ? '#00b894' : 'rgba(255,255,255,0.1)'}; flex: 1; cursor:pointer;">📤 Surat Keluar</button>
        </div>

        <div id="areaTabelEksplorasi"></div>
    `;

    // Event Switch Tab
    const btnMasuk = document.getElementById('btnEksMasuk');
    const btnKeluar = document.getElementById('btnEksKeluar');

    if (btnMasuk) {
        btnMasuk.addEventListener('click', () => {
            switchEksplorasiTab('masuk', loadTabelSuratMasuk, loadTabelSuratKeluar);
        });
    }

    if (btnKeluar) {
        btnKeluar.addEventListener('click', () => {
            switchEksplorasiTab('keluar', loadTabelSuratMasuk, loadTabelSuratKeluar);
        });
    }

    if (isGuru) {
        loadTabelSuratKeluar();
    } else {
        loadTabelSuratMasuk();
    }

    // Event Auto Search
    const searchInput = document.getElementById('globalSearchInput');
    const suggestionsBox = document.getElementById('searchSuggestions');

    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const kw = e.target.value.trim();
            if (kw.length === 0) {
                suggestionsBox.style.display = 'none';
                return;
            }

            try {
                const res = await fetch(`/api/search?keyword=${encodeURIComponent(kw)}`);
                const data = await res.json();

                if (data.length === 0) {
                    suggestionsBox.innerHTML = `<div style="padding: 15px; color: #ff4757; text-align: center;">❌ Tidak ada data yang cocok dengan "${kw}"</div>`;
                } else {
                    suggestionsBox.innerHTML = data.map(item => `
                        <div style="padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: 0.2s; display: flex; justify-content: space-between; align-items: center;"
                             onmouseover="this.style.background='rgba(0, 255, 240, 0.15)'" 
                             onmouseout="this.style.background='transparent'"
                             onclick="window.open('${item.tipe === 'MASUK' ? '/cetak-disposisi/' + item.id : '/surat/cetak/' + item.id}', '_blank')">
                            <div>
                                <span style="font-size:0.75rem; background:${item.tipe === 'MASUK' ? '#00b894' : '#0984e3'}; padding:3px 8px; border-radius:6px; font-weight:bold;">${item.tipe} [${item.jenis_surat}]</span>
                                <strong style="margin-left:8px; color:#fff;">${item.perihal}</strong>
                                <div style="font-size: 0.85rem; color: #aaa; margin-top: 4px;">No: ${item.nomor_surat} | Pihak Terkait: ${item.pihak}</div>
                            </div>
                            <span style="font-size: 0.8rem; color: #00fff0;">🖨️ Buka</span>
                        </div>
                    `).join('');
                }
                suggestionsBox.style.display = 'block';
            } catch (err) {
                console.error(err);
            }
        });

        document.addEventListener('click', (e) => {
            if (suggestionsBox && !searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                suggestionsBox.style.display = 'none';
            }
        });
    }
}

async function renderStatsPage(content) {
    content.innerHTML = `<h2>📊 STATISTIK ARSIP</h2><p>Memuat statistik...</p>`;
    try {
        const res = await fetch('/api/statistik');
        const data = await res.json();
        content.innerHTML = `
            <h2>📊 STATISTIK & REKAP ARSIP</h2>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px; margin-top:20px;">
                <div style="background:rgba(0,184,148,0.2); padding:20px; border-radius:12px; text-align:center;">
                    <h3>📥 Surat Masuk</h3>
                    <h1 style="font-size:2.5rem; color:#00b894;">${data.masuk}</h1>
                </div>
                <div style="background:rgba(9,132,227,0.2); padding:20px; border-radius:12px; text-align:center;">
                    <h3>📤 Surat Keluar</h3>
                    <h1 style="font-size:2.5rem; color:#0984e3;">${data.keluar}</h1>
                </div>
                <div style="background:rgba(236,77,122,0.2); padding:20px; border-radius:12px; text-align:center;">
                    <h3>📦 Total Arsip</h3>
                    <h1 style="font-size:2.5rem; color:#ec4d7a;">${data.total}</h1>
                </div>
            </div>
        `;
    } catch (e) {
        content.innerHTML = `<p style="color:red;">Gagal memuat statistik.</p>`;
    }
}

// Global Export untuk HTML
window.loadPage = loadPage;