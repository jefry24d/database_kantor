import { hapusSurat } from './common.js';
import { initMasterData, setupAutocompleteNama, getMasterData } from './autocomplete_helper.js';

initMasterData();

const getValue = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
};

function generateNomorSurat() {
    const kode = getValue('kodeKlasifikasi') || '421.7';
    const noUrut = getValue('noUrutSurat').trim() || '001';
    const tipe = getValue('tipeSubjek') || 'S';
    const tglInput = getValue('tglSurat');
    const tahun = tglInput ? new Date(tglInput).getFullYear() : new Date().getFullYear();

    return `${kode}/${noUrut}.SMABHY.${tipe}/402.4.9.24/${tahun}`;
}

export async function updateInfoNomorTerakhir() {
    const inputNoUrut = document.getElementById('noUrutSurat');
    if (!inputNoUrut) return;

    let infoLabel = document.getElementById('infoNoTerakhir');
    if (!infoLabel) {
        infoLabel = document.createElement('small');
        infoLabel.id = 'infoNoTerakhir';
        infoLabel.style.cssText = 'display:block; margin-top:4px; color:#00fff0; font-weight:bold;';
        inputNoUrut.parentNode.appendChild(infoLabel);
    }

    try {
        const res = await fetch('/api/last-number');
        const data = await res.json();

        if (data.success) {
            infoLabel.innerHTML = `📌 No. Urut Terakhir (Global): <b style="color:#fffa65;">${data.last_number}</b> | Saran Selanjutnya: <b style="color:#00ff88;">${data.suggested_number}</b>`;
            if (!inputNoUrut.value || inputNoUrut.value === '001') {
                inputNoUrut.value = data.suggested_number;
            }
        }
    } catch (err) {
        console.error("Gagal mengambil nomor terakhir:", err);
    }
}

// Helper untuk memperbarui dropdown Kelas/Unit berdasarkan tipe S atau P
// Helper untuk memperbarui elemen Kelas/Unit/Jurusan berdasarkan tipe S, P, atau M
function updateOptionsKelas() {
    const selectTipe = document.getElementById('tipeSubjek');
    let elKelas = document.getElementById('kelas');
    if (!selectTipe || !elKelas) return;

    const tipe = selectTipe.value;
    const master = getMasterData();
    const parentContainer = elKelas.parentNode;

    // Kalo tipe M (Mahasiswa), ubah jadi Input Text Biasa
    if (tipe === 'M') {
        if (elKelas.tagName === 'SELECT') {
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.id = 'kelas';
            newInput.placeholder = 'Contoh: S1 Administrasi Negara - UNESA';
            newInput.style.cssText = 'background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; width: 100%;';
            
            parentContainer.replaceChild(newInput, elKelas);
        }
    } 
    // Kalo tipe S atau P, kembalikan ke Dropdown Select
    else {
        if (elKelas.tagName === 'INPUT') {
            const newSelect = document.createElement('select');
            newSelect.id = 'kelas';
            newSelect.style.cssText = 'background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; width: 100%;';
            
            parentContainer.replaceChild(newSelect, elKelas);
            elKelas = newSelect; // Re-assign acuan elemen
        }

        elKelas.innerHTML = '';

        if (tipe === 'P') {
            elKelas.innerHTML = `<option value="" style="color:#000;">-- Pilih Unit Kerja Guru/Staf --</option>`;
            const units = [...new Set(master.guru.map(g => g.unit).filter(Boolean))];
            units.forEach(u => {
                elKelas.innerHTML += `<option value="${u}" style="color:#000;">👨‍🏫 ${u}</option>`;
            });
        } else { // Tipe 'S' (Siswa)
            elKelas.innerHTML = `<option value="" style="color:#000;">-- Pilih Kelas Siswa --</option>`;
            const kelases = [...new Set(master.siswa.map(s => s.kelas).filter(Boolean))];
            kelases.forEach(k => {
                elKelas.innerHTML += `<option value="${k}" style="color:#000;">🏫 ${k}</option>`;
            });
        }
    }
}

