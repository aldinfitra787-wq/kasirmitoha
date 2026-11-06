/* pages-admin.js — Produk & Stok, Form Produk, Laporan, Dokumen (doc engine), Migrasi, Pengguna, Pengaturan */
'use strict';

// ============================================================ PRODUK & STOK
registerPage('produk', {
  auth: 'SUPERVISOR', title: 'Produk & Stok',
  template: () => `
  <div class="page-head"><div><div class="row"><span class="tag" style="background:var(--orange-soft)">GUDANG & RESEP PUSAT</span><span class="small ink2"><span class="orange">●</span> Sync Live</span></div>
    <h1 class="h1 mt8">Katalog Produk & Inventaris Dapur</h1><p>Kontrol resep seblak, ketersediaan topping instan, dan kalkulasi margin terpusat tersinkron Google Sheets.</p></div>
    <div class="row-wrap"><button class="btn btn-secondary" id="pdCsv">${icon('sheet')}Ekspor Sheets / CSV</button><a class="btn btn-primary btn-lg" href="#/produk-form">${icon('plus')}Tambah Menu Baru</a></div></div>
  <div class="grid g4" id="pdStat"></div>
  <div class="card mt16"><div class="row-wrap"><div class="input-ic grow" style="min-width:240px">${icon('search')}<input class="input" id="pdQ" placeholder="Cari nama menu, barcode, atau ketik SKU…"></div>
    <select class="select" id="pdCat" style="width:auto;min-width:180px"></select>
    <select class="select" id="pdSort" style="width:auto"><option value="nama">Urutkan: Nama</option><option value="stok">Urutkan: Stok terendah</option><option value="harga">Urutkan: Harga tertinggi</option><option value="margin">Urutkan: Margin</option></select></div>
    <div class="chips mt12" id="pdChips"></div></div>
  <div class="card pad0 mt16"><div class="table-wrap"><table class="tbl cards"><thead><tr><th>Foto</th><th>SKU & Barcode</th><th>Nama Produk & Varian</th><th>Kategori</th><th class="num">Harga Jual</th><th>Status & Stok</th><th>Aksi</th></tr></thead><tbody id="pdB"></tbody></table></div>
    <div class="between" style="padding:14px 18px;background:var(--surface-low);flex-wrap:wrap"><span class="small ink2">${icon('sync', 'ic-sm')} Tersinkron: <b>Google Sheets “Produk”</b></span><div class="row" id="pdPg"></div></div></div>`,
  init(el) {
    el.dataset.st = 'all'; el.dataset.pg = '1';
    $('#pdQ', el).oninput = debounce(() => { el.dataset.pg = '1'; this.draw(el); }, 150);
    $('#pdCat', el).onchange = $('#pdSort', el).onchange = () => { el.dataset.pg = '1'; this.draw(el); };
    $('#pdCsv', el).onclick = () => {
      const rows = [['sku', 'barcode', 'nama', 'kategori', 'harga', 'diskon', 'hpp', 'stok', 'minStok', 'levelPedas', 'pajak', 'aktif', 'deskripsi']]
        .concat(AppState.products.map(p => [p.sku, p.barcode, p.nama, p.kategori, p.harga, p.diskon, p.hpp, p.stok === null ? '' : p.stok, p.minStok, p.levelPedas, p.pajak ? 'TRUE' : 'FALSE', p.aktif ? 'TRUE' : 'FALSE', p.deskripsi]));
      downloadFile('produk-dapoermitoha-' + dayKey() + '.csv', toCsv(rows), 'text/csv;charset=utf-8');
    };
    if (!this._bootL) { this._bootL = 1; document.addEventListener('boot', () => { const e = $('.page[data-page="produk"]'); if (_current === 'produk' && e) this.draw(e); }); }
  },
  show(el) {
    this.draw(el);
    api('products').then(r => { if (r.success) { AppState.products = r.data; this.draw(el); updateBell(); } });
  },
  status(p) { return p.stok === null ? 'unl' : p.stok <= 0 ? 'out' : p.stok <= (p.minStok || 10) ? 'low' : 'ok'; },
  draw(el) {
    const P = AppState.products, st = el.dataset.st;
    const cnt = { all: P.length, ok: 0, low: 0, out: 0, unl: 0 }; P.forEach(p => cnt[this.status(p)]++);
    $('#pdStat', el).innerHTML = [['TOTAL MENU', P.length, 'Item Terdaftar', 'utensils', '', P.filter(p => p.aktif).length + ' aktif di kasir'],
      ['STOK MELIMPAH', cnt.ok + cnt.unl, 'Menu Siap Jual', 'checkc', 'soft-yellow', 'Stok Aman (>min)'],
      ['PERLU RESTOCK', cnt.low, 'Menu Menipis', 'alert', 'soft-orange', 'Kritis (≤ ambang)'],
      ['HABIS / SOLD OUT', cnt.out, 'Menu Kosong', 'ban', 'soft-red', 'Stok Habis (0 porsi)']].map((k, i) =>
      `<div class="card kpi" style="min-height:0"><div class="label-sm">${k[0]}</div><div class="kpi-ic" style="${i === 2 ? 'background:var(--orange-soft);color:#8A3B00' : i === 3 ? 'background:var(--red-soft)' : ''}">${icon(k[3] === 'utensils' ? 'dine' : k[3])}</div>
      <div class="row" style="align-items:baseline"><span class="kpi-v ${i === 2 ? 'orange' : i === 3 ? 'red' : ''}">${k[1]}</span><span class="ink2" style="font-weight:600">${k[2]}</span></div>${k[4] ? '<span class="pill ' + k[4] + '"><span class="dotc"></span>' + k[5] + '</span>' : '<span class="small ink2"><span class="orange">●</span> ' + k[5] + '</span>'}</div>`).join('');
    const cats = Array.from(new Set((AppState.config.KATEGORI || []).concat(P.map(p => p.kategori)).filter(Boolean)));
    const cs = $('#pdCat', el), cv = cs.value; cs.innerHTML = '<option value="">Semua Kategori</option>' + cats.map(c => '<option>' + esc(c) + '</option>').join(''); cs.value = cv;
    $('#pdChips', el).innerHTML = [['all', 'Semua Status', cnt.all], ['ok', 'Stok Aman', cnt.ok + cnt.unl], ['low', 'Menipis', cnt.low], ['out', 'Habis / Sold Out', cnt.out], ['arsip', 'Diarsipkan', P.filter(p => !p.aktif).length]]
      .map(c => '<button class="fchip ' + (st === c[0] ? 'on' : '') + '" data-s="' + c[0] + '">' + c[1] + ' (' + c[2] + ')</button>').join('');
    $$('#pdChips .fchip', el).forEach(b => b.onclick = () => { el.dataset.st = b.dataset.s; el.dataset.pg = '1'; this.draw(el); });
    const q = $('#pdQ', el).value.toLowerCase(), cat = cs.value, sort = $('#pdSort', el).value;
    let rows = P.filter(p => (st === 'arsip' ? !p.aktif : st === 'all' ? true : (st === 'ok' ? ['ok', 'unl'].indexOf(this.status(p)) > -1 : this.status(p) === st)) &&
      (!cat || p.kategori === cat) && (!q || (p.nama + ' ' + p.sku + ' ' + p.barcode).toLowerCase().indexOf(q) > -1));
    rows.sort((a, b) => sort === 'stok' ? (a.stok === null ? 1e9 : a.stok) - (b.stok === null ? 1e9 : b.stok) : sort === 'harga' ? b.harga - a.harga : sort === 'margin' ? (b.harga - b.hpp) / (b.harga || 1) - (a.harga - a.hpp) / (a.harga || 1) : a.nama.localeCompare(b.nama));
    const per = 10, pages = Math.max(1, Math.ceil(rows.length / per)), pg = Math.min(pages, +el.dataset.pg || 1);
    const view = rows.slice((pg - 1) * per, pg * per);
    const katPill = k => '<span class="pill ' + (/minum/i.test(k) ? 'yellow' : /topping/i.test(k) ? '' : 'soft-red') + '">' + esc(k) + '</span>';
    $('#pdB', el).innerHTML = view.length ? view.map(p => {
      const s = this.status(p);
      const sp = s === 'unl' ? '<span class="pill">Tidak dilacak</span>' : s === 'out' ? '<span class="pill soft-red"><span class="dotc"></span>0 Porsi (Habis)</span>' : s === 'low' ? '<span class="pill soft-orange"><span class="dotc"></span>' + p.stok + ' Porsi (Menipis)</span>' : '<span class="pill soft-green"><span class="dotc"></span>' + p.stok + ' Porsi</span>';
      return `<tr style="${p.aktif ? '' : 'opacity:.55'}"><td>${p.fotoId ? '<img class="thumb" loading="lazy" src="' + driveThumb(p.fotoId, 160) + '" alt="">' : '<div class="thumb" style="display:grid;place-items:center;color:var(--primary-deep)">' + icon(KAT_IC[p.kategori] || 'bowl') + '</div>'}</td>
        <td><div class="mono" style="font-weight:600;${s === 'out' ? 'text-decoration:line-through' : ''}">${esc(p.sku)}</div><span class="sub mono">${esc(p.barcode)}</span></td>
        <td class="c-wide"><b style="font-size:15px">${esc(p.nama)}</b><span class="sub" style="max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.deskripsi)}</span></td>
        <td>${katPill(p.kategori)}</td><td class="num" style="font-size:16px;font-weight:600">${rp(p.harga)}</td><td>${sp}</td>
        <td><div class="row"><button class="icon-btn" data-adj="${esc(p.sku)}" title="Sesuaikan stok">${icon('sliders')}</button><a class="icon-btn" href="#/produk-form/${encodeURIComponent(p.sku)}" title="Edit">${icon('pencil')}</a><button class="icon-btn" data-arc="${esc(p.sku)}" title="${p.aktif ? 'Arsipkan' : 'Aktifkan'}">${icon(p.aktif ? 'archive' : 'sync')}</button></div></td></tr>`;
    }).join('') : '<tr><td colspan="7" class="empty">Tidak ada produk yang cocok.</td></tr>';
    $('#pdPg', el).innerHTML = '<span class="small ink2">Menampilkan ' + (rows.length ? (pg - 1) * per + 1 : 0) + ' - ' + Math.min(pg * per, rows.length) + ' dari ' + rows.length + ' menu</span>' +
      '<button class="icon-btn" data-pg="' + (pg - 1) + '" ' + (pg <= 1 ? 'disabled' : '') + '>' + icon('left') + '</button>' +
      Array.from({ length: pages }, (_, i) => i + 1).filter(i => i === 1 || i === pages || Math.abs(i - pg) <= 1).map(i => '<button class="btn btn-sm ' + (i === pg ? 'btn-primary' : 'btn-ghost') + '" data-pg="' + i + '" style="min-width:36px;color:' + (i === pg ? '#fff' : 'var(--ink)') + '">' + i + '</button>').join('') +
      '<button class="icon-btn" data-pg="' + (pg + 1) + '" ' + (pg >= pages ? 'disabled' : '') + '>' + icon('right') + '</button>';
    $$('[data-pg]', el).forEach(b => b.onclick = () => { el.dataset.pg = b.dataset.pg; this.draw(el); });
    $$('[data-adj]', el).forEach(b => b.onclick = () => this.adjust(el, b.dataset.adj));
    $$('[data-arc]', el).forEach(b => b.onclick = async () => {
      const p = productBySku(b.dataset.arc);
      if (p.aktif && !(await confirmDialog('Arsipkan ' + p.nama + '?', 'Menu disembunyikan dari layar kasir. Riwayat transaksi tetap utuh dan menu bisa diaktifkan lagi.', 'Arsipkan'))) return;
      const prev = p.aktif; p.aktif = !prev; this.draw(el);                                  // optimistic
      const r = await api('archiveProduct', { sku: p.sku, aktif: !prev });
      if (!r.success) { p.aktif = prev; this.draw(el); return toast('Gagal', r.message, 'err'); }
      toast('Tersimpan', r.message); invalidate('boot');
    });
  },
  adjust(el, sku) {
    const p = productBySku(sku);
    const m = openModal(modalHead('box', 'Sesuaikan Stok', esc(p.nama) + ' · stok saat ini <b class="mono">' + (p.stok === null ? '∞' : p.stok) + '</b>') + `<div class="modal-b">
      <div class="seg"><button class="on" data-m="add">Tambah (+)</button><button data-m="sub">Kurangi (−)</button><button data-m="set">Set Stok</button></div>
      <div class="field"><label>Jumlah porsi</label><input class="input mono" id="adV" inputmode="numeric" autofocus></div>
      <div class="field"><label>Alasan</label><select class="select" id="adR"><option>Restock dari supplier</option><option>Stok opname</option><option>Rusak / basi</option><option>Dipakai internal</option></select></div>
      <div id="adH" class="small"></div></div>
      <div class="modal-f"><button class="btn btn-secondary grow" data-close>Batal</button><button class="btn btn-primary grow" id="adOk">Simpan Stok</button></div>`, { cls: 'sm' });
    let mode = 'add';
    $$('.seg button', m.el).forEach(b => b.onclick = () => { mode = b.dataset.m; $$('.seg button', m.el).forEach(x => x.classList.toggle('on', x === b)); });
    api('stockHistory', { sku }).then(r => { if (r.success && $('#adH', m.el)) $('#adH', m.el).innerHTML = '<div class="label-sm mb">Riwayat terbaru</div>' + (r.data.slice(0, 6).map(h => '<div class="between" style="padding:4px 0;border-bottom:1px solid var(--line)"><span>' + fmtDT(h.waktu) + ' · ' + esc(h.alasan) + '</span><span class="mono ' + (h.delta < 0 ? 'red' : 'green') + '">' + (h.delta > 0 ? '+' : '') + h.delta + ' → ' + h.stokAkhir + '</span></div>').join('') || '<span class="muted">Belum ada riwayat.</span>'); });
    $('#adOk', m.el).onclick = async e => {
      const v = num($('#adV', m.el).value); if (!v && mode !== 'set') return;
      e.currentTarget.disabled = true;
      const r = await api('adjustStock', { sku, alasan: $('#adR', m.el).value, delta: mode === 'add' ? v : mode === 'sub' ? -v : undefined, set: mode === 'set' ? v : undefined });
      e.currentTarget.disabled = false;
      if (!r.success) return toast('Gagal', r.message, 'err');
      p.stok = r.data.stok; this.draw(el); updateBell(); m.close(); toast('Stok diperbarui', p.nama + ': ' + r.data.stok + ' porsi');
    };
  }
});

