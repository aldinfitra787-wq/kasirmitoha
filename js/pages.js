/* pages.js — Login, Verifikasi, Dashboard, Kasir, Pembayaran, Struk, Shift */
'use strict';

// ============================================================ LOGIN
registerPage('login', {
  auth: 'public', shell: false, title: 'Login Kasir',
  template: () => `
  <div class="full">
    <div class="full-top" id="lgTop">POS-TERM-01 • DAPOERMITOHA • SHIFT KASIR</div>
    <form class="login-card" id="lgForm" autocomplete="on">
      <div class="between"><span class="pill soft-red"><span class="dotc"></span><span id="lgReady">TERMINAL READY</span></span><span class="mono" style="font-size:16px"><span data-live-clock>--:--</span> WIB</span></div>
      <div class="login-brand"><div class="brand-logo">${icon('ladle', 'ic-lg')}</div><div><div class="h3" style="font-size:22px">DapoerMitoha POS</div><div class="ink2">Seblak Hotpot • Street Kitchen POS Cloud</div><span class="tag mono mt8">Cloud Edition v2.4</span></div></div>
      <div><h1 class="h1" style="font-size:26px">Staff Terminal Login</h1><p class="ink2" style="margin:6px 0 0">Gunakan akun staf outlet untuk membuka sesi register dan mencatat pesanan.</p></div>
      <div class="field"><label for="lgEmail">Akun Kasir <span class="hint mono" id="lgDomain"></span></label>
        <div class="input-ic">${icon('user')}<input class="input" id="lgEmail" type="email" inputmode="email" autocomplete="username" placeholder="kasir01@dapoermitoha.internal" required></div></div>
      <div class="field"><label for="lgPin">PIN Otorisasi <a href="javascript:void 0" id="lgForgot" class="small" style="font-weight:600">Lupa PIN Kasir?</a></label>
        <div class="input-ic">${icon('key')}<input class="input mono" id="lgPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="6" placeholder="••••••" required style="letter-spacing:.3em">
        <button type="button" class="icon-btn suffix" id="lgEye" aria-label="Tampilkan PIN">${icon('eye')}</button></div></div>
      <label class="check small"><input type="checkbox" id="lgRemember" checked><span>Ingat sesi pada terminal kasir fisik ini (<b>maksimal 12 jam kerja shift</b>). Otomatis logout saat sesi berakhir.</span></label>
      <button class="btn btn-primary btn-lg btn-block" id="lgBtn" type="submit">${icon('register')}MASUK KE KASIR</button>
      <div id="lgSso"><button type="button" class="btn btn-soft btn-block btn-lg sso" id="lgGoogle" style="font-size:15px"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>Masuk dengan Google Workspace</button></div>
      <div class="demo-box" id="lgDemo" hidden><b>Mode demo</b> — data contoh tersimpan di peramban ini. Pilih akun:
        <div class="row-wrap"><button type="button" class="btn btn-sm btn-secondary" data-demo="kasir01@dapoermitoha.internal|111111">Kasir · Siti</button><button type="button" class="btn btn-sm btn-secondary" data-demo="spv01@dapoermitoha.internal|222222">Supervisor · Hendra</button><button type="button" class="btn btn-sm btn-secondary" data-demo="owner@dapoermitoha.internal|123456">Owner</button></div></div>
      <div class="syncbox"><div class="between"><span class="label-sm mono" style="color:var(--primary-deep)">${icon('sync', 'ic-sm')} CLOUD SYNC ENGINE</span><span class="small mono ink2" id="lgTid">ID: T-01</span></div>
        <div class="cells"><div class="cell"><span class="pill" style="width:8px;height:8px;padding:0;background:var(--secondary)" id="lgDot"></span><div><div>Sheets POS DB</div><div class="mono small orange" id="lgLat">Memeriksa…</div></div></div>
        <div class="cell"><span class="pill" style="width:8px;height:8px;padding:0;background:var(--secondary)"></span><div><div>Drive Storage</div><div class="mono small ink2" id="lgDrive">${DEMO ? 'Mode demo' : 'Terhubung'}</div></div></div></div></div>
      <div class="small ink2" style="text-align:center">${icon('shield', 'ic-sm')} Terotentikasi • DapoerMitoha Central Cloud Protocol</div>
    </form>
    <div style="margin-top:22px;text-align:center"><div style="font-weight:600;font-size:18px"><span class="red">•</span> Pedas Nikmat Juara Rasa <span class="red">•</span></div><div class="small ink2 mt8">SOP POS Terminal Rev 2024.2 • Hak Cipta DapoerMitoha Group</div></div>
  </div>`,
  init(el) {
    const pin = $('#lgPin', el);
    $('#lgEye', el).onclick = () => { pin.type = pin.type === 'password' ? 'text' : 'password'; $('#lgEye', el).innerHTML = icon(pin.type === 'password' ? 'eye' : 'eyeoff'); };
    $('#lgForgot', el).onclick = () => toast('Lupa PIN?', 'Minta Owner mengatur ulang PIN Anda di menu Pengguna.', 'warn', 5000);
    if (DEMO) $('#lgDemo', el).hidden = false;
    $$('[data-demo]', el).forEach(b => b.onclick = () => { const p = b.dataset.demo.split('|'); $('#lgEmail', el).value = p[0]; pin.value = p[1]; $('#lgForm', el).requestSubmit(); });
    $('#lgForm', el).addEventListener('submit', async e => {
      e.preventDefault();
      let email = $('#lgEmail', el).value.trim();
      const dom = el.dataset.domain; if (email && email.indexOf('@') < 0 && dom) email += '@' + dom;
      const btn = $('#lgBtn', el); btn.disabled = true; btn.innerHTML = icon('sync') + 'Memeriksa…';
      const r = await api('login', { email, pin: pin.value.trim() });
      btn.disabled = false; btn.innerHTML = icon('register') + 'MASUK KE KASIR';
      if (!r.success) { toast('Login gagal', r.message, 'err'); pin.value = ''; pin.focus(); return; }
      afterLogin(r.data, $('#lgRemember', el).checked);
      toast('Login berhasil', r.message);
      go(defaultPage());
    });
    $('#lgGoogle', el).onclick = () => toast('Login Google belum aktif', 'Owner dapat mengisi GOOGLE_CLIENT_ID di Pengaturan.', 'warn', 5000);
  },
  async show(el) {
    const t0 = performance.now();
    const r = await apiGet({ action: 'publicInfo' });
    const ms = Math.round(performance.now() - t0);
    if (r.success) {
      const d = r.data;
      $('#lgTop', el).textContent = 'POS-TERM-' + (d.terminal || 'T-01').replace(/^T-/, '') + ' • ' + String(d.cabang || '').toUpperCase() + ' • ' + shiftNama().toUpperCase();
      $('#lgReady', el).textContent = 'TERMINAL READY • OUTLET ' + (d.kode || '01') + ' ' + String(d.cabang || '').toUpperCase();
      $('#lgTid', el).textContent = 'ID: ' + (d.terminal || 'T-01');
      $('#lgLat', el).textContent = 'Live (' + ms + 'ms)'; $('#lgDot', el).style.background = 'var(--success)';
      if (d.domain) { el.dataset.domain = d.domain; $('#lgDomain', el).textContent = 'WAJIB @' + d.domain; }
      if (d.googleClientId) setupGsi(el, d.googleClientId);
    } else { $('#lgLat', el).textContent = 'Tidak terhubung'; $('#lgDot', el).style.background = 'var(--error)'; }
  }
});
async function setupGsi(el, clientId) {
  try {
    await loadScript('https://accounts.google.com/gsi/client');
    google.accounts.id.initialize({ client_id: clientId, callback: async resp => {
      const r = await api('loginGoogle', { credential: resp.credential });
      if (!r.success) return toast('Login Google gagal', r.message, 'err');
      afterLogin(r.data, $('#lgRemember', el).checked); go(defaultPage());
    } });
    const box = $('#lgSso', el); box.innerHTML = '<div id="gsiBtn" style="display:flex;justify-content:center"></div>';
    google.accounts.id.renderButton($('#gsiBtn', box), { theme: 'outline', size: 'large', width: Math.min(480, box.offsetWidth || 320), text: 'signin_with', locale: 'id' });
  } catch (e) { }
}

// ============================================================ VERIFIKASI DOKUMEN (publik)
registerPage('v', {
  auth: 'public', shell: false, title: 'Verifikasi Dokumen',
  template: () => '<div class="full"><div class="full-top">VERIFIKASI DOKUMEN • DAPOERMITOHA</div><div class="verify-card" id="vfCard"><div class="modal-b"><div class="skel" style="height:80px"></div></div></div></div>',
  async show(el, kode) {
    const card = $('#vfCard', el);
    const r = await apiGet({ action: 'deVerify', k: kode });
    const d = r.data || {};
    const sah = r.success && d.status === 'SAH', tarik = r.success && d.status === 'DITARIK';
    card.innerHTML = '<div class="verify-status ' + (sah ? '' : tarik ? 'bad' : 'unk') + '">' + icon(sah ? 'shield' : tarik ? 'ban' : 'help', 'ic-lg') +
      '<div><div class="label-sm" style="color:rgba(255,255,255,.85)">STATUS DOKUMEN</div><div class="h2">' + (sah ? 'SAH & TERDAFTAR' : tarik ? 'DITARIK / TIDAK BERLAKU' : 'TIDAK DIKENAL') + '</div></div></div>' +
      '<div class="modal-b">' + (r.success ? '<div class="kv"><span>Nomor</span><span class="mono">' + esc(d.nomor) + '</span><span>Dokumen</span><span>' + esc(d.judul) + '</span><span>Diterbitkan</span><span>' + fmtDT(d.terbit) + ' WIB</span><span>Penerbit</span><span>' + esc(d.outlet) + '</span>' +
        (tarik ? '<span>Alasan ditarik</span><span>' + esc(d.alasanTarik) + '</span>' : '') + '</div>' +
        (d.penandatangan || []).map(p => '<div class="optrow">' + icon('checkc') + '<div class="grow"><b>' + esc(p.nama) + '</b><div class="small ink2">' + esc(p.jabatan) + ' · ' + (p.metode === 'BYPASS' ? 'Disahkan Owner' : 'Persetujuan elektronik ' + esc(p.metode)) + '</div></div><span class="small mono">' + fmtDT(p.waktu) + '</span></div>').join('') +
        (d.hashPdf ? '<div class="note"><b>Cek keaslian berkas PDF</b><p class="small ink2" style="margin:4px 0 10px">Unggah PDF yang Anda terima. Sidik jari SHA-256 dihitung di perangkat Anda — berkas tidak dikirim ke mana pun.</p><input type="file" accept="application/pdf" id="vfFile"><div id="vfRes" class="mt8"></div></div>' : '')
        : '<p>' + esc(r.message || 'Kode verifikasi tidak ditemukan.') + '</p><p class="small muted">Kode: <span class="mono">' + esc(kode) + '</span></p>') + '</div>';
    const f = $('#vfFile', card);
    if (f) f.onchange = async () => {
      const file = f.files[0]; if (!file) return;
      const buf = await file.arrayBuffer(), h = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buf))).map(b => b.toString(16).padStart(2, '0')).join('');
      $('#vfRes', card).innerHTML = h === d.hashPdf ? '<span class="pill green">' + icon('check', 'ic-sm') + 'Identik dengan arsip resmi</span>' : '<span class="pill red">' + icon('x', 'ic-sm') + 'Berbeda — berkas telah diubah atau bukan dokumen ini</span>';
    };
  }
});

