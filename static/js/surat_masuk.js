// 🔄 Auto Fetch Nomor Disposisi
export async function fetchNomorDisposisiAuto() {
    const kodeSelect = document.getElementById('sm_kode_surat');
    const inputNoDisposisi = document.getElementById('sm_no_disposisi');
    
    if (!kodeSelect || !inputNoDisposisi) return;

    const kode = kodeSelect.value;
    try {
        const res = await fetch(`/api/last-disposisi-number?kode=${kode}`);
        const data = await res.json();
        if (data.success) {
            inputNoDisposisi.value = data.suggested_number;
        }
    } catch (err) {
        console.error("Gagal ambil nomor disposisi:", err);
    }
}

// 📥 1. Render Form Surat Masuk
export function renderFormSuratMasuk(content) {
    const userPetugas = typeof CURRENT_USER !== 'undefined' ? CURRENT_USER : 'Staf';
    
    content.innerHTML = `
        <h2>📥 INPUT SURAT MASUK</h2>
        <p style="color: #ccc; margin-bottom: 20px;">Catat data arsip surat masuk dari instansi luar.</p>

        <form id="formSuratMasuk" style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <label>Kode Klasifikasi Surat:</label>
                    <select id="sm_kode_surat" style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white;">
                        <option value="DP" style="color:black;">DP (Disposisi Pimpinan)</option>
                        <option value="S" style="color:black;">S (Biasa/Sangat)</option>
                        <option value="P" style="color:black;">P (Penting)</option>
                        <option value="SR" style="color:black;">SR (Sangat Rahasia)</option>
                    </select>

                    <label style="margin-top:10px; display:block;">No. Urut / No. Disposisi:</label>
                    <input type="text" id="sm_no_disposisi" placeholder="Memuat nomor..." required style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white;">

                    <label style="margin-top:10px; display:block;">Pengirim (Pemberi Surat):</label>
                    <input type="text" id="sm_pengirim" placeholder="Contoh: Dinas Pemkot Surabaya" required style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white;">

                    <label style="margin-top:10px; display:block;">Nomor Surat Pengirim:</label>
                    <input type="text" id="sm_no_surat_pengirim" placeholder="Contoh: 500/123/402.1/2026" required style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white;">
                </div>

                <div>
                    <label>📅 Tanggal Surat Diterima:</label>
                    <input type="date" id="sm_tgl_diterima" required style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white;">

                    <label style="margin-top:10px; display:block;">📅 Tanggal Surat (Asli):</label>
                    <input type="date" id="sm_tgl_surat" required style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white;">

                    <label style="margin-top:10px; display:block;">Petugas Pencatat:</label>
                    <input type="text" id="sm_petugas" value="${userPetugas}" readonly style="width:100%; padding:10px; border-radius:8px; background: rgba(255,255,255,0.05); color: #00fff0; cursor: not-allowed;">

                    <label style="margin-top:10px; display:block;">📁 Upload Scan Surat Asli (.pdf / .jpg / .png):</label>
                    <input type="file" id="sm_file_scan" accept=".pdf,.png,.jpg,.jpeg" style="width:100%; padding:8px; background:rgba(255,255,255,0.1); border-radius:8px; color:white;">
                </div>
            </div>

            <div style="margin-top: 15px;">
                <label>Perihal / Ringkasan Isi:</label>
                <textarea id="sm_perihal" rows="3" placeholder="Contoh: Undangan Rapat Evaluasi Anggaran" required style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white;"></textarea>
            </div>

            <button type="submit" class="btn-primary" style="margin-top: 20px; background: #00b894; padding:10px 20px; border:none; border-radius:8px; color:white; font-weight:bold; cursor:pointer;">💾 Simpan Surat Masuk</button>
            <p id="msgSuratMasuk" style="margin-top: 15px; font-weight: bold;"></p>
        </form>
    `;

    const kodeSelect = document.getElementById('sm_kode_surat');
    if (kodeSelect) {
        kodeSelect.addEventListener('change', fetchNomorDisposisiAuto);
    }
    fetchNomorDisposisiAuto();

    const form = document.getElementById('formSuratMasuk');
    if (form) {
        form.addEventListener('submit', simpanSuratMasuk);
    }
}