// ============================================================ FORM PRODUK
registerPage('produk-form', {
  auth: 'SUPERVISOR', title: 'Formulir Produk',
  template: () => '<div id="pfBody"></div>',
  show(el, sku) {
    const p = sku ? productBySku(sku) : null;
    const draftKey = userKey('pfDraft:' + (sku || 'new'));
    const d = Object.assign({ sku: '', barcode: '', nama: '', kategori: (AppState.config.KATEGORI || [])[0] || '', deskripsi: '', harga: '', diskon: 0, hpp: '', stok: 50, minStok: 10, levelPedas: '0-5', pajak: true, fotoId: '', favorit: false, lacak: true }, p ? Object.assign({}, p, { lacak: p.stok !== null }) : {}, Store.get(draftKey, {}));
    const cats = AppState.config.KATEGORI || [];
    const body = $('#pfBody', el);
    body.innerHTML = `<a href="#/produk" class="small" style="font-weight:600">${icon('arrowleft', 'ic-sm')} Kembali ke Katalog Produk</a>
    <div class="page-head mt8"><div><div class="row-wrap"><h1 class="h1">${p ? 'Edit Menu / Produk' : 'Formulir Tambah Menu / Produk Baru'}</h1><span class="pill soft-yellow"><span class="dotc"></span>Mode Input</span></div><p>${icon('sync', 'ic-sm')} Data otomatis tersinkronisasi ke Google Sheets (sheet Produk & StokLog).</p></div>
      <div class="row"><div class="optrow" style="background:#fff;box-shadow:var(--e1)">${icon('sync')}<div><div class="small ink2">Status Sync</div><div class="mono">Google Sheets</div></div></div><div class="optrow" style="background:#fff;box-shadow:var(--e1)">${icon('database')}<div><div class="small ink2">Master ID</div><div class="mono">${p ? esc(p.sku) : 'BARU'}</div></div></div></div></div>
    <div class="grid" style="grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);align-items:start" id="pfGrid">
     <div class="stack">
      <div class="card"><div class="card-h"><div class="row" style="align-items:flex-start"><span class="sec-num">01</span><div><div class="h3">Detail & Identitas Menu</div><div class="small ink2">Penamaan menu, pelabelan kasir, dan deskripsi bahan bumbu khas</div></div></div><span class="pill soft-yellow">Wajib Diisi</span></div>
        <div class="stack">
          <div class="field"><label>Barcode / SKU <span class="hint">SKU kosong = dibuat otomatis</span></label><div class="row"><div class="input-ic grow">${icon('qr')}<input class="input mono" data-f="sku" value="${esc(d.sku)}" placeholder="SKU-SBK-022"></div><button class="btn btn-soft" id="pfGen" type="button">${icon('scan')}Generate Barcode</button></div>
            <input class="input mono" data-f="barcode" value="${esc(d.barcode)}" placeholder="Barcode EAN-13 (opsional)"></div>
          <div class="field"><label>Nama Produk Kuliner</label><div class="input-ic"><input class="input" data-f="nama" maxlength="60" value="${esc(d.nama)}" placeholder="Seblak Tulang Rawan Level Mercon" style="font-size:18px;font-weight:600;padding-left:14px"></div>
            <div class="between small ink2"><span>Tampil di struk kasir & monitor dapur</span><span class="mono" id="pfCnt"></span></div></div>
          <div class="field"><label>Kategori Menu POS</label><select class="select" data-f="kategori">${cats.map(c => '<option ' + (c === d.kategori ? 'selected' : '') + '>' + esc(c) + '</option>').join('')}</select></div>
          <div class="field"><label>Deskripsi Singkat Resep & Topping Bawaan</label><textarea class="textarea" data-f="deskripsi" maxlength="500" placeholder="Seblak rempah kencur dengan tulang rawan sapi, makaroni basah, mie kenyal, sosis bakar, telur orak-arik…">${esc(d.deskripsi)}</textarea><span class="small ink2">Dapat dicetak sebagai panduan peracikan tim dapur saat pesanan masuk.</span></div>
          <div class="note"><div class="between"><b>${icon('flame', 'ic-sm')} Dukungan Tier Level Kepedasan</b><label class="switch"><input type="checkbox" id="pfLv" ${d.levelPedas ? 'checked' : ''}><span></span></label></div>
            <div class="row-wrap mt8">${['Lv 0: Gurih Ori', 'Lv 1-2: Sedang', 'Lv 3-4: Jeletot', 'Lv 5: Mercon'].map((x, i) => '<span class="pill mono" style="background:' + ['#FFE3B0', '#FFD6A8', '#F57C00', '#D7261E'][i] + ';color:' + (i > 1 ? '#fff' : 'var(--ink)') + '">' + x + '</span>').join('')}</div>
            <div class="small ink2 mt8">Bila aktif, kasir memilih level Lv 0–5 saat menambahkan menu ini.</div></div>
          <label class="check"><input type="checkbox" data-f="favorit" ${d.favorit ? 'checked' : ''}><span><b>Tandai Favorit</b> — tampil paling depan di layar kasir</span></label>
        </div></div>
      <div class="card"><div class="card-h"><div class="row" style="align-items:flex-start"><span class="sec-num">02</span><div><div class="h3">Pengaturan Harga & Pajak</div><div class="small ink2">Harga jual, diskon, dan estimasi laba kotor</div></div></div><span class="pill soft-yellow">Finansial</span></div>
        <div class="form-grid"><div class="field"><label>Harga Jual Pokok (Retail)</label><div class="input-rp"><span>Rp</span><input class="input" data-f="harga" data-rp inputmode="numeric" value="${d.harga ? rpn(d.harga) : ''}" placeholder="22.000"></div><span class="small ink2">Harga standar sebelum promo & PPN</span></div>
          <div class="field"><label>Diskon Khusus / Promo <span class="hint">Opsional</span></label><div class="input-rp"><span>Rp</span><input class="input" data-f="diskon" data-rp inputmode="numeric" value="${d.diskon ? rpn(d.diskon) : ''}" placeholder="0"></div><span class="small ink2">Potongan langsung saat pesanan diinput</span></div></div>
        <label class="optrow mt12 check"><input type="checkbox" data-f="pajak" ${d.pajak ? 'checked' : ''}><div class="grow"><b>Kena Pajak Resto PB1 / PPN ${AppState.config.PPN_PERSEN || 11}%</b><div class="small ink2">Otomatis dihitung & dipisahkan pada struk dan rekap omzet harian.</div></div><span class="pill yellow mono">+${AppState.config.PPN_PERSEN || 11}%</span></label>
        <div class="note mt12"><div class="between"><b>${icon('chart', 'ic-sm')} Kalkulator Margin & HPP Bahan</b><span class="small mono ink2">Live</span></div>
          <div class="margin-box mt8"><div><div class="small">Estimasi HPP (Modal)</div><div class="row"><span class="mono">Rp</span><input class="input mono" data-f="hpp" data-rp inputmode="numeric" value="${d.hpp ? rpn(d.hpp) : ''}" placeholder="9.500" style="min-height:36px;padding:0 6px;background:#fff"></div></div>
            <div><div class="small">Laba Kotor / Porsi</div><div class="data-md orange" id="pfLaba">-</div><div class="small ink2">Harga bersih − HPP</div></div>
            <div style="background:var(--orange-soft)"><div class="small"><b>Margin Kotor</b></div><div class="data-lg" id="pfMargin">-</div><div class="small orange" id="pfMsg"></div></div></div>
          <div class="progress mt8"><i id="pfBar" style="width:0"></i></div></div></div>
     </div>
     <div class="stack">
      <div class="card"><div class="card-h"><div class="row" style="align-items:flex-start"><span class="sec-num">03</span><div><div class="h3">Inventaris & Ambang Batas</div><div class="small ink2">Ketersediaan porsi & pemicu peringatan kasir</div></div></div></div>
        <label class="check"><input type="checkbox" id="pfTrack" ${d.lacak ? 'checked' : ''}><span><b>Lacak stok</b> — matikan untuk menu tanpa batas (mis. minuman racik)</span></label>
        <div class="grid g2 mt12" id="pfStokBox"><div class="optrow" style="flex-direction:column;align-items:stretch"><span class="label">Stok Tersedia</span><div class="row"><input class="input mono" data-f="stok" inputmode="numeric" value="${d.stok === null ? '' : d.stok}" style="font-size:24px;text-align:center;background:#fff"><span>Porsi</span></div><span class="small ink2">Berkurang otomatis setiap transaksi</span></div>
          <div class="optrow" style="flex-direction:column;align-items:stretch"><span class="label">Min-Alert (Ambang) ${icon('alert', 'ic-sm')}</span><div class="row"><input class="input mono red" data-f="minStok" inputmode="numeric" value="${d.minStok}" style="font-size:24px;text-align:center;background:#fff"><span>Porsi</span></div><span class="small ink2">Memicu badge 'Sisa' di kasir</span></div></div></div>
      <div class="card"><div class="card-h"><div class="row" style="align-items:flex-start"><span class="sec-num">04</span><div><div class="h3">Foto Menu & Media POS</div><div class="small ink2">Disimpan di Google Drive outlet</div></div></div><span class="pill soft-yellow">Drive</span></div>
        <label class="dropzone" id="pfDrop">${icon('upload', 'ic-lg')}<div class="mt8"><b>Tarik & lepas foto menu di sini atau klik untuk unggah</b></div><div class="small ink2">JPEG / PNG, otomatis dikompres ±1200px sebelum diunggah</div><input type="file" accept="image/*" id="pfFile" hidden></label>
        <div id="pfPhoto" class="mt12"></div>
        <div class="note mt12"><div class="label-sm">Preview Kartu Kasir POS</div><div class="pcard mt8" id="pfPrev"></div></div></div>
     </div></div>
    <div class="sticky-foot"><span class="dotc" style="width:8px;height:8px;border-radius:50%;background:var(--secondary)"></span><span class="grow small" id="pfDraft">Draf tersimpan otomatis di perangkat ini.</span>
      <a class="btn btn-secondary" href="#/produk">${icon('x')}Batal / Kembali</a><button class="btn btn-primary btn-lg" id="pfSave">${icon('upload')}Simpan & Publikasikan ke POS</button></div>`;
    if (innerWidth < 1000) $('#pfGrid', body).style.gridTemplateColumns = '1fr';
    const F = k => $('[data-f="' + k + '"]', body);
    const val = () => ({ sku: F('sku').value.trim(), barcode: F('barcode').value.trim(), nama: F('nama').value.trim(), kategori: F('kategori').value, deskripsi: F('deskripsi').value.trim(),
      harga: num(F('harga').value), diskon: num(F('diskon').value), hpp: num(F('hpp').value), stok: $('#pfTrack', body).checked ? num(F('stok').value) : null, minStok: num(F('minStok').value),
      levelPedas: $('#pfLv', body).checked ? '0-5' : '', pajak: F('pajak').checked, favorit: F('favorit').checked, fotoId: d.fotoId, lacak: $('#pfTrack', body).checked });
    const live = () => {
      const v = val();
      $('#pfCnt', body).textContent = v.nama.length + ' / 60 Karakter';
      const bersih = v.harga - v.diskon, laba = bersih - v.hpp, mg = bersih ? laba / bersih * 100 : 0;
      $('#pfLaba', body).textContent = v.harga ? rp(laba) : '-';
      $('#pfMargin', body).textContent = v.harga ? mg.toFixed(1) + '%' : '-';
      $('#pfMsg', body).textContent = !v.harga ? '' : mg >= 45 ? 'Sangat Sehat (> 45%)' : mg >= 30 ? 'Cukup (30–45%)' : 'Tipis — tinjau HPP';
      $('#pfBar', body).style.width = Math.max(0, Math.min(100, mg)) + '%';
      $('#pfStokBox', body).style.opacity = v.lacak ? '1' : '.45';
      $('#pfPrev', body).innerHTML = (d.fotoId ? '<img class="thumb" src="' + driveThumb(d.fotoId, 160) + '" alt="">' : '<div class="thumb" style="display:grid;place-items:center;color:var(--primary-deep)">' + icon('bowl') + '</div>') +
        '<div class="grow" style="min-width:0"><div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(v.nama || 'Nama menu') + '</div><div class="mono red" style="font-weight:600">' + rp(bersih || 0) + '</div></div><span class="pill mono">' + (v.lacak ? v.stok + ' porsi' : '∞') + '</span>';
      Store.set(draftKey, v); $('#pfDraft', body).textContent = 'Draf tersimpan otomatis · ' + fmtTime(new Date());
    };
    $$('[data-f], #pfLv, #pfTrack', body).forEach(i => i.addEventListener('input', live));
    $$('[data-rp]', body).forEach(i => i.addEventListener('input', () => { const n = num(i.value); i.value = n ? rpn(n) : ''; }));
    $('#pfGen', body).onclick = () => { let b = '899' + String(Date.now()).slice(-9); let s = 0; for (let i = 0; i < 12; i++) s += +b[i] * (i % 2 ? 3 : 1); F('barcode').value = b + ((10 - s % 10) % 10); live(); };
    const photo = () => { $('#pfPhoto', body).innerHTML = d.fotoId ? '<div class="optrow"><img class="thumb" src="' + driveThumb(d.fotoId, 160) + '" alt=""><div class="grow"><b>Foto tersimpan</b><div class="small ink2 mono">ID: ' + esc(d.fotoId.slice(0, 12)) + '…</div><span class="pill soft-green mt8">' + icon('cloud', 'ic-sm') + 'Drive Connected</span></div><button class="icon-btn" id="pfRm" title="Hapus foto">' + icon('trash') + '</button></div>' : '';
      const rm = $('#pfRm', body); if (rm) rm.onclick = () => { d.fotoId = ''; photo(); live(); }; };
    photo();
    const upload = async file => {
      if (!file || !/^image\//.test(file.type)) return;
      if (DEMO) return toast('Mode demo', 'Unggah foto ke Google Drive aktif setelah backend GAS terhubung.', 'warn');
      $('#pfPhoto', body).innerHTML = '<div class="optrow">' + icon('sync') + ' Mengompres & mengunggah ' + esc(file.name) + '…</div>';
      const b64 = await resizeImage(file, 1200, 0.82);
      const r = await api('uploadPhoto', { base64: b64, mime: 'image/jpeg', name: file.name.replace(/\.\w+$/, '') + '.jpg' });
      if (!r.success) { photo(); return toast('Unggah gagal', r.message, 'err'); }
      d.fotoId = r.data.id; photo(); live(); toast('Foto tersimpan', 'Tersimpan di Google Drive outlet.');
    };
    const drop = $('#pfDrop', body);
    $('#pfFile', body).onchange = e => upload(e.target.files[0]);
    drop.ondragover = e => { e.preventDefault(); drop.classList.add('drag'); }; drop.ondragleave = () => drop.classList.remove('drag');
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove('drag'); upload(e.dataTransfer.files[0]); };
    live();
    $('#pfSave', body).onclick = async e => {
      const v = val();
      if (!v.nama) return toast('Nama wajib diisi', '', 'warn');
      if (!v.harga) return toast('Harga jual wajib diisi', '', 'warn');
      const btn = e.currentTarget; btn.disabled = true; btn.innerHTML = icon('sync') + 'Menyimpan…';
      const r = await api('saveProduct', Object.assign(v, { originalSku: p ? p.sku : '' }));
      btn.disabled = false; btn.innerHTML = icon('upload') + 'Simpan & Publikasikan ke POS';
      if (!r.success) return toast('Gagal menyimpan', r.message, 'err');
      Store.del(draftKey);
      const i = AppState.products.findIndex(x => x.sku === (p ? p.sku : r.data.sku));
      if (i > -1) AppState.products[i] = r.data; else AppState.products.push(r.data);
      invalidate('boot'); updateBell();
      toast('Tersimpan', r.message); go('produk');
    };
  }
});
function resizeImage(file, max, q) {
  return new Promise((ok, no) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', q)); };
    img.onerror = no; img.src = url;
  });
}

