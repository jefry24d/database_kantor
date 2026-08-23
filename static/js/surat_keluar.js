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
    if (!perihalVal) {
        const namaPenerima = getValue('namaPenerima') || 'Siswa/Pegawai';
        if (jenisSurat === 'KETERANGAN_PIP') {
            perihalVal = `Aktivasi Rekening Simple PIP a.n ${namaPenerima}`;
        } else if (jenisSurat === 'KETERANGAN' || jenisSurat === 'KETERANGAN_BEBAS') {
            perihalVal = `Surat Keterangan a.n ${namaPenerima}`;
        } else {
            perihalVal = `Surat Keterangan ${jenisSurat} a.n ${namaPenerima}`;
        }
    }

    const payload = {
        jenis: jenisSurat,
        nomor_surat: nomorSuratLengkap,
        perihal: perihalVal,
        bulan: getValue('bulan') || 'Januari',
        tgl_surat: getValue('tglSurat'),
        nama_penerima: getValue('namaPenerima'),

        nama_event: getValue('namaEvent'),
        
        nama_bank: getValue('namaBank'),
        no_rekening: getValue('noRekening'),
        virtual_account: getValue('virtualAccount'),

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

// Render Form Khusus Custom File (BISA AUTO GENERATE NO SURAT + AUDIT LOG)
export function renderCustomSuratHybrid(content) {
    content.innerHTML = `
        <h2>📤 UPLOAD SURAT CUSTOM / ARSIP DOKUMEN</h2>
        <p style="color:#aaa;">Input identifikasi database dan upload dokumen (PDF/Word/Gambar).</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background:rgba(0,0,0,0.2); padding:20px; border-radius:12px;">
            <div>
                <label style="font-weight:bold; display:block; margin-bottom:4px;">Kode Klasifikasi Surat</label>
                <select id="kodeKlasifikasi" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; width: 100%;">
                    <option value="421.7" style="color:#000;">421.7 - Kegiatan Pelajar / Siswa</option>
                    <option value="425" style="color:#000;">425 - Sarana Pendidikan</option>
                    <option value="424" style="color:#000;">424 - Guru/Guru Teladan</option>
                    <option value="422" style="color:#000;">422 - Administrasi Sekolah</option>
                </select>

                <label style="font-weight:bold; display:block; margin-top:10px; margin-bottom:4px;">Nomor Urut Surat</label>
                <input type="text" id="noUrutSurat" placeholder="Contoh: 001" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; width: 100%;">

                <label style="font-weight:bold; display:block; margin-top:10px; margin-bottom:4px;">Tipe Penerima (S / P)</label>
                <select id="tipeSubjek" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; width: 100%;">
                    <option value="S" style="color:#000;">S - Siswa</option>
                    <option value="P" style="color:#000;">P - Pegawai / Guru</option>
                </select>

                <label style="font-weight:bold; display:block; margin-top:10px; margin-bottom:4px;">Perihal / Judul Surat</label>
                <input type="text" id="perihal" placeholder="Contoh: SK Panitia PPDB 2026" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; width: 100%;">
            </div>

            <div>
                <label style="font-weight:bold; display:block; margin-bottom:4px;">Ditujukan Kepada / Penerima</label>
                <input type="text" id="namaPenerima" placeholder="Contoh: Seluruh Panitia" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; width: 100%;">

                <label style="font-weight:bold; display:block; margin-top:10px; margin-bottom:4px;">📅 Tanggal Surat Dibuat</label>
                <input type="date" id="tglSurat" value="${new Date().toISOString().split('T')[0]}" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 10px; width: 100%;">

                <label style="font-weight:bold; display:block; margin-top:10px; margin-bottom:4px;">📁 Upload File Surat (.pdf / .doc / .jpg)</label>
                <input type="file" id="fileSurat" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px; width: 100%;">
            </div>
        </div>

        <button id="btnUploadCustom" class="btn-primary" style="margin-top: 15px;">💾 Simpan ID & Upload Dokumen Custom 🚀</button>
        <p id="msgCustom" style="margin-top: 10px;"></p>
    `;

    // Ambil nomor urut saran paling baru
    updateInfoNomorTerakhir();

    const selectKode = document.getElementById('kodeKlasifikasi');
    if (selectKode) {
        selectKode.addEventListener('change', updateInfoNomorTerakhir);
    }

    document.getElementById('btnUploadCustom').addEventListener('click', async () => {
        const msg = document.getElementById('msgCustom');
        msg.innerText = "Proses mengunggah dokumen...";
        msg.style.color = "#00fff0";

        const formData = new FormData();
        formData.append('jenis', 'CUSTOM_FILE');
        formData.append('nomor_surat', generateNomorSurat());
        formData.append('perihal', getValue('perihal'));
        formData.append('nama_penerima', getValue('namaPenerima'));
        formData.append('tgl_surat', getValue('tglSurat'));

        const fileInput = document.getElementById('fileSurat');
        if (fileInput.files.length > 0) {
            formData.append('file_surat', fileInput.files[0]);
        }

        try {
            const res = await fetch('/surat/add', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                msg.innerText = "✅ " + data.message;
                msg.style.color = "#00ff88";
            } else {
                msg.innerText = "❌ " + data.message;
                msg.style.color = "#ff4757";
            }
        } catch (err) {
            msg.innerText = "❌ Gagal koneksi ke server!";
            msg.style.color = "#ff4757";
        }
    });
}

export async function loadTabelSuratKeluar() {
    const area = document.getElementById('areaTabelEksplorasi');
    if (!area) return;

    try {
        const res = await fetch('/api/surat-keluar');
        const data = await res.json();

        let html = `
            <table class="fl-table" style="width:100%; text-align:left; border-collapse:collapse;">
                <thead>
                    <tr style="background:rgba(255,255,255,0.1); color:#00fff0;">
                        <th style="padding:10px;">No</th>
                        <th>Jenis</th>
                        <th>No. Surat</th>
                        <th>Perihal</th>
                        <th>Penerima</th>
                        <th>Tgl Surat</th>
                        <th>Petugas</th>
                        <th style="text-align:center;">Aksi</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (data.length === 0) {
            html += `<tr><td colspan="8" style="text-align:center; padding:20px;">Belum ada arsip surat keluar.</td></tr>`;
        } else {
            data.forEach((d, index) => {
                // Tombol Approve hanya muncul jika BUKAN Surat Custom
                let btnApprove = '';
                if (d.jenis_surat !== 'CUSTOM') {
                    if (d.is_approved == 1) {
                        btnApprove = `<span style="background:#00b894; color:white; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">✅ Approved</span>`;
                    } else {
                        btnApprove = `<button data-id="${d.id}" class="btn-approve-sk" style="padding:5px 10px; font-size:0.75rem; background:#2ed573; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">✅ Approve</button>`;
                    }
                } else {
                    btnApprove = `<span style="color:#aaa; font-size:0.75rem;">-</span>`;
                }

                html += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding:10px;">${index + 1}</td>
                        <td><span style="background:#0984e3; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${d.jenis_surat}</span></td>
                        <td><strong>${d.nomor_surat}</strong></td>
                        <td>${d.perihal}</td>
                        <td>${d.penerima_atau_pihak || '-'}</td>
                        <td>${d.tgl_surat}</td>
                        <td><small>👤 ${d.created_by || 'admin'}</small></td>
                        <td style="text-align:center; display:flex; gap:5px; justify-content:center; align-items:center;">
                            ${btnApprove}
                            <button onclick="window.open('/surat/cetak/${d.id}', '_blank')" style="padding:5px 10px; font-size:0.75rem; background:#0984e3; color:white; border:none; border-radius:4px; cursor:pointer;">🖨️ Cetak</button>
                            <button onclick="hapusSuratKeluar(${d.id})" style="padding:5px 10px; font-size:0.75rem; background:#ff4757; color:white; border:none; border-radius:4px; cursor:pointer;">🗑️ Hapus</button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table>`;
        area.innerHTML = html;

        // Event Listener Tombol Approve
        document.querySelectorAll('.btn-approve-sk').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (confirm("Approve surat ini dan tampilkan TTD/Stempel Digital saat dicetak?")) {
                    try {
                        const appRes = await fetch(`/api/surat/approve/${id}`, { method: 'POST' });
                        const appData = await appRes.json();
                        if (appData.success) {
                            loadTabelSuratKeluar();
                        } else {
                            alert(appData.message);
                        }
                    } catch (err) {
                        alert("Gagal melakukan approval");
                    }
                }
            });
        });

    } catch (err) {
        area.innerHTML = `<p style="color:red;">Gagal memuat tabel surat keluar.</p>`;
    }
}