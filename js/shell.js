/* shell.js — sidebar, topbar, navigasi HP, jam, notifikasi, pintasan keyboard, pemindai barcode, boot */
'use strict';
const NAV = [
  { p: 'dashboard', label: 'Dashboard', ic: 'dashboard', r: 'KASIR' },
  { p: 'kasir', label: 'Kasir / Transaksi', ic: 'register', r: 'KASIR', m: 'Kasir' },
  { p: 'produk', label: 'Produk & Stok', ic: 'box', r: 'SUPERVISOR', m: 'Produk' },
  { p: 'laporan', label: 'Laporan', ic: 'chart', r: 'SUPERVISOR', m: 'Laporan' },
  { p: 'struk', label: 'Struk & Cetak', ic: 'receipt', r: 'KASIR', m: 'Struk' },
  { p: 'shift', label: 'Tutup Shift', ic: 'lockclock', r: 'KASIR', m: 'Shift' },
  { sec: 'Dokumen & Admin' },
  { p: 'dokumen', label: 'Dokumen Cetak', ic: 'file', r: 'KASIR' },
  { p: 'migrasi', label: 'Migrasi Data', ic: 'database', r: 'OWNER' },
  { p: 'pengguna', label: 'Pengguna', ic: 'users', r: 'OWNER' },
  { p: 'pengaturan', label: 'Pengaturan', ic: 'settings', r: 'OWNER' }
];

function renderShell() {
  const u = AppState.user || {}, cfg = AppState.config || {};
  const items = NAV.filter(n => n.sec || can(n.r));
  const navHtml = items.map(n => n.sec ? '<div class="nav-sec">' + n.sec + '</div>' :
    '<a href="#/' + n.p + '" data-nav="' + n.p + '" title="' + n.label + '">' + icon(n.ic) + '<span>' + n.label + '</span></a>').join('');
  $('#shell').innerHTML =
    '<aside class="sidebar">' +
      '<div class="brand"><div class="brand-logo">' + icon('flame') + '</div><div class="brand-txt"><div class="brand-name">' + esc(cfg.OUTLET_NAMA || 'DapoerMitoha') + '</div><div class="brand-sub">' + esc(cfg.OUTLET_TAGLINE || 'Kuliner Seblak Asli') + '</div></div></div>' +
      '<div class="brand-tags"><span class="tag">POS CLOUD</span><span class="tag mono">v' + esc(cfg.VERSION || '2.4') + '</span>' + (DEMO ? '<span class="tag" style="background:var(--tertiary)">DEMO</span>' : '') + '</div>' +
      '<nav class="nav">' + navHtml + '</nav>' +
      '<div class="side-user"><div class="avatar">' + icon('user') + '</div><div class="who"><b>' + esc(u.nama) + ' (' + esc(u.kode || u.role) + ')</b><span id="sideShift">' + shiftLabel() + '</span></div>' +
      '<button class="icon-btn" id="btnLogout" title="Keluar">' + icon('logout') + '</button></div>' +
    '</aside>' +
    '<header class="topbar">' +
      '<span class="chip hide-sm">' + icon('monitor', 'ic-sm') + '<span class="mono">#' + esc(cfg.TERMINAL || 'T-01') + '</span></span>' +
      '<button class="chip" id="shiftChip"></button>' +
      '<span class="chip hide-md hide-sm" id="scanChip">' + icon('scan', 'ic-sm') + 'Scanner Aktif</span>' +
      '<span class="grow"></span>' +
      '<span class="clock">' + icon('clock') + '<span id="clockT">--:--:--</span><span class="hide-sm">WIB</span></span>' +
      '<span class="chip sync hide-sm" id="syncChip">' + icon('cloud') + '<span class="lbl">Tersinkron</span></span>' +
      '<button class="icon-btn hide-sm" id="btnHelp" title="Bantuan & pintasan">' + icon('help') + '</button>' +
      '<button class="icon-btn" id="btnBell" title="Notifikasi">' + icon('bell') + '<span class="dot" id="bellDot" hidden></span></button>' +
      '<button class="avatar sm" id="btnAvatar" style="border:0" title="Akun">' + esc(initials(u.nama)) + '</button>' +
    '</header>' +
    '<main id="main" class="main"></main>' +
    '<nav class="bottom-nav">' +
      ['dashboard', 'kasir', 'struk', 'shift'].map(p => { const n = NAV.find(x => x.p === p); return '<a href="#/' + p + '" data-nav="' + p + '">' + icon(n.ic) + '<span>' + (n.m || n.label) + '</span></a>'; }).join('') +
      '<a href="javascript:void 0" id="btnMore">' + icon('menu') + '<span>Lainnya</span></a>' +
    '</nav>';
  $('#btnLogout').onclick = logout;
  $('#btnHelp').onclick = showHelp;
  $('#btnBell').onclick = showNotif;
  $('#btnAvatar').onclick = e => popMenu(e.currentTarget, [
    { icon: 'key', label: 'Ganti PIN saya', run: changePinDialog },
    { icon: 'help', label: 'Bantuan & pintasan', run: showHelp },
    { icon: 'logout', label: 'Keluar', run: logout }
  ]);
  $('#btnMore').onclick = e => popMenu(e.currentTarget, NAV.filter(n => !n.sec && can(n.r) && ['dashboard', 'kasir', 'struk', 'shift'].indexOf(n.p) < 0)
    .map(n => ({ icon: n.ic, label: n.label, run: () => go(n.p) })).concat([{ icon: 'logout', label: 'Keluar', run: logout }]));
  $('#shiftChip').onclick = () => go('shift');
  updateShiftChip();
  updateBell();
  setSync(0);
  tickClock();
}
function shiftLabel() { const s = AppState.shift; return s ? 'Online · ' + esc(s.id.replace(/^SHF-\d{8}-/, 'Shift #')) : 'Shift belum dibuka'; }
function updateShiftChip() {
  const c = $('#shiftChip'); if (!c) return;
  const s = AppState.shift;
  c.className = 'chip ' + (s ? 'yellow' : 'ghost');
  c.innerHTML = '<span class="dotc" style="color:' + (s ? '#5b4300' : 'var(--muted)') + '"></span>' + (s ? (shiftNama(s.buka) + ' ' + s.id.replace(/^SHF-\d{8}-/, '#')) : 'Buka Shift');
  const sd = $('#sideShift'); if (sd) sd.innerHTML = shiftLabel();
}
function shiftNama(iso) { const h = Number(fmtParts(iso || new Date(), { hour: '2-digit', hour12: false })); return h < 11 ? 'Shift Pagi' : h < 15 ? 'Shift Siang' : h < 18 ? 'Shift Sore' : 'Shift Malam'; }
function tickClock() { const t = $('#clockT'); if (t) t.textContent = fmtTime(new Date(), true); }
setInterval(() => { tickClock(); $$('[data-live-clock]').forEach(e => e.textContent = fmtTime(new Date(), e.dataset.liveClock === 's')); }, 1000);