// ============================================================ DASHBOARD
registerPage('dashboard', {
  title: 'Dashboard',
  template: () => `
  <div class="card hero">
    <div class="hero-l"><div class="hero-ic">${icon('ladle', 'ic-lg')}</div><div class="grow"><h1 class="h-display">Dashboard Operasional <span id="dbOutlet"></span></h1>
      <span class="pill soft-orange mt8"><span class="dotc" style="color:var(--secondary)"></span>${DEMO ? 'Mode Demo' : 'Live POS Cloud'}</span>
      <p class="ink2" style="margin:8px 0 0;max-width:560px">Monitoring real-time dapur seblak, laju antrean, dan performa kasir cabang.</p></div></div>
    <div class="hero-r"><span class="pill yellow" id="dbShift" style="height:32px;padding:0 14px"></span>
      <span class="datebox">${icon('calendar')}<span id="dbDate"></span> • <span data-live-clock>--:--</span> WIB</span>
      <button class="btn btn-primary btn-sm" id="dbSync">${icon('sync')}Sync Data</button></div>
  </div>
  <div class="grid g4 mt16" id="dbKpi">${'<div class="card kpi"><div class="skel" style="height:110px"></div></div>'.repeat(4)}</div>
  <div class="grid g-main mt16">
    <div class="card"><div class="card-h"><div><div class="h3">${icon('trend')} Tren Penjualan</div><div class="small ink2" id="dbChartSub">Omzet per jam operasional (09:00 – 21:00 WIB)</div></div>
      <div class="seg" id="dbRange"><button class="on" data-r="today">Hari Ini</button><button data-r="7d">7 Hari Terakhir</button></div></div>
      <div class="row-wrap" id="dbPeaks"></div>
      <div class="legend mt12" id="dbLegend"></div>
      <div class="chart mt8" id="dbChart"><div class="skel" style="height:220px"></div></div>
      <div class="grid g3 mt16" id="dbMini"></div></div>
    <div class="stack"><div class="card"><div class="card-h"><div><div class="h3">Top Topping Prasmanan</div><div class="small ink2">Pilihan topping terlaris hari ini</div></div>${icon('bowl', 'ic-lg')}</div><div class="stack" id="dbTop"></div></div>
      <div class="card"><div class="note" id="dbNote"></div></div></div>
  </div>
  <div class="card pad0 mt16"><div class="between" style="padding:18px 20px"><div class="row"><div class="tpl-ic">${icon('receipt')}</div><div><div class="h3">5 Transaksi Terakhir Masuk</div><div class="small ink2">Real-time order line kasir hari ini</div></div></div>
    <div class="row"><span class="pill hide-sm"><span class="dotc"></span>Kasir Utama Terminal #<span id="dbTerm"></span></span><a class="btn btn-primary btn-sm" href="#/kasir">Buka Kasir ${icon('arrowright', 'ic-sm')}</a></div></div>
    <div class="table-wrap"><table class="tbl cards"><thead><tr><th>Waktu</th><th>ID Tiket</th><th>Pelanggan / Meja</th><th>Item Pesanan</th><th class="num">Tagihan</th><th>Metode</th><th>Status</th></tr></thead><tbody id="dbRecent"></tbody></table></div>
    <div class="between small" style="padding:14px 20px;background:var(--surface-low)"><span class="ink2" id="dbRecentFoot"></span><a href="#/struk" style="font-weight:600">Lihat semua transaksi ${icon('right', 'ic-sm')}</a></div></div>`,
  init(el) {
    $('#dbSync', el).onclick = () => { refreshBoot(); this.load(el, true); };
    $$('#dbRange button', el).forEach(b => b.onclick = () => {
      if (b.dataset.r === '7d' && !can('SUPERVISOR')) return toast('Khusus supervisor', 'Tren 7 hari tersedia untuk Supervisor/Owner di menu Laporan.', 'warn');
      $$('#dbRange button', el).forEach(x => x.classList.toggle('on', x === b)); el.dataset.range = b.dataset.r; this.load(el);
    });
  },
  show(el) { this.load(el); },
  load(el, force) {
    const cfg = AppState.config;
    $('#dbOutlet', el).textContent = cfg.OUTLET_NAMA || 'DapoerMitoha';
    $('#dbDate', el).textContent = fmtDateLong(new Date());
    $('#dbTerm', el).textContent = cfg.TERMINAL || 'T-01';
    const s = AppState.shift; $('#dbShift', el).innerHTML = '<span class="dotc"></span>' + (s ? 'Shift Aktif: ' + shiftNama(s.buka) + ' ' + s.id.replace(/^SHF-\d{8}-/, '#') : 'Shift belum dibuka');
    swr('dash', 'dashboard', {}, d => this.render(el, d), { fresh: 60000, force, onError: r => $('#dbKpi', el).replaceChildren(retryBox(r.message, () => this.load(el, true))) });
    if (el.dataset.range === '7d') swr('rep:' + addDays(dayKey(), -6) + ':' + dayKey(), 'report', { from: addDays(dayKey(), -6), to: dayKey() }, r => this.render7(el, r), { fresh: 120000, force });
  },
  render(el, d) {
    const pct = d.target ? Math.min(100, d.omzet / d.target * 100) : 0;
    const t = d.terlaris;
    $('#dbKpi', el).innerHTML =
      `<div class="card kpi"><div class="label-sm">Omzet Hari Ini</div><div class="kpi-ic">${icon('cash')}</div><div class="kpi-v red">${rp(d.omzet)}</div>
        <div class="small ${d.growth === null ? 'muted' : d.growth >= 0 ? 'green' : 'red'}">${d.growth === null ? 'Belum ada data kemarin' : (d.growth >= 0 ? '↗ +' : '↘ ') + String(d.growth).replace('.', ',') + '% vs kemarin (' + rpShort(d.omzetKemarin) + ')'}</div>
        <div class="kpi-foot" style="flex-direction:column;align-items:stretch"><div class="between"><span>Target: ${rp(d.target)}</span><b class="mono red">${pct.toFixed(1).replace('.', ',')}%</b></div><div class="progress"><i style="width:${pct}%"></i></div></div></div>
      <div class="card kpi"><div class="label-sm">Total Transaksi</div><div class="kpi-ic">${icon('receipt')}</div><div class="row" style="align-items:baseline"><span class="kpi-v">${d.jmlTrx}</span><span class="ink2">Pesanan Masuk</span></div>
        <div class="small ink2"><span class="orange">●</span> ${d.dineIn} dine-in • ${d.takeAway} take-away</div><div class="kpi-foot"><span>Rata-rata Keranjang</span><b class="mono" style="font-size:16px;color:var(--ink)">${rp(d.avgBasket)}</b></div></div>
      <div class="card kpi"><div class="between"><span class="label-sm">Menu Terlaris</span><span class="pill yellow">${icon('star', 'ic-sm')}TOP #1</span></div><div class="h3" style="font-size:19px">${t ? esc(t.nama) : '—'}</div>
        <div class="small ink2">${t ? esc((productBySku(t.sku) || {}).deskripsi || '').slice(0, 60) : 'Belum ada penjualan hari ini'}</div><div class="kpi-foot"><span class="red">${icon('flame', 'ic-sm')} Terjual Hari Ini</span><b class="mono red" style="font-size:18px">${t ? t.qty + ' Porsi' : '0'}</b></div></div>
      <div class="card kpi"><div class="between"><span class="label-sm">Peringatan Stok</span>${d.jmlMenipis ? '<span class="pill yellow">Perlu Restock</span>' : '<span class="pill soft-green">Aman</span>'}</div>
        <div class="row" style="align-items:baseline"><span class="kpi-v red">${d.jmlMenipis}</span><span class="ink2">Bahan Menipis (&lt;10 porsi)</span></div>
        <div class="row-wrap">${d.menipis.slice(0, 3).map(p => '<span class="pill soft-orange">' + esc(p.nama) + ' (' + p.stok + ')</span>').join('')}</div>
        <div class="kpi-foot"><span>Kelola stok</span>${can('SUPERVISOR') ? '<a href="#/produk" class="mono" style="font-weight:600">Restock →</a>' : '<span class="muted">Hubungi supervisor</span>'}</div></div>`;
    if (el.dataset.range !== '7d') {
      $('#dbChartSub', el).textContent = 'Omzet per jam operasional (09:00 – 21:00 WIB)';
      const hiSet = [d.puncakSiang && d.puncakSiang.jam, d.puncakMalam && d.puncakMalam.jam];
      $('#dbPeaks', el).innerHTML = (d.puncakSiang ? '<span class="pill soft-red"><span class="dotc" style="color:var(--primary)"></span>Puncak Siang: ' + rpShort(d.puncakSiang.omzet) + ' (' + d.puncakSiang.jam + ' WIB)</span>' : '') +
        (d.puncakMalam ? '<span class="pill soft-orange"><span class="dotc" style="color:var(--secondary)"></span>Puncak Malam: ' + rpShort(d.puncakMalam.omzet) + ' (' + d.puncakMalam.jam + ' WIB)</span>' : '') +
        (!d.puncakSiang && !d.puncakMalam ? '<span class="pill">Belum ada transaksi hari ini</span>' : '');
      $('#dbLegend', el).innerHTML = '<span><i style="background:#E8A317"></i>Omzet per jam</span><span><i style="background:#D7261E"></i>Jam puncak</span>';
      barChart($('#dbChart', el), d.perJam.map(j => ({ label: j.jam, value: j.omzet, sub: j.qty + ' item', hi: hiSet.indexOf(j.jam) > -1 })), { fmt: rp, fmtAxis: rpShort });
    }
    $('#dbMini', el).innerHTML =
      `<div class="mini"><div class="mini-ic">${icon('bowl')}</div><div><div class="small ink2">Rata-rata item / transaksi</div><div class="data-md">${String(d.avgItem).replace('.', ',')} item</div></div></div>
       <div class="mini"><div class="mini-ic">${icon('flame')}</div><div><div class="small ink2">Level Pedas Favorit</div><div class="data-md red">${d.favLevel === null ? '—' : 'Level ' + d.favLevel}</div><div class="small ink2">${String(d.favLevelPersen).replace('.', ',')}% total mangkok</div></div></div>
       <div class="mini"><div class="mini-ic">${icon('qr')}</div><div><div class="small ink2">Pembayaran Non-Tunai</div><div class="data-md">${String(d.nonTunaiPersen).replace('.', ',')}%</div><div class="small ink2">QRIS, EDC & e-wallet</div></div></div>`;
    $('#dbTop', el).innerHTML = d.topping.length ? d.topping.map((m, i) => {
      const st = m.stok === null || m.stok === undefined ? '<span class="small green">Stok Aman</span>' : m.stok <= (m.minStok || 10) ? '<span class="small red" style="font-weight:600">Stok Kritis</span>' : '<span class="small green">Stok Aman</span>';
      return `<div class="topping"><div class="tw">${m.fotoId ? '<img class="thumb" loading="lazy" src="' + driveThumb(m.fotoId, 200) + '" alt="">' : '<div class="thumb" style="display:grid;place-items:center;color:var(--primary-deep)">' + icon('bowl') + '</div>'}<span class="rank">${i + 1}</span></div>
        <div class="grow"><b>${esc(m.nama)}</b><div class="small ink2">${rp(m.harga)} / porsi</div><div class="between"><span class="mono red" style="font-weight:600">${m.qty} Porsi</span>${i === 0 ? '<span class="small ink2">' + m.persen + '% dari seblak</span>' : st}</div></div></div>`;
    }).join('') : '<div class="empty small">Belum ada topping terjual hari ini.</div>';
    const low = d.menipis[0];
    $('#dbNote', el).innerHTML = '<h4>' + icon('note') + 'Catatan Dapur & Wajan</h4><div class="small ink2" style="line-height:20px">' +
      (low ? 'Stok <b>' + esc(low.nama) + '</b> tersisa ' + low.stok + ' porsi. ' + (d.jmlMenipis > 1 ? (d.jmlMenipis - 1) + ' menu lain juga menipis. ' : '') + 'Segera lakukan restock agar tidak menolak pesanan.' : 'Semua bahan dalam batas aman. Tetap periksa kesegaran kuah kencur sebelum jam puncak malam.') + '</div>';
    $('#dbRecent', el).innerHTML = d.terbaru.length ? d.terbaru.map(trxRow).join('') : '<tr><td colspan="7" class="empty">Belum ada transaksi hari ini.</td></tr>';
    $$('#dbRecent tr[data-id]', el).forEach(tr => tr.onclick = () => go('struk', tr.dataset.id));
    $('#dbRecentFoot', el).textContent = 'Menampilkan ' + d.terbaru.length + ' transaksi terbaru dari ' + d.jmlTrx + ' total transaksi hari ini.';
  },
  render7(el, r) {
    if (el.dataset.range !== '7d') return;
    $('#dbChartSub', el).textContent = 'Penjualan bersih harian 7 hari terakhir';
    $('#dbPeaks', el).innerHTML = '<span class="pill soft-red">Total 7 hari: ' + rp(r.total.netto) + '</span>';
    $('#dbLegend', el).innerHTML = '<span><i class="line" style="background:#D7261E"></i>Penjualan bersih</span><span><i class="dash"></i>Target harian</span>';
    lineChart($('#dbChart', el), r.harian.map(h => keyLabel(h.tanggal)), r.harian.map(h => h.netto), { target: r.target, fmt: rp, fmtAxis: rpShort, sub: i => r.harian[i].trx + ' trx' });
  }
});
const METODE_LBL = { TUNAI: ['cash', 'Tunai'], QRIS: ['qr', 'QRIS'], EDC: ['card', 'EDC Debit'], EWALLET: ['wallet', 'E-Wallet'], SPLIT: ['split', 'Split'] };
function metodePill(m) { const x = METODE_LBL[m] || ['cash', m]; return '<span class="pill soft-red">' + icon(x[0], 'ic-sm') + x[1] + '</span>'; }
function trxRow(t) {
  const items = (t.items || []).map(l => l.qty + 'x ' + l.nama + (l.level !== null && l.level !== undefined ? ' Lv' + l.level : '')).join(', ');
  return `<tr class="click" data-id="${esc(t.id)}"><td class="mono" data-l="Waktu">${fmtTime(t.waktu, true)}</td><td class="mono red" style="font-weight:600">#${esc(t.id.slice(-4))}</td>
    <td class="c-wide"><b>${esc(t.pelanggan || (t.meja ? 'Meja ' + t.meja : 'Pelanggan'))}</b><span class="sub">${t.tipe === 'DINE_IN' ? 'Dine-in' + (t.meja ? ' · Meja ' + esc(t.meja) : '') : t.tipe === 'ONLINE' ? 'Online' : 'Bungkus / Take Away'}</span></td>
    <td class="c-wide" style="max-width:280px"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(items)}</div>${t.catatan ? '<span class="sub">Catatan: ' + esc(t.catatan) + '</span>' : ''}</td>
    <td class="num" style="font-size:16px;font-weight:600">${rp(t.total)}</td><td>${metodePill(t.metode)}</td><td>${t.status === 'VOID' ? '<span class="pill soft-red">Void</span>' : '<span class="pill soft-yellow"><span class="dotc"></span>Lunas</span>'}</td></tr>`;
}

