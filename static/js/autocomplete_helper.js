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
            position: absolute; background: #2d3436; border: 1px solid #00fff0;
            max-height: 180px; overflow-y: auto; width: 100%; z-index: 999;
            border-radius: 0 0 8px 8px; display: none; box-shadow: 0 6px 15px rgba(0,0,0,0.6);
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
            // Tipe 'M' (Mahasiswa) - Bebas ngetik manual tanpa autocomplete master data
            suggestionBox.style.display = 'none';
            return;
        }

        if (results.length === 0) {
            suggestionBox.innerHTML = `<div style="padding: 10px; color: #ff4757; font-size: 0.85rem;">❌ Data tidak ditemukan...</div>`;
        } else {
            suggestionBox.innerHTML = results.map(item => `
                <div class="suggest-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.1); color: white;">
                    <b>${item.nama}</b> <br>
                    <small style="color: #00fff0;">${tipe === 'P' ? item.unit : item.kelas + ' - ' + item.nis}</small>
                </div>
            `).join('');

            suggestionBox.querySelectorAll('.suggest-item').forEach((el, index) => {
                el.addEventListener('click', () => {
                    const selected = results[index];
                    inputNama.value = selected.nama;

                    if (tipe === 'P') {
                        if (selectKelas) selectKelas.value = selected.unit || '';
                        if (inputNIS) inputNIS.value = selected.nip || '';
                    } else {
                        if (selectKelas) selectKelas.value = selected.kelas || '';
                        if (inputNIS) inputNIS.value = selected.nis || '';
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