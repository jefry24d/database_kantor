// static/js/audit_log.js

export async function renderAuditLogPage(content) {
    content.innerHTML = `
        <h2>📜 RIWAYAT AKTIVITAS SISTEM (AUDIT LOG)</h2>
        <p style="color: #aaa; margin-bottom: 20px;">Catatan permanen aktivitas pengguna. Data ini tersimpan aman di server.</p>
        <div id="tabelAuditLog">Memuat riwayat aktivitas...</div>
    `;

    loadTabelAuditLog();
}

async function loadTabelAuditLog() {
    const container = document.getElementById('tabelAuditLog');
    try {
        const res = await fetch('/api/admin/logs');
        const logs = await res.json();

        if (logs.length === 0) {
            container.innerHTML = `<p style="color: #ccc;">Belum ada riwayat aktivitas yang tercatat nyot.</p>`;
            return;
        }

        let html = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.1); text-align: left;">
                        <th style="padding: 10px;">Waktu & Tanggal</th>
                        <th style="padding: 10px;">Pengguna</th>
                        <th style="padding: 10px;">Aksi</th>
                        <th style="padding: 10px;">Detail Aktivitas</th>
                    </tr>
                </thead>
                <tbody>
        `;

        logs.forEach(log => {
            let colorAksi = log.action.includes('HAPUS') ? '#ff4757' : '#00b894';
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 10px; color: #aaa;"><code>${log.created_at}</code></td>
                    <td style="padding: 10px;"><b>👤 ${log.username}</b></td>
                    <td style="padding: 10px;"><b style="color: ${colorAksi};">[${log.action}]</b></td>
                    <td style="padding: 10px;">${log.detail}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<p style="color: #ff4757;">❌ Gagal memuat riwayat aktivitas!</p>`;
    }
}