// ============================================================ KASIR
const LVL_COL = ['#FFC83D', '#FFB02E', '#FB9420', '#F57C00', '#E5501A', '#D7261E'];
const KAT_IC = { 'Seblak Kuah': 'bowl', 'Seblak Kering': 'flame', 'Topping': 'star', 'Minuman': 'zap' };
registerPage('kasir', {
  title: 'Kasir',
  template: () => `
  <div class="pos-strip" id="psStrip"></div>
  <div class="pos">
    <div>
      <div class="pos-search"><div class="input-ic">${icon('search')}<input class="input" id="psQ" placeholder="Cari nama menu seblak, topping, minuman, atau SKU" autocomplete="off"><span class="suffix kbd hide-sm" style="background:var(--surface-2)">Ctrl + K</span></div>
        <button class="btn btn-primary btn-lg" id="psScan">${icon('scan')}<span>Scan Barcode</span><span class="kbd">F2</span></button></div>
      <div class="chips" id="psCats"></div>
      <div class="prod-grid" id="psGrid"></div>
    </div>
    <aside class="cart" id="psCart"></aside>
  </div>
  <div class="cart-mobile-bar" id="psBar"></div>`,
  init(el) {
    AppState.cart = Store.get(userKey('cart'), null) || AppState.cart;
    el.dataset.cat = '';
    $('#psQ', el).addEventListener('input', debounce(() => this.renderGrid(el), 120));
    $('#psQ', el).addEventListener('keydown', e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (v && this.byCode(v)) { this.addBySku(this.byCode(v).sku); e.target.value = ''; this.renderGrid(el); } } });
    $('#psScan', el).onclick = () => { $('#psQ', el).focus(); toast('Pemindai siap', 'Arahkan pemindai ke barcode — produk otomatis masuk keranjang.'); };
    window.onBarcode = code => { const p = this.byCode(code); if (p) this.addBySku(p.sku); else toast('Barcode tidak dikenal', code, 'warn'); };
    if (!this._bootL) { this._bootL = 1; document.addEventListener('boot', () => { const e = $('.page[data-page="kasir"]'); if (_current === 'kasir' && e) this.renderAll(e); }); }
  },
  show(el) { this.renderAll(el); },
  renderAll(el) { this.renderStrip(el); this.renderCats(el); this.renderGrid(el); this.renderCart(); },
  byCode(v) { v = String(v).trim().toUpperCase(); return AppState.products.find(p => p.aktif && (String(p.barcode) === v || p.sku.toUpperCase() === v)); },
  renderStrip(el) {
    const s = AppState.shift, u = AppState.user, held = Store.get(userKey('held'), []), lat = Perf.last();
    $('#psStrip', el).innerHTML = `<span class="chip" style="background:var(--orange-soft)"><span class="dotc" style="color:#8A3B00"></span><b>${s ? 'Shift Aktif: ' + esc(u.nama.split(' ')[0]) + ' (' + esc(u.kode) + ')' : 'Shift belum dibuka'}</b></span>
      <span class="chip ghost" style="background:#fff"><span class="dotc" style="color:var(--tertiary-deep)"></span>Scanner Siap <span class="kbd">F2</span></span>
      <span class="chip ghost mono">${icon('lan', 'ic-sm')}POS Terminal: ${esc(AppState.config.TERMINAL || 'T-01')}${lat ? ' (Latency ' + lat.total + 'ms)' : ''}</span>
      <span class="grow"></span>
      <button class="chip ghost" style="background:#fff" id="psHold">${icon('hold', 'ic-sm')}Hold Order (${held.length})</button>
      <button class="chip" style="background:var(--surface-2)" id="psRekap">${icon('chart', 'ic-sm')}Rekap Shift</button>`;
    $('#psHold', el).onclick = () => this.holdDialog(el);
    $('#psRekap', el).onclick = () => go('shift');
  },
  renderCats(el) {
    const cats = (AppState.config.KATEGORI || []).slice();
    AppState.products.forEach(p => { if (p.kategori && cats.indexOf(p.kategori) < 0) cats.push(p.kategori); });
    const act = AppState.products.filter(p => p.aktif);
    $('#psCats', el).innerHTML = '<button class="fchip ' + (!el.dataset.cat ? 'on' : '') + '" data-c="">Semua Menu <span class="badge">' + act.length + '</span></button>' +
      cats.map(c => '<button class="fchip ' + (el.dataset.cat === c ? 'on' : '') + '" data-c="' + esc(c) + '">' + icon(KAT_IC[c] || 'tag') + esc(c) + '</button>').join('');
    $$('#psCats .fchip', el).forEach(b => b.onclick = () => { el.dataset.cat = b.dataset.c; this.renderCats(el); this.renderGrid(el); });
  },
  renderGrid(el) {
    const q = $('#psQ', el).value.trim().toLowerCase(), cat = el.dataset.cat;
    const list = AppState.products.filter(p => p.aktif && (!cat || p.kategori === cat) && (!q || (p.nama + ' ' + p.sku + ' ' + p.barcode + ' ' + p.deskripsi).toLowerCase().indexOf(q) > -1))
      .sort((a, b) => (b.favorit - a.favorit) || (a.kategori > b.kategori ? 1 : a.kategori < b.kategori ? -1 : 0) || a.nama.localeCompare(b.nama));
    const grid = $('#psGrid', el);
    if (!AppState.products.length) { grid.innerHTML = '<div class="empty" style="grid-column:1/-1">' + icon('box') + '<div>Katalog kosong. ' + (can('SUPERVISOR') ? '<a href="#/produk-form">Tambah menu pertama</a>' : 'Hubungi supervisor.') + '</div></div>'; return; }
    grid.innerHTML = list.map(p => {
      const out = p.stok !== null && p.stok <= 0, low = p.stok !== null && p.stok <= (p.minStok || 10);
      const sb = p.stok === null ? '' : '<span class="stockb ' + (out ? 'out' : low ? 'low' : '') + '">' + (out ? 'Habis' : (low ? 'Sisa ' : (p.stok >= 50 ? 'Stok ' : 'Ready ')) + (p.stok >= 50 ? '50+' : p.stok)) + '</span>';
      return `<button class="tile ${out ? 'off' : ''}" data-sku="${esc(p.sku)}" ${out ? 'disabled' : ''}>
        <div class="ph">${p.fotoId ? '<img loading="lazy" src="' + driveThumb(p.fotoId, 400) + '" alt="" onerror="this.remove()">' : icon(KAT_IC[p.kategori] || 'bowl', 'ph-ic')}${p.favorit ? '<span class="favb">' + icon('flame', 'ic-sm') + 'Favorit</span>' : ''}${sb}</div>
        <div class="sku">${esc(p.sku)}</div><div class="nm">${esc(p.nama)}</div><div class="ds">${esc(p.deskripsi)}</div>
        <div class="bt"><span class="pr">${rp(p.harga - (p.diskon || 0))}</span><span class="add">${icon('plus', 'ic-lg')}</span></div></button>`;
    }).join('') || '<div class="empty" style="grid-column:1/-1">' + icon('search') + '<div>Menu tidak ditemukan.</div></div>';
    $$('.tile', grid).forEach(t => t.onclick = () => this.pick(t.dataset.sku));
  },
  pick(sku) {
    const p = productBySku(sku); if (!p) return;
    if (!p.levelPedas) return this.addBySku(sku);
    let lv = Store.get(userKey('lastLevel'), 3), qty = 1;
    const m = openModal(modalHead('flame', p.nama, rp(p.harga - (p.diskon || 0)) + ' · ' + esc(p.kategori)) +
      `<div class="modal-b"><div class="field"><div class="flabel">Level Kepedasan <span class="hint">Lv 0 gurih ori — Lv 5 mercon</span></div>
        <div class="lvl" id="mdLv">${[0, 1, 2, 3, 4, 5].map(i => '<button style="background:' + LVL_COL[i] + ';color:' + (i > 2 ? '#fff' : 'var(--ink)') + '" data-l="' + i + '" class="' + (i === lv ? 'on' : '') + '">' + (i === 5 ? icon('flame', 'ic-sm') : '') + 'Lv ' + i + '</button>').join('')}</div></div>
      <div class="field"><label>Catatan dapur <span class="hint">opsional</span></label><input class="input" id="mdNote" maxlength="120" placeholder="Mis. kuah nyemek kencur pekat, tanpa daun bawang"></div>
      <div class="between"><span class="label">Jumlah</span><div class="qty"><button id="mdMin">−</button><b id="mdQty">1</b><button class="plus" id="mdPlus">+</button></div></div></div>
      <div class="modal-f"><button class="btn btn-secondary" data-close>Batal</button><button class="btn btn-primary grow btn-lg" id="mdAdd">${icon('plus')}Tambah ke Pesanan</button></div>`, { cls: 'sm' });
    $$('#mdLv button', m.el).forEach(b => b.onclick = () => { lv = +b.dataset.l; $$('#mdLv button', m.el).forEach(x => x.classList.toggle('on', x === b)); });
    $('#mdMin', m.el).onclick = () => { qty = Math.max(1, qty - 1); $('#mdQty', m.el).textContent = qty; };
    $('#mdPlus', m.el).onclick = () => { qty++; $('#mdQty', m.el).textContent = qty; };
    $('#mdAdd', m.el).onclick = () => { Store.set(userKey('lastLevel'), lv); this.addBySku(sku, { level: lv, catatan: $('#mdNote', m.el).value.trim(), qty }); m.close(); };
    $('#mdNote', m.el).onkeydown = e => { if (e.key === 'Enter') $('#mdAdd', m.el).click(); };
  },
  addBySku(sku, o) {
    o = o || {};
    const p = productBySku(sku); if (!p) return;
    const lines = AppState.cart.lines, inCart = lines.filter(l => l.sku === sku).reduce((a, l) => a + l.qty, 0), add = o.qty || 1;
    if (p.stok !== null && inCart + add > p.stok) return toast('Stok tidak cukup', p.nama + ' tersisa ' + p.stok + '.', 'warn');
    const lv = o.level === undefined ? null : o.level, note = o.catatan || '';
    const ex = lines.find(l => l.sku === sku && l.level === lv && (l.catatan || '') === note);
    if (ex) ex.qty += add; else lines.push({ sku, qty: add, level: lv, catatan: note });
    this.saveCart(); this.renderCart(true);
  },
  saveCart() { Store.set(userKey('cart'), AppState.cart); },
  clearCart() { AppState.cart = { lines: [], diskon: 0, tipe: 'DINE_IN', meja: '', pelanggan: '' }; this.saveCart(); this.renderCart(); },
  renderCart(bump) {
    const host = $('#psCart'); if (!host) return;
    const c = AppState.cart, t = calcCart(c), u = AppState.user || {};
    host.innerHTML = `<div class="cart-h"><div class="between"><div class="row">${icon('bag', 'ic-lg')}<div class="h2">Pesanan Aktif</div></div><button class="icon-btn" id="ctClose" title="Tutup" style="display:none">${icon('x')}</button><span class="tag mono" style="font-size:12px;background:var(--red-soft);color:var(--primary-deep)">${c.lines.length ? 'DRAF · ' + t.items + ' item' : 'BARU'}</span></div>
      <div class="between small mt8"><span>Kasir: <b>${esc(u.nama || '')}</b> (${esc(u.kode || '')})</span><span class="row" style="gap:4px">Meja: <input class="input mono" id="ctMeja" value="${esc(c.meja)}" placeholder="T-04" style="width:72px;min-height:34px;padding:0 8px;font-size:14px"></span></div>
      <div class="seg mt12" style="width:100%"><button class="grow ${c.tipe === 'DINE_IN' ? 'on' : ''}" data-t="DINE_IN" style="color:${c.tipe === 'DINE_IN' ? 'var(--primary)' : ''}">${icon('dine', 'ic-sm')} Dine In</button><button class="grow ${c.tipe === 'TAKE_AWAY' ? 'on' : ''}" data-t="TAKE_AWAY" style="color:${c.tipe === 'TAKE_AWAY' ? 'var(--primary)' : ''}">${icon('bag', 'ic-sm')} Take Away</button><button class="grow ${c.tipe === 'ONLINE' ? 'on' : ''}" data-t="ONLINE" style="color:${c.tipe === 'ONLINE' ? 'var(--primary)' : ''}">${icon('monitor', 'ic-sm')} Online</button></div></div>
      <div class="cart-lines">${c.lines.length ? c.lines.map((l, i) => {
        const p = productBySku(l.sku) || { nama: l.sku };
        return `<div class="cline"><div class="between"><div class="grow"><div class="nm">${esc(p.nama)}</div><div class="md">${[l.level !== null && l.level !== undefined ? 'Pedas Lv ' + l.level : '', l.catatan].filter(Boolean).map(esc).join(' · ') || esc(p.kategori || '')}</div></div><button class="icon-btn" data-del="${i}" title="Hapus" style="color:var(--muted)">${icon('trash')}</button></div>
          <div class="between mt8"><div class="qty"><button data-m="${i}">−</button><b>${l.qty}</b><button class="plus" data-p="${i}">+</button></div><div style="text-align:right"><div class="small muted mono">@ ${rp(l.harga)}</div><div class="data-md">${rp(l.subtotal)}</div></div></div></div>`;
      }).join('') : '<div class="empty">' + icon('bag') + '<div>Keranjang kosong.<br><span class="small">Ketuk menu atau pindai barcode.</span></div></div>'}</div>
      <div class="cart-sum">
        <div class="sumrow"><span>Subtotal (${t.items} porsi item)</span><span class="mono">${rp(t.subtotal)}</span></div>
        <div class="sumrow"><span>Diskon Promo</span><span class="row"><button class="btn btn-sm btn-yellow" id="ctDisc" style="min-height:32px">Kupon / Manual ${icon('pencil', 'ic-sm')}</button><span class="mono red">${t.diskon ? '-' + rp(t.diskon) : 'Rp 0'}</span></span></div>
        <div class="sumrow"><span>Dasar Pengenaan Pajak (DPP)</span><span class="mono">${rp(t.dpp)}</span></div>
        <div class="sumrow"><span>PPN Resto (${AppState.config.PPN_AKTIF ? AppState.config.PPN_PERSEN + '% Otomatis' : 'nonaktif'})</span><span class="mono">${rp(t.ppn)}</span></div>
        <div class="totalbox"><div><div class="label-sm">Total Tagihan</div><div class="small">Termasuk Pajak Resto</div></div><div class="v">${rp(t.total)}</div></div>
        <div class="row mt8"><button class="btn btn-danger-soft" id="ctVoid" style="min-height:56px">${icon('xc')}Batal</button><button class="btn btn-primary btn-lg grow" id="ctPay" ${c.lines.length ? '' : 'disabled'}>${icon('cash')}BAYAR SEKARANG <span class="kbd">F8</span></button></div>
        <div class="label-sm mt8">Pembayaran Cepat:</div>
        <div class="quick"><button data-q="pas">${icon('check', 'ic-sm')}Uang Pas</button><button data-q="50000">${icon('cash', 'ic-sm')}Rp 50.000</button><button data-q="100000">${icon('cash', 'ic-sm')}Rp 100.000</button><button data-q="QRIS" style="background:var(--orange-soft)">${icon('qr', 'ic-sm')}QRIS Instan [F4]</button></div>
      </div>`;
    const me = this;
    $$('[data-t]', host).forEach(b => b.onclick = () => { c.tipe = b.dataset.t; me.saveCart(); me.renderCart(); });
    $('#ctMeja', host).onchange = e => { c.meja = e.target.value.trim(); me.saveCart(); };
    $$('[data-del]', host).forEach(b => b.onclick = () => { c.lines.splice(+b.dataset.del, 1); me.saveCart(); me.renderCart(); });
    $$('[data-m]', host).forEach(b => b.onclick = () => { const l = c.lines[+b.dataset.m]; l.qty--; if (l.qty <= 0) c.lines.splice(+b.dataset.m, 1); me.saveCart(); me.renderCart(); });
    $$('[data-p]', host).forEach(b => b.onclick = () => { const l = c.lines[+b.dataset.p], p = productBySku(l.sku), tot = c.lines.filter(x => x.sku === l.sku).reduce((a, x) => a + x.qty, 0); if (p && p.stok !== null && tot >= p.stok) return toast('Stok tidak cukup', p.nama + ' tersisa ' + p.stok + '.', 'warn'); l.qty++; me.saveCart(); me.renderCart(); });
    $('#ctDisc', host).onclick = () => me.discountDialog();
    $('#ctVoid', host).onclick = async () => { if (c.lines.length && await confirmDialog('Batalkan pesanan?', 'Semua item di keranjang akan dihapus.', 'Ya, kosongkan', true)) me.clearCart(); };
    $('#ctPay', host).onclick = () => openPayment();
    $$('[data-q]', host).forEach(b => b.onclick = () => { if (!c.lines.length) return toast('Keranjang kosong', 'Tambahkan menu terlebih dahulu.', 'warn'); const q = b.dataset.q; openPayment(q === 'QRIS' ? { metode: 'QRIS' } : { metode: 'TUNAI', bayar: q === 'pas' ? t.total : +q }); });
    const bar = $('#psBar');
    if (bar) { bar.hidden = !c.lines.length; bar.innerHTML = '<div class="grow"><div class="small" style="opacity:.8">' + t.items + ' item · ' + (c.tipe === 'DINE_IN' ? 'Dine-in' : c.tipe === 'ONLINE' ? 'Online' : 'Take away') + '</div><div class="mono" style="font-size:18px;font-weight:700">' + rp(t.total) + '</div></div><button class="btn btn-primary" id="barOpen">Lihat Pesanan ' + icon('arrowright', 'ic-sm') + '</button>';
      $('#barOpen', bar).onclick = () => { host.classList.add('open'); $('#ctClose', host).style.display = 'grid'; }; }
    $('#ctClose', host).onclick = () => { host.classList.remove('open'); $('#ctClose', host).style.display = 'none'; };
    if (host.classList.contains('open')) $('#ctClose', host).style.display = 'grid';
    if (bump && bar && innerWidth <= 900) { bar.animate([{ transform: 'scale(1.03)' }, { transform: 'none' }], { duration: 180 }); }
  },
  discountDialog() {
    const t = calcCart(AppState.cart);
    const m = openModal(modalHead('tag', 'Diskon Promo', 'Subtotal ' + rp(t.subtotal)) + `<div class="modal-b">
      <div class="seg" id="dsMode"><button class="on" data-m="rp">Nominal (Rp)</button><button data-m="pct">Persen (%)</button></div>
      <div class="input-rp"><span id="dsUnit">Rp</span><input class="input" id="dsVal" inputmode="numeric" value="${AppState.cart.diskon || ''}" placeholder="0" autofocus></div>
      <div class="row-wrap">${[5, 10, 15, 20].map(p => '<button class="btn btn-sm btn-soft" data-pct="' + p + '">' + p + '%</button>').join('')}<button class="btn btn-sm btn-soft" data-rp="3000">Diskon Siang Rp 3.000</button></div></div>
      <div class="modal-f"><button class="btn btn-secondary grow" id="dsClear">Hapus Diskon</button><button class="btn btn-primary grow" id="dsOk">Terapkan</button></div>`, { cls: 'sm' });
    let mode = 'rp';
    $$('#dsMode button', m.el).forEach(b => b.onclick = () => { mode = b.dataset.m; $$('#dsMode button', m.el).forEach(x => x.classList.toggle('on', x === b)); $('#dsUnit', m.el).textContent = mode === 'rp' ? 'Rp' : '%'; });
    const apply = v => { AppState.cart.diskon = Math.round(v); this.saveCart(); this.renderCart(); m.close(); };
    $$('[data-pct]', m.el).forEach(b => b.onclick = () => apply(t.subtotal * +b.dataset.pct / 100));
    $$('[data-rp]', m.el).forEach(b => b.onclick = () => apply(+b.dataset.rp));
    $('#dsClear', m.el).onclick = () => apply(0);
    $('#dsOk', m.el).onclick = () => { const v = num($('#dsVal', m.el).value); apply(mode === 'rp' ? v : t.subtotal * Math.min(100, v) / 100); };
  },
  holdDialog(el) {
    const held = Store.get(userKey('held'), []), c = AppState.cart;
    const m = openModal(modalHead('hold', 'Hold Order', 'Simpan pesanan sementara, lanjutkan nanti') + '<div class="modal-b">' +
      (c.lines.length ? '<button class="btn btn-primary btn-block" id="hdSave">' + icon('plus') + 'Tahan pesanan aktif (' + calcCart(c).items + ' item)</button>' : '') +
      (held.length ? held.map((h, i) => '<div class="optrow"><div class="grow"><b>' + esc(h.label) + '</b><div class="small ink2">' + h.cart.lines.length + ' baris · ' + fmtTime(h.t) + '</div></div><button class="btn btn-sm btn-secondary" data-res="' + i + '">Lanjutkan</button><button class="icon-btn" data-rm="' + i + '">' + icon('trash') + '</button></div>').join('') : '<div class="empty small">Belum ada pesanan ditahan.</div>') + '</div>', { cls: 'sm' });
    const save = () => { Store.set(userKey('held'), held); this.renderStrip(el); };
    const hs = $('#hdSave', m.el);
    if (hs) hs.onclick = () => { held.push({ t: Date.now(), label: (c.meja ? 'Meja ' + c.meja : c.pelanggan || 'Pesanan') + ' · ' + rp(calcCart(c).total), cart: JSON.parse(JSON.stringify(c)) }); save(); this.clearCart(); m.close(); toast('Pesanan ditahan', 'Lanjutkan dari tombol Hold Order.'); };
    $$('[data-res]', m.el).forEach(b => b.onclick = async () => { if (c.lines.length && !(await confirmDialog('Ganti keranjang?', 'Keranjang aktif akan diganti dengan pesanan yang ditahan.', 'Ganti'))) return; const h = held.splice(+b.dataset.res, 1)[0]; AppState.cart = h.cart; this.saveCart(); save(); this.renderCart(); m.close(); });
    $$('[data-rm]', m.el).forEach(b => b.onclick = () => { held.splice(+b.dataset.rm, 1); save(); m.close(); this.holdDialog(el); });
  },
  keys(e, typing) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { $('#psQ').focus(); $('#psQ').select(); return false; }
    if (e.key === 'F2') { $('#psQ').focus(); return false; }
    if (_modals.length) return;
    if (e.key === 'F8') { openPayment(); return false; }
    if (e.key === 'F4') { if (AppState.cart.lines.length) openPayment({ metode: 'QRIS' }); return false; }
  }
});