// ============================================================ LAPORAN
registerPage('laporan', {
  auth: 'SUPERVISOR', title: 'Laporan',
  template: () => `
  <div class="card"><div class="between" style="flex-wrap:wrap;align-items:flex-start"><div><h1 class="h1">Laporan Penjualan & Performa Usaha</h1><span class="pill soft-red mt8" id="lpOutlet"></span>
    <p class="ink2" style="margin:8px 0 0">Konsolidasi metrik pendapatan kasir POS, rekonsiliasi pembayaran multikanal, dan performa menu dapur seblak.</p></div>
    <div class="stack" style="gap:8px"><button class="btn btn-secondary" id="lpCsv">${icon('sheet')}Unduh Excel / CSV</button><button class="btn btn-primary" id="lpPdf">${icon('printer')}Cetak PDF Laporan</button></div></div></div>
  <div class="tabs mt16" id="lpTabs"><button class="on" data-t="harian">${icon('calendar')}Harian</button><button data-t="bulanan">${icon('sheet')}Bulanan</button><button data-t="tahunan">${icon('calendar')}Tahunan</button><button data-t="menu">${icon('flame')}Menu Terlaris</button><button data-t="shift">${icon('lockclock')}Rekap Tutup Shift</button></div>
  <div class="card mt16 no-print"><div class="row-wrap"><span class="optrow" style="padding:6px 10px">${icon('calendar')}Dari:<input type="date" id="lpFrom" class="input mono" style="min-height:36px;width:auto;background:transparent;border:0"></span><span>-</span>
    <span class="optrow" style="padding:6px 10px">${icon('calendar')}Sampai:<input type="date" id="lpTo" class="input mono" style="min-height:36px;width:auto;background:transparent;border:0"></span>
    <button class="pill soft-orange" data-pr="today" style="border:0;cursor:pointer">Hari Ini</button><button class="pill soft-orange" data-pr="month" style="border:0;cursor:pointer">Bulan Ini</button><button class="pill" data-pr="7" style="border:0;cursor:pointer">7 Hari Terakhir</button><button class="pill" data-pr="30" style="border:0;cursor:pointer">30 Hari</button>
    <span class="grow"></span><button class="btn btn-secondary btn-sm" id="lpReset">${icon('filter')}Reset</button><button class="btn btn-orange" id="lpGo">${icon('search')}Terapkan Filter</button></div></div>
  <div id="lpBody" class="mt16"></div>`,
  init(el) {
    const setR = (f, t) => { $('#lpFrom', el).value = f; $('#lpTo', el).value = t; };
    setR(addDays(dayKey(), -6), dayKey());
    $$('[data-pr]', el).forEach(b => b.onclick = () => { const t = dayKey(), p = b.dataset.pr; setR(p === 'today' ? t : p === 'month' ? t.slice(0, 8) + '01' : addDays(t, -(+p - 1)), t); this.load(el); });
    $('#lpReset', el).onclick = () => { setR(addDays(dayKey(), -6), dayKey()); this.load(el); };
    $('#lpGo', el).onclick = () => this.load(el);
    $$('#lpTabs button', el).forEach(b => b.onclick = () => {
      $$('#lpTabs button', el).forEach(x => x.classList.toggle('on', x === b)); el.dataset.tab = b.dataset.t;
      const t = dayKey();
      if (b.dataset.t === 'bulanan') setR(t.slice(0, 8) + '01', t);
      if (b.dataset.t === 'tahunan') setR(t.slice(0, 5) + '01-01', t);
      this.load(el);
    });
    $('#lpCsv', el).onclick = () => { const r = el._rep; if (!r) return; const rows = [['Tanggal', 'Transaksi', 'Omzet Kotor', 'Diskon', 'PPN', 'Penjualan Bersih', 'Tunai', 'Non-Tunai', 'Void', 'Status Shift']].concat(r.harian.map(h => [h.tanggal, h.trx, h.gross, h.diskon, h.ppn, h.netto, h.tunai, h.nonTunai, h.void, h.statusShift]));
      rows.push(['TOTAL', r.total.trx, r.total.gross, r.total.diskon, r.total.ppn, r.total.netto, '', '', r.total.void, '']); downloadFile('laporan-' + r.from + '_' + r.to + '.csv', toCsv(rows), 'text/csv;charset=utf-8'); };
    $('#lpPdf', el).onclick = () => {
      const tpl = ((Store.get(userKey('deTpl')) || { data: { templates: [] } }).data.templates || []).find(x => x.sumber === 'laporan');
      if (!DEMO && tpl && el._rep) return go('dokumen', 'terbit:' + tpl.kode + ':' + el._rep.from + '|' + el._rep.to);
      window.print();
    };
  },
  show(el) { $('#lpOutlet', el).innerHTML = icon('receipt', 'ic-sm') + '#' + esc(AppState.config.OUTLET_KODE || '01') + ' - ' + esc(AppState.config.OUTLET_CABANG || ''); this.load(el); },
  load(el) {
    const f = $('#lpFrom', el).value, t = $('#lpTo', el).value, tab = el.dataset.tab || 'harian', body = $('#lpBody', el);
    if (tab === 'shift') return this.shifts(el, body);
    if (!el._rep) body.innerHTML = '<div class="card"><div class="skel" style="height:260px"></div></div>';
    else body.style.opacity = '.55';
    swr('rep:' + f + ':' + t, 'report', { from: f, to: t }, r => { body.style.opacity = '1'; el._rep = r; this.render(el, body, r, tab); }, { fresh: t === dayKey() ? 60000 : 3600e3, onError: r => body.replaceChildren(retryBox(r.message, () => this.load(el))) });
  },
  render(el, body, r, tab) {
    const T = r.total, max = Math.max.apply(null, r.topMenu.map(m => m.qty).concat([1]));
    const col = ['#D7261E', '#F57C00', '#E8A317', '#D7261E', '#F57C00'];
    const kpis = `<div class="grid g4">
      <div class="card kpi"><div class="label-sm">Total Transaksi</div><div class="kpi-ic">${icon('receipt')}</div><div class="kpi-v">${T.trx} TRX</div><div class="small ${r.growthTrx === null ? 'muted' : r.growthTrx >= 0 ? 'green' : 'red'}" style="margin-top:auto">${r.growthTrx === null ? 'Tidak ada pembanding' : (r.growthTrx >= 0 ? '↗ +' : '↘ ') + r.growthTrx + '% vs periode lalu'}</div></div>
      <div class="card kpi"><div class="label-sm">Omzet Kotor (Gross)</div><div class="kpi-ic" style="background:var(--orange-soft)">${icon('register')}</div><div class="kpi-v">${rp(T.gross)}</div><div class="kpi-foot"><span>Rata-rata / hari</span><b class="mono" style="color:var(--ink)">${rp(r.rataHarian)}</b></div></div>
      <div class="card kpi"><div class="label-sm">PPN ${AppState.config.PPN_PERSEN || 11}% Terkumpul</div><div class="kpi-ic" style="background:var(--cream-yellow)">${icon('shield')}</div><div class="kpi-v">${rp(T.ppn)}</div><div class="small ink2" style="margin-top:auto">${icon('checkc', 'ic-sm')} Sesuai faktur kasir tercetak</div></div>
      <div class="card kpi hot"><div class="label-sm">Penjualan Bersih (Netto)</div><div class="kpi-ic">${icon('wallet')}</div><div class="kpi-v">${rp(T.netto)}</div><span class="pill" style="background:rgba(255,255,255,.2);color:#fff;margin-top:auto">${icon('checkc', 'ic-sm')}Diskon ${rp(T.diskon)} · ${T.void} void</span></div></div>`;
    const top = `<div class="card"><div class="between"><div class="h3">${icon('dine')} Top 5 Menu Terlaris</div><span class="small ink2">Porsi Terjual</span></div><div class="small ink2">Komposisi varian seblak terfavorit pelanggan outlet ${esc(AppState.config.OUTLET_CABANG || '')}.</div>
      <div class="stack mt12">${r.topMenu.map((m, i) => '<div class="bar-row"><div class="between"><span>' + (i + 1) + '. ' + esc(m.nama) + '</span><span class="mono red" style="font-weight:600">' + m.qty + ' Porsi</span></div><div class="track"><i style="width:' + (m.qty / max * 100) + '%;background:' + col[i] + '"></i></div></div>').join('') || '<div class="empty small">Belum ada penjualan.</div>'}</div>
      <div class="optrow mt12 between"><span class="small">Kontribusi Top 5 Menu</span><b class="mono">${String(r.kontribusiTop).replace('.', ',')}% Total Item</b></div></div>`;
    const capai = r.target ? (T.gross / (r.target * r.harian.length) * 100) : 0;
    const chart = `<div class="card"><div class="between" style="flex-wrap:wrap"><div><div class="h3"><span class="red">●</span> Tren Penjualan Harian (Gross Sales)</div><div class="small ink2">Fluktuasi omzet ${r.harian.length} hari: ${keyLabel(r.from)} – ${keyLabel(r.to)}</div></div>
      <div class="seg" id="lpMode"><button class="${el.dataset.mode !== 'trx' ? 'on' : ''}" data-m="rp">Nominal (Rp)</button><button class="${el.dataset.mode === 'trx' ? 'on' : ''}" data-m="trx">Volume Transaksi</button></div></div>
      <div class="legend mt12"><span><i class="line" style="background:#D7261E"></i>${el.dataset.mode === 'trx' ? 'Jumlah transaksi' : 'Omzet kotor'}</span>${el.dataset.mode !== 'trx' ? '<span><i class="dash"></i>Target harian</span>' : ''}</div>
      <div class="chart mt8" id="lpChart"></div><div class="between small mt8"><span class="ink2">Arahkan kursor ke grafik untuk nilai per hari.</span><span class="mono ${capai >= 100 ? 'green' : 'orange'}">Tercapai ${capai.toFixed(1).replace('.', ',')}% dari target periode</span></div></div>`;
    const table = `<div class="card pad0 mt16"><div class="between" style="padding:18px 20px"><div><div class="h3">Rekapitulasi Finansial ${tab === 'tahunan' ? 'Bulanan' : 'Harian'}</div><div class="small ink2">Rincian jurnal transaksi register dan pemotongan pajak kasir</div></div><span class="small ink2">Menampilkan ${tab === 'tahunan' ? 'per bulan' : r.harian.length + ' hari'}</span></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>${tab === 'tahunan' ? 'Bulan' : 'Tanggal'}</th><th class="num">TRX</th><th class="num">Omzet Kotor</th><th class="num">Diskon / Promo</th><th class="num">PPN</th><th class="num">Penjualan Bersih (Netto)</th><th>Status Shift</th></tr></thead><tbody>
      ${(tab === 'tahunan' ? this.byMonth(r.harian) : r.harian.slice().reverse()).map(h => '<tr><td>' + (h.bulan || fmtParts(h.tanggal + 'T12:00:00+07:00', { day: 'numeric', month: 'short', year: 'numeric' })) + (h.tanggal === dayKey() ? ' <span class="pill soft-orange">Hari Ini</span>' : '') + '</td><td class="num">' + h.trx + ' TRX</td><td class="num">' + rp(h.gross) + '</td><td class="num red">' + (h.diskon ? '-' + rp(h.diskon) : '-') + '</td><td class="num">' + rp(h.ppn) + '</td><td class="num" style="font-weight:700;font-size:15px' + (h.tanggal === dayKey() ? ';color:var(--primary)' : '') + '">' + rp(h.netto) + '</td><td>' + (h.statusShift === 'AKTIF' ? '<span class="pill yellow"><span class="dotc"></span>Shift Aktif</span>' : h.statusShift ? '<span class="pill soft-red">' + icon('lockclock', 'ic-sm') + 'Ditutup</span>' : '<span class="muted small">—</span>') + '</td></tr>').join('')}</tbody>
      <tfoot><tr><td>TOTAL AKUMULASI <span class="pill" style="background:var(--secondary);color:#fff">AUDIT SAH</span></td><td class="num" style="color:var(--tertiary)">${T.trx} TRX</td><td class="num">${rp(T.gross)}</td><td class="num">-${rp(T.diskon)}</td><td class="num">${rp(T.ppn)}</td><td class="num" style="font-size:18px">${rp(T.netto)}</td><td class="small">${icon('shield', 'ic-sm')} Siap Setor</td></tr></tfoot></table></div>
      <div class="between small" style="padding:12px 20px;background:var(--surface-low);flex-wrap:wrap"><span class="ink2">${icon('sync', 'ic-sm')} Dihitung dari sheet Transaksi · ${fmtDT(new Date())} WIB</span><span>Petugas: <b>${esc(AppState.user.nama)} (${esc(AppState.user.kode)})</b></span></div></div>`;
    const metode = '<div class="card"><div class="h3">Komposisi Pembayaran</div><div class="stack mt12">' + Object.keys(r.metode).map(k => { const p = T.netto ? r.metode[k] / T.netto * 100 : 0; return '<div class="bar-row"><div class="between"><span>' + metodePill(k) + '</span><span class="mono">' + rp(r.metode[k]) + ' · ' + p.toFixed(1) + '%</span></div><div class="track"><i style="width:' + p + '%;background:#D7261E"></i></div></div>'; }).join('') + '</div></div>';
    body.innerHTML = kpis + (tab === 'menu' ? '<div class="grid g2 mt16">' + top + metode + '</div>' : '<div class="grid g-main mt16">' + chart + '<div class="stack">' + top + metode + '</div></div>') + table;
    const draw = () => { const ch = $('#lpChart', body); if (!ch) return; const lbl = r.harian.map(h => keyLabel(h.tanggal));
      if (el.dataset.mode === 'trx') lineChart(ch, lbl, r.harian.map(h => h.trx), { fmt: v => v + ' transaksi' });
      else lineChart(ch, lbl, r.harian.map(h => h.gross), { target: r.target, fmt: rp, fmtAxis: rpShort, sub: i => r.harian[i].trx + ' trx' }); };
    draw();
    $$('#lpMode button', body).forEach(b => b.onclick = () => { el.dataset.mode = b.dataset.m; this.render(el, body, r, tab); });
  },
  byMonth(harian) {
    const m = {}; harian.forEach(h => { const k = h.tanggal.slice(0, 7); const x = m[k] || (m[k] = { bulan: fmtParts(k + '-15T12:00:00+07:00', { month: 'long', year: 'numeric' }), trx: 0, gross: 0, diskon: 0, ppn: 0, netto: 0, statusShift: '' }); ['trx', 'gross', 'diskon', 'ppn', 'netto'].forEach(f => x[f] += h[f]); if (h.statusShift) x.statusShift = x.statusShift === 'AKTIF' ? 'AKTIF' : h.statusShift; });
    return Object.keys(m).sort().reverse().map(k => m[k]);
  },
  shifts(el, body) {
    body.innerHTML = '<div class="card pad0"><div class="table-wrap"><table class="tbl cards"><thead><tr><th>ID Shift</th><th>Kasir</th><th>Buka – Tutup</th><th class="num">Penjualan</th><th class="num">Kas Sistem</th><th class="num">Kas Fisik</th><th class="num">Selisih</th><th>Verifikator</th><th></th></tr></thead><tbody id="lpS"><tr><td colspan="9"><div class="skel"></div></td></tr></tbody></table></div></div>';
    swr('shifts:all', 'shifts', { limit: 120 }, rows => {
      $('#lpS', body).innerHTML = rows.map(s => `<tr><td class="mono" style="font-weight:600">${esc(s.id)}</td><td>${esc(s.kasirNama)}</td><td class="small mono">${fmtDT(s.buka)}<br>${s.tutup ? fmtDT(s.tutup) : '<span class="pill yellow">Aktif</span>'}</td><td class="num">${rp(s.total)}</td><td class="num">${rp(s.kasSistem)}</td><td class="num">${s.status === 'DITUTUP' ? rp(s.kasFisik) : '—'}</td>
        <td class="num ${s.selisih < 0 ? 'red' : s.selisih > 0 ? 'orange' : 'green'}" style="font-weight:700">${s.status === 'DITUTUP' ? rp(s.selisih) : '—'}</td><td class="small">${esc(s.supervisor || '—')}</td><td>${s.status === 'DITUTUP' ? '<button class="btn btn-sm btn-soft" data-z="' + esc(s.id) + '">' + icon('printer', 'ic-sm') + '</button>' : ''}</td></tr>`).join('') || '<tr><td colspan="9" class="empty">Belum ada shift.</td></tr>';
      $$('[data-z]', body).forEach(b => b.onclick = async () => { const r = await api('shiftSummary', { id: b.dataset.z }); if (r.success) printZ(r.data, 'Z-REPORT'); });
    }, { fresh: 30000 });
  }
});