function lowStock() { return (AppState.products || []).filter(p => p.aktif && p.stok !== null && p.stok <= (p.minStok || 10)); }
function updateBell() { const d = $('#bellDot'); if (d) d.hidden = !lowStock().length; }
function showNotif() {
  const low = lowStock().sort((a, b) => a.stok - b.stok);
  const m = openModal(modalHead('bell', 'Notifikasi', low.length + ' peringatan stok') + '<div class="modal-b">' +
    (low.length ? low.map(p => '<div class="between optrow"><div><b>' + esc(p.nama) + '</b><div class="small muted mono">' + esc(p.sku) + '</div></div><span class="pill ' + (p.stok === 0 ? 'soft-red' : 'soft-orange') + '">' + (p.stok === 0 ? 'Habis' : 'Sisa ' + p.stok) + '</span></div>').join('')
      : '<div class="empty">' + icon('checkc') + '<div>Semua stok aman.</div></div>') +
    '</div>' + (can('SUPERVISOR') ? '<div class="modal-f"><button class="btn btn-primary btn-block" id="goStok">' + icon('box') + 'Kelola Stok</button></div>' : ''), { cls: 'sm' });
  const b = $('#goStok', m.el); if (b) b.onclick = () => { m.close(); go('produk'); };
}
function showHelp() {
  const rows = [['F2', 'Fokus pencarian / pemindai (Kasir) · Transaksi baru (Struk)'], ['Ctrl + K', 'Cari menu'], ['F4', 'Bayar QRIS instan'], ['F8', 'Bayar sekarang / konfirmasi'], ['Enter', 'Konfirmasi pembayaran'], ['Esc', 'Tutup jendela / kembali'], ['Ctrl + P', 'Cetak struk (halaman Struk)']];
  openModal(modalHead('keyboard', 'Bantuan & Pintasan', 'Pemindai barcode USB/Bluetooth langsung bekerja di layar Kasir') + '<div class="modal-b"><div class="kv">' +
    rows.map(r => '<span><span class="kbd" style="background:var(--surface-2)">' + r[0] + '</span></span><span style="text-align:left;font-weight:500">' + r[1] + '</span>').join('') + '</div>' +
    '<div class="note small"><b>Performa:</b> ketik <span class="code">Perf.table()</span> di Console untuk melihat waktu setiap panggilan server (total vs server).</div></div>', { cls: 'sm' });
}
function changePinDialog() {
  const m = openModal(modalHead('key', 'Ganti PIN Saya') + '<div class="modal-b">' +
    '<div class="field"><label>PIN lama</label><input class="input mono" id="pinOld" type="password" inputmode="numeric" maxlength="6"></div>' +
    '<div class="field"><label>PIN baru <span class="hint">6 angka</span></label><input class="input mono" id="pinNew" type="password" inputmode="numeric" maxlength="6"></div></div>' +
    '<div class="modal-f"><button class="btn btn-secondary grow" data-close>Batal</button><button class="btn btn-primary grow" id="pinSave">Simpan PIN</button></div>', { cls: 'sm' });
  $('#pinSave', m.el).onclick = async e => {
    e.currentTarget.disabled = true;
    const r = await api('changePin', { pinLama: $('#pinOld', m.el).value, pinBaru: $('#pinNew', m.el).value });
    e.currentTarget.disabled = false;
    if (r.success) { m.close(); toast('PIN diganti', r.message); } else toast('Gagal', r.message, 'err');
  };
}
async function logout() {
  if (AppState.shift && !(await confirmDialog('Keluar dari kasir?', 'Shift Anda masih aktif. Anda dapat login kembali untuk melanjutkan shift yang sama.', 'Keluar'))) return;
  clearSession(); resetPages(); $('#shell').innerHTML = ''; go('login');
}