// ============================================================ SHIFT: buka (dipakai dari Kasir & halaman Shift)
function openShiftDialog() {
  return new Promise(res => {
    const def = AppState.config.MODAL_AWAL_DEFAULT || 200000;
    const m = openModal(modalHead('lockclock', 'Buka Shift Kasir', 'Hitung kas awal (petty cash) di laci sebelum transaksi pertama') +
      `<div class="modal-b"><div class="field"><label>Modal awal di laci</label><div class="input-rp"><span>Rp</span><input class="input" id="osModal" inputmode="numeric" value="${rpn(def)}" autofocus></div></div>
      <div class="row-wrap">${[100000, 200000, 300000, 500000].map(v => '<button class="btn btn-sm btn-soft" data-v="' + v + '">' + rp(v) + '</button>').join('')}</div></div>
      <div class="modal-f"><button class="btn btn-secondary grow" data-close>Nanti</button><button class="btn btn-primary grow btn-lg" id="osGo">${icon('check')}Buka Shift</button></div>`, { cls: 'sm', onClose: v => res(v || null) });
    $$('[data-v]', m.el).forEach(b => b.onclick = () => { $('#osModal', m.el).value = rpn(+b.dataset.v); });
    $('#osModal', m.el).oninput = e => { e.target.value = rpn(num(e.target.value)); };
    $('#osGo', m.el).onclick = async e => {
      e.currentTarget.disabled = true;
      const r = await api('openShift', { modalAwal: num($('#osModal', m.el).value) });
      if (!r.success) { e.currentTarget.disabled = false; return toast('Gagal', r.message, 'err'); }
      AppState.shift = r.data; updateShiftChip(); invalidate('shiftsum', 'dash'); toast('Shift dibuka', r.message);
      const k = Pages.kasir, kel = $('.page[data-page="kasir"]'); if (kel) k.renderStrip(kel);
      m.close(r.data);
    };
  });
}

