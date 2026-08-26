let masterData = { guru: [], siswa: [] };

export async function initMasterData() {
    try {
        const res = await fetch('/static/master_data.json');
        if (!res.ok) throw new Error("Gagal load master_data.json");
        masterData = await res.json();
    } catch (err) {
        console.error("❌ Error Autocomplete Master Data:", err);
    }
}

export function getMasterData() {
    return masterData;
}

// 🔥 FUNGSI HELPER BARU DITAROH DI SINI BOSSS! 🗿🍌
export function convertToCustomDropdown(selectId) {
    const origSelect = document.getElementById(selectId);
    if (!origSelect) return;

    // 1. Sembunyiin <select> aslinya biar tetep bisa dibaca nilainya sama form
    origSelect.style.display = 'none';

    // 2. Buat Wrapper Custom
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    wrapper.style.cssText = 'position: relative; width: 100%; display: inline-block;';

    // 3. Buat Box Tampilan Pilihan Saat Ini (Trigger)
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    const selectedText = origSelect.options[origSelect.selectedIndex]?.text || 'Pilih...';
    
    trigger.innerHTML = `<span>${selectedText}</span> <small style="color: #00fff0;">▼</small>`;
    trigger.style.cssText = `
        background: #2d3436; color: white; padding: 10px 12px;
        border: 1px solid #00fff0; border-radius: 8px; cursor: pointer;
        display: flex; justify-content: space-between; align-items: center;
        font-size: 0.9rem;
    `;

    // 4. Buat Menu Options (Melipat / Floating Box ala SuggestionBox)
    const optionsBox = document.createElement('div');
    optionsBox.className = 'custom-options-box';
    optionsBox.style.cssText = `
        position: absolute; top: 100%; left: 0; right: 0;
        background: #2d3436; border: 1px solid #00fff0;
        max-height: 180px; overflow-y: auto; z-index: 999;
        border-radius: 0 0 8px 8px; display: none;
        box-shadow: 0 6px 15px rgba(0,0,0,0.6); margin-top: 2px;
    `;

    // 5. Populate Isi Opsi dari <select> Asli
    Array.from(origSelect.options).forEach((opt) => {
        const item = document.createElement('div');
        item.className = 'custom-option-item';
        item.style.cssText = `
            padding: 8px 12px; cursor: pointer; color: white;
            border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem;
        `;
        item.textContent = opt.text;

        item.addEventListener('click', () => {
            // Set value ke select asli & trigger event 'change'
            origSelect.value = opt.value;
            origSelect.dispatchEvent(new Event('change'));

            // Update tampilan trigger UI
            trigger.querySelector('span').textContent = opt.text;
            optionsBox.style.display = 'none';
        });

        // Hover Effect
        item.addEventListener('mouseenter', () => item.style.background = '#00fff022');
        item.addEventListener('mouseleave', () => item.style.background = 'transparent');

        optionsBox.appendChild(item);
    });

    // 6. Toggle Buka/Tutup Lipatan Dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Tutup custom dropdown lain yang lagi kebuka
        document.querySelectorAll('.custom-options-box').forEach(box => {
            if (box !== optionsBox) box.style.display = 'none';
        });
        
        optionsBox.style.display = optionsBox.style.display === 'none' ? 'block' : 'none';
    });

    // Pasang ke DOM
    origSelect.parentNode.insertBefore(wrapper, origSelect);
    wrapper.appendChild(origSelect);
    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsBox);

    // Close pas klik luar area
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            optionsBox.style.display = 'none';
        }
    });
}

export function setupAutocompleteNama() {
    const inputNama = document.getElementById('namaPenerima');
    const selectKelas = document.getElementById('kelas');
    const inputNIS = document.getElementById('noIndukSiswa');
    const selectTipe = document.getElementById('tipeSubjek');

    if (!inputNama) return;

    let suggestionBox = document.getElementById('suggestionBox');
    if (!suggestionBox) {
        suggestionBox = document.createElement('div');
        suggestionBox.id = 'suggestionBox';
        suggestionBox.style.cssText = `
            position: absolute; background: #ffffff; border: 1.5px solid #e9ecef;
            max-height: 200px; overflow-y: auto; width: 100%; z-index: 999;
            border-radius: 12px; display: none; box-shadow: 0 10px 25px rgba(0,0,0,0.08); margin-top: 6px;
        `;
        inputNama.parentNode.style.position = 'relative';
        inputNama.parentNode.appendChild(suggestionBox);
    }

    inputNama.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const tipe = selectTipe ? selectTipe.value : 'S';
        const filterKelasUnit = selectKelas ? selectKelas.value : '';

        if (!query) {
            suggestionBox.style.display = 'none';
            return;
        }

        let results = [];
        if (tipe === 'P') {
            results = masterData.guru.filter(g => {
                const matchNama = g.nama.toLowerCase().includes(query);
                const matchUnit = filterKelasUnit ? g.unit === filterKelasUnit : true;
                return matchNama && matchUnit;
            });
        } else if (tipe === 'S') {
            results = masterData.siswa.filter(s => {
                const matchNama = s.nama.toLowerCase().includes(query);
                const matchKelas = filterKelasUnit ? s.kelas === filterKelasUnit : true;
                return matchNama && matchKelas;
            });
        } else {
            suggestionBox.style.display = 'none';
            return;
        }

        if (results.length === 0) {
            suggestionBox.innerHTML = `<div style="padding: 12px; color: #ff4757; font-size: 0.85rem; font-weight:600;">❌ Data tidak ditemukan...</div>`;
        } else {
            suggestionBox.innerHTML = results.map(item => `
                <div class="suggest-item" style="padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f2f6; color: #2d3436; transition: background 0.15s;">
                    <b style="font-size:0.9rem;">${item.nama}</b> <br>
                    <small style="color: #0984e3; font-weight: 600;">${tipe === 'P' ? item.unit : item.kelas + ' - ' + item.nis + (item.nisn ? ' / ' + item.nisn : '')}</small>
                </div>
            `).join('');

            suggestionBox.querySelectorAll('.suggest-item').forEach((el, index) => {
                el.addEventListener('mouseenter', () => el.style.background = '#e3f2fd');
                el.addEventListener('mouseleave', () => el.style.background = 'transparent');

                el.addEventListener('click', () => {
                    const selected = results[index];
                    inputNama.value = selected.nama;

                    if (tipe === 'P') {
                        if (selectKelas) selectKelas.value = selected.unit || '';
                        if (inputNIS) inputNIS.value = selected.nip || '';
                    } else {
                        if (selectKelas) selectKelas.value = selected.kelas || '';
                        if (inputNIS) {
                            const nisnVal = selected.nisn ? ` / ${selected.nisn}` : '';
                            inputNIS.value = `${selected.nis}${nisnVal}`;
                        }
                    }
                    suggestionBox.style.display = 'none';
                });
            });
        }
        suggestionBox.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
        if (e.target !== inputNama && e.target !== suggestionBox) {
            suggestionBox.style.display = 'none';
        }
    });
}