/* ==========================================================================
   core.js — fondasi SPA (gas-instant-ux-pro)
   api() timeout+retry+reqId · swr() cache per user · router hash · UI helper
   ========================================================================== */
'use strict';
const CFG = window.APP_CONFIG || {};
const GAS_URL = String(CFG.GAS_URL || '').trim();
const DEMO = !GAS_URL || /[?&]demo=1/.test(location.search);
const TZ = 'Asia/Jakarta';

// ---------------------------------------------------------------- utilitas
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = Number(String(v === undefined || v === null ? '' : v).replace(/[^\d.\-]/g, '')); return isNaN(n) ? 0 : n; };
const rpn = n => (n < 0 ? '-' : '') + String(Math.round(Math.abs(Number(n) || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const rp = n => (n < 0 ? '-Rp ' : 'Rp ') + rpn(Math.abs(n));
const rpShort = n => { n = Number(n) || 0; if (Math.abs(n) >= 1e6) return 'Rp ' + (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace('.', ',').replace(/,?0+$/, '') + 'jt'; if (Math.abs(n) >= 1e3) return 'Rp ' + Math.round(n / 1e3) + 'rb'; return 'Rp ' + n; };
const fmtParts = (d, o) => new Intl.DateTimeFormat('id-ID', Object.assign({ timeZone: TZ }, o)).format(d instanceof Date ? d : new Date(d));
const fmtTime = (d, s) => fmtParts(d, { hour: '2-digit', minute: '2-digit', second: s ? '2-digit' : undefined, hour12: false }).replace(/\./g, ':');
const fmtDate = d => fmtParts(d, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateLong = d => fmtParts(d, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
const fmtDT = d => d ? fmtDate(d) + ' ' + fmtTime(d) : '-';
const dayKey = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d ? new Date(d) : new Date());
const addDays = (k, n) => { const p = k.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10); };
const keyLabel = k => { const p = k.split('-'); return Number(p[2]) + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(p[1]) - 1]; };
const debounce = (fn, ms) => { let t; return function () { clearTimeout(t); const a = arguments; t = setTimeout(() => fn.apply(null, a), ms); }; };
const initials = s => String(s || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const driveThumb = (id, w) => id ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + (w || 600) : '';
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const roleRank = r => ({ KASIR: 1, SUPERVISOR: 2, OWNER: 3 }[r] || 0);
const can = r => AppState.user && roleRank(AppState.user.role) >= roleRank(r);

// ---------------------------------------------------------------- penyimpanan
const LS_PREFIX = 'dm:v2:';
const Store = {
  get(k, d) { try { const v = localStorage.getItem(LS_PREFIX + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) {
    const s = JSON.stringify(v);
    try { localStorage.setItem(LS_PREFIX + k, s); }
    catch (e) {
      try { Object.keys(localStorage).filter(x => x.indexOf(LS_PREFIX + 'u:') === 0 && x.indexOf(userKey('')) !== 0).forEach(x => localStorage.removeItem(x)); localStorage.setItem(LS_PREFIX + k, s); } catch (e2) { }
    }
  },
  del(k) { try { localStorage.removeItem(LS_PREFIX + k); } catch (e) { } }
};
function userKey(k) { return 'u:' + ((AppState.user && AppState.user.email) || 'anon') + ':' + k; }
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ':' + s.length; }

// ---------------------------------------------------------------- state
const AppState = {
  token: '', exp: 0, user: null, config: {}, products: [], shift: null, approvers: [],
  cart: { lines: [], diskon: 0, tipe: 'DINE_IN', meja: '', pelanggan: '' },
  lastTrx: null, inflight: 0, online: navigator.onLine !== false
};
function saveSession(remember) {
  const s = JSON.stringify({ token: AppState.token, exp: AppState.exp, user: AppState.user });
  try { (remember ? localStorage : sessionStorage).setItem(LS_PREFIX + 'session', s); (remember ? sessionStorage : localStorage).removeItem(LS_PREFIX + 'session'); } catch (e) { }
}
function loadSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem(LS_PREFIX + 'session') || localStorage.getItem(LS_PREFIX + 'session') || 'null');
    if (s && s.exp > Date.now()) { AppState.token = s.token; AppState.exp = s.exp; AppState.user = s.user; return true; }
  } catch (e) { }
  return false;
}
function clearSession() {
  try { sessionStorage.removeItem(LS_PREFIX + 'session'); localStorage.removeItem(LS_PREFIX + 'session'); } catch (e) { }
  AppState.token = ''; AppState.user = null; AppState.shift = null;
}
function applyBoot(boot) {
  if (!boot) return;
  AppState.user = boot.user; AppState.config = boot.config || {}; AppState.products = boot.products || [];
  AppState.shift = boot.shift; AppState.approvers = boot.approvers || [];
  Store.set(userKey('boot'), { t: Date.now(), data: boot });
  document.dispatchEvent(new CustomEvent('boot'));
}

// ---------------------------------------------------------------- pengukur performa (P0)
const Perf = {
  rows: [],
  add(action, total, server) { this.rows.push({ action, total, server: server == null ? null : server, net: server != null ? total - server : null, at: Date.now() }); if (this.rows.length > 200) this.rows.shift(); },
  table() { console.table(this.rows.slice(-30)); },
  last() { return this.rows[this.rows.length - 1]; }
};
window.Perf = Perf;

// ---------------------------------------------------------------- API (P8)
const READ_ACTIONS = /^(ping|bootstrap|batch|products|dashboard|report|transactions|transaction|shiftSummary|shifts|users|settings|logs|stockHistory|deTemplates|deDocuments|deSourceData|deVerify|publicInfo|importScan)$/;
function setSync(delta) {
  AppState.inflight = Math.max(0, AppState.inflight + delta);
  const el = $('#syncChip'); if (!el) return;
  el.classList.toggle('busy', AppState.inflight > 0);
  el.classList.toggle('off', !AppState.online);
  $('.lbl', el).textContent = !AppState.online ? 'Offline' : AppState.inflight ? 'Menyinkron…' : (DEMO ? 'Mode Demo' : 'Tersinkron');
  el.firstElementChild.outerHTML = icon(!AppState.online ? 'cloudoff' : AppState.inflight ? 'sync' : 'cloud');
}
async function apiOnce(action, data, timeout, reqId) {
  const body = { action, token: AppState.token || '', reqId, data: data || {} };
  const t0 = performance.now();
  if (DEMO) {
    if (!window.DemoServer) await loadScript('js/demo.js');
    await new Promise(r => setTimeout(r, 90 + Math.random() * 120));
    const j = window.DemoServer.handle(body);
    Perf.add(action, Math.round(performance.now() - t0), j.ms);
    return j;
  }
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(GAS_URL, { method: 'POST', redirect: 'follow', cache: 'no-store', signal: ctrl.signal,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    const text = await res.text();
    try { const j = JSON.parse(text); Perf.add(action, Math.round(performance.now() - t0), j.ms); return j; }
    catch (e) { return { success: false, network: true, retryable: res.status >= 500 || res.status === 429, message: 'Server membalas HTTP ' + res.status + ' (bukan JSON). Periksa GAS_URL & deployment.' }; }
  } catch (err) {
    return { success: false, network: true, retryable: true, message: err.name === 'AbortError' ? 'Server terlalu lama merespons.' : 'Koneksi terputus.' };
  } finally { clearTimeout(timer); }
}
async function api(action, data, opt) {
  opt = opt || {};
  const isRead = READ_ACTIONS.test(action);
  const reqId = isRead ? '' : (opt.reqId || uuid());
  const tries = isRead ? 3 : 2;
  let res;
  setSync(1);
  try {
    for (let i = 0; i < tries; i++) {
      if (i) { await new Promise(r => setTimeout(r, 1200 * i)); if (navigator.onLine === false) await waitOnline(15000); }
      res = await apiOnce(action, data, isRead ? (i ? 40000 : 25000) : 120000, reqId);
      if (res.success || !res.retryable) break;
    }
  } finally { setSync(-1); }
  if (!res.success && res.data && res.data.code === 'AUTH' && action !== 'login') onSessionExpired();
  return res;
}
function waitOnline(ms) { return new Promise(r => { if (navigator.onLine !== false) return r(); const t = setTimeout(done, ms); function done() { clearTimeout(t); removeEventListener('online', done); r(); } addEventListener('online', done); }); }
function warmUpServer() { if (!DEMO) fetch(GAS_URL + '?ping=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).catch(() => { }); }
async function apiGet(params) {
  if (DEMO) { if (!window.DemoServer) await loadScript('js/demo.js'); return window.DemoServer.get(params); }
  try { const r = await fetch(GAS_URL + '?' + new URLSearchParams(params), { redirect: 'follow', cache: 'no-store' }); return await r.json(); }
  catch (e) { return { success: false, message: 'Tidak dapat menghubungi server.' }; }
}
function onSessionExpired() {
  if (!AppState.token) return;
  clearSession();
  toast('Sesi berakhir', 'Silakan login ulang.', 'warn');
  go('login');
}

/** SWR: render cache seketika, segarkan di latar bila lewat batas kesegaran; render ulang hanya bila data berubah. */
async function swr(key, action, payload, render, opt) {
  opt = opt || {};
  const fresh = opt.fresh === undefined ? 60000 : opt.fresh;
  const c = Store.get(userKey(key), null);
  if (c) render(c.data, true);
  if (c && !opt.force && Date.now() - c.t < fresh) return { success: true, data: c.data, cached: true };
  const res = await api(action, payload);
  if (res.success) {
    const h = hashStr(JSON.stringify(res.data));
    Store.set(userKey(key), { t: Date.now(), h, data: res.data });
    if (!c || c.h !== h) render(res.data, false);
  } else if (!c && opt.onError) opt.onError(res);
  else if (!c) toast('Gagal memuat', res.message, 'err');
  return res;
}
function invalidate(...keys) { keys.forEach(k => Store.del(userKey(k))); }

/** Prefetch menu yang sering dibuka dalam SATU panggilan batch saat idle (P3). */
function prefetch() {
  const calls = [{ action: 'dashboard' }, { action: 'transactions', data: { tanggal: dayKey(), limit: 50 } }];
  if (can('SUPERVISOR')) calls.push({ action: 'report', data: { from: addDays(dayKey(), -6), to: dayKey() } });
  const keyOf = { dashboard: 'dash', transactions: 'trx:' + dayKey(), report: 'rep:' + addDays(dayKey(), -6) + ':' + dayKey() };
  const run = () => api('batch', { calls }).then(res => {
    if (!res.success) return;
    Object.keys(res.data).forEach(a => { const r = res.data[a]; if (r.success && keyOf[a] && !Store.get(userKey(keyOf[a]))) Store.set(userKey(keyOf[a]), { t: Date.now(), h: hashStr(JSON.stringify(r.data)), data: r.data }); });
  });
  setTimeout(() => window.requestIdleCallback ? requestIdleCallback(run, { timeout: 3000 }) : run(), 1200);
}

// ---------------------------------------------------------------- loader skrip
const _scripts = {};
function loadScript(src) {
  if (_scripts[src]) return _scripts[src];
  return (_scripts[src] = new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = ok; s.onerror = () => { delete _scripts[src]; no(new Error('Gagal memuat ' + src)); };
    document.head.appendChild(s);
  }));
}
async function qrDataUrl(text, cell) {
  try {
    if (!window.qrcode) await loadScript(CFG.QR_LIB);
    const q = window.qrcode(0, 'M'); q.addData(String(text)); q.make();
    const n = q.getModuleCount(), sz = cell || 6, m = 4 * sz, cv = document.createElement('canvas');
    cv.width = cv.height = n * sz + m * 2;
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#000';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(m + c * sz, m + r * sz, sz, sz);
    return cv.toDataURL('image/png');
  } catch (e) { return ''; }
}

// ---------------------------------------------------------------- toast / modal / menu
function toast(title, msg, type, ms) {
  let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + (type || 'ok'); t.setAttribute('role', 'status');
  t.innerHTML = icon(type === 'err' ? 'xc' : type === 'warn' ? 'alert' : 'checkc') + '<div><b></b><span></span></div>';
  $('b', t).textContent = title; $('span', t).textContent = msg || '';
  box.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, ms || 3200);
}
const _modals = [];
function openModal(html, opt) {
  opt = opt || {};
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = '<div class="modal ' + (opt.cls || '') + '" role="dialog" aria-modal="true">' + html + '</div>';
  document.body.appendChild(ov);
  const close = v => { ov.remove(); const i = _modals.indexOf(rec); if (i > -1) _modals.splice(i, 1); opt.onClose && opt.onClose(v); };
  const rec = { el: ov, close, opt };
  _modals.push(rec);
  ov.addEventListener('mousedown', e => { if (e.target === ov && !opt.sticky) close(); });
  $$('[data-close]', ov).forEach(b => b.addEventListener('click', () => close()));
  setTimeout(() => { const f = $('[autofocus]', ov) || $('input,select,textarea', ov); f && f.focus(); }, 30);
  return { el: ov, close };
}
function modalHead(ic, title, sub) {
  return '<div class="modal-h"><div class="mi">' + icon(ic) + '</div><div class="grow"><div class="h3">' + esc(title) + '</div>' + (sub ? '<div class="small muted">' + sub + '</div>' : '') +
    '</div><button class="icon-btn" data-close aria-label="Tutup">' + icon('x') + '</button></div>';
}
function confirmDialog(title, msg, okLabel, danger) {
  return new Promise(res => {
    const m = openModal(modalHead(danger ? 'alert' : 'help', title) + '<div class="modal-b"><p style="margin:0">' + esc(msg) + '</p></div>' +
      '<div class="modal-f"><button class="btn btn-secondary grow" data-close>Batal</button><button class="btn ' + (danger ? 'btn-primary' : 'btn-primary') + ' grow" id="cfOk">' + esc(okLabel || 'Lanjutkan') + '</button></div>',
      { cls: 'sm', onClose: v => res(!!v) });
    $('#cfOk', m.el).onclick = () => m.close(true);
  });
}
/** Otorisasi supervisor: pilih penyetuju + PIN. Mengembalikan {email, pin} atau null. */
function askApproval(title, note, extra) {
  return new Promise(res => {
    const opts = AppState.approvers.map(a => '<option value="' + esc(a.email) + '">' + esc(a.nama) + ' — ' + esc(a.kode || a.role) + '</option>').join('');
    const m = openModal(modalHead('shield', title, note || 'Membutuhkan PIN Supervisor/Owner') +
      '<div class="modal-b">' + (extra || '') +
      '<div class="field"><label>Verifikator</label><select class="select" id="apEmail">' + opts + '</select></div>' +
      '<div class="field"><label>PIN Otorisasi <span class="hint">6 angka</span></label><input class="input mono" id="apPin" type="password" inputmode="numeric" maxlength="6" autocomplete="off" autofocus></div></div>' +
      '<div class="modal-f"><button class="btn btn-secondary grow" data-close>Batal</button><button class="btn btn-primary grow" id="apOk">' + icon('key') + 'Otorisasi</button></div>',
      { cls: 'sm', onClose: v => res(v || null) });
    const ok = () => { const pin = $('#apPin', m.el).value.trim(); if (!/^\d{6}$/.test(pin)) return toast('PIN tidak valid', 'Masukkan 6 angka.', 'warn'); const o = { email: $('#apEmail', m.el).value, pin }; $$('[data-x]', m.el).forEach(i => o[i.dataset.x] = i.value); m.close(o); };
    $('#apOk', m.el).onclick = ok;
    $('#apPin', m.el).onkeydown = e => { if (e.key === 'Enter') ok(); };
  });
}
function popMenu(anchor, items) {
  $$('.menu-pop').forEach(x => x.remove());
  const m = document.createElement('div'); m.className = 'menu-pop';
  items.forEach(it => { const b = document.createElement('button'); b.innerHTML = icon(it.icon) + '<span></span>'; $('span', b).textContent = it.label; b.onclick = () => { m.remove(); it.run(); }; m.appendChild(b); });
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect();
  m.style.top = (r.bottom + 6) + 'px'; m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + 'px';
  setTimeout(() => document.addEventListener('click', function h(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('click', h); } }), 0);
}
function retryBox(msg, fn) {
  const d = document.createElement('div'); d.className = 'retry';
  d.innerHTML = icon('cloudoff', 'ic-lg') + '<p class="muted"></p><button class="btn btn-secondary">' + icon('sync') + 'Coba lagi</button>';
  $('p', d).textContent = msg || 'Gagal memuat data.'; $('button', d).onclick = fn;
  return d;
}

// ---------------------------------------------------------------- cetak & unduh
function printHtml(html, opt) {
  opt = opt || {};
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(f);
  const css = $$('link[rel=stylesheet]').map(l => '<link rel="stylesheet" href="' + l.href + '">').join('');
  const page = opt.width ? '@page{size:' + opt.width + ' auto;margin:0}body{margin:0;padding:2mm 3mm;width:' + opt.width + '}' : '@page{size:A4;margin:12mm}body{margin:0}';
  const doc = f.contentDocument;
  doc.open();
  doc.write('<!doctype html><html><head><meta charset="utf-8">' + css + '<style>' + page + 'body{background:#fff}.receipt{box-shadow:none!important;width:100%!important;padding:0!important}</style></head><body>' + html + '</body></html>');
  doc.close();
  const go = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { } setTimeout(() => f.remove(), 2000); };
  const imgs = $$('img', doc);
  let left = imgs.length; if (!left) setTimeout(go, 350);
  imgs.forEach(i => { if (i.complete) { if (!--left) setTimeout(go, 250); } else i.onload = i.onerror = () => { if (!--left) setTimeout(go, 250); }; });
}
function downloadFile(name, content, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}
function toCsv(rows) { return '﻿' + rows.map(r => r.map(v => { const s = String(v === null || v === undefined ? '' : v); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n'); }
function b64ToBlob(b64, mime) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: mime }); }

// ---------------------------------------------------------------- kalkulasi keranjang (cermin server — server tetap penentu)
function calcCart(cart) {
  const cfg = AppState.config || {};
  let subtotal = 0, taxable = 0, items = 0;
  cart.lines.forEach(l => { const p = productBySku(l.sku) || {}; const h = Math.max(0, (p.harga || 0) - (p.diskon || 0)); l.harga = h; l.subtotal = h * l.qty; subtotal += l.subtotal; items += l.qty; if (p.pajak !== false) taxable += l.subtotal; });
  const diskon = Math.min(subtotal, Math.max(0, Math.round(cart.diskon || 0)));
  const dpp = subtotal - diskon;
  const base = subtotal ? dpp * (taxable / subtotal) : 0;
  const ppn = cfg.PPN_AKTIF ? Math.round(base * (cfg.PPN_PERSEN || 0) / 100) : 0;
  return { subtotal, diskon, dpp, ppn, total: dpp + ppn, items };
}
function productBySku(sku) { return AppState.products.find(p => p.sku === sku); }

// ---------------------------------------------------------------- router (P1)
const Pages = {};
function registerPage(name, def) { Pages[name] = Object.assign({ auth: 'KASIR', shell: true }, def); }
function go(name, param) { const h = '#/' + name + (param ? '/' + encodeURIComponent(param) : ''); if (location.hash === h) route(); else location.hash = h; }
function defaultPage() { return AppState.user ? (AppState.user.role === 'KASIR' ? 'kasir' : 'dashboard') : 'login'; }
let _current = null;
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  let name = parts[0] || defaultPage(); const param = parts[1] ? decodeURIComponent(parts.slice(1).join('/')) : '';
  if (!Pages[name]) name = defaultPage();
  let def = Pages[name];
  if (def.auth !== 'public' && !AppState.token) { name = 'login'; def = Pages.login; }
  else if (def.auth !== 'public' && !can(def.auth)) { toast('Akses ditolak', 'Menu ini khusus ' + def.auth.toLowerCase() + '.', 'warn'); name = defaultPage(); def = Pages[name]; }
  if (name === 'login' && AppState.token) { name = defaultPage(); def = Pages[name]; }
  document.body.classList.toggle('no-shell', !def.shell);
  $('#shell').hidden = !def.shell;
  const host = def.shell ? $('#main') : $('#fullhost');
  $('#fullhost').hidden = def.shell;
  let el = $('.page[data-page="' + name + '"]', host);
  if (!el) { el = document.createElement('section'); el.className = 'page'; el.dataset.page = name; el.innerHTML = def.template ? def.template() : ''; host.appendChild(el); def.init && def.init(el); }
  $$('.page', $('#main')).concat($$('.page', $('#fullhost'))).forEach(p => { p.hidden = p !== el; });
  if (_current && _current !== name && Pages[_current] && Pages[_current].hide) Pages[_current].hide();
  _current = name;
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === name || (name === 'produk-form' && a.dataset.nav === 'produk')));
  if (def.shell) window.scrollTo(0, 0);
  document.title = (def.title || 'POS') + ' · DapoerMitoha';
  def.show && def.show(el, param);
}
function resetPages() { $$('.page').forEach(p => p.remove()); }
addEventListener('hashchange', route);