// ============================================================ PEMBAYARAN
function openPayment(preset) {
  const cart = AppState.cart;
  if (!cart.lines.length) return toast('Keranjang kosong', 'Tambahkan menu terlebih dahulu.', 'warn');
  if (!AppState.shift) { openShiftDialog().then(s => { if (s) openPayment(preset); }); return; }
  preset = preset || {};
  const t = calcCart(cart);
  const reqId = uuid();
  let metode = preset.metode || 'TUNAI', bayar = preset.bayar || 0, split = false, splitM = 'QRIS';
  const names = cart.lines.map(l => (productBySku(l.sku) || {}).nama).filter(Boolean);
  const lvMax = cart.lines.reduce((a, l) => l.level !== null && l.level !== undefined && l.level > a ? l.level : a, -1);
  const roundUp = Math.ceil(t.total / 10000) * 10000, roundUp2 = Math.ceil(t.total / 50000) * 50000;
  const chips = [['Uang Pas', t.total], ['Bulat', roundUp], ['Lembar', Math.max(100000, roundUp2 === roundUp ? roundUp + 50000 : roundUp2)], ['Lembar', Math.max(200000, Math.ceil(t.total / 100000) * 100000)]]
    .filter((c, i, a) => a.findIndex(x => x[1] === c[1]) === i);
  const m = openModal(`<div class="modal-h"><div class="mi">${icon('cash')}</div><div class="grow"><div class="h3">Pembayaran & Selesai Transaksi</div><div class="small">Kasir: <b>${esc(AppState.user.nama)}</b> · <span class="mono">${esc(AppState.shift.id)}</span></div></div><button class="icon-btn" data-close>${icon('x')}</button></div>
    <div class="modal-b">
      <div class="paybox between"><div><div class="row"><span class="label-sm" style="color:#6F5300">Total Harus Dibayar</span>${cart.meja ? '<span class="pill yellow">Meja #' + esc(cart.meja) + '</span>' : ''}</div><div class="v">${rp(t.total)}</div><div class="small ink2">${t.items} item (${esc(names.slice(0, 3).join(', '))}${names.length > 3 ? ', …' : ''})</div></div>
        ${lvMax >= 0 ? '<span class="pill" style="background:#fff;color:var(--primary-deep);border:1px solid var(--line)">' + icon('flame', 'ic-sm') + 'Level ' + lvMax + ' Hot</span>' : ''}</div>
      <div><div class="between mb"><span class="label">Metode Pembayaran</span><span class="small ink2">Pilih 1 opsi</span></div>
        <div class="methods mt8" id="pyM">${[['TUNAI', 'cash', 'Tunai (Cash)'], ['EDC', 'card', 'Kartu EDC'], ['QRIS', 'qr', 'QRIS'], ['EWALLET', 'wallet', 'E-Wallet']].map(x => '<button data-m="' + x[0] + '">' + icon(x[1], 'ic-lg') + x[2] + '</button>').join('')}</div></div>
      <div class="optrow" style="background:#fff;border:1px solid var(--line)"><div class="tpl-ic" style="width:36px;height:36px">${icon('split')}</div><div class="grow"><b>Split Payment</b><div class="small ink2">Bayar dengan 2 metode (Tunai & Non-Tunai)</div></div><label class="switch"><input type="checkbox" id="pySplit"><span></span></label></div>
      <div id="pySplitBox" hidden><div class="form-grid"><div class="field"><label>Non-tunai via</label><select class="select" id="pySplitM"><option value="QRIS">QRIS</option><option value="EDC">Kartu EDC</option><option value="EWALLET">E-Wallet</option></select></div>
        <div class="field"><label>Nominal non-tunai</label><div class="input-rp"><span>Rp</span><input class="input" id="pySplitV" inputmode="numeric" placeholder="0"></div></div></div></div>
      <div id="pyCash"><div class="between"><span class="label">Uang Tunai Diterima (Rp) <span class="red">*</span></span><span class="small mono ink2">Bisa ketik atau klik chip</span></div>
        <div class="cashin mt8"><span class="mono red" style="font-weight:700;font-size:18px">Rp</span><input id="pyBayar" inputmode="numeric" autocomplete="off"><button class="icon-btn" id="pyBack" title="Hapus">${icon('x')}</button></div>
        <div class="denom-chips mt8" id="pyChips">${chips.map(c => '<button data-v="' + c[1] + '">' + c[0] + '<b>' + rpn(c[1]) + '</b></button>').join('')}</div></div>
      <div class="change" id="pyChange"></div>
    </div>
    <div class="modal-f"><button class="btn btn-secondary btn-lg" data-close>${icon('arrowleft')}Batal<span class="hide-sm">&nbsp;(Esc)</span></button><button class="btn btn-primary btn-lg grow" id="pyGo">${icon('printer')}Konfirmasi<span class="hide-sm">&nbsp;& Cetak Struk</span> <span class="kbd hide-sm">Enter</span></button></div>`, { sticky: false });
  const el = m.el, inp = $('#pyBayar', el);
  const nonTunaiV = () => split ? Math.min(t.total, num($('#pySplitV', el).value)) : 0;
  const refresh = () => {
    $$('#pyM button', el).forEach(b => b.classList.toggle('on', b.dataset.m === metode));
    const cash = metode === 'TUNAI' || split;
    $('#pyCash', el).hidden = !cash;
    $('#pySplitBox', el).hidden = !split;
    $$('#pyChips button', el).forEach(b => b.classList.toggle('on', +b.dataset.v === bayar));
    const need = split ? t.total - nonTunaiV() : t.total;
    const kembali = cash ? bayar - need : 0, kurang = cash && bayar < need;
    const ch = $('#pyChange', el); ch.className = 'change' + (kurang ? ' bad' : '');
    ch.innerHTML = cash ? `<div class="ci">${icon(kurang ? 'alert' : 'sync', 'ic-lg')}</div><div class="grow"><div class="label-sm" style="color:${kurang ? 'var(--primary-deep)' : '#6F5300'}">${kurang ? 'Uang Kurang' : 'Kembalian Pelanggan'}</div><div class="data-lg">${rp(Math.abs(kembali))} <span class="small" style="font-family:var(--font);font-weight:400">rupiah</span></div></div>
        <div style="text-align:right">${!kurang ? '<span class="pill" style="background:var(--tertiary-deep);color:#fff">' + icon('check', 'ic-sm') + (kembali === 0 ? 'Uang Pas' : 'Siap Diberikan') + '</span>' : ''}<div class="mono small mt8">Laci Kasir #${esc(AppState.config.TERMINAL || '01')} ${!kurang ? 'Siap Terbuka' : ''}</div></div>`
      : `<div class="ci" style="background:var(--success)">${icon(metode === 'QRIS' ? 'qr' : metode === 'EDC' ? 'card' : 'wallet', 'ic-lg')}</div><div class="grow"><div class="label-sm" style="color:var(--success)">Non-tunai ${metode}</div><div class="small ink2">Pastikan pembayaran ${rp(t.total)} berhasil di perangkat ${metode === 'QRIS' ? 'QRIS / mutasi' : metode === 'EDC' ? 'EDC' : 'e-wallet'} sebelum konfirmasi.</div></div>`;
    $('#pyGo', el).disabled = cash && kurang;
  };
  $$('#pyM button', el).forEach(b => b.onclick = () => { metode = b.dataset.m; if (metode !== 'TUNAI' && !split) bayar = 0; if (split && metode === 'TUNAI') metode = splitM; refresh(); if (metode === 'TUNAI') inp.focus(); });
  $('#pySplit', el).onchange = e => { split = e.target.checked; if (split) { metode = splitM; } else metode = 'TUNAI'; refresh(); };
  $('#pySplitM', el).onchange = e => { splitM = e.target.value; metode = splitM; refresh(); };
  $('#pySplitV', el).oninput = e => { e.target.value = rpn(num(e.target.value)); refresh(); };
  inp.oninput = () => { bayar = num(inp.value); inp.value = bayar ? rpn(bayar) : ''; refresh(); };
  inp.onkeydown = e => { if (e.key === 'Enter' && !$('#pyGo', el).disabled) $('#pyGo', el).click(); };
  $('#pyBack', el).onclick = () => { bayar = 0; inp.value = ''; refresh(); inp.focus(); };
  $$('#pyChips button', el).forEach(b => b.onclick = () => { bayar = +b.dataset.v; inp.value = rpn(bayar); refresh(); });
  if (bayar) inp.value = rpn(bayar);
  refresh();
  setTimeout(() => { if (metode === 'TUNAI') inp.focus(); else $('#pyGo', el).focus(); }, 40);
  el.addEventListener('keydown', e => { if (e.key === 'F8') { e.preventDefault(); $('#pyGo', el).click(); } });
  $('#pyGo', el).onclick = async () => {
    const btn = $('#pyGo', el); if (btn.disabled) return;
    btn.disabled = true; btn.innerHTML = icon('sync') + 'Memproses transaksi…';
    const payload = { items: cart.lines.map(l => ({ sku: l.sku, qty: l.qty, level: l.level, catatan: l.catatan })), diskon: cart.diskon, tipe: cart.tipe, meja: cart.meja, pelanggan: cart.pelanggan };
    if (split) { const nt = nonTunaiV(); payload.split = [{ metode: 'TUNAI', jumlah: bayar }, { metode: splitM, jumlah: nt }]; }
    else { payload.metode = metode; payload.bayar = metode === 'TUNAI' ? bayar : t.total; }
    const r = await api('createTransaction', payload, { reqId });
    if (!r.success) {
      btn.disabled = false; btn.innerHTML = icon('printer') + 'Coba Lagi (aman, tidak dobel)';
      if (r.data && r.data.code === 'NO_SHIFT') { AppState.shift = null; updateShiftChip(); m.close(); openShiftDialog().then(s => s && openPayment(preset)); return; }
      if (r.data && r.data.code === 'STOCK') { const p = productBySku(r.data.sku); if (p) p.stok = r.data.stok; }
      return toast('Transaksi gagal', r.message, 'err', 5000);
    }
    const trx = r.data.trx;
    Object.keys(r.data.stok || {}).forEach(sku => { const p = productBySku(sku); if (p) p.stok = r.data.stok[sku]; });
    const cached = Store.get(userKey('boot')); if (cached) { cached.data.products = AppState.products; Store.set(userKey('boot'), cached); }
    AppState.lastTrx = trx;
    const tk = 'trx:' + trx.tanggal, list = Store.get(userKey(tk)); if (list) { list.data.unshift(trx); Store.set(userKey(tk), list); }
    invalidate('dash', 'shiftsum');
    Pages.kasir.clearCart();
    const kel = $('.page[data-page="kasir"]'); if (kel) { Pages.kasir.renderGrid(kel); const cart = $('#psCart'); cart && cart.classList.remove('open'); }
    updateBell();
    m.close();
    toast('Transaksi lunas', trx.id + (trx.kembalian ? ' · Kembalian ' + rp(trx.kembalian) : ''));
    go('struk', trx.id);
    if (printPrefs().auto) setTimeout(() => printReceipt(trx), 250);
  };
}