// ============================================================ DOKUMEN CETAK (gas-doc-engine)
const ENGINE_IC = { docs: 'file', sheets: 'sheet', slides: 'slides' };
registerPage('dokumen', {
  title: 'Dokumen Cetak',
  template: () => `<div class="page-head"><div><h1 class="h1">Dokumen Cetak dari Template</h1><p>Terbitkan Z-Report, nota A4, rekap penjualan, surat pesanan supplier, atau dokumen apa pun dari template Google Docs/Sheets/Slides Anda — lengkap dengan nomor otomatis, persetujuan PIN supervisor, dan QR verifikasi.</p></div></div>
    <div class="tabs" id="dkTabs"><button class="on" data-t="terbit">${icon('printer')}Terbitkan</button><button data-t="arsip">${icon('archive')}Arsip Dokumen</button><button data-t="template" data-owner>${icon('sliders')}Kelola Template</button></div>
    <div id="dkBody" class="mt16"></div>`,
  init(el) {
    if (!can('OWNER')) $('[data-owner]', el).hidden = true;
    $$('#dkTabs button', el).forEach(b => b.onclick = () => { el.dataset.tab = b.dataset.t; el.dataset.pre = ''; this.show(el); });
  },
  show(el, param) {
    if (param && /^terbit:/.test(param)) { el.dataset.tab = 'terbit'; el.dataset.pre = param; }
    const tab = el.dataset.tab || 'terbit';
    $$('#dkTabs button', el).forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const body = $('#dkBody', el);
    if (DEMO) body.innerHTML = '<div class="note small mb">' + icon('info', 'ic-sm') + ' <b>Mode demo:</b> pemindaian template & render PDF membutuhkan Google Docs/Drive, jadi baru berfungsi setelah backend Apps Script terhubung. Antarmuka tetap bisa dijelajahi.</div>';
    const host = document.createElement('div'); if (DEMO) { host.className = 'mt12'; body.appendChild(host); } else body.replaceChildren(host);
    if (tab === 'arsip') return this.arsip(el, host);
    if (tab === 'template') return this.templates(el, host);
    this.terbit(el, host);
  },
  loadTpl(render, force) { return swr('deTpl', 'deTemplates', {}, render, { fresh: 300000, force }); },
  terbit(el, host) {
    host.innerHTML = '<div class="grid g3" id="dkTpl"><div class="card"><div class="skel" style="height:60px"></div></div></div><div id="dkForm" class="mt16"></div>';
    this.loadTpl(d => {
      const T = d.templates;
      $('#dkTpl', host).innerHTML = T.length ? T.map(t => `<button class="tpl-card" data-k="${esc(t.kode)}"><div class="tpl-ic">${icon(ENGINE_IC[t.engine] || 'file')}</div><div class="grow"><b>${esc(t.nama)}</b><div class="small ink2">${esc((d.sumber.find(s => s.kode === t.sumber) || {}).label || t.sumber)}</div>
          <div class="row-wrap mt8"><span class="code">${esc(t.kode)}</span><span class="pill">${t.keluaran.map(x => x.toUpperCase()).join(' · ')}</span>${t.slotTtd.length ? '<span class="pill soft-yellow">' + t.slotTtd.length + ' TTD</span>' : ''}</div></div></button>`).join('')
        : '<div class="card" style="grid-column:1/-1"><div class="empty">' + icon('file') + '<div>Belum ada template dokumen.</div>' + (can('OWNER') ? '<button class="btn btn-primary mt12" id="dkMk">' + icon('zap') + 'Buat 4 Template Contoh Otomatis</button>' : '<div class="small">Minta Owner menyiapkan template.</div>') + '</div></div>';
      $$('.tpl-card', host).forEach(b => b.onclick = () => { $$('.tpl-card', host).forEach(x => x.classList.toggle('on', x === b)); this.form(el, $('#dkForm', host), T.find(t => t.kode === b.dataset.k), d); });
      const mk = $('#dkMk', host); if (mk) mk.onclick = () => this.samples(el);
      const pre = el.dataset.pre; if (pre) { const p = pre.split(':'); const t = T.find(x => x.kode === p[1]) || T.find(x => (p[1] === 'ZREPORT' && x.sumber === 'shift')); if (t) { el.dataset.pre = ''; const b = $('.tpl-card[data-k="' + t.kode + '"]', host); b && b.classList.add('on'); this.form(el, $('#dkForm', host), t, d, p.slice(2).join(':')); } else toast('Template belum ada', 'Owner perlu membuat template ' + p[1] + ' di tab Kelola Template.', 'warn', 5000); }
    });
  },
  async form(el, box, t, meta, ref) {
    const today = dayKey();
    const refInput = t.sumber === 'shift' ? '<select class="select" id="dfRef"><option value="">Shift terakhir saya</option></select>'
      : t.sumber === 'transaksi' ? '<input class="input mono" id="dfRef" placeholder="TRX-20261106-0001" value="' + esc(ref || '') + '">'
      : t.sumber === 'laporan' ? '<div class="row"><input type="date" class="input" id="dfF" value="' + esc((ref || '').split('|')[0] || addDays(today, -6)) + '"><input type="date" class="input" id="dfT" value="' + esc((ref || '').split('|')[1] || today) + '"></div>' : '';
    box.innerHTML = `<div class="grid g-main" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="card"><div class="card-h"><div><div class="h3">${esc(t.nama)}</div><div class="small ink2">Template v${t.versi} · ${esc(t.engine)} · nomor <span class="code">${esc(t.formatNomor)}</span></div></div><a class="btn btn-sm btn-ghost" href="${esc(t.url)}" target="_blank" rel="noopener">${icon('link', 'ic-sm')}Buka template</a></div>
      ${refInput ? '<div class="field"><label>Sumber data POS</label>' + refInput + '</div><button class="btn btn-soft btn-sm mt8" id="dfLoad">' + icon('sync') + 'Muat data</button><div id="dfSrc" class="mt12"></div>' : ''}
      <div class="stack mt12" id="dfFields"></div></div>
      <div class="stack"><div class="card"><div class="h3">Penanda Tangan & Keluaran</div><div class="stack mt12" id="dfTtd"></div>
        <div class="field mt12"><label>Format keluaran</label><div class="row-wrap">${t.keluaran.map(k => '<label class="check"><input type="checkbox" data-out="' + k + '" checked><span>' + k.toUpperCase() + '</span></label>').join('')}</div></div></div>
        <button class="btn btn-primary btn-lg btn-block" id="dfGo">${icon('shield')}Terbitkan Dokumen</button><div id="dfRes"></div></div></div>`;
    let src = { data: {} };
    const fields = t.bidang.filter(b => b.kategori !== 'sumber');
    $('#dfFields', box).innerHTML = fields.length ? '<div class="label-sm">Isian dokumen</div>' + fields.map(b => deFieldHtml(b)).join('') : '<div class="small ink2">Semua kolom terisi otomatis dari data POS.</div>';
    $$('[data-addrow]', box).forEach(btn => btn.onclick = () => { const tb = $('#dl_' + btn.dataset.addrow + ' tbody', box); tb.insertAdjacentHTML('beforeend', tb.rows[0].outerHTML.replace(/value="[^"]*"/g, 'value=""')); });
    $('#dfTtd', box).innerHTML = t.slotTtd.length ? t.slotTtd.map(s => `<div class="optrow" style="flex-direction:column;align-items:stretch"><b>${esc(s.label)} <span class="small ink2">(slot ${s.slot}, min. ${esc(s.peranMin)})</span></b>
        <select class="select mt8" data-ttd-e="${s.slot}">${AppState.approvers.map(a => '<option value="' + esc(a.email) + '">' + esc(a.nama) + ' — ' + esc(a.role) + '</option>').join('')}</select>
        ${s.wajibPin !== false ? '<input class="input mono mt8" type="password" inputmode="numeric" maxlength="6" placeholder="PIN penanda tangan" data-ttd-p="' + s.slot + '">' : ''}</div>`).join('') +
        (can('OWNER') ? '<label class="check small"><input type="checkbox" id="dfBy"><span>Sahkan sebagai Owner tanpa PIN pejabat (tercatat BYPASS)</span></label><input class="input" id="dfByR" placeholder="Alasan pengesahan Owner" hidden>' : '')
      : '<div class="small ink2">Template ini tidak memiliki slot tanda tangan.</div>';
    const by = $('#dfBy', box); if (by) by.onchange = () => { $('#dfByR', box).hidden = !by.checked; };
    const refVal = () => t.sumber === 'laporan' ? $('#dfF', box).value + '|' + $('#dfT', box).value : ($('#dfRef', box) ? $('#dfRef', box).value : '');
    const loadSrc = async () => {
      if (!t.sumber || t.sumber === 'manual') return;
      $('#dfSrc', box).innerHTML = '<div class="skel" style="height:60px"></div>';
      const r = await api('deSourceData', { sumber: t.sumber, ref: refVal() });
      if (!r.success) { $('#dfSrc', box).innerHTML = '<div class="pill soft-red">' + esc(r.message) + '</div>'; return; }
      src = r.data;
      const keys = Object.keys(src.data).filter(k => !Array.isArray(src.data[k])).slice(0, 14);
      $('#dfSrc', box).innerHTML = '<div class="note"><b>' + esc(src.judul) + '</b><div class="kv mt8 small">' + keys.map(k => '<span class="mono">' + esc(k) + '</span><span>' + esc(typeof src.data[k] === 'number' ? rpn(src.data[k]) : String(src.data[k]).slice(0, 40)) + '</span>').join('') + '</div>' +
        Object.keys(src.data).filter(k => Array.isArray(src.data[k])).map(k => '<div class="small mt8">' + icon('hold', 'ic-sm') + ' <span class="code">' + esc(k) + '</span> ' + src.data[k].length + ' baris</div>').join('') + '</div>';
    };
    if (t.sumber === 'shift') api('shifts', { limit: 30 }).then(r => { if (r.success) { $('#dfRef', box).innerHTML = r.data.map(s => '<option value="' + esc(s.id) + '"' + (s.id === ref ? ' selected' : '') + '>' + esc(s.id) + ' · ' + esc(s.kasirNama) + ' · ' + (s.status === 'DITUTUP' ? 'ditutup' : 'aktif') + '</option>').join(''); loadSrc(); } });
    else if (t.sumber !== 'manual') loadSrc();
    const lb = $('#dfLoad', box); if (lb) lb.onclick = loadSrc;
    $('#dfGo', box).onclick = async e => {
      const isian = deCollect(fields, box);
      const ttd = t.slotTtd.map(s => ({ slot: s.slot, email: ($('[data-ttd-e="' + s.slot + '"]', box) || {}).value, pin: ($('[data-ttd-p="' + s.slot + '"]', box) || {}).value }));
      const bypass = by && by.checked ? $('#dfByR', box).value : '';
      const out = $$('[data-out]', box).filter(i => i.checked).map(i => i.dataset.out);
      if (!out.length) return toast('Pilih format keluaran', '', 'warn');
      const btn = e.currentTarget; btn.disabled = true; btn.innerHTML = icon('sync') + 'Merender dokumen… (5–20 dtk)';
      const kode = Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
      const base = (AppState.config.VERIFY_BASE_URL || location.href.split('#')[0]).replace(/#.*$/, '').replace(/\/?$/, '/');
      const qr = await qrDataUrl(base + '#/v/' + kode, 6);
      const r = await api('deGenerate', { kode: t.kode, ref: refVal(), isian, ttd, bypassAlasan: bypass, keluaran: out, verif: { kode, qr } });
      btn.disabled = false; btn.innerHTML = icon('shield') + 'Terbitkan Dokumen';
      if (!r.success) return toast('Gagal menerbitkan', r.message, 'err', 6000);
      invalidate('deDocs');
      const d = r.data;
      $('#dfRes', box).innerHTML = `<div class="card" style="border-color:var(--success)"><div class="row">${icon('checkc', 'ic-lg')}<div><b>${esc(d.nomor)}</b><div class="small ink2">${esc(d.judul)}</div></div></div>
        <div class="row-wrap mt12">${d.pdfBase64 ? '<button class="btn btn-primary btn-sm" id="drPdf">' + icon('download', 'ic-sm') + 'Unduh PDF</button><button class="btn btn-soft btn-sm" id="drPrint">' + icon('printer', 'ic-sm') + 'Cetak</button>' : ''}
        ${Object.keys(d.berkas).filter(k => k !== 'sumber').map(k => '<a class="btn btn-soft btn-sm" target="_blank" rel="noopener" href="' + esc(d.berkas[k].url) + '">' + k.toUpperCase() + ' di Drive</a>').join('')}
        <a class="btn btn-ghost btn-sm" href="${esc(d.urlVerifikasi)}" target="_blank" rel="noopener">${icon('shield', 'ic-sm')}Halaman verifikasi</a></div><div class="small mono ink2 mt8">Kode: ${esc(d.kodeVerifikasi)}</div></div>`;
      const pdfUrl = d.pdfBase64 ? URL.createObjectURL(b64ToBlob(d.pdfBase64, 'application/pdf')) : '';
      const pb = $('#drPdf', box); if (pb) pb.onclick = () => downloadFile(d.nomor.replace(/\//g, '-') + '.pdf', b64ToBlob(d.pdfBase64, 'application/pdf'));
      const pp = $('#drPrint', box); if (pp) pp.onclick = () => window.open(pdfUrl, '_blank');
      toast('Dokumen terbit', r.message);
    };
  },
  arsip(el, host) {
    host.innerHTML = '<div class="card pad0"><div style="padding:14px 16px"><div class="input-ic">' + icon('search') + '<input class="input" id="daQ" placeholder="Cari nomor / judul dokumen…"></div></div><div class="table-wrap"><table class="tbl cards"><thead><tr><th>Nomor</th><th>Dokumen</th><th>Terbit</th><th>Penanda tangan</th><th>Status</th><th>Berkas</th><th></th></tr></thead><tbody id="daB"><tr><td colspan="7"><div class="skel"></div></td></tr></tbody></table></div></div>';
    let rows = [];
    const draw = () => {
      const q = $('#daQ', host).value.toLowerCase();
      $('#daB', host).innerHTML = rows.filter(x => !q || (x.nomor + ' ' + x.judul).toLowerCase().indexOf(q) > -1).map(x => `<tr><td class="mono" style="font-weight:600">${esc(x.nomor)}</td><td class="c-wide"><b>${esc(x.judul)}</b><span class="sub">${esc(x.templateKode)}</span></td><td class="small">${fmtDT(x.dibuat)}</td>
        <td class="small">${x.penandatangan.map(p => esc(p.nama) + ' (' + esc(p.metode) + ')').join('<br>') || '—'}</td><td>${x.status === 'TERBIT' ? '<span class="pill soft-green">Sah</span>' : '<span class="pill soft-red">Ditarik</span>'}</td>
        <td><div class="row-wrap">${Object.keys(x.berkas).filter(k => k !== 'sumber').map(k => '<a class="btn btn-sm btn-soft" target="_blank" rel="noopener" href="' + esc(x.berkas[k].url) + '">' + k.toUpperCase() + '</a>').join('')}</div></td>
        <td>${x.status === 'TERBIT' && can('SUPERVISOR') ? '<button class="btn btn-sm btn-danger-soft" data-rv="' + esc(x.id) + '">Tarik</button>' : ''}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">Belum ada dokumen terbit.</td></tr>';
      $$('[data-rv]', host).forEach(b => b.onclick = async () => { const a = prompt('Alasan penarikan dokumen (min. 5 karakter):'); if (!a) return; const r = await api('deRevoke', { id: b.dataset.rv, alasan: a }); if (!r.success) return toast('Gagal', r.message, 'err'); toast('Ditarik', r.message); invalidate('deDocs'); this.arsip(el, host); });
    };
    $('#daQ', host).oninput = debounce(draw, 150);
    swr('deDocs', 'deDocuments', {}, d => { rows = d; draw(); }, { fresh: 30000 });
  },
  templates(el, host) {
    host.innerHTML = `<div class="grid g-main" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)"><div class="stack"><div class="card"><div class="between"><div class="h3">Template Terdaftar</div><button class="btn btn-sm btn-soft" id="dtMk">${icon('zap', 'ic-sm')}Buat Template Contoh</button></div><div id="dtList" class="stack mt12"><div class="skel"></div></div></div></div>
      <div class="stack"><div class="card"><div class="h3">Daftarkan / Pindai Ulang Template</div><div class="small ink2">Desain template di Google Docs, Sheets, atau Slides dengan placeholder <span class="code">{{KUNCI}}</span>, lalu tempel URL-nya.</div>
        <div class="stack mt12"><div class="form-grid"><div class="field"><label>Kode</label><input class="input mono" id="dtK" placeholder="ZREPORT" maxlength="20"></div><div class="field"><label>Sumber data</label><select class="select" id="dtS"></select></div></div>
        <div class="field"><label>Nama dokumen</label><input class="input" id="dtN" placeholder="Z-Report Tutup Shift"></div>
        <div class="field"><label>URL template Google</label><input class="input" id="dtU" placeholder="https://docs.google.com/document/d/…/edit"></div>
        <div class="field"><label>Format nomor</label><input class="input mono" id="dtF" placeholder="{URUT}/ZR/{OUTLET}/{BULAN}/{TAHUN}"></div>
        <div class="row-wrap">${['pdf', 'docx', 'xlsx', 'png'].map(k => '<label class="check"><input type="checkbox" data-ko="' + k + '"' + (k === 'pdf' ? ' checked' : '') + '><span>' + k.toUpperCase() + '</span></label>').join('')}</div>
        <button class="btn btn-primary" id="dtGo">${icon('scan')}Pindai Placeholder & Simpan</button></div></div>
        <div class="card"><div class="h3">Kamus Placeholder</div><div class="small ink2 mt8">Pengubah: <span class="code">|rupiah</span> <span class="code">|terbilang:rupiah</span> <span class="code">|tanggal</span> <span class="code">|tanggal:dd/MM/yyyy HH:mm</span> <span class="code">|kapital</span> <span class="code">|bawaan:teks</span>. Baris berulang: taruh <span class="code">{{#ITEM}}</span> di sel pertama baris tabel lalu <span class="code">{{ITEM.NAMA}}</span>. Bagian opsional: <span class="code">{{?CATATAN}}…{{/CATATAN}}</span>.</div>
          <div class="small mt8"><b>Sistem:</b> <span class="code">{{NOMOR}}</span> <span class="code">{{TANGGAL}}</span> <span class="code">{{QR}}</span> <span class="code">{{KODE_VERIFIKASI}}</span> <span class="code">{{INSTITUSI_NAMA}}</span> <span class="code">{{NAMA_PEJABAT_1}}</span> <span class="code">{{JABATAN_1}}</span> <span class="code">{{TTD_1}}</span></div><div id="dtDict" class="mt8"></div></div></div></div>`;
    $('#dtMk', host).onclick = () => this.samples(el);
    this.loadTpl(d => {
      $('#dtS', host).innerHTML = d.sumber.map(s => '<option value="' + s.kode + '">' + esc(s.label) + '</option>').join('');
      $('#dtDict', host).innerHTML = d.sumber.filter(s => s.kunci.length).map(s => '<div class="small mt8"><b>' + esc(s.label) + ':</b> <div class="ph-list mt8">' + s.kunci.map(k => '<span class="code">' + k + '</span>').join('') + '</div></div>').join('');
      $('#dtList', host).innerHTML = d.templates.length ? d.templates.map(t => `<div class="optrow" style="align-items:flex-start"><div class="tpl-ic">${icon(ENGINE_IC[t.engine] || 'file')}</div><div class="grow"><b>${esc(t.nama)}</b> <span class="code">${esc(t.kode)}</span><div class="small ink2">${esc(t.sumber)} · v${t.versi} · ${t.bidang.length} kolom · ${t.slotTtd.length} slot TTD · ${t.keluaran.join(', ').toUpperCase()}</div>
          <div class="row-wrap mt8"><button class="btn btn-sm btn-soft" data-ed="${esc(t.kode)}">${icon('sliders', 'ic-sm')}Atur Kolom</button><button class="btn btn-sm btn-soft" data-rs="${esc(t.kode)}">${icon('sync', 'ic-sm')}Pindai Ulang</button><a class="btn btn-sm btn-ghost" target="_blank" rel="noopener" href="${esc(t.url)}">Buka</a><button class="btn btn-sm btn-danger-soft" data-off="${esc(t.kode)}">Nonaktifkan</button></div></div></div>`).join('') : '<div class="empty small">Belum ada template. Klik “Buat Template Contoh” untuk membuat 4 template siap pakai di Drive Anda.</div>';
      $$('[data-ed]', host).forEach(b => b.onclick = () => this.editCols(el, d.templates.find(t => t.kode === b.dataset.ed)));
      $$('[data-rs]', host).forEach(b => b.onclick = () => { const t = d.templates.find(x => x.kode === b.dataset.rs); $('#dtK', host).value = t.kode; $('#dtN', host).value = t.nama; $('#dtU', host).value = t.url; $('#dtS', host).value = t.sumber; $('#dtF', host).value = t.formatNomor; $$('[data-ko]', host).forEach(i => i.checked = t.keluaran.indexOf(i.dataset.ko) > -1); $('#dtGo', host).scrollIntoView({ behavior: 'smooth', block: 'center' }); });
      $$('[data-off]', host).forEach(b => b.onclick = async () => { if (!(await confirmDialog('Nonaktifkan template?', 'Berkas master di Drive tidak dihapus.', 'Nonaktifkan', true))) return; const r = await api('deDeleteTemplate', { kode: b.dataset.off }); toast(r.success ? 'Selesai' : 'Gagal', r.message, r.success ? 'ok' : 'err'); invalidate('deTpl'); this.templates(el, host); });
    }, true);
    $('#dtGo', host).onclick = async e => {
      const btn = e.currentTarget; btn.disabled = true; btn.innerHTML = icon('sync') + 'Memindai…';
      const r = await api('deScanTemplate', { kode: $('#dtK', host).value, nama: $('#dtN', host).value, url: $('#dtU', host).value, sumber: $('#dtS', host).value, formatNomor: $('#dtF', host).value, keluaran: $$('[data-ko]', host).filter(i => i.checked).map(i => i.dataset.ko) });
      btn.disabled = false; btn.innerHTML = icon('scan') + 'Pindai Placeholder & Simpan';
      if (!r.success) return toast('Gagal memindai', r.message, 'err', 6000);
      toast('Template tersimpan', r.message + (r.data.hilang.length ? ' Kolom hilang: ' + r.data.hilang.join(', ') : ''), 'ok', 6000);
      invalidate('deTpl'); this.templates(el, host);
    };
  },
  editCols(el, t) {
    const tipe = ['teks', 'area', 'angka', 'tanggal', 'pilihan', 'daftar'];
    const m = openModal(modalHead('sliders', 'Atur Kolom — ' + t.kode, 'Label, tipe, wajib, dan pilihan untuk form isian') + `<div class="modal-b"><div class="table-wrap"><table class="tbl"><thead><tr><th>Kunci</th><th>Label</th><th>Tipe</th><th>Wajib</th><th>Opsi (pisah koma)</th></tr></thead><tbody>
      ${t.bidang.map((b, i) => '<tr><td class="mono small">' + esc(b.kunci) + (b.kategori === 'sumber' ? '<span class="sub">otomatis</span>' : '') + '</td><td><input class="input" data-i="' + i + '" data-k="label" value="' + esc(b.label) + '" style="min-height:38px"></td><td><select class="select" data-i="' + i + '" data-k="tipe" style="min-height:38px">' + tipe.map(x => '<option' + (x === b.tipe ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></td><td><input type="checkbox" data-i="' + i + '" data-k="wajib"' + (b.wajib ? ' checked' : '') + '></td><td><input class="input" data-i="' + i + '" data-k="opsi" value="' + esc((b.opsi || []).join(', ')) + '" style="min-height:38px"></td></tr>').join('')}</tbody></table></div>
      ${t.slotTtd.length ? '<div class="h3">Slot Tanda Tangan</div>' + t.slotTtd.map((s, i) => '<div class="row-wrap"><span class="code">Slot ' + s.slot + '</span><input class="input" data-s="' + i + '" data-k="label" value="' + esc(s.label) + '" style="width:200px;min-height:38px"><select class="select" data-s="' + i + '" data-k="peranMin" style="width:auto;min-height:38px">' + ['SUPERVISOR', 'OWNER', 'KASIR'].map(r => '<option' + (r === s.peranMin ? ' selected' : '') + '>' + r + '</option>').join('') + '</select><label class="check small"><input type="checkbox" data-s="' + i + '" data-k="wajibPin"' + (s.wajibPin !== false ? ' checked' : '') + '><span>Wajib PIN</span></label></div>').join('') : ''}</div>
      <div class="modal-f"><button class="btn btn-secondary grow" data-close>Batal</button><button class="btn btn-primary grow" id="ecOk">Simpan Setelan</button></div>`);
    $('#ecOk', m.el).onclick = async () => {
      const bidang = JSON.parse(JSON.stringify(t.bidang)), slot = JSON.parse(JSON.stringify(t.slotTtd));
      $$('[data-i]', m.el).forEach(i => { const b = bidang[+i.dataset.i], k = i.dataset.k; b[k] = k === 'wajib' ? i.checked : k === 'opsi' ? i.value.split(',').map(x => x.trim()).filter(Boolean) : i.value; });
      $$('[data-s]', m.el).forEach(i => { const s = slot[+i.dataset.s], k = i.dataset.k; s[k] = k === 'wajibPin' ? i.checked : i.value; });
      const r = await api('deSaveTemplate', { kode: t.kode, bidang, slotTtd: slot });
      if (!r.success) return toast('Gagal', r.message, 'err');
      invalidate('deTpl'); m.close(); toast('Tersimpan', r.message); this.show(el);
    };
  },
  async samples(el) {
    toast('Membuat template…', 'Membuat 4 template di folder Drive “Template Dokumen” (±30 detik).', 'ok', 5000);
    const r = await api('deCreateSamples', {});
    if (!r.success) return toast('Gagal', r.message, 'err', 6000);
    toast('Template siap', r.message); invalidate('deTpl'); this.show(el);
  }
});
function deFieldHtml(b) {
  const id = 'df_' + b.kunci, lbl = '<label for="' + id + '">' + esc(b.label) + (b.wajib ? ' <span class="red">*</span>' : '') + (b.bantu ? ' <span class="hint">' + esc(b.bantu) + '</span>' : '') + '</label>';
  let inp;
  if (b.tipe === 'area' || b.tipe === 'naskah') inp = '<textarea class="textarea" id="' + id + '"></textarea>';
  else if (b.tipe === 'pilihan') inp = '<select class="select" id="' + id + '">' + (b.opsi || []).map(o => '<option>' + esc(o) + '</option>').join('') + '</select>';
  else if (b.tipe === 'daftar') inp = '<div class="table-wrap"><table class="tbl" id="dl_' + b.kunci + '"><thead><tr>' + (b.kolom || []).map(k => '<th>' + esc(k.label) + '</th>').join('') + '</tr></thead><tbody><tr>' + (b.kolom || []).map(k => '<td style="padding:6px"><input class="input" data-col="' + esc(k.kunci) + '" ' + (k.tipe === 'angka' ? 'inputmode="numeric"' : '') + ' style="min-height:38px"></td>').join('') + '</tr></tbody></table></div><button type="button" class="btn btn-sm btn-soft" data-addrow="' + b.kunci + '">' + icon('plus', 'ic-sm') + 'Tambah baris</button>';
  else inp = '<input class="input" id="' + id + '" type="' + ({ tanggal: 'date', angka: 'number' }[b.tipe] || 'text') + '">';
  return '<div class="field">' + lbl + inp + '</div>';
}
function deCollect(fields, box) {
  const o = {};
  fields.forEach(b => {
    if (b.tipe === 'daftar') { const t = $('#dl_' + b.kunci, box); if (!t) return; o[b.kunci] = $$('tbody tr', t).map(tr => { const r = {}; $$('[data-col]', tr).forEach(i => { r[i.dataset.col] = i.inputMode === 'numeric' && i.value ? num(i.value) : i.value; }); return r; }).filter(r => Object.values(r).some(v => v !== '')); return; }
    const el = $('#df_' + b.kunci, box); if (!el) return;
    o[b.kunci] = b.tipe === 'angka' ? (el.value === '' ? '' : Number(el.value)) : el.value.trim();
  });
  return o;
}

// ============================================================ MIGRASI DATA (gas-migrasi-database)
const MIG_SHEETS = [['Users', 'Staf / akun kasir', true], ['Produk', 'Produk & stok', true], ['Shift', 'Riwayat shift', false], ['Transaksi', 'Riwayat transaksi', false], ['StokLog', 'Riwayat mutasi stok', false]];
registerPage('migrasi', {
  auth: 'OWNER', title: 'Migrasi Data',
  template: () => `<div class="page-head"><div><h1 class="h1">Migrasi Data dari App POS Lama</h1><p>Pindahkan staf, produk, shift, dan riwayat transaksi dari spreadsheet app lama ke app ini. App lama <b>hanya dibaca</b>, tidak pernah diubah. Aman diulang — data yang sudah ada tidak digandakan.</p></div></div>
  <div class="grid g-main" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)">
    <div class="stack"><div class="card"><div class="card-h"><div class="row" style="align-items:flex-start"><span class="sec-num">01</span><div><div class="h3">Sumber Spreadsheet Lama</div><div class="small ink2">Harus milik / dibagikan ke akun Google pemilik backend ini</div></div></div></div>
      <div class="field"><label>URL atau ID spreadsheet app lama</label><input class="input" id="mgSrc" placeholder="https://docs.google.com/spreadsheets/d/…/edit"></div></div>
      <div class="card"><div class="card-h"><div class="row" style="align-items:flex-start"><span class="sec-num">02</span><div><div class="h3">Pilih Data & Peta Sheet</div><div class="small ink2">Nama sheet sumber dapat dipilih setelah Pindai. Header dibaca berdasarkan nama (alias otomatis).</div></div></div></div>
        <div class="stack" id="mgSheets">${MIG_SHEETS.map(s => `<div class="optrow"><label class="check grow"><input type="checkbox" data-s="${s[0]}" ${s[2] ? 'checked' : ''}><span><b>${s[0]}</b><div class="small ink2">${s[1]}</div></span></label><select class="select" data-map="${s[0]}" style="width:200px;min-height:40px"><option value="${s[0]}">${s[0]}</option></select></div>`).join('')}</div>
        <label class="check mt12"><input type="checkbox" id="mgOw"><span><b>Timpa data yang sudah ada</b> <span class="small ink2">— perbarui harga/stok/nama produk dari app lama (bawaan: mati, keputusan di app baru tidak ditimpa)</span></span></label>
        <div class="field mt12"><label>Peta kategori lama → baru <span class="hint">satu per baris, mis. Seblak Basah=Seblak Kuah</span></label><textarea class="textarea" id="mgKat" placeholder="Seblak Basah=Seblak Kuah&#10;Es=Minuman" style="min-height:70px"></textarea></div>
        <div class="row mt12"><button class="btn btn-secondary btn-lg grow" id="mgScan">${icon('search')}Pindai (Dry-run)</button><button class="btn btn-primary btn-lg grow" id="mgRun">${icon('database')}Jalankan Import</button></div></div>
      <div id="mgRes"></div></div>
    <div class="stack"><div class="card"><div class="h3">${icon('sheet')} Import dari CSV</div><div class="small ink2 mt8">Untuk data dari luar (ekspor marketplace / POS lain). Pemisah koma atau titik koma.</div>
      <div class="form-grid mt12"><div class="field"><label>Target</label><select class="select" id="csT"><option>Produk</option><option>Users</option></select></div><div class="field"><label>Berkas CSV</label><input type="file" accept=".csv,text/csv" id="csF" class="input" style="padding-top:12px"></div></div>
      <label class="check mt8"><input type="checkbox" id="csOw"><span class="small">Timpa data yang sudah ada</span></label>
      <div class="row-wrap mt12"><button class="btn btn-sm btn-soft" id="csTpl">${icon('download', 'ic-sm')}Unduh template CSV</button><button class="btn btn-sm btn-secondary" id="csScan">Pindai</button><button class="btn btn-sm btn-primary" id="csRun">Import CSV</button></div><div id="csRes" class="mt12"></div></div>
      <div class="card"><div class="h3">Checklist Cutover</div><ol class="small" style="padding-left:18px;line-height:22px;margin:10px 0 0">
        <li>Pasang app baru → login Owner → <b>Pindai</b> → <b>Jalankan Import</b>.</li><li>Periksa Pengguna, Produk, foto, dan pengaturan. Uji 1 transaksi dengan akun kasir.</li>
        <li>Atur PIN staf yang belum punya PIN (menu Pengguna).</li><li>Tepat sebelum pindah: <b>Jalankan Import sekali lagi</b> (delta sync) untuk menangkap data baru di app lama.</li>
        <li>Umumkan alamat baru ke staf, lalu arsipkan deployment lama (datanya tetap aman).</li></ol>
        <div class="note small mt12">${icon('info', 'ic-sm')} Sesi login lama tidak ikut pindah — staf cukup login ulang. Foto Drive tetap terbaca bila backend memakai akun Google yang sama dengan app lama.</div></div></div></div>`,
  init(el) {
    const params = dry => ({ source: $('#mgSrc', el).value.trim(), sheets: $$('[data-s]', el).filter(i => i.checked).map(i => i.dataset.s), map: Object.fromEntries($$('[data-map]', el).map(s => [s.dataset.map, s.value])), overwrite: $('#mgOw', el).checked, kategoriMap: $('#mgKat', el).value });
    const run = async (dry, btn) => {
      const p = params(dry);
      if (!p.source) return toast('Sumber kosong', 'Tempel URL spreadsheet app lama.', 'warn');
      if (!dry && !(await confirmDialog('Jalankan import?', 'Data dari app lama akan ditambahkan ke database app ini. Aman diulang (tidak menggandakan).', 'Jalankan'))) return;
      btn.disabled = true; const old = btn.innerHTML; btn.innerHTML = icon('sync') + (dry ? 'Memindai…' : 'Mengimpor…');
      const r = await api(dry ? 'importScan' : 'importRun', p);
      btn.disabled = false; btn.innerHTML = old;
      if (!r.success) return toast('Gagal', r.message, 'err', 6000);
      this.result(el, r.data);
      if (!dry) { invalidate('boot', 'dash'); refreshBoot(); }
      toast(dry ? 'Pindai selesai' : 'Import selesai', r.message);
    };
    $('#mgScan', el).onclick = e => run(true, e.currentTarget);
    $('#mgRun', el).onclick = e => run(false, e.currentTarget);
    $('#csTpl', el).onclick = () => downloadFile('template-' + $('#csT', el).value.toLowerCase() + '.csv', $('#csT', el).value === 'Produk'
      ? toCsv([['sku', 'barcode', 'nama', 'kategori', 'harga', 'hpp', 'stok', 'minStok', 'levelPedas', 'deskripsi'], ['SKU-SBK-101', '8990000000001', 'Seblak Original', 'Seblak Kuah', 15000, 6000, 40, 10, '0-5', 'Kerupuk, makaroni, kuah kencur']])
      : toCsv([['email', 'nama', 'kode', 'role', 'pin'], ['kasir05@dapoermitoha.internal', 'Rina', 'CS-0050', 'KASIR', '123456']]), 'text/csv');
    const csv = async (dry, btn) => {
      const f = $('#csF', el).files[0]; if (!f) return toast('Pilih berkas CSV', '', 'warn');
      btn.disabled = true;
      const r = await api('importCsv', { target: $('#csT', el).value, csv: await f.text(), overwrite: $('#csOw', el).checked, dryRun: dry });
      btn.disabled = false;
      if (!r.success) return toast('Gagal', r.message, 'err');
      const x = r.data.report;
      $('#csRes', el).innerHTML = '<div class="kv small"><span>Baris CSV</span><span>' + x.source + '</span><span>Ditambah</span><span class="green">' + x.inserted + '</span><span>Diperbarui</span><span>' + x.updated + '</span><span>Dilewati</span><span>' + x.skipped + '</span><span>Kolom dikenali</span><span class="mono">' + esc(x.kolom.join(', ')) + '</span></div>' + (dry ? '<div class="pill soft-yellow mt8">Dry-run — belum ditulis</div>' : '');
      if (!dry) { invalidate('boot'); refreshBoot(); }
    };
    $('#csScan', el).onclick = e => csv(true, e.currentTarget);
    $('#csRun', el).onclick = e => csv(false, e.currentTarget);
  },
  result(el, d) {
    (d.sheetsSumber || []).length && $$('[data-map]', el).forEach(s => { const cur = s.value; s.innerHTML = d.sheetsSumber.map(x => '<option' + (x.nama === cur ? ' selected' : '') + '>' + esc(x.nama) + '</option>').join(''); if (!d.sheetsSumber.some(x => x.nama === cur)) { const guess = d.sheetsSumber.find(x => x.nama.toLowerCase().indexOf(s.dataset.map.toLowerCase().slice(0, 4)) > -1); if (guess) s.value = guess.nama; } });
    const rows = Object.keys(d.report).map(k => { const x = d.report[k]; return '<tr><td><b>' + k + '</b><span class="sub">← ' + esc(x.sumber) + '</span></td><td class="num">' + x.source + '</td><td class="num green">' + x.inserted + '</td><td class="num">' + x.updated + '</td><td class="num muted">' + x.skipped + '</td><td class="small">' + Object.keys(x.kolom || {}).map(f => '<span class="code">' + esc(f) + '←' + esc(x.kolom[f]) + '</span>').join(' ') + '</td></tr>'; }).join('');
    $('#mgRes', el).innerHTML = `<div class="card pad0"><div class="between" style="padding:16px 20px"><div><div class="h3">${d.dryRun ? 'Hasil Pindai (belum ditulis)' : 'Hasil Import'}</div><div class="small ink2">Sumber: ${esc(d.source.nama)}</div></div><span class="pill ${d.dryRun ? 'soft-yellow' : 'soft-green'}">${d.dryRun ? 'DRY-RUN' : 'SELESAI'}</span></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Data</th><th class="num">Di app lama</th><th class="num">Ditambah</th><th class="num">Diperbarui</th><th class="num">Dilewati</th><th>Kolom terdeteksi</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${d.warnings.length ? '<div style="padding:14px 20px" class="stack">' + d.warnings.map(w => '<div class="pill soft-orange" style="height:auto;padding:6px 10px;white-space:normal">' + icon('alert', 'ic-sm') + esc(w) + '</div>').join('') + '</div>' : ''}
      <div class="small ink2" style="padding:12px 20px;background:var(--surface-low)">Sheet di app lama: ${(d.sheetsSumber || []).map(s => esc(s.nama) + ' (' + s.baris + ')').join(', ')}</div></div>`;
  }
});

// ============================================================ PENGGUNA
registerPage('pengguna', {
  auth: 'OWNER', title: 'Pengguna',
  template: () => `<div class="page-head"><div><h1 class="h1">Pengguna & Hak Akses</h1><p>Kelola akun kasir, supervisor, dan owner. Login memakai email + PIN 6 angka (atau Google Workspace bila diaktifkan).</p></div><button class="btn btn-primary btn-lg" id="usAdd">${icon('plus')}Tambah Staf</button></div>
    <div class="card pad0"><div class="table-wrap"><table class="tbl cards"><thead><tr><th>Nama</th><th>Email</th><th>Kode</th><th>Peran</th><th>Status</th><th>Login terakhir</th><th></th></tr></thead><tbody id="usB"><tr><td colspan="7"><div class="skel"></div></td></tr></tbody></table></div></div>
    <div class="grid g3 mt16"><div class="card soft"><b>Kasir</b><div class="small ink2 mt8">Dashboard, transaksi, struk, buka/tutup shift sendiri, menerbitkan dokumen.</div></div><div class="card soft"><b>Supervisor</b><div class="small ink2 mt8">+ Produk & stok, laporan, otorisasi void & tutup shift (PIN), penanda tangan dokumen.</div></div><div class="card soft"><b>Owner</b><div class="small ink2 mt8">+ Pengguna, pengaturan, migrasi data, template dokumen.</div></div></div>`,
  init(el) { $('#usAdd', el).onclick = () => this.edit(el, null); },
  show(el) {
    swr('users', 'users', {}, rows => {
      el._rows = rows;
      $('#usB', el).innerHTML = rows.map((u, i) => `<tr><td><div class="row"><div class="avatar sm">${esc(initials(u.nama))}</div><b>${esc(u.nama)}</b></div></td><td class="small" data-l="Email">${esc(u.email)}</td><td class="mono">${esc(u.kode)}</td>
        <td><span class="pill ${u.role === 'OWNER' ? 'red' : u.role === 'SUPERVISOR' ? 'orange' : 'yellow'}">${u.role}</span></td><td>${u.aktif ? '<span class="pill soft-green">Aktif</span>' : '<span class="pill soft-red">Nonaktif</span>'}${u.adaPin ? '' : ' <span class="pill soft-orange">Tanpa PIN</span>'}</td>
        <td class="small">${u.lastLogin ? fmtDT(u.lastLogin) : '—'}</td><td><button class="btn btn-sm btn-soft" data-e="${i}">${icon('pencil', 'ic-sm')}Ubah</button></td></tr>`).join('');
      $$('[data-e]', el).forEach(b => b.onclick = () => this.edit(el, rows[+b.dataset.e]));
    }, { fresh: 30000 });
  },
  edit(el, u) {
    const m = openModal(modalHead('user', u ? 'Ubah Staf' : 'Tambah Staf', u ? esc(u.email) : '') + `<div class="modal-b"><div class="form-grid">
      <div class="field full"><label>Email</label><input class="input" id="ueE" type="email" value="${esc(u ? u.email : '')}" ${u ? 'readonly' : ''} placeholder="kasir02@dapoermitoha.internal"></div>
      <div class="field"><label>Nama</label><input class="input" id="ueN" value="${esc(u ? u.nama : '')}"></div><div class="field"><label>Kode staf</label><input class="input mono" id="ueK" value="${esc(u ? u.kode : '')}" placeholder="CS-0043"></div>
      <div class="field"><label>Peran</label><select class="select" id="ueR">${['KASIR', 'SUPERVISOR', 'OWNER'].map(r => '<option' + (u && u.role === r ? ' selected' : '') + '>' + r + '</option>').join('')}</select></div>
      <div class="field"><label>${u ? 'PIN baru' : 'PIN awal'} <span class="hint">${u ? 'kosongkan = tetap' : '6 angka'}</span></label><input class="input mono" id="ueP" inputmode="numeric" maxlength="6"></div>
      <label class="check full"><input type="checkbox" id="ueA" ${!u || u.aktif ? 'checked' : ''}><span>Akun aktif (menonaktifkan / mengganti PIN akan mengeluarkan semua sesi staf ini)</span></label></div></div>
      <div class="modal-f"><button class="btn btn-secondary grow" data-close>Batal</button><button class="btn btn-primary grow" id="ueOk">Simpan</button></div>`, { cls: 'sm' });
    $('#ueOk', m.el).onclick = async e => {
      e.currentTarget.disabled = true;
      const r = await api('saveUser', { email: $('#ueE', m.el).value, nama: $('#ueN', m.el).value, kode: $('#ueK', m.el).value, role: $('#ueR', m.el).value, pin: $('#ueP', m.el).value.trim(), aktif: $('#ueA', m.el).checked });
      e.currentTarget.disabled = false;
      if (!r.success) return toast('Gagal', r.message, 'err');
      m.close(); toast('Tersimpan', r.message); invalidate('users'); this.show(el); refreshBoot();
    };
  }
});

// ============================================================ PENGATURAN
const SET_GROUPS = [
  ['Outlet', 'monitor', [['OUTLET_NAMA', 'Nama outlet'], ['OUTLET_TAGLINE', 'Tagline'], ['OUTLET_CABANG', 'Nama cabang'], ['OUTLET_KODE', 'Kode outlet'], ['OUTLET_ALAMAT', 'Alamat', 1], ['OUTLET_TELP', 'Telepon / WA'], ['TERMINAL', 'ID terminal kasir']]],
  ['Pajak, Target & Kas', 'chart', [['PPN_AKTIF', 'PPN aktif (TRUE/FALSE)'], ['PPN_PERSEN', 'PPN (%)'], ['TARGET_HARIAN', 'Target omzet harian (Rp)'], ['TARGET_BULANAN', 'Target omzet bulanan (Rp)'], ['MODAL_AWAL_DEFAULT', 'Modal awal laci bawaan (Rp)'], ['KATEGORI', 'Kategori menu (pisah koma)', 1]]],
  ['Struk', 'receipt', [['STRUK_FOOTER', 'Salam penutup'], ['STRUK_CATATAN', 'Catatan kebijakan'], ['STRUK_WIFI', 'Info WiFi tamu']]],
  ['Integrasi & Keamanan', 'shield', [['EMAIL_DOMAIN', 'Domain email wajib (mis. dapoermitoha.internal)'], ['GOOGLE_CLIENT_ID', 'Google OAuth Client ID (login Google)'], ['VERIFY_BASE_URL', 'URL frontend untuk QR verifikasi'], ['SESI_JAM', 'Lama sesi login (jam)']]]
];
registerPage('pengaturan', {
  auth: 'OWNER', title: 'Pengaturan',
  template: () => `<div class="page-head"><div><h1 class="h1">Pengaturan Outlet</h1><p>Tersimpan di sheet <span class="code">AppConfig</span> dan langsung berlaku di semua terminal setelah sinkron.</p></div><button class="btn btn-primary btn-lg" id="stSave">${icon('check')}Simpan Pengaturan</button></div>
    <div class="grid g2" id="stGrid"><div class="card"><div class="skel" style="height:200px"></div></div></div>
    <div class="card mt16"><div class="between"><div class="h3">${icon('zap')} Diagnostik Performa</div><button class="btn btn-sm btn-soft" id="stPerf">Segarkan</button></div><div class="small ink2 mt8">Waktu 30 panggilan server terakhir dari perangkat ini. <b>Server</b> besar → beban Sheets; <b>Jaringan</b> besar → koneksi / cold start.</div><div class="table-wrap mt12" id="stPerfT"></div></div>`,
  init(el) {
    $('#stSave', el).onclick = async e => {
      const d = {}; $$('[data-cfg]', el).forEach(i => d[i.dataset.cfg] = i.value.trim());
      e.currentTarget.disabled = true; const r = await api('saveSettings', d); e.currentTarget.disabled = false;
      if (!r.success) return toast('Gagal', r.message, 'err');
      AppState.config = r.data; invalidate('settings'); refreshBoot(); renderShell(); route(); toast('Tersimpan', r.message);
    };
    $('#stPerf', el).onclick = () => this.perf(el);
  },
  show(el) {
    swr('settings', 'settings', {}, c => {
      $('#stGrid', el).innerHTML = SET_GROUPS.map(g => '<div class="card"><div class="h3">' + icon(g[1]) + ' ' + g[0] + '</div><div class="stack mt12">' + g[2].map(f => '<div class="field"><label>' + f[1] + ' <span class="hint mono">' + f[0] + '</span></label>' +
        (f[2] ? '<textarea class="textarea" data-cfg="' + f[0] + '" style="min-height:64px">' + esc(c[f[0]]) + '</textarea>' : '<input class="input" data-cfg="' + f[0] + '" value="' + esc(c[f[0]]) + '">') + (f[0] === 'VERIFY_BASE_URL' ? '<button class="btn btn-sm btn-ghost" type="button" id="stUrl">Gunakan alamat ini: ' + esc(location.href.split('#')[0]) + '</button>' : '') + '</div>').join('') + '</div></div>').join('');
      const b = $('#stUrl', el); if (b) b.onclick = () => { $('[data-cfg="VERIFY_BASE_URL"]', el).value = location.href.split('#')[0]; };
    }, { fresh: 0 });
    this.perf(el);
  },
  perf(el) {
    const rows = Perf.rows.slice(-30).reverse();
    $('#stPerfT', el).innerHTML = rows.length ? '<table class="tbl"><thead><tr><th>Aksi</th><th class="num">Total</th><th class="num">Server</th><th class="num">Jaringan</th><th>Waktu</th></tr></thead><tbody>' + rows.map(r => '<tr><td class="mono">' + esc(r.action) + '</td><td class="num ' + (r.total > 3000 ? 'red' : '') + '">' + r.total + ' ms</td><td class="num">' + (r.server == null ? '—' : r.server + ' ms') + '</td><td class="num">' + (r.net == null ? '—' : r.net + ' ms') + '</td><td class="small">' + fmtTime(r.at, true) + '</td></tr>').join('') + '</tbody></table>' : '<div class="empty small">Belum ada panggilan.</div>';
  }
});
