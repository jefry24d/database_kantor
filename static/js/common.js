// 🔔 Notifikasi Helper Universal
export function tampilkanAlert(pesan, tipe = 'info') {
    if (tipe === 'error') {
        alert(`❌ ${pesan}`);
    } else if (tipe === 'success') {
        alert(`✅ ${pesan}`);
    } else {
        alert(`ℹ️ ${pesan}`);
    }
}

// 🖨️ Helper Buka Lembar Disposisi di Tab Baru
export function cetakDisposisi(id) {
    window.open(`/cetak-disposisi/${id}`, '_blank');
}

// 🔄 Switch Tab Eksplorasi (Masuk vs Keluar)
export function switchEksplorasiTab(type, callbackMasuk, callbackKeluar) {
    const btnMasuk = document.getElementById('btnEksMasuk');
    const btnKeluar = document.getElementById('btnEksKeluar');

    if (type === 'masuk') {
        btnMasuk.style.background = '#00b894';
        btnKeluar.style.background = 'rgba(255,255,255,0.1)';
        if (callbackMasuk) callbackMasuk();
    } else {
        btnKeluar.style.background = '#0984e3';
        btnMasuk.style.background = 'rgba(255,255,255,0.1)';
        if (callbackKeluar) callbackKeluar();
    }
}

// 🗑️ Helper Hapus Surat Universal dengan Konfirmasi Yes/No
export async function hapusSurat(id, tipe, callbackRefresh) {
    const namaTipe = tipe === 'masuk' ? 'Surat Masuk' : 'Surat Keluar';
    
    // 🛑 POP-UP KONFIRMASI YES / NO
    const yakin = confirm(`⚠️ YAKIN MAU HAPUS ARSIP INI?\n\nData ${namaTipe} (ID: ${id}) akan dihapus permanen dan dicatat ke Audit Log!`);
    
    if (!yakin) return; // Kalau No/Cancel, batalkan!

    const url = tipe === 'masuk' ? `/api/surat-masuk/${id}` : `/api/surat/${id}`;

    try {
        const res = await fetch(url, { method: 'DELETE' });
        const data = await res.json();

        if (data.status === 'success' || data.success) {
            alert(`✅ Berhasil! ${namaTipe} telah dihapus.`);
            if (callbackRefresh) callbackRefresh(); // Refresh tabel otomatis
        } else {
            alert(`❌ Gagal menghapus: ${data.message}`);
        }
    } catch (err) {
        console.error(err);
        alert('❌ Terjadi kesalahan koneksi server!');
    }
}