// ============================================================ STRUK & CETAK
function printPrefs() { return Object.assign({ width: '80', copies: 1, auto: false, kot: false, drawer: true }, Store.get('printPrefs', {})); }
function receiptHtml(trx, w, qr) {
  const cfg = AppState.config, line = '='.repeat(w === '58' ? 32 : 46);
  const it = trx.items.map(l => `<div class="it"><div class="ln"><b>${esc(l.nama)}</b><span><b>${rpn(l.subtotal)}</b></span></div><div class="d">${l.qty} x @ ${rpn(l.harga)}${l.level !== null && l.level !== undefined ? ' (Lv ' + l.level + ')' : ''}${l.catatan ? ' · ' + esc(l.catatan) : ''}</div></div>`).join('');
  const bayar = (trx.detailBayar || []).map(b => `<div class="ln"><span>Pembayaran ${b.metode === 'TUNAI' ? 'Tunai (Cash)' : esc(b.metode)}:</span><span>Rp ${rpn(b.diterima || b.jumlah)}</span></div>`).join('');
  const kot = printPrefs().kot ? `<div class="kot"><div class="c"><b>KITCHEN ORDER TICKET</b><br>#${esc(trx.id.slice(-4))} · ${trx.tipe === 'DINE_IN' ? 'MEJA ' + esc(trx.meja || '-') : esc(trx.tipe.replace('_', ' '))}</div><hr>${trx.items.map(l => `<div><b>${l.qty}x ${esc(l.nama)}</b>${l.level !== null && l.level !== undefined ? ' — PEDAS LV ' + l.level : ''}${l.catatan ? '<br>&nbsp;&nbsp;» ' + esc(l.catatan) : ''}</div>`).join('')}<hr><div class="c">${fmtTime(trx.waktu, true)}</div></div>` : '';
  return `<div class="receipt ${w === '58' ? 'w58' : ''}">
    <div class="c"><div class="logo">${icon('flame')}</div><div class="ttl">${esc(cfg.OUTLET_NAMA || 'DapoerMitoha')}</div><div style="letter-spacing:.08em">${esc(String(cfg.OUTLET_TAGLINE || '').toUpperCase())}</div><div>${esc(cfg.OUTLET_ALAMAT || '')}</div><div>Telp / WA: ${esc(cfg.OUTLET_TELP || '')}</div></div>
    <hr class="dbl"><div class="ln"><span>No. Struk:</span><span><b>${esc(trx.id)}</b></span></div><div class="ln"><span>Waktu:</span><span>${fmtParts(trx.waktu, { day: '2-digit', month: '2-digit', year: 'numeric' })} ${fmtTime(trx.waktu, true)}</span></div>
    <div class="ln"><span>Kasir / Pos:</span><span>${esc(trx.kasirNama)} / #${esc(trx.terminal)}</span></div><div class="ln"><span>Tipe / Meja:</span><span><b>${trx.tipe === 'DINE_IN' ? 'DINE-IN' : esc(trx.tipe.replace('_', '-'))}${trx.meja ? ' // MEJA ' + esc(trx.meja) : ''}</b></span></div>
    ${trx.pelanggan ? '<div class="ln"><span>Pelanggan:</span><span>' + esc(trx.pelanggan) + '</span></div>' : ''}
    <hr>${it}<hr>
    <div class="ln"><span>Subtotal:</span><span>${rpn(trx.subtotal)}</span></div>${trx.diskon ? '<div class="ln" style="color:#B20007"><span>Diskon Promo:</span><span>-' + rpn(trx.diskon) + '</span></div>' : ''}
    <div class="ln"><span>DPP:</span><span>${rpn(trx.dpp)}</span></div><div class="ln"><span>PPN:</span><span>${rpn(trx.ppn)}</span></div>
    <hr class="dbl"><div class="ln tot"><span>TOTAL AKHIR:</span><span>Rp ${rpn(trx.total)}</span></div><hr>${bayar}<div class="ln"><span>Kembalian:</span><span><b>Rp ${rpn(trx.kembalian)}</b></span></div>
    ${trx.status === 'VOID' ? '<hr><div class="c tot">*** VOID / DIBATALKAN ***</div>' : ''}<hr class="dbl">
    ${qr ? '<img class="qr" src="' + qr + '" alt="QR">' : ''}<div class="c">${esc(trx.id)}</div>
    <div class="c" style="margin-top:8px"><b>${esc(cfg.STRUK_FOOTER || '')}</b></div><div class="c">${esc(cfg.STRUK_CATATAN || '')}</div>${cfg.STRUK_WIFI ? '<div class="c" style="margin-top:6px">' + esc(cfg.STRUK_WIFI) + '</div>' : ''}${kot}</div>`;
}
async function printReceipt(trx) {
  const pr = printPrefs(), qr = await qrDataUrl(trx.id, 4);
  let html = '';
  for (let i = 0; i < Math.max(1, pr.copies); i++) html += receiptHtml(trx, pr.width, qr) + (i < pr.copies - 1 ? '<div style="page-break-after:always"></div>' : '');
  printHtml(html, { width: pr.width + 'mm' });
}
function receiptText(trx) {
  const cfg = AppState.config;
  return ['*' + (cfg.OUTLET_NAMA || 'DapoerMitoha') + '*', 'No. Struk: ' + trx.id, fmtDT(trx.waktu) + ' WIB', '', ...trx.items.map(l => l.qty + 'x ' + l.nama + (l.level !== null && l.level !== undefined ? ' (Lv ' + l.level + ')' : '') + ' — ' + rp(l.subtotal)),
    '', 'Subtotal: ' + rp(trx.subtotal), trx.diskon ? 'Diskon: -' + rp(trx.diskon) : '', 'PPN: ' + rp(trx.ppn), '*TOTAL: ' + rp(trx.total) + '*', 'Bayar: ' + trx.metode, '', cfg.STRUK_FOOTER || 'Terima kasih!'].filter(x => x !== '').join('\n');
}