// ---------------------------------------------------------------- pintasan keyboard & pemindai
let scanBuf = '', scanT = 0;
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select';
  if (e.key === 'Escape' && _modals.length) { const m = _modals[_modals.length - 1]; if (!m.opt.sticky) m.close(); return; }
  const page = _current && Pages[_current];
  if (page && page.keys && page.keys(e, typing) === false) { e.preventDefault(); return; }
  // pemindai barcode (keyboard wedge): karakter beruntun cepat diakhiri Enter
  if (!typing && _current === 'kasir') {
    const now = Date.now();
    if (now - scanT > 60) scanBuf = '';
    scanT = now;
    if (e.key === 'Enter' && scanBuf.length >= 5) { e.preventDefault(); const code = scanBuf; scanBuf = ''; window.onBarcode && window.onBarcode(code); return; }
    if (e.key.length === 1) scanBuf += e.key;
  }
});
addEventListener('online', () => { AppState.online = true; setSync(0); toast('Kembali online', 'Koneksi pulih.'); });
addEventListener('offline', () => { AppState.online = false; setSync(0); toast('Offline', 'Data tampil dari cache. Transaksi menunggu koneksi.', 'warn'); });
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (hiddenAt && Date.now() - hiddenAt > 120000) { warmUpServer(); refreshBoot(); }
});

// ---------------------------------------------------------------- boot
async function refreshBoot() {
  if (!AppState.token) return;
  const r = await api('bootstrap');
  if (r.success) { applyBoot(r.data); updateShiftChip(); updateBell(); }
}
function afterLogin(data, remember) {
  AppState.token = data.token; AppState.exp = data.exp;
  applyBoot(data.boot);
  saveSession(remember);
  resetPages();
  renderShell();
  prefetch();
}
function boot() {
  warmUpServer();
  const pub = /^#\/v\//.test(location.hash);
  if (loadSession()) {
    const cached = Store.get(userKey('boot'), null);
    if (cached) applyBoot(cached.data);
    renderShell();
    route();
    if (!pub) { refreshBoot(); prefetch(); }
  } else route();
  $('#splash') && $('#splash').remove();
}
document.addEventListener('DOMContentLoaded', boot);