export async function renderFormSuratKeluar(content, subType = 'rekomendasi') {
    try {
        const res = await fetch('/static/surat_config.json');
        if (!res.ok) throw new Error("Gagal mengambil file JSON!");
        const schema = await res.json();

        const config = schema[subType] || schema['rekomendasi'];
        const todayStr = new Date().toISOString().split('T')[0];

        const makeInputs = (fields) => fields.map(f => {
            if (f.type === 'select') {
                const optionsHtml = (f.options || []).map(opt => `<option value="${opt.value}" style="color:#000;">${opt.text}</option>`).join('');
                return `
                    <div style="margin-bottom: 10px;">
                        <label style="display:block; margin-bottom: 4px; font-weight:bold;">${f.label}</label>
                        <select id="${f.id}" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; width: 100%;">
                            ${optionsHtml}
                        </select>
                    </div>
                `;
            }

            const type = f.type || 'text';
            let val = '';
            if (f.isToday || f.id === 'tglSurat') {
                val = `value="${todayStr}"`;
            } else if (f.defaultValue) {
                val = `value="${f.defaultValue}"`;
            }

            return `
                <div style="margin-bottom: 10px;">
                    <label style="display:block; margin-bottom: 4px; font-weight:bold;">${f.label}</label>
                    <input type="${type}" id="${f.id}" placeholder="${f.placeholder || ''}" ${val}
                        style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; width: 100%;">
                </div>
            `;
        }).join('');

        let htmlTextArea = '';
        if (config.textarea) {
            htmlTextArea = `
                <div style="margin-top: 15px;">
                    <label style="font-weight:bold; display:block; margin-bottom: 4px;">${config.textarea.label}</label>
                    <textarea id="${config.textarea.id}" rows="${config.textarea.rows}" 
                              style="width:100%; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:10px;">${config.textarea.default || ''}</textarea>
                </div>
            `;
        }

        content.innerHTML = `
            <h2>${config.judul}</h2>
            <input type="hidden" id="jenisSurat" value="${config.jenis}">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>${makeInputs(config.kiri)}</div>
                <div>${makeInputs(config.kanan)}</div>
            </div>
            ${htmlTextArea}
            <button id="btnSimpanCetak" class="btn-primary" style="margin-top: 15px;">💾 Simpan & Buka Template Cetak Surat 🖨️</button>
            <p id="msg" style="margin-top: 10px;"></p>
        `;

        document.getElementById('btnSimpanCetak').addEventListener('click', simpanDanCetak);

    } catch (err) {
        console.error("Error Form Render:", err);
        content.innerHTML = `<p style="color: #ff4757;">❌ Gagal memuat form dari JSON schema!</p>`;
    }

    updateInfoNomorTerakhir();

    const selectKode = document.getElementById('kodeKlasifikasi');
    if (selectKode) {
        selectKode.addEventListener('change', updateInfoNomorTerakhir);
    }

    // Event listener perpindahan S / P
    const selectTipe = document.getElementById('tipeSubjek');
    if (selectTipe) {
        selectTipe.addEventListener('change', () => {
            updateOptionsKelas();
            const inputNama = document.getElementById('namaPenerima');
            if (inputNama) inputNama.value = '';
            const inputNIS = document.getElementById('noIndukSiswa');
            if (inputNIS) inputNIS.value = '';
        });
    }

    // Inisialisasi awal dropdown Kelas/Unit
    updateOptionsKelas();
    setupAutocompleteNama();
}

export async function simpanDanCetak() {
    const msg = document.getElementById('msg');
    msg.innerText = "Sedang menyimpan surat...";
    msg.style.color = "#00fff0";

    const jenisSurat = getValue('jenisSurat') || 'KETERANGAN';
    const nomorSuratLengkap = getValue('noSurat') || generateNomorSurat();
    const tipe = getValue('tipeSubjek') || 'S';

    // AUTO-FILL PERIHAL KALO SURAT KETERANGAN (BIAR KAGAK ERROR DIBLOCK SERVER)
    let perihalVal = getValue('perihal');
    if (!perihalVal && (jenisSurat === 'KETERANGAN' || jenisSurat === 'KETERANGAN_BEBAS')) {
        const namaPenerima = getValue('namaPenerima') || 'Siswa/Pegawai';
        perihalVal = `Surat Keterangan a.n ${namaPenerima}`;
    }

    const payload = {
        jenis: jenisSurat,
        nomor_surat: nomorSuratLengkap,
        perihal: perihalVal,
        bulan: getValue('bulan') || 'Januari',
        tgl_surat: getValue('tglSurat'),
        nama_penerima: getValue('namaPenerima'),

        kelas: getValue('kelas'),
        no_induk_siswa: getValue('noIndukSiswa'),
        unit: (tipe === 'P' || tipe === 'M') ? getValue('kelas') : '-',
        no_pegawai: (tipe === 'P' || tipe === 'M') ? getValue('noIndukSiswa') : '-',

        ttl: getValue('ttl'),
        alamat: getValue('alamat'),
        isi_keterangan: getValue('isiKeterangan'),
        keterangan_acara: getValue('keteranganAcara'),
        hari_tanggal: getValue('hariTanggal'),
        tempat: getValue('tempat'),
        waktu: getValue('waktu'),
        lampiran: getValue('lampiran') || '-'
    };

    try {
        const res = await fetch('/surat/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            msg.innerText = "✅ " + data.message;
            msg.style.color = "#00ff88";
            setTimeout(() => {
                window.open(`/surat/cetak/${data.surat_id}`, '_blank');
            }, 800);
        } else {
            msg.innerText = "❌ " + data.message;
            msg.style.color = "#ff4757";
        }
    } catch (err) {
        msg.innerText = "❌ Gagal koneksi ke server!";
        msg.style.color = "#ff4757";
    }
}