registerPage('struk', {
  title: 'Struk & Cetak',
  template: () => '<div id="skBody"></div>',
  async show(el, id) {
    const body = $('#skBody', el);
    if (!id) return this.list(el, body);
    let trx = AppState.lastTrx && AppState.lastTrx.id === id ? AppState.lastTrx : null;
    if (!trx) { const l = Store.get(userKey('trx:' + id.replace(/^TRX-(\d{4})(\d{2})(\d{2}).*/, '$1-$2-$3'))); trx = l && l.data.find(x => x.id === id); }
    if (!trx) {
      body.innerHTML = '<div class="card"><div class="skel" style="height:300px"></div></div>';
      const r = await api('transaction', { id });
      if (!r.success) { body.replaceChildren(retryBox(r.message, () => this.show(el, id))); return; }
      trx = r.data;
    }
    this.detail(el, body, trx);
  },
  detail(el, body, trx) {
    const pr = printPrefs(), lat = Perf.last();
    body.innerHTML = `<div class="card"><div class="between" style="flex-wrap:wrap"><div class="row" style="align-items:flex-start"><div class="succ-ic" style="${trx.status === 'VOID' ? 'background:var(--red-soft);color:var(--primary)' : ''}">${icon(trx.status === 'VOID' ? 'ban' : 'checkc', 'ic-lg')}</div>
        <div><div class="h2">${trx.status === 'VOID' ? 'Transaksi Dibatalkan' : 'Transaksi Berhasil'}</div><div class="ink2" style="font-weight:600">// Pratinjau & Cetak Struk</div>
        <div class="row-wrap mt8"><span class="pill ${trx.status === 'VOID' ? 'soft-red' : 'soft-green'}"><span class="dotc"></span>STATUS: ${trx.status === 'VOID' ? 'VOID' : 'LUNAS / PAID'}</span><span class="pill">No. Struk: <b class="mono">${esc(trx.id)}</b></span><span class="pill">${icon('user', 'ic-sm')}Kasir: ${esc(trx.kasirNama)}</span></div></div></div>
      <div class="row-wrap no-print"><button class="btn btn-primary" id="skPrint">${icon('printer')}Cetak Struk <span class="kbd">Ctrl+P</span></button><button class="btn btn-soft" id="skPdf">${icon('download')}Unduh PDF</button><button class="btn btn-soft" id="skWa">${icon('message')}Kirim WhatsApp</button><button class="btn btn-yellow" id="skNew">${icon('plus')}Transaksi Baru (F2)</button></div></div></div>
    <div class="grid g-main mt16" style="grid-template-columns:minmax(0,1fr) 400px">
      <div class="card"><div class="between" style="flex-wrap:wrap"><div class="row"><span class="label">${icon('receipt')} Lebar Kertas:</span><div class="seg" id="skW"><button data-w="80" class="${pr.width === '80' ? 'on' : ''}">80mm (Standar POS)</button><button data-w="58" class="${pr.width === '58' ? 'on' : ''}">58mm (Kecil Mobile)</button></div></div><span class="small ink2"><span class="orange">●</span> Skala 1:1 thermal</span></div>
        <div class="receipt-wrap mt12" id="skRc"></div><div class="small ink2 mt8">${icon('info', 'ic-sm')} Tampilan di atas merepresentasikan hasil cetak printer thermal (driver printer OS / “Simpan sebagai PDF”).</div></div>
      <div class="stack">
        <div class="card"><div class="between"><div class="row"><div class="tpl-ic">${icon('printer')}</div><div><div class="h3">Pengaturan Cetak</div><div class="small ink2">Printer thermal via dialog cetak peramban</div></div></div><span class="pill soft-green"><span class="dotc"></span>READY</span></div>
          <div class="stack mt12">
            <label class="optrow"><div class="grow"><b>Cetak otomatis setelah bayar</b><div class="small ink2">Dialog cetak langsung terbuka saat transaksi lunas</div></div><span class="switch"><input type="checkbox" data-pref="auto" ${pr.auto ? 'checked' : ''}><span></span></span></label>
            <label class="optrow"><div class="grow"><b>Salinan Dapur (KOT)</b><div class="small ink2">Tambahkan tiket dapur (menu, level, catatan) di bawah struk</div></div><span class="switch"><input type="checkbox" data-pref="kot" ${pr.kot ? 'checked' : ''}><span></span></span></label>
            <div class="between"><b>Jumlah Salinan Struk</b><div class="qty"><button id="skCm">−</button><b id="skC">${pr.copies}</b><button class="plus" id="skCp">+</button></div></div></div></div>
        <div class="card"><div class="between"><div class="h3">${icon('sync')} Rekonsiliasi Cloud POS</div><span class="pill soft-green"><span class="dotc"></span>LIVE</span></div>
          <div class="kv mt12"><span>Database</span><span class="mono">Sheet Transaksi · ${esc(trx.id)}</span><span>Metode tercatat</span><span>${esc(trx.metode)} // ${esc(trx.shiftId)}</span><span>Total</span><span class="mono">${rp(trx.total)}</span><span>Latensi sinkronisasi</span><span class="green mono">${lat ? lat.total + ' ms' : '—'}</span></div></div>
        <button class="btn btn-primary btn-lg btn-block" id="skPrint2">${icon('printer')}CETAK STRUK SEKARANG</button>
        <div class="row"><button class="btn btn-soft grow" id="skBack">${icon('register')}Kasir Baru (Esc)</button>${trx.status !== 'VOID' ? '<button class="btn btn-danger-soft grow" id="skVoid">' + icon('xc') + 'Void Transaksi</button>' : ''}</div>
      </div></div>`;
    const draw = async () => { const w = printPrefs().width; $('#skRc', body).innerHTML = receiptHtml(trx, w, ''); const q = await qrDataUrl(trx.id, 4); if (q) $('#skRc', body).innerHTML = receiptHtml(trx, w, q); };
    draw();
    const setPref = (k, v) => { const p = printPrefs(); p[k] = v; Store.set('printPrefs', p); };
    $$('#skW button', body).forEach(b => b.onclick = () => { setPref('width', b.dataset.w); $$('#skW button', body).forEach(x => x.classList.toggle('on', x === b)); draw(); });
    $$('[data-pref]', body).forEach(i => i.onchange = () => { setPref(i.dataset.pref, i.checked); draw(); });
    $('#skCm', body).onclick = () => { const c = Math.max(1, printPrefs().copies - 1); setPref('copies', c); $('#skC', body).textContent = c; };
    $('#skCp', body).onclick = () => { const c = Math.min(5, printPrefs().copies + 1); setPref('copies', c); $('#skC', body).textContent = c; };
    $('#skPrint', body).onclick = $('#skPrint2', body).onclick = () => printReceipt(trx);
    $('#skPdf', body).onclick = () => {
      if (!DEMO && Store.get(userKey('deTpl'))) { const tp = (Store.get(userKey('deTpl')).data.templates || []).find(x => x.sumber === 'transaksi'); if (tp) return go('dokumen', 'terbit:' + tp.kode + ':' + trx.id); }
      toast('Simpan sebagai PDF', 'Pada dialog cetak, pilih tujuan “Simpan sebagai PDF”.', 'ok', 4500); printReceipt(trx);
    };
    $('#skWa', body).onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(receiptText(trx)), '_blank', 'noopener');
    $('#skNew', body).onclick = $('#skBack', body).onclick = () => go('kasir');
    const v = $('#skVoid', body);
    if (v) v.onclick = async () => {
      const extra = '<div class="field"><label>Alasan void</label><input class="input" data-x="alasan" placeholder="Mis. salah input menu"></div>';
      let ap = null;
      if (!can('SUPERVISOR')) { ap = await askApproval('Void ' + trx.id, 'Stok akan dikembalikan. Butuh PIN Supervisor.', extra); if (!ap) return; }
      else { const a = prompt('Alasan void transaksi ' + trx.id + ':'); if (!a) return; ap = { alasan: a }; }
      const r = await api('voidTransaction', { id: trx.id, alasan: ap.alasan, spvEmail: ap.email, spvPin: ap.pin });
      if (!r.success) return toast('Void gagal', r.message, 'err');
      trx.status = 'VOID'; invalidate('dash', 'shiftsum', 'trx:' + trx.tanggal); refreshBoot();
      toast('Transaksi di-void', r.message); this.detail(el, body, trx);
    };
  },
  list(el, body) {
    const tgl = el.dataset.tgl || dayKey();
    body.innerHTML = `<div class="page-head"><div><h1 class="h1">Struk & Cetak Ulang</h1><p>Riwayat transaksi untuk cetak ulang struk, kirim WhatsApp, atau void (dengan otorisasi supervisor).</p></div>
      <div class="row-wrap"><input type="date" class="input" id="slD" value="${tgl}" style="width:auto"><a class="btn btn-primary" href="#/kasir">${icon('plus')}Transaksi Baru</a></div></div>
      <div class="card pad0"><div style="padding:14px 16px"><div class="input-ic">${icon('search')}<input class="input" id="slQ" placeholder="Cari no. struk, meja, pelanggan, kasir…"></div></div>
      <div class="table-wrap"><table class="tbl cards"><thead><tr><th>Waktu</th><th>ID</th><th>Pelanggan / Meja</th><th>Item</th><th class="num">Tagihan</th><th>Metode</th><th>Status</th></tr></thead><tbody id="slB"><tr><td colspan="7"><div class="skel"></div></td></tr></tbody></table></div></div>`;
    let rows = [];
    const draw = () => {
      const q = $('#slQ', body).value.toLowerCase();
      const f = rows.filter(t => !q || (t.id + ' ' + t.meja + ' ' + t.pelanggan + ' ' + t.kasirNama).toLowerCase().indexOf(q) > -1);
      $('#slB', body).innerHTML = f.length ? f.map(trxRow).join('') : '<tr><td colspan="7" class="empty">Tidak ada transaksi pada tanggal ini.</td></tr>';
      $$('#slB tr[data-id]', body).forEach(tr => tr.onclick = () => { const t = rows.find(x => x.id === tr.dataset.id); AppState.lastTrx = t; go('struk', t.id); });
    };
    $('#slQ', body).oninput = debounce(draw, 150);
    $('#slD', body).onchange = e => { el.dataset.tgl = e.target.value; this.list(el, body); };
    swr('trx:' + tgl, 'transactions', { tanggal: tgl, limit: 300 }, d => { rows = d; draw(); }, { fresh: tgl === dayKey() ? 20000 : 600000 });
  },
  keys(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && $('#skPrint')) { $('#skPrint').click(); return false; }
    if (e.key === 'F2') { go('kasir'); return false; }
    if (e.key === 'Escape' && !_modals.length && $('#skBack')) { go('kasir'); return false; }
  }
});