// 💾 3. Simpan Surat Masuk
export async function simpanSuratMasuk(e) {
    e.preventDefault();
    const msg = document.getElementById('msgSuratMasuk');
    msg.innerText = "Sedang menyimpan data surat masuk...";
    msg.style.color = "#00fff0";

    const formData = new FormData();
    formData.append('no_disposisi', document.getElementById('sm_no_disposisi').value);
    formData.append('pengirim', document.getElementById('sm_pengirim').value);
    formData.append('tgl_diterima', document.getElementById('sm_tgl_diterima').value);
    formData.append('tgl_surat', document.getElementById('sm_tgl_surat').value);
    formData.append('no_surat_pengirim', document.getElementById('sm_no_surat_pengirim').value);
    formData.append('perihal', document.getElementById('sm_perihal').value);
    formData.append('kode_surat', document.getElementById('sm_kode_surat').value);
    formData.append('petugas', document.getElementById('sm_petugas').value);

    const fileInput = document.getElementById('sm_file_scan');
    if (fileInput.files.length > 0) {
        formData.append('file_scan', fileInput.files[0]);
    }

    try {
        const res = await fetch('/api/surat-masuk', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.status === 'success') {
            msg.innerText = "✅ " + data.message;
            msg.style.color = "#00ff88";
            if (typeof window.loadPage === 'function') {
                setTimeout(() => { window.loadPage('eksplorasi'); }, 1200);
            }
        } else {
            msg.innerText = "❌ " + data.message;
            msg.style.color = "#ff4757";
        }
    } catch (err) {
        msg.innerText = "❌ Terjadi kesalahan server!";
        msg.style.color = "#ff4757";
    }
}

export async function loadTabelSuratMasuk() {
    const content = document.getElementById('areaTabelEksplorasi') 
                 || document.getElementById('contentArea') 
                 || document.getElementById('mainContent');
                 
    if (!content) return;

    content.innerHTML = `
        <h2>📂 DAFTAR SURAT MASUK</h2>
        <p style="color: #ccc; margin-bottom: 20px;">Memuat data surat masuk...</p>
    `;

    try {
        const res = await fetch('/api/surat-masuk');
        const data = await res.json();

        // 🎯 FIX: Pakai Array.isArray karena API Flask return List langsung
        const listData = Array.isArray(data) ? data : (data.data || []);

        let html = `
            <h2>📂 DAFTAR SURAT MASUK</h2>
            <div style="overflow-x:auto; margin-top:20px;">
                <table style="width:100%; border-collapse:collapse; color:white; text-align:left;">
                    <thead>
                        <tr style="background:rgba(255,255,255,0.1); border-bottom:2px solid #555;">
                            <th style="padding:10px;">No. Disposisi</th>
                            <th style="padding:10px;">Kode</th>
                            <th style="padding:10px;">Pengirim</th>
                            <th style="padding:10px;">No. Surat</th>
                            <th style="padding:10px;">Perihal</th>
                            <th style="padding:10px;">Tgl Diterima</th>
                            <th style="padding:10px;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (listData.length === 0) {
            html += `<tr><td colspan="7" style="padding:15px; text-align:center;">Belum ada data surat masuk.</td></tr>`;
        } else {
            listData.forEach(item => {
                html += `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                        <td style="padding:10px;">${item.no_disposisi || '-'}</td>
                        <td style="padding:10px;"><strong>${item.kode_surat || '-'}</strong></td>
                        <td style="padding:10px;">${item.pengirim || '-'}</td>
                        <td style="padding:10px;">${item.no_surat_pengirim || '-'}</td>
                        <td style="padding:10px;">${item.perihal || '-'}</td>
                        <td style="padding:10px;">${item.tgl_diterima || '-'}</td>
                        <td style="padding:10px;">
                            <a href="/cetak-disposisi/${item.id}" target="_blank" style="color:#00fff0; text-decoration:none; margin-right:8px;">🖨️ Disposisi</a>
                            ${item.file_scan_path && item.file_scan_path !== '-' ? `<a href="/static/uploads/${item.file_scan_path}" target="_blank" style="color:#74b9ff; text-decoration:none;">📄 File</a>` : ''}
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table></div>`;
        content.innerHTML = html;

    } catch (err) {
        console.error("Gagal muat tabel surat masuk:", err);
        content.innerHTML = `<h2 style="color:#ff4757;">❌ Gagal memuat data surat masuk!</h2>`;
    }
}