export function renderCustomSuratHybrid(content) {
    content.innerHTML = `
        <h2>📜 CUSTOM SURAT HYBRID</h2>
        <p style="color:#aaa;">Upload dokumen file custom atau buat format tersendiri.</p>
        <div style="background:rgba(0,0,0,0.2); padding:20px; border-radius:12px;">
            <label>Nomor Surat:</label>
            <input type="text" id="cs_no_surat" placeholder="Contoh: 005/CS/2026">
            <label>Perihal:</label>
            <input type="text" id="cs_perihal" placeholder="Perihal surat custom">
            <label>Pilih File (.pdf / .doc / .jpg):</label>
            <input type="file" id="cs_file" accept=".pdf,.doc,.docx,.png,.jpg">
            <button id="btnUploadCustom" class="btn-primary" style="margin-top:15px;"> Upload Custom Surat</button>
            <p id="msgCustom" style="margin-top:10px;"></p>
        </div>
    `;

    document.getElementById('btnUploadCustom').addEventListener('click', async () => {
        const msg = document.getElementById('msgCustom');
        const formData = new FormData();
        formData.append('jenis', 'CUSTOM_FILE');
        formData.append('nomor_surat', document.getElementById('cs_no_surat').value);
        formData.append('perihal', document.getElementById('cs_perihal').value);
        
        const fileInput = document.getElementById('cs_file');
        if (fileInput.files.length > 0) {
            formData.append('file_surat', fileInput.files[0]);
        }

        const res = await fetch('/surat/add', { method: 'POST', body: formData });
        const data = await res.json();
        msg.innerText = data.message;
        msg.style.color = data.success ? '#00ff88' : '#ff4757';
    });
}

export async function loadTabelSuratKeluar() {
    const container = document.getElementById('areaTabelEksplorasi');
    if (!container) return;
    container.innerHTML = "Memuat data Surat Keluar...";

    try {
        const res = await fetch('/api/eksplorasi');
        const data = await res.json();

        if (data.length === 0) {
            container.innerHTML = `<p style="color: #ff4757;">Belum ada arsip surat keluar nyot.</p>`;
            return;
        }

        let html = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.1); text-align: left;">
                        <th style="padding: 10px;">No</th>
                        <th style="padding: 10px;">Tanggal Surat</th>
                        <th style="padding: 10px;">No. Surat</th>
                        <th style="padding: 10px;">Perihal</th>
                        <th style="padding: 10px;">Penerima</th>
                        <th style="padding: 10px;">Pembuat</th>
                        <th style="padding: 10px;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach((d, index) => {
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px;"><b>${index + 1}</b></td>
                    <td style="padding: 10px; color:#00fff0;">${d.tgl_surat || '-'}</td>
                    <td style="padding: 10px;"><code>${d.nomor_surat}</code></td>
                    <td style="padding: 10px;">${d.perihal}</td>
                    <td style="padding: 10px;">${d.nama_penerima || '-'}</td>
                    <td style="padding: 10px;">👤 ${d.uploaded_by}</td>
                    <td style="padding: 10px;">
                        <div style="display: flex; gap: 4px;">
                            <button data-id="${d.id}" class="btn-cetak-sk btn-primary" style="padding:4px 8px; font-size:0.75rem; background:#0984e3; border:none; border-radius:4px;">🖨️ Cetak</button>
                            <button data-id="${d.id}" class="btn-hapus-sk btn-primary" style="padding:4px 8px; font-size:0.75rem; background:#ff4757; border:none; border-radius:4px;">🗑️ Hapus</button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        document.querySelectorAll('.btn-cetak-sk').forEach(btn => {
            btn.addEventListener('click', (e) => window.open(`/surat/cetak/${e.target.dataset.id}`, '_blank'));
        });
        document.querySelectorAll('.btn-hapus-sk').forEach(btn => {
            btn.addEventListener('click', (e) => hapusSurat(e.target.dataset.id, 'keluar', loadTabelSuratKeluar));
        });

    } catch (err) {
        container.innerHTML = `<p style="color: #ff4757;">❌ Gagal memuat data surat keluar!</p>`;
    }
}