// ============================================================ TUTUP SHIFT
const DENOMS = [[100000, '100k'], [50000, '50k'], [20000, '20k'], [10000, '10k'], [5000, '5k'], [2000, '2k'], [1000, '1k'], [500, '500']];
registerPage('shift', {
  title: 'Tutup Shift',
  template: () => '<div id="shBody"></div>',
  show(el) {
    const body = $('#shBody', el);
    if (!AppState.shift) return this.closed(el, body);
    body.innerHTML = '<div class="card"><div class="skel" style="height:120px"></div></div>';
    swr('shiftsum', 'shiftSummary', {}, d => d ? this.render(el, body, d) : this.closed(el, body), { fresh: 15000, force: true });
  },
  closed(el, body) {
    body.innerHTML = `<div class="page-head"><div><h1 class="h1">Shift Kasir</h1><p>Tidak ada shift aktif untuk akun Anda. Buka shift dengan menghitung modal awal laci.</p></div><button class="btn btn-primary btn-lg" id="shOpen">${icon('lockclock')}Buka Shift Sekarang</button></div>
      <div class="card pad0"><div style="padding:16px 20px" class="h3">Riwayat Shift</div><div class="table-wrap"><table class="tbl cards"><thead><tr><th>ID Shift</th><th>Kasir</th><th>Buka</th><th>Tutup</th><th class="num">Penjualan</th><th class="num">Selisih</th><th>Aksi</th></tr></thead><tbody id="shHist"><tr><td colspan="7"><div class="skel"></div></td></tr></tbody></table></div></div>`;
    $('#shOpen', body).onclick = () => openShiftDialog().then(s => s && this.show(el));
    swr('shifts', 'shifts', { limit: 30 }, rows => {
      $('#shHist', body).innerHTML = rows.length ? rows.map(s => `<tr><td class="mono" style="font-weight:600">${esc(s.id)}</td><td>${esc(s.kasirNama)}</td><td class="mono small">${fmtDT(s.buka)}</td><td class="mono small">${s.tutup ? fmtDT(s.tutup) : '<span class="pill yellow">Aktif</span>'}</td><td class="num">${rp(s.total)}</td>
        <td class="num ${s.selisih < 0 ? 'red' : s.selisih > 0 ? 'orange' : 'green'}">${s.status === 'DITUTUP' ? rp(s.selisih) : '—'}</td><td>${s.status === 'DITUTUP' ? '<button class="btn btn-sm btn-soft" data-z="' + esc(s.id) + '">' + icon('printer', 'ic-sm') + 'Z-Report</button>' : ''}</td></tr>`).join('') : '<tr><td colspan="7" class="empty">Belum ada riwayat shift.</td></tr>';
      $$('[data-z]', body).forEach(b => b.onclick = async () => { const r = await api('shiftSummary', { id: b.dataset.z }); if (r.success) printZ(r.data, 'Z-REPORT'); });
    }, { fresh: 30000 });
  },
  render(el, body, d) {
    const s = d.shift, cfg = AppState.config;
    const st = Store.get(userKey('denom:' + s.id), {});
    const dur = Math.max(0, Date.now() - new Date(s.buka).getTime()), jam = Math.floor(dur / 3600e3), mnt = Math.floor(dur % 3600e3 / 60000);
    const k = d.kanal, tot = d.total || 1;
    const ch = [['TUNAI', 'cash', 'Uang Tunai (Cash)', 'Transaksi fisik', '#8D6A00'], ['QRIS', 'qr', 'QRIS Dinamis', 'Transaksi QRIS', '#D7261E'], ['EDC', 'card', 'Kartu Debit EDC', 'Transaksi kartu', '#8D6A00'], ['EWALLET', 'wallet', 'E-Wallet Direct', 'Transaksi e-wallet', '#F57C00']];
    body.innerHTML = `<div class="shift-hero"><div><span class="pill" style="background:rgba(255,255,255,.2);color:#fff"><span class="dotc" style="color:var(--tertiary)"></span>PROSEDUR TUTUP BUKU KASIR</span><h1 class="h-display mt8">Rekonsiliasi & Tutup Shift Kasir</h1>
        <div class="meta"><span>${icon('user', 'ic-sm')} Kasir: <b>${esc(s.kasirNama)} (${esc(AppState.user.kode)})</b></span><span>${icon('clock', 'ic-sm')} Buka: <b>${fmtTime(s.buka)} WIB</b> → sekarang</span><span>${icon('sync', 'ic-sm')} Durasi: <b>${('0' + jam).slice(-2)} Jam ${('0' + mnt).slice(-2)} Mnt</b></span></div></div>
      <div class="row" style="align-items:center"><button class="btn btn-secondary" id="shX">${icon('printer')}Pra-Cetak X-Report</button><div class="regbox"><div class="small" style="opacity:.85">NO. REGISTER</div><div class="mono" style="font-size:18px;font-weight:600">REG-${esc(cfg.TERMINAL || 'T-01')}</div></div></div></div>
    <div class="grid g3 mt16">
      <div class="card kpi" style="min-height:0"><div>Kas Awal di Laci</div><div class="kpi-ic">${icon('coins')}</div><div class="kpi-v">${rp(s.modalAwal)}</div><div class="small"><span class="tag mono" style="background:var(--surface-2);color:var(--primary-deep)">${esc(s.id.slice(-6))}</span> Petty cash pembuka shift</div></div>
      <div class="card kpi" style="min-height:0"><div>Penjualan Sistem Total</div><div class="kpi-ic">${icon('register')}</div><div class="kpi-v red">${rp(d.total)}</div><div class="small"><span class="tag mono" style="background:var(--surface-2);color:var(--primary-deep)">${d.jmlTrx} Pesanan</span> ${d.jmlVoid ? d.jmlVoid + ' void · ' : ''}Tercatat 100% Lunas</div></div>
      <div class="card kpi" style="min-height:0"><div>Kas Fisik Seharusnya</div><div class="kpi-ic">${icon('wallet')}</div><div class="kpi-v orange">${rp(d.kasSistem)}</div><div class="small ink2">Modal ${rpShort(s.modalAwal)} + Penjualan Tunai ${rpShort(k.TUNAI.jumlah)}</div></div></div>
    <div class="between mt20"><div class="h3"><span class="red">●</span> Penerimaan Sistem per Saluran Bayar</div><span class="small ink2 hide-sm">Otomatisasi Verifikasi Gateway</span></div>
    <div class="grid g4 mt12">${ch.map(c => { const p = d.total ? k[c[0]].jumlah / tot * 100 : 0; return `<div class="card chan"><div class="between"><span class="row">${icon(c[1])}<b>${c[2]}</b></span><span class="pill soft-yellow mono">${p.toFixed(1)}%</span></div><div class="data-lg">${rp(k[c[0]].jumlah)}</div><div class="mono small ink2">${k[c[0]].trx} ${c[3]}</div><div class="bar"><i style="width:${p}%;background:${c[4]}"></i></div></div>`; }).join('')}</div>
    <div class="grid mt16" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);align-items:start" id="shGrid">
      <div class="card"><div class="between"><div><div class="h3">Hitung Uang Fisik di Laci</div><div class="small ink2">Masukkan jumlah lembar/koin kas fisik saat pergantian kasir.</div></div><span class="pill soft-yellow" id="shCnt"></span></div>
        <div class="optrow mt12 between"><span class="small">Modal Awal ${rpShort(s.modalAwal)} + Kas Tunai ${rpShort(k.TUNAI.jumlah)}:</span><b class="mono orange" style="font-size:17px">Target = ${rp(d.kasSistem)}</b></div>
        <div class="denom-grid mt12">${DENOMS.map(x => `<div class="denom"><span class="dv">${x[1]}</span><div class="grow"><div class="mono small">${rp(x[0])}</div><div class="small ink2" data-sub="${x[0]}"></div></div><button class="qb" data-dm="${x[0]}">−</button><input inputmode="numeric" data-d="${x[0]}" value="${st[x[0]] || ''}" placeholder="0"><button class="qb" data-dp="${x[0]}">+</button></div>`).join('')}</div>
        <div class="optrow mt12 between" style="background:var(--surface-2)"><div class="row"><div class="tpl-ic" style="background:var(--tertiary-deep);color:#fff;border-radius:50%">${icon('coins')}</div><div><b>Total Kas Fisik Dihitung</b><div class="small ink2">Akumulasi seluruh denominasi</div></div></div><span class="data-lg red" id="shFisik">Rp 0</span></div>
        <div class="field mt12"><label>Catatan Pergantian Shift <span class="hint">Maks. 200 karakter</span></label><textarea class="textarea" id="shNote" maxlength="200" placeholder="Contoh: Stok kerupuk mawar & kencur telah di-restock untuk shift malam. Seluruh transaksi QRIS sudah settle."></textarea></div></div>
      <div class="stack"><div class="result" id="shRes"></div>
        <div class="card"><div class="between"><b>Verifikator Supervisor</b><span class="pill soft-yellow">PIN wajib</span></div>
          <div class="field mt12"><select class="select" id="shSpv">${AppState.approvers.map(a => '<option value="' + esc(a.email) + '">' + esc(a.nama) + ' (' + esc(a.kode || a.role) + ')</option>').join('')}</select></div>
          <div class="field mt8"><input class="input mono" id="shPin" type="password" inputmode="numeric" maxlength="6" placeholder="PIN Supervisor (6 angka)" autocomplete="off"></div></div>
        <button class="btn btn-primary btn-lg btn-block" id="shClose">${icon('lockclock')}TUTUP SHIFT & CETAK Z-REPORT</button>
        <button class="btn btn-secondary btn-block" id="shReset">${icon('sync')}Hitung Ulang Denominasi Fisik</button></div></div>`;
    if (innerWidth < 900) $('#shGrid', body).style.gridTemplateColumns = '1fr';
    const calc = () => {
      let f = 0, n = 0; const st2 = {};
      $$('[data-d]', body).forEach(i => { const v = Math.max(0, Math.floor(num(i.value))); st2[i.dataset.d] = v || ''; f += v * +i.dataset.d; if (v) n++; $('[data-sub="' + i.dataset.d + '"]', body).textContent = v ? v + ' lembar · ' + rp(v * +i.dataset.d) : ''; });
      Store.set(userKey('denom:' + s.id), st2);
      $('#shFisik', body).textContent = rp(f); $('#shCnt', body).innerHTML = icon('checkc', 'ic-sm') + n + ' Pecahan Terhitung';
      const sel = f - d.kasSistem, r = $('#shRes', body);
      if (!f) { r.className = 'result'; r.style.background = 'var(--ink-2)'; r.innerHTML = '<div class="row">' + icon('coins', 'ic-lg') + '<div><div class="label-sm" style="color:rgba(255,255,255,.85)">Hasil Rekonsiliasi Kas Laci</div><div class="h2" style="font-weight:700">BELUM DIHITUNG</div></div></div><div class="inner small">Masukkan jumlah lembar per pecahan di laci. Target kas fisik: <b class="mono">' + rp(d.kasSistem) + '</b></div>'; return f; }
      r.style.background = '';
      r.className = 'result' + (sel < 0 ? ' minus' : sel > 0 ? ' plus' : '');
      r.innerHTML = `<div class="row">${icon(sel === 0 ? 'checkc' : 'alert', 'ic-lg')}<div><div class="label-sm" style="color:rgba(255,255,255,.85)">Hasil Rekonsiliasi Kas Laci</div><div class="h2" style="font-weight:700">${sel === 0 ? 'SEIMBANG (MATCH)' : sel < 0 ? 'KURANG (SHORT)' : 'LEBIH (OVER)'}</div></div></div>
        <div class="inner"><div class="between"><span>Selisih Kas Laci:</span><b class="mono" style="font-size:18px">${rp(sel)}</b></div><div class="grid g2 mt12 small" style="gap:8px"><div>Fisik Dihitung:<div class="mono" style="font-size:15px">${rp(f)}</div></div><div>Sistem Kas Tunai:<div class="mono" style="font-size:15px">${rp(d.kasSistem)}</div></div></div>
        <div class="between mt12 small"><span>Toleransi Deviasi:</span><span class="mono pill" style="background:rgba(255,255,255,.2);color:#fff">${d.kasSistem ? (Math.abs(sel) / d.kasSistem * 100).toFixed(2) : '0.00'}% ${sel === 0 ? '(Sempurna)' : ''}</span></div></div>
        <div class="small mt12">${icon('shield', 'ic-sm')} ${sel === 0 ? 'Semua transaksi telah tervalidasi tanpa selisih minus/plus.' : 'Periksa ulang hitungan sebelum menutup shift. Selisih tercatat di Z-Report.'}</div>`;
      return f;
    };
    $$('[data-d]', body).forEach(i => i.oninput = calc);
    $$('[data-dp]', body).forEach(b => b.onclick = () => { const i = $('[data-d="' + b.dataset.dp + '"]', body); i.value = num(i.value) + 1; calc(); });
    $$('[data-dm]', body).forEach(b => b.onclick = () => { const i = $('[data-d="' + b.dataset.dm + '"]', body); i.value = Math.max(0, num(i.value) - 1) || ''; calc(); });
    $('#shReset', body).onclick = () => { $$('[data-d]', body).forEach(i => i.value = ''); calc(); };
    $('#shX', body).onclick = () => printZ(d, 'X-REPORT (SEMENTARA)');
    calc();
    $('#shClose', body).onclick = async e => {
      const pin = $('#shPin', body).value.trim();
      if (!/^\d{6}$/.test(pin)) return toast('PIN supervisor', 'Masukkan PIN 6 angka verifikator.', 'warn');
      const f = calc();
      if (!(await confirmDialog('Tutup shift sekarang?', 'Kas fisik ' + rp(f) + ' vs sistem ' + rp(d.kasSistem) + '. Setelah ditutup, transaksi shift ini tidak bisa di-void.', 'Tutup Shift'))) return;
      const btn = e.currentTarget; btn.disabled = true; btn.innerHTML = icon('sync') + 'Menutup shift…';
      const den = {}; $$('[data-d]', body).forEach(i => { if (num(i.value)) den[i.dataset.d] = num(i.value); });
      const r = await api('closeShift', { denominasi: den, catatan: $('#shNote', body).value, spvEmail: $('#shSpv', body).value, spvPin: pin });
      btn.disabled = false; btn.innerHTML = icon('lockclock') + 'TUTUP SHIFT & CETAK Z-REPORT';
      if (!r.success) return toast('Gagal menutup shift', r.message, 'err');
      Store.del(userKey('denom:' + s.id)); AppState.shift = null; updateShiftChip(); invalidate('shiftsum', 'shifts', 'dash');
      toast('Shift ditutup', r.message);
      this.done(el, body, r.data);
    };
  },
  done(el, body, z) {
    printZ(z, 'Z-REPORT');
    body.innerHTML = `<div class="card" style="max-width:620px;margin:20px auto;text-align:center"><div class="succ-ic" style="margin:0 auto">${icon('checkc', 'ic-lg')}</div><h1 class="h1 mt12">Shift ${esc(z.shift.id)} ditutup</h1>
      <p class="ink2">Selisih kas: <b class="mono">${rp(z.selisih)}</b> · Diverifikasi ${esc(z.shift.supervisor)}</p>
      <div class="stack mt16"><button class="btn btn-secondary btn-lg" id="zP">${icon('printer')}Cetak Ulang Z-Report (thermal)</button>
      ${!DEMO ? '<button class="btn btn-soft btn-lg" id="zDoc">' + icon('file') + 'Terbitkan Z-Report Resmi (PDF ber-QR)</button>' : ''}
      <button class="btn btn-primary btn-lg" id="zOut">${icon('logout')}Selesai & Keluar</button></div></div>`;
    $('#zP', body).onclick = () => printZ(z, 'Z-REPORT');
    const zd = $('#zDoc', body); if (zd) zd.onclick = () => go('dokumen', 'terbit:ZREPORT:' + z.shift.id);
    $('#zOut', body).onclick = () => { clearSession(); resetPages(); $('#shell').innerHTML = ''; go('login'); };
  }
});
function printZ(d, judul) {
  const s = d.shift, cfg = AppState.config, k = d.kanal;
  const den = s.denominasi || {};
  const html = `<div class="receipt"><div class="c"><div class="ttl">${esc(cfg.OUTLET_NAMA)}</div><div>${esc(cfg.OUTLET_CABANG)} · #${esc(s.terminal)}</div><b>${esc(judul)}</b></div><hr class="dbl">
    <div class="ln"><span>Shift</span><span>${esc(s.id)}</span></div><div class="ln"><span>Kasir</span><span>${esc(s.kasirNama)}</span></div><div class="ln"><span>Buka</span><span>${fmtDT(s.buka)}</span></div><div class="ln"><span>Tutup</span><span>${s.tutup ? fmtDT(s.tutup) : 'masih aktif'}</span></div><hr>
    <div class="ln"><span>Tunai</span><span>${rpn(k.TUNAI.jumlah)}</span></div><div class="ln"><span>QRIS</span><span>${rpn(k.QRIS.jumlah)}</span></div><div class="ln"><span>EDC</span><span>${rpn(k.EDC.jumlah)}</span></div><div class="ln"><span>E-Wallet</span><span>${rpn(k.EWALLET.jumlah)}</span></div>
    <hr><div class="ln tot"><span>TOTAL</span><span>${rpn(d.total)}</span></div><div class="ln"><span>Transaksi / Void</span><span>${d.jmlTrx} / ${d.jmlVoid}</span></div><div class="ln"><span>PPN</span><span>${rpn(d.ppn)}</span></div><div class="ln"><span>Diskon</span><span>${rpn(d.diskon)}</span></div><hr>
    <div class="ln"><span>Modal awal</span><span>${rpn(s.modalAwal)}</span></div><div class="ln"><span>Kas sistem</span><span>${rpn(d.kasSistem)}</span></div>
    ${Object.keys(den).sort((a, b) => b - a).map(v => '<div class="ln"><span>&nbsp; ' + rpn(v) + ' x ' + den[v] + '</span><span>' + rpn(v * den[v]) + '</span></div>').join('')}
    ${d.kasFisik !== undefined && s.status === 'DITUTUP' ? '<div class="ln"><span>Kas fisik</span><span>' + rpn(s.kasFisik) + '</span></div><div class="ln tot"><span>SELISIH</span><span>' + rpn(s.selisih) + '</span></div><hr><div>Verifikator: ' + esc(s.supervisor) + '</div>' : ''}
    ${s.catatan ? '<div>Catatan: ' + esc(s.catatan) + '</div>' : ''}<hr><div class="c">Dicetak ${fmtDT(new Date())} WIB</div></div>`;
  printHtml(html, { width: printPrefs().width + 'mm' });
}
