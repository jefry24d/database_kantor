import { cetakDisposisi, hapusSurat } from './common.js';

// 📥 1. Render Form Surat Masuk
export function renderFormSuratMasuk(content) {
    const userPetugas = typeof CURRENT_USER !== 'undefined' ? CURRENT_USER : 'Staf';
    
    content.innerHTML = `
        <h2>📥 INPUT SURAT MASUK & DISPOSISI</h2>
        <p style="color: #ccc; margin-bottom: 20px;">Catat data surat masuk dari instansi luar dan lampirkan file scan jika ada.</p>

        <form id="formSuratMasuk" style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <label>No. Urut / No. Disposisi:</label>
                    <input type="text" id="sm_no_disposisi" placeholder="Contoh: 001/DS/2026" required>

                    <label>Pengirim (Pemberi Surat):</label>
                    <input type="text" id="sm_pengirim" placeholder="Contoh: Dinas Pemkot Surabaya" required>

                    <label>Nomor Surat Pengirim:</label>
                    <input type="text" id="sm_no_surat_pengirim" placeholder="Contoh: 500/123/402.1/2026" required>

                    <label>Perihal / Ringkasan Isi:</label>
                    <textarea id="sm_perihal" rows="3" placeholder="Contoh: Undangan Rapat Evaluasi Anggaran" required style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white;"></textarea>
                </div>
                <div>
                    <label>📅 Tanggal Surat Diterima:</label>
                    <input type="date" id="sm_tgl_diterima" required style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white;">

                    <label>📅 Tanggal Surat (Asli):</label>
                    <input type="date" id="sm_tgl_surat" required style="width:100%; padding:10px; border-radius:8px; background:rgba(255,255,255,0.1); color:white;">

                    <label>Kode Klasifikasi Surat:</label>
                    <select id="sm_kode_surat">
                        <option value="DP">DP (Disposisi Pimpinan)</option>
                        <option value="S">S (Biasa/Sangat)</option>
                        <option value="P">P (Penting)</option>
                        <option value="SR">SR (Sangat Rahasia)</option>
                    </select>

                    <label>Petugas Pencatat:</label>
                    <input type="text" id="sm_petugas" value="${userPetugas}" readonly style="background: rgba(255,255,255,0.05); color: #00fff0; cursor: not-allowed;">
                </div>
            </div>

            <div style="margin-top: 15px;">
                <label><b>📁 Upload Scan Surat Asli (.pdf / .jpg / .png):</b></label>
                <input type="file" id="sm_file_scan" accept=".pdf,.png,.jpg,.jpeg" style="width:100%; padding:10px; background:rgba(255,255,255,0.1); border-radius:8px; color:white;">
            </div>

            <button type="submit" class="btn-primary" style="margin-top: 20px; background: #00b894;">💾 Simpan Surat Masuk</button>
            <p id="msgSuratMasuk" style="margin-top: 15px; font-weight: bold;"></p>
        </form>
    `;

    document.getElementById('formSuratMasuk').addEventListener('submit', simpanSuratMasuk);
}

// 📥 2. Fetch & Load Tabel Surat Masuk
export async function loadTabelSuratMasuk() {
    const container = document.getElementById('areaTabelEksplorasi');
    if (!container) return;
    
    container.innerHTML = "Sedang mengambil data Surat Masuk...";

    try {
        const res = await fetch('/api/surat-masuk');
        const data = await res.json();

        if (data.length === 0) {
            container.innerHTML = `<p style="color: #ff4757;">Belum ada arsip surat masuk nyot.</p>`;
            return;
        }

        let html = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.1); text-align: left;">
                        <th width="40" style="padding: 10px;">No</th>
                        <th style="padding: 10px;">No. Disposisi</th>
                        <th style="padding: 10px;">Pengirim</th>
                        <th style="padding: 10px;">Tgl Masuk</th>
                        <th style="padding: 10px;">Tgl Surat</th>
                        <th style="padding: 10px;">No. Surat Pengirim</th>
                        <th style="padding: 10px;">Perihal</th>
                        <th style="padding: 10px;">Petugas</th>
                        <th style="padding: 10px;">Kode</th>
                        <th width="120" style="padding: 10px;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach((d, index) => {
            let tombolScan = d.file_scan_path !== '-' 
                ? `<a href="/static/uploads/${d.file_scan_path}" target="_blank" download><button class="btn-primary" style="padding: 4px 8px; font-size: 0.75rem; background: #00b894; border:none; border-radius:4px; margin-top:2px;">⏬ Scan</button></a>`
                : `<span style="color:#aaa; font-size:0.75rem;">Tanpa Scan</span>`;

            let tombolDisposisi = `<button data-id="${d.id}" class="btn-disposisi btn-primary" style="padding: 4px 8px; font-size: 0.75rem; background: #0984e3; border:none; border-radius:4px;">📄 Disposisi</button>`;
            let tombolHapus = `<button data-id="${d.id}" class="btn-hapus-sm btn-primary" style="padding: 4px 8px; font-size: 0.75rem; background: #ff4757; border:none; border-radius:4px; margin-top:2px;">🗑️ Hapus</button>`;

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px;"><b>${index + 1}</b></td>
                    <td style="padding: 10px;"><code>${d.no_disposisi}</code></td>
                    <td style="padding: 10px;"><b>${d.pengirim}</b></td>
                    <td style="padding: 10px;">${d.tgl_diterima}</td>
                    <td style="padding: 10px;">${d.tgl_surat}</td>
                    <td style="padding: 10px;"><code>${d.no_surat_pengirim}</code></td>
                    <td style="padding: 10px;">${d.perihal}</td>
                    <td style="padding: 10px;">👤 ${d.petugas}</td>
                    <td style="padding: 10px;"><b style="color: #00fff0;">[${d.kode_surat}]</b></td>
                    <td style="padding: 10px;">
                        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                            ${tombolDisposisi} ${tombolScan} ${tombolHapus}
                        </div>        
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        // Listener Aksi Surat Masuk (Memakai hapusSurat universal dari common.js)
        document.querySelectorAll('.btn-disposisi').forEach(btn => {
            btn.addEventListener('click', (e) => cetakDisposisi(e.target.dataset.id));
        });
        document.querySelectorAll('.btn-hapus-sm').forEach(btn => {
            btn.addEventListener('click', (e) => hapusSurat(e.target.dataset.id, 'masuk', loadTabelSuratMasuk));
        });

    } catch (err) {
        container.innerHTML = `<p style="color: #ff4757;">❌ Gagal mengambil data!</p>`;
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
            if (typeof loadPage === 'function') setTimeout(() => { loadPage('eksplorasi'); }, 1200);
        } else {
            msg.innerText = "❌ " + data.message;
            msg.style.color = "#ff4757";
        }
    } catch (err) {
        msg.innerText = "❌ Terjadi kesalahan server!";
        msg.style.color = "#ff4757";
    }
}