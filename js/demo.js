/* demo.js — DIBANGKITKAN OTOMATIS oleh tools/build-demo.js. Jangan diedit.
 * Mode demo: backend asli (Kode.gs, Migrasi.gs, DocEngine.gs) berjalan di peramban di atas mock Google Apps Script.
 * Data tersimpan di localStorage perangkat ini saja. Isi GAS_URL di js/config.js untuk memakai Google Sheets sungguhan. */
(function () {
/* Mock runtime Google Apps Script — dipakai untuk uji Node DAN mode demo di peramban.
 * Meniru: SpreadsheetApp (in-memory + konversi angka/tanggal ala Sheets), CacheService,
 * PropertiesService, LockService, Utilities (SHA-256/HMAC sinkron), ContentService, dll. */
var MockGAS = (function () {
  'use strict';
  // ---------------- SHA-256 & HMAC (sinkron, murni JS) ----------------
  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function sha256(bytes) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length, withPad = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(withPad);
    m.set(bytes); m[l] = 0x80;
    var bits = l * 8; for (var i = 0; i < 8; i++) m[withPad - 1 - i] = (i < 4 ? (bits >>> (8 * i)) : Math.floor(bits / Math.pow(2, 8 * i))) & 255;
    var w = new Array(64);
    for (var o = 0; o < withPad; o += 64) {
      for (var t = 0; t < 16; t++) w[t] = (m[o + 4 * t] << 24) | (m[o + 4 * t + 1] << 16) | (m[o + 4 * t + 2] << 8) | m[o + 4 * t + 3];
      for (t = 16; t < 64; t++) {
        var x = w[t - 15], y = w[t - 2];
        var s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3);
        var s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = new Uint8Array(32);
    for (i = 0; i < 8; i++) { out[4 * i] = H[i] >>> 24; out[4 * i + 1] = (H[i] >>> 16) & 255; out[4 * i + 2] = (H[i] >>> 8) & 255; out[4 * i + 3] = H[i] & 255; }
    return out;
  }
  var enc = new TextEncoder(), dec = new TextDecoder();
  function toBytes(v) { if (typeof v === 'string') return enc.encode(v); return Uint8Array.from(v, function (b) { return b & 255; }); }
  function hmac(msg, key) {
    var k = toBytes(key); if (k.length > 64) k = sha256(k);
    var kp = new Uint8Array(64); kp.set(k);
    var ip = new Uint8Array(64), op = new Uint8Array(64);
    for (var i = 0; i < 64; i++) { ip[i] = kp[i] ^ 0x36; op[i] = kp[i] ^ 0x5c; }
    var m = toBytes(msg), inner = new Uint8Array(64 + m.length); inner.set(ip); inner.set(m, 64);
    var ih = sha256(inner), outer = new Uint8Array(96); outer.set(op); outer.set(ih, 64);
    return sha256(outer);
  }
  function signed(u8) { return Array.prototype.map.call(u8, function (b) { return b > 127 ? b - 256 : b; }); }
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function b64enc(bytes) {
    var s = '', i; bytes = toBytes(bytes);
    for (i = 0; i < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      s += B64[n >> 18 & 63] + B64[n >> 12 & 63] + (i + 1 < bytes.length ? B64[n >> 6 & 63] : '=') + (i + 2 < bytes.length ? B64[n & 63] : '=');
    }
    return s;
  }
  function b64dec(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/]/g, '');
    var out = [], i;
    for (i = 0; i < s.length; i += 4) {
      var n = (B64.indexOf(s[i]) << 18) | (B64.indexOf(s[i + 1]) << 12) | ((B64.indexOf(s[i + 2]) & 63) << 6) | (B64.indexOf(s[i + 3]) & 63);
      out.push(n >> 16 & 255); if (s[i + 2] !== undefined) out.push(n >> 8 & 255); if (s[i + 3] !== undefined) out.push(n & 255);
    }
    return signed(out);
  }

  // ---------------- Format tanggal ala Utilities.formatDate ----------------
  function parts(d, tz) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short', hourCycle: 'h23' });
    var o = {}; f.formatToParts(d).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  var WD = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  function formatDate(d, tz, pat) {
    var p = parts(d, tz || 'Asia/Jakarta'), pad = function (n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; };
    var map = { yyyy: p.year, yy: String(p.year).slice(-2), MM: pad(p.month, 2), M: String(+p.month), dd: pad(p.day, 2), d: String(+p.day),
                HH: pad(p.hour, 2), H: String(+p.hour), mm: pad(p.minute, 2), ss: pad(p.second, 2), u: String(WD[p.weekday]) };
    return String(pat).replace(/'([^']*)'|yyyy|yy|MM|M|dd|d|HH|H|mm|ss|u/g, function (m, lit) { return lit !== undefined ? lit : map[m]; });
  }

  // ---------------- Spreadsheet in-memory ----------------
  var store = { ss: {}, props: {}, seq: 0 };
  var onChange = null;
  function changed() { if (onChange) onChange(); }
  function coerce(v, text) {
    if (text || typeof v !== 'string') return v;
    if (/^-?\d+(\.\d+)?$/.test(v) && v.length < 16 && !/^0\d/.test(v)) return Number(v);
    if (/^-?\d+(\.\d+)?$/.test(v) && v.length < 16) return Number(v);           // Sheets juga membuang 0 di depan
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00+07:00');  // Sheets mengubah teks tanggal jadi Date
    if (v.toUpperCase() === 'TRUE') return true; if (v.toUpperCase() === 'FALSE') return false;
    return v;
  }
  function makeRange(sh, r, c, nr, nc) {
    var R = {
      getValues: function () {
        var out = [];
        for (var i = 0; i < nr; i++) { var row = []; for (var j = 0; j < nc; j++) { var x = (sh.data[r - 1 + i] || [])[c - 1 + j]; row.push(x === undefined || x === null ? '' : x); } out.push(row); }
        return out;
      },
      getDisplayValues: function () { return R.getValues().map(function (row) { return row.map(String); }); },
      getFormulas: function () { return R.getValues().map(function (row) { return row.map(function () { return ''; }); }); },
      setValues: function (v) {
        if (v.length !== nr || (v[0] && v[0].length !== nc)) throw new Error('Ukuran data (' + v.length + 'x' + (v[0] || []).length + ') tidak cocok dengan range (' + nr + 'x' + nc + ').');
        for (var i = 0; i < nr; i++) {
          sh.data[r - 1 + i] = sh.data[r - 1 + i] || [];
          for (var j = 0; j < nc; j++) sh.data[r - 1 + i][c - 1 + j] = coerce(v[i][j] instanceof Date ? new Date(v[i][j].getTime()) : v[i][j], sh.text[c + j] || sh.textAll);
        }
        changed(); return R;
      },
      setValue: function (x) { return R.setValues([[x]]); },
      setNumberFormat: function (f) { if (f === '@') { for (var j = 0; j < nc; j++) sh.text[c + j] = true; } return R; },
      getRow: function () { return r; }, getColumn: function () { return c; }
    };
    var PR = new Proxy(R, { get: function (t, k) { return k in t ? t[k] : function () { return PR; }; } });
    Object.keys(R).forEach(function (k) { var f = R[k]; R[k] = function () { var x = f.apply(R, arguments); return x === R ? PR : x; }; });
    return PR;
  }
  function makeSheet(name) {
    var sh = { name: name, data: [], text: {}, textAll: false };
    var S = {
      _raw: sh,
      getName: function () { return sh.name; }, setName: function (n) { sh.name = n; changed(); return S; },
      getLastRow: function () { for (var i = sh.data.length - 1; i >= 0; i--) if ((sh.data[i] || []).some(function (x) { return x !== '' && x !== undefined && x !== null; })) return i + 1; return 0; },
      getLastColumn: function () { var m = 0; sh.data.forEach(function (r) { for (var j = (r || []).length - 1; j >= 0; j--) if (r[j] !== '' && r[j] !== undefined && r[j] !== null) { m = Math.max(m, j + 1); break; } }); return m; },
      getMaxRows: function () { return Math.max(1000, sh.data.length); },
      getRange: function (r, c, nr, nc) {
        if (typeof r === 'string') return makeRange(sh, 1, 1, 1, 1);
        return makeRange(sh, r, c, nr || 1, nc || 1);
      },
      getDataRange: function () { return makeRange(sh, 1, 1, Math.max(S.getLastRow(), 1), Math.max(S.getLastColumn(), 1)); },
      appendRow: function (row) { sh.data[S.getLastRow()] = row.map(function (x, j) { return coerce(x, sh.text[j + 1]); }); changed(); return S; },
      insertRowsAfter: function (r, n) { var blank = []; for (var i = 0; i < n; i++) blank.push([]); sh.data.splice.apply(sh.data, [r, 0].concat(blank)); changed(); return S; },
      deleteRow: function (r) { sh.data.splice(r - 1, 1); changed(); return S; },
      createTextFinder: function (t) { return { matchCase: function () { return this; }, findNext: function () {
        for (var i = 0; i < sh.data.length; i++) for (var j = 0; j < (sh.data[i] || []).length; j++) if (String(sh.data[i][j]).toLowerCase().indexOf(t.toLowerCase()) > -1) return { getRow: function () { return i + 1; } };
        return null; } }; }
    };
    var PS = new Proxy(S, { get: function (t, k) { return k in t ? t[k] : function () { return PS; }; } });
    Object.keys(S).forEach(function (k) { if (k === '_raw') return; var f = S[k]; S[k] = function () { var x = f.apply(S, arguments); return x === S ? PS : x; }; });
    return PS;
  }
  function makeSS(id, name) {
    var o = { id: id, name: name, sheets: [] };
    var SS = {
      _raw: o,
      getId: function () { return o.id; }, getName: function () { return o.name; }, getUrl: function () { return 'https://docs.google.com/spreadsheets/d/' + o.id; },
      getSheets: function () { return o.sheets.slice(); }, getActiveSheet: function () { return o.sheets[0]; },
      getSheetByName: function (n) { return o.sheets.filter(function (s) { return s.getName() === n; })[0] || null; },
      insertSheet: function (n) { var s = makeSheet(n); o.sheets.push(s); changed(); return s; }
    };
    return SS;
  }
  function newId() { store.seq++; return 'mock' + Date.now().toString(36) + store.seq + 'x'.repeat(20); }

  var cache = {};
  var G = {
    SpreadsheetApp: {
      openById: function (id) { var s = store.ss[id]; if (!s) throw new Error('Spreadsheet tidak ditemukan: ' + id); return s; },
      create: function (name) { var id = newId(); var s = makeSS(id, name); s.insertSheet('Sheet1'); store.ss[id] = s; return s; },
      flush: function () { }, CopyPasteType: { PASTE_FORMAT: 'f' }
    },
    CacheService: { getScriptCache: function () {
      var now = function () { return Date.now(); };
      var C = {
        get: function (k) { var x = cache[k]; if (!x) return null; if (x.e < now()) { delete cache[k]; return null; } return x.v; },
        put: function (k, v, ttl) { if (String(v).length > 100000) throw new Error('Argumen terlalu besar: value'); cache[k] = { v: String(v), e: now() + (ttl || 600) * 1000 }; },
        remove: function (k) { delete cache[k]; },
        getAll: function (ks) { var o = {}; ks.forEach(function (k) { var v = C.get(k); if (v !== null) o[k] = v; }); return o; },
        putAll: function (m, ttl) { Object.keys(m).forEach(function (k) { C.put(k, m[k], ttl); }); },
        removeAll: function (ks) { ks.forEach(function (k) { delete cache[k]; }); }
      };
      return C;
    } },
    PropertiesService: { getScriptProperties: function () {
      return {
        getProperty: function (k) { return store.props[k] === undefined ? null : store.props[k]; },
        setProperty: function (k, v) { store.props[k] = String(v); changed(); return this; },
        setProperties: function (o) { Object.keys(o).forEach(function (k) { store.props[k] = String(o[k]); }); changed(); return this; },
        getProperties: function () { return Object.assign({}, store.props); },
        deleteProperty: function (k) { delete store.props[k]; changed(); return this; }
      };
    } },
    LockService: { getScriptLock: function () { return { waitLock: function () { }, tryLock: function () { return true; }, releaseLock: function () { }, hasLock: function () { return true; } }; } },
    Utilities: {
      getUuid: function () { return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); },
      formatDate: formatDate,
      computeHmacSha256Signature: function (v, k) { return signed(hmac(v, k)); },
      computeDigest: function (alg, v) { return signed(sha256(toBytes(v))); },
      base64EncodeWebSafe: function (v) { return b64enc(v).replace(/\+/g, '-').replace(/\//g, '_'); },
      base64DecodeWebSafe: function (s) { return b64dec(s); },
      base64Encode: function (v) { return b64enc(v); }, base64Decode: function (s) { return b64dec(s); },
      newBlob: function (data, mime, name) { var bytes = toBytes(data); return { getDataAsString: function () { return dec.decode(bytes); }, getBytes: function () { return signed(bytes); }, setName: function () { return this; } }; },
      DigestAlgorithm: { SHA_256: 'SHA_256' }, Charset: { UTF_8: 'UTF_8' }
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: function (s) { return { _s: s, setMimeType: function () { return this; }, getContent: function () { return s; } }; } },
    Session: { getScriptTimeZone: function () { return 'Asia/Jakarta'; }, getEffectiveUser: function () { return { getEmail: function () { return 'owner@dapoermitoha.internal'; } }; } },
    Logger: { log: function () { if (G.__verbose) console.log.apply(console, arguments); } },
    MimeType: { GOOGLE_DOCS: 'docs', GOOGLE_SHEETS: 'sheets', GOOGLE_SLIDES: 'slides', PDF: 'pdf' },
    ScriptApp: { getProjectTriggers: function () { return []; }, deleteTrigger: function () { }, getOAuthToken: function () { return ''; },
      newTrigger: function () { var t = { timeBased: function () { return t; }, everyMinutes: function () { return t; }, create: function () { return t; } }; return t; } },
    DriveApp: {
      Access: { ANYONE_WITH_LINK: 1 }, Permission: { VIEW: 1 },
      createFolder: function (n) { var id = newId(); var F = { getId: function () { return id; }, getUrl: function () { return 'https://drive.google.com/drive/folders/' + id; },
        createFolder: function (x) { return G.DriveApp.createFolder(x); }, createFile: function () { throw new Error(DEMO_MSG); } }; return F; },
      getFileById: function (id) { return { moveTo: function () { }, getMimeType: function () { throw new Error(DEMO_MSG); }, makeCopy: function () { throw new Error(DEMO_MSG); } }; },
      getFolderById: function () { return { createFile: function () { throw new Error(DEMO_MSG); } }; }
    }
  };
  var DEMO_MSG = 'Fitur ini membutuhkan backend Google Apps Script asli (Drive/Docs) — tidak tersedia di mode demo.';
  ['DocumentApp', 'SlidesApp', 'UrlFetchApp'].forEach(function (n) {
    G[n] = new Proxy({}, { get: function (t, k) { if (k === 'ElementType' || k === 'PageElementType' || k === 'HorizontalAlignment' || k === 'ParagraphHeading' || k === 'Attribute' || k === 'GlyphType') return {}; return function () { throw new Error(DEMO_MSG); }; } });
  });

  // ---------------- Persistensi (mode demo) ----------------
  function dump() {
    var out = { props: store.props, seq: store.seq, ss: {} };
    Object.keys(store.ss).forEach(function (id) {
      var o = store.ss[id]._raw;
      out.ss[id] = { name: o.name, sheets: o.sheets.map(function (s) {
        var r = s._raw;
        return { name: r.name, text: r.text, data: r.data.map(function (row) { return (row || []).map(function (x) { return x instanceof Date ? { __d: x.toISOString() } : x; }); }) };
      }) };
    });
    return JSON.stringify(out);
  }
  function load(json) {
    var o = JSON.parse(json);
    store.props = o.props || {}; store.seq = o.seq || 0; store.ss = {};
    Object.keys(o.ss || {}).forEach(function (id) {
      var SS = makeSS(id, o.ss[id].name);
      o.ss[id].sheets.forEach(function (s) {
        var sh = SS.insertSheet(s.name); sh._raw.text = s.text || {};
        sh._raw.data = s.data.map(function (row) { return row.map(function (x) { return x && typeof x === 'object' && x.__d ? new Date(x.__d) : x; }); });
      });
      store.ss[id] = SS;
    });
  }
  return { globals: G, dump: dump, load: load, setOnChange: function (f) { onChange = f; }, resetCache: function () { cache = {}; }, sha256: sha256 };
})();

var G = MockGAS.globals;
var SpreadsheetApp = G.SpreadsheetApp, CacheService = G.CacheService, PropertiesService = G.PropertiesService, LockService = G.LockService,
    Utilities = G.Utilities, ContentService = G.ContentService, Session = G.Session, Logger = G.Logger, MimeType = G.MimeType,
    ScriptApp = G.ScriptApp, DriveApp = G.DriveApp, DocumentApp = G.DocumentApp, SlidesApp = G.SlidesApp, UrlFetchApp = G.UrlFetchApp;
// ---- Kode.gs
/**
 * ============================================================================
 *  DapoerMitoha Seblak Cloud POS — Backend REST API (Google Apps Script)
 *  Versi 2.4.0
 *
 *  Arsitektur  : gas-pro-api (frontend statis di GitHub Pages, GAS = JSON API)
 *  Performa    : gas-instant-ux-pro (bootstrap 1 panggilan, cache berversi,
 *                memo per eksekusi, token HMAC, idempotensi reqId, antrean log)
 *  Modul lain  : Migrasi.gs (import data app lama), DocEngine.gs (dokumen cetak)
 *
 *  Semua respons: { success, data, message, ms }
 *  Frontend memanggil: fetch(GAS_URL, {method:'POST', headers:{'Content-Type':'text/plain'}, body})
 * ============================================================================
 */

// ============================================================================
// KONFIGURASI
// ============================================================================
const APP = { NAME: 'DapoerMitoha POS', VERSION: '2.4.0', TZ: 'Asia/Jakarta' };

const CONFIG = {
  get SPREADSHEET_ID() { return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'); },
  get ROOT_FOLDER_ID() { return PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID'); },
  get UPLOADS_FOLDER() { return PropertiesService.getScriptProperties().getProperty('UPLOADS_FOLDER'); },
  get EXPORTS_FOLDER() { return PropertiesService.getScriptProperties().getProperty('EXPORTS_FOLDER'); },
  get TEMPLATES_FOLDER() { return PropertiesService.getScriptProperties().getProperty('TEMPLATES_FOLDER'); }
};

const SH = {
  config: 'AppConfig', users: 'Users', produk: 'Produk', trx: 'Transaksi',
  shift: 'Shift', stok: 'StokLog', logs: 'Logs'
};

const HEADERS = {
  Users:     ['id', 'email', 'nama', 'kode', 'role', 'pinHash', 'pinSalt', 'outlet', 'aktif', 'lastLogin', 'dibuat'],
  Produk:    ['sku', 'barcode', 'nama', 'deskripsi', 'kategori', 'harga', 'diskon', 'hpp', 'stok', 'minStok',
              'levelPedas', 'pajak', 'fotoId', 'favorit', 'aktif', 'diperbarui'],
  Transaksi: ['id', 'waktu', 'tanggal', 'shiftId', 'kasirEmail', 'kasirNama', 'terminal', 'tipe', 'meja', 'pelanggan',
              'items', 'jmlItem', 'subtotal', 'diskon', 'dpp', 'ppn', 'total', 'metode', 'bayar', 'kembalian',
              'detailBayar', 'status', 'catatan', 'voidOleh', 'voidAlasan'],
  Shift:     ['id', 'terminal', 'kasirEmail', 'kasirNama', 'buka', 'tutup', 'modalAwal', 'tunai', 'qris', 'edc', 'ewallet',
              'total', 'jmlTrx', 'kasSistem', 'kasFisik', 'selisih', 'denominasi', 'supervisor', 'waktuOtorisasi',
              'catatan', 'status'],
  StokLog:   ['id', 'waktu', 'sku', 'delta', 'stokAkhir', 'alasan', 'ref', 'oleh'],
  Logs:      ['id', 'waktu', 'email', 'role', 'aksi', 'detail', 'target']
};

/** Nilai bawaan AppConfig. Kunci yang belum ada di sheet otomatis memakai nilai ini. */
const CONFIG_DEFAULT = {
  APP_NAME: 'DapoerMitoha POS',
  OUTLET_NAMA: 'DapoerMitoha',
  OUTLET_TAGLINE: 'Kuliner Seblak Asli',
  OUTLET_KODE: '01',
  OUTLET_CABANG: 'Padalarang Pusat',
  OUTLET_ALAMAT: 'Jl. Raya Padalarang No. 42 Bandung Barat',
  OUTLET_TELP: '0812-9988-7711',
  TERMINAL: 'T-01',
  PPN_AKTIF: 'TRUE',
  PPN_PERSEN: '11',
  TARGET_HARIAN: '4500000',
  TARGET_BULANAN: '18000000',
  MODAL_AWAL_DEFAULT: '200000',
  KATEGORI: 'Seblak Kuah,Seblak Kering,Topping,Minuman',
  STRUK_FOOTER: '*** Hatur Nuhun Parantos Sumping ***',
  STRUK_CATATAN: 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan',
  STRUK_WIFI: 'Free WiFi: DapoerMitoha_Guest | Pass: kencurpedas99',
  EMAIL_DOMAIN: '',
  GOOGLE_CLIENT_ID: '',
  VERIFY_BASE_URL: '',
  SESI_JAM: '12'
};

/** Kunci config yang boleh dikirim ke peramban (tidak ada rahasia di AppConfig, tapi tetap dibatasi). */
const CONFIG_PUBLIC = Object.keys(CONFIG_DEFAULT);

const ROLE_RANK = { KASIR: 1, SUPERVISOR: 2, OWNER: 3 };
const METODE = ['TUNAI', 'QRIS', 'EDC', 'EWALLET'];
const SLOW_MS = 3000;

// ============================================================================
// ROUTER
// ============================================================================
// auth: 'public' | 'KASIR' | 'SUPERVISOR' | 'OWNER'  (peran minimal)
// write: true → dibungkus LockService + idempotensi reqId
// Dibangun saat pertama dipakai: di Apps Script setiap berkas .gs dimuat berurutan, sehingga fungsi dari
// Migrasi.gs / DocEngine.gs belum ada ketika Kode.gs dievaluasi. Objek ini tidak boleh dibuat di level atas.
let ROUTES_ = null;
function routes_() { return ROUTES_ || (ROUTES_ = buildRoutes_()); }
function buildRoutes_() { return {
  ping:              { fn: apiPing,            auth: 'public' },
  login:             { fn: apiLogin,           auth: 'public', write: false },
  loginGoogle:       { fn: apiLoginGoogle,     auth: 'public' },
  publicInfo:        { fn: apiPublicInfo,      auth: 'public' },
  bootstrap:         { fn: apiBootstrap,       auth: 'KASIR' },
  batch:             { fn: apiBatch,           auth: 'KASIR' },
  products:          { fn: apiProducts,        auth: 'KASIR' },
  saveProduct:       { fn: apiSaveProduct,     auth: 'SUPERVISOR', write: true },
  archiveProduct:    { fn: apiArchiveProduct,  auth: 'SUPERVISOR', write: true },
  adjustStock:       { fn: apiAdjustStock,     auth: 'SUPERVISOR', write: true },
  stockHistory:      { fn: apiStockHistory,    auth: 'SUPERVISOR' },
  uploadPhoto:       { fn: apiUploadPhoto,     auth: 'SUPERVISOR', write: true },
  createTransaction: { fn: apiCreateTransaction, auth: 'KASIR', write: true },
  voidTransaction:   { fn: apiVoidTransaction, auth: 'KASIR', write: true },
  transactions:      { fn: apiTransactions,    auth: 'KASIR' },
  transaction:       { fn: apiTransaction,     auth: 'KASIR' },
  dashboard:         { fn: apiDashboard,       auth: 'KASIR' },
  report:            { fn: apiReport,          auth: 'SUPERVISOR' },
  openShift:         { fn: apiOpenShift,       auth: 'KASIR', write: true },
  shiftSummary:      { fn: apiShiftSummary,    auth: 'KASIR' },
  closeShift:        { fn: apiCloseShift,      auth: 'KASIR', write: true },
  shifts:            { fn: apiShifts,          auth: 'KASIR' },
  users:             { fn: apiUsers,           auth: 'OWNER' },
  saveUser:          { fn: apiSaveUser,        auth: 'OWNER', write: true },
  changePin:         { fn: apiChangePin,       auth: 'KASIR', write: true },
  settings:          { fn: apiSettings,        auth: 'OWNER' },
  saveSettings:      { fn: apiSaveSettings,    auth: 'OWNER', write: true },
  logs:              { fn: apiLogs,            auth: 'OWNER' },
  // Modul migrasi (Migrasi.gs)
  importScan:        { fn: function (c, d) { return apiImport(c, Object.assign({}, d, { dryRun: true })); }, auth: 'OWNER' },
  importRun:         { fn: function (c, d) { return apiImport(c, Object.assign({}, d, { dryRun: false })); }, auth: 'OWNER', write: true },
  importCsv:         { fn: apiImportCsv,       auth: 'OWNER', write: true },
  // Modul dokumen (DocEngine.gs)
  deTemplates:       { fn: apiDeTemplates,     auth: 'KASIR' },
  deScanTemplate:    { fn: apiDeScanTemplate,  auth: 'OWNER' },              // kunci singkat di dalam fungsi
  deSaveTemplate:    { fn: apiDeSaveTemplate,  auth: 'OWNER', write: true },
  deDeleteTemplate:  { fn: apiDeDeleteTemplate, auth: 'OWNER', write: true },
  deCreateSamples:   { fn: apiDeCreateSamples, auth: 'OWNER' },
  deSourceData:      { fn: apiDeSourceData,    auth: 'KASIR' },
  deGenerate:        { fn: apiDeGenerate,      auth: 'KASIR' },              // render lama → tidak memegang kunci global; idempotensi di dalam
  deDocuments:       { fn: apiDeDocuments,     auth: 'KASIR' },
  deRevoke:          { fn: apiDeRevoke,        auth: 'SUPERVISOR', write: true },
  deVerify:          { fn: apiDeVerify,        auth: 'public' }
}; }

// Aksi yang boleh dijalankan di dalam batch (baca saja)
const BATCHABLE = ['shifts', 'products', 'dashboard', 'report', 'transactions', 'shiftSummary', 'users', 'settings',
                   'deTemplates', 'deDocuments', 'stockHistory', 'logs'];

// ============================================================================
// ENTRY POINTS
// ============================================================================
function doGet(e) {
  const t0 = Date.now();
  resetMemo_();
  const p = (e && e.parameter) || {};
  let res;
  try {
    if (p.ping !== undefined || !p.action || p.action === 'ping') res = apiPing();
    else if (p.action === 'deVerify') res = apiDeVerify(null, { kode: p.k || p.kode });
    else if (p.action === 'publicInfo') res = apiPublicInfo();
    else res = fail('Aksi GET tidak dikenal. Gunakan POST.');
  } catch (err) {
    res = fail(errMsg(err));
  }
  res.ms = Date.now() - t0;
  return json_(res);
}

function doPost(e) {
  const t0 = Date.now();
  resetMemo_();
  let body = {}, res;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    res = dispatch(body);
  } catch (err) {
    res = fail(errMsg(err));
  }
  res.ms = Date.now() - t0;
  if (res.ms > SLOW_MS) {
    try { queueLog(['', 'SYSTEM', 'SLOW', (body.action || '?') + ' ' + res.ms + 'ms', '']); } catch (e2) { }
  }
  return json_(res);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function dispatch(body) {
  const r = routes_()[body.action];
  if (!r) return fail('Aksi tidak dikenal: ' + body.action);
  const ctx = { session: verifyToken(body.token), reqId: String(body.reqId || ''), after: [] };
  if (!authorized(r, ctx)) {
    return fail(ctx.session ? 'Akses ditolak untuk peran Anda.' : 'Sesi berakhir. Silakan login ulang.',
      { code: ctx.session ? 'FORBIDDEN' : 'AUTH' });
  }
  if (!r.write) return r.fn(ctx, body.data || {});

  const res = withLock(function () {
    const c = CacheService.getScriptCache(), k = ctx.reqId && ('idem_' + ctx.reqId);
    const hit = k && c.get(k);
    if (hit) return JSON.parse(hit);                       // permintaan ulang → hasil sama
    const out = r.fn(ctx, body.data || {});
    if (k && out.success) {
      const s = JSON.stringify(out);
      if (s.length < 90000) c.put(k, s, 21600);
    }
    return out;
  });
  // pekerjaan lambat (render dokumen, notifikasi) berjalan setelah kunci dilepas
  ctx.after.forEach(function (fn) { try { fn(); } catch (e) { Logger.log(e); } });
  return res;
}

function authorized(route, ctx) {
  if (route.auth === 'public') return true;
  if (!ctx.session) return false;
  return (ROLE_RANK[ctx.session.role] || 0) >= (ROLE_RANK[route.auth] || 99);
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function apiBatch(ctx, d) {
  const out = {};
  (d.calls || []).slice(0, 10).forEach(function (c) {
    const r = routes_()[c.action];
    if (!r || r.write || BATCHABLE.indexOf(c.action) < 0 || !authorized(r, ctx)) {
      out[c.action] = fail('Tidak diizinkan dalam batch.');
      return;
    }
    try { out[c.action] = r.fn(ctx, c.data || {}); } catch (e) { out[c.action] = fail(errMsg(e)); }
  });
  return ok(out);
}

// ============================================================================
// RESPON & UTILITAS UMUM
// ============================================================================
function ok(data, message) { return { success: true, data: data === undefined ? null : data, message: message || '' }; }
function fail(message, data) { return { success: false, data: data || null, message: message || 'Terjadi kesalahan.' }; }
function errMsg(e) { return e && e.message ? e.message : String(e); }
function lower(s) { return String(s || '').trim().toLowerCase(); }
function num(v) { const n = Number(String(v === undefined || v === null ? '' : v).replace(/[^\d.\-]/g, '')); return isNaN(n) ? 0 : n; }
function bool(v) { return v === true || String(v).toUpperCase() === 'TRUE' || v === 1 || v === '1'; }
function uid(prefix) { return (prefix || '') + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase(); }
function toDate(v) {
  if (v instanceof Date) return v;
  if (v === '' || v === null || v === undefined) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function fmt(d, pattern) { const x = toDate(d); return x ? Utilities.formatDate(x, APP.TZ, pattern) : ''; }
function dayKey(d) { return fmt(d || new Date(), 'yyyy-MM-dd'); }
function iso(d) { const x = toDate(d); return x ? x.toISOString() : ''; }
function parseJson(s, def) { try { return s ? JSON.parse(s) : def; } catch (e) { return def; } }
/** Kolom tanggal di sheet bisa terbaca sebagai Date (Sheets mengubah teks tanggal) → normalkan ke yyyy-MM-dd */
/** Tambah n hari pada kunci 'yyyy-MM-dd' tanpa terpengaruh zona waktu. */
function addDays(key, n) {
  const p = String(key).split('-').map(Number);
  return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10);
}
function dkey(v) { if (v instanceof Date) return dayKey(v); return String(v || '').slice(0, 10); }

// ============================================================================
// AKSES SHEET (memo per eksekusi + batch tulis)
// ============================================================================
let _SS = null;
const _ROWS = {};
function resetMemo_() { Object.keys(_ROWS).forEach(function (k) { delete _ROWS[k]; }); }

function ss_() {
  if (_SS) return _SS;
  const id = CONFIG.SPREADSHEET_ID;
  if (!id) throw new Error('Backend belum di-setup. Jalankan setupAppEnvironment() sekali di editor Apps Script.');
  return (_SS = SpreadsheetApp.openById(id));
}

function getSheet(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Sheet "' + name + '" tidak ditemukan. Jalankan setupAppEnvironment() atau migrateSchema().');
  return sh;
}

function readSheet(name) {
  if (_ROWS[name]) return _ROWS[name];
  const v = getSheet(name).getDataRange().getValues();
  const h = (v[0] || []).map(String);
  const rows = [];
  for (let i = 1; i < v.length; i++) {
    const r = v[i];
    if (r.join('') === '') continue;
    const o = {};
    h.forEach(function (k, j) { if (k) o[k] = r[j]; });
    rows.push(o);
  }
  return (_ROWS[name] = rows);
}
function invalidateRows(name) { delete _ROWS[name]; }

/** N baris terbawah (untuk sheet yang terus bertambah: Transaksi, Logs). */
function readTail(name, n) {
  const sh = getSheet(name), last = sh.getLastRow(), cols = sh.getLastColumn();
  if (last < 2) return [];
  const h = sh.getRange(1, 1, 1, cols).getValues()[0].map(String);
  const start = Math.max(2, last - n + 1);
  const v = sh.getRange(start, 1, last - start + 1, cols).getValues();
  return v.filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    const o = {}; h.forEach(function (k, j) { if (k) o[k] = r[j]; }); return o;
  });
}

function headerOf(name) {
  const sh = getSheet(name);
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
}

/** Tambah banyak objek dengan SATU setValues. */
function appendObjects(name, objs) {
  if (!objs || !objs.length) return;
  const sh = getSheet(name), h = headerOf(name);
  const rows = objs.map(function (o) { return h.map(function (k) { return o[k] === undefined || o[k] === null ? '' : o[k]; }); });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, h.length).setValues(rows);
  invalidateRows(name);
}

/** Ubah banyak baris sekaligus: {key: {Kolom: nilai}} → tulis satu blok kontigu. */
function updateWhere(name, keyCol, patchesByKey) {
  const sh = getSheet(name), v = sh.getDataRange().getValues(), h = v[0].map(String), ki = h.indexOf(keyCol);
  let min = Infinity, max = -1, count = 0;
  for (let i = 1; i < v.length; i++) {
    const p = patchesByKey[String(v[i][ki])];
    if (!p) continue;
    Object.keys(p).forEach(function (k) { const c = h.indexOf(k); if (c > -1) v[i][c] = p[k]; });
    min = Math.min(min, i); max = Math.max(max, i); count++;
  }
  if (max > -1) sh.getRange(min + 1, 1, max - min + 1, h.length).setValues(v.slice(min, max + 1));
  invalidateRows(name);
  return count;
}
function updateByKey(name, keyCol, key, patch) { const o = {}; o[String(key)] = patch; return updateWhere(name, keyCol, o); }

// ============================================================================
// CACHE SERVER BERLAPIS (versi + chunk)
// ============================================================================
const CacheX = {
  SZ: 50000,
  c: function () { return CacheService.getScriptCache(); },
  get: function (key) {
    const c = this.c(), head = c.get(key);
    if (head == null) return null;
    if (head.indexOf('__chunks:') !== 0) return JSON.parse(head);
    const n = +head.slice(9), keys = [];
    for (let i = 0; i < n; i++) keys.push(key + '#' + i);
    const parts = c.getAll(keys); let s = '';
    for (let i = 0; i < n; i++) { if (parts[keys[i]] == null) return null; s += parts[keys[i]]; }
    return JSON.parse(s);
  },
  put: function (key, val, ttl) {
    const s = JSON.stringify(val), c = this.c();
    try {
      if (s.length <= this.SZ) return c.put(key, s, ttl);
      const n = Math.ceil(s.length / this.SZ);
      if (n > 20) return;
      const m = {};
      for (let i = 0; i < n; i++) m[key + '#' + i] = s.substr(i * this.SZ, this.SZ);
      c.putAll(m, ttl); c.put(key, '__chunks:' + n, ttl);
    } catch (e) { /* cache opsional */ }
  }
};
function ver(scope) {
  const c = CacheService.getScriptCache(), k = 'ver_' + scope;
  let v = c.get(k);
  if (!v) { v = String(Date.now()); c.put(k, v, 21600); }
  return v;
}
function bump(scope) { CacheService.getScriptCache().put('ver_' + scope, String(Date.now()) + Math.random().toString(36).slice(2, 5), 21600); }
function cached(key, ttl, build) {
  const v = CacheX.get(key);
  if (v !== null) return v;
  const d = build();
  CacheX.put(key, d, ttl);
  return d;
}

// ============================================================================
// LOG (antrean, ditulis oleh trigger flushLogs)
// ============================================================================
function queueLog(row) {                                   // [email, role, aksi, detail, target]
  const full = [uid('L'), new Date().toISOString()].concat(row);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(300)) return appendLogRows_([full]);
  try {
    const c = CacheService.getScriptCache(), q = JSON.parse(c.get('logq') || '[]');
    q.push(full);
    if (q.length >= 100) { appendLogRows_(q); c.remove('logq'); }
    else c.put('logq', JSON.stringify(q), 21600);
  } finally { lock.releaseLock(); }
}
function flushLogs() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const c = CacheService.getScriptCache(), q = JSON.parse(c.get('logq') || '[]');
    if (!q.length) return;
    appendLogRows_(q);
    c.remove('logq');
  } finally { lock.releaseLock(); }
}
function appendLogRows_(rows) {
  const sh = getSheet(SH.logs);
  const v = rows.map(function (r) { const x = r.slice(0, 7); while (x.length < 7) x.push(''); x[1] = new Date(x[1]); return x; });
  sh.getRange(sh.getLastRow() + 1, 1, v.length, 7).setValues(v);
}
function logAct(ctx, aksi, detail, target) {
  const s = (ctx && ctx.session) || {};
  queueLog([s.email || '', s.role || '', aksi, detail || '', target || '']);
}

// ============================================================================
// TOKEN HMAC (stateless) + PIN
// ============================================================================
function secret_() {
  const p = PropertiesService.getScriptProperties();
  let s = p.getProperty('TOKEN_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('TOKEN_SECRET', s); }
  return s;
}
function sign_(s) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(s, secret_())).replace(/=+$/, '');
}
function signToken(p) {
  const body = Utilities.base64EncodeWebSafe(JSON.stringify(p)).replace(/=+$/, '');
  return body + '.' + sign_(body);
}
function verifyToken(t) {
  try {
    const parts = String(t || '').split('.');
    if (parts.length !== 2 || sign_(parts[0]) !== parts[1]) return null;
    let b = parts[0];
    while (b.length % 4) b += '=';
    const p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(b)).getDataAsString());
    if (!p.x || p.x < Date.now()) return null;
    const revokedAt = Number(CacheService.getScriptCache().get('rev_' + p.e) ||
      PropertiesService.getScriptProperties().getProperty('REV_' + p.e) || 0);
    if (p.i < revokedAt) return null;
    return { email: p.e, role: p.r, nama: p.n, kode: p.k, exp: p.x };
  } catch (e) { return null; }
}
function revokeAll(email) {
  const t = String(Date.now());
  PropertiesService.getScriptProperties().setProperty('REV_' + email, t);
  CacheService.getScriptCache().put('rev_' + email, t, 21600);
}
function hashPin(pin, salt) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
/** Cek PIN dengan penguncian 5× salah → 15 menit. Mengembalikan pesan galat atau ''. */
function checkPin_(user, pin) {
  const c = CacheService.getScriptCache(), k = 'pinfail_' + lower(user.email), gagal = Number(c.get(k) || 0);
  if (gagal >= 5) return 'Akun terkunci 15 menit karena 5 kali PIN salah.';
  if (!user.pinHash || hashPin(String(pin || ''), user.pinSalt) !== user.pinHash) {
    c.put(k, String(gagal + 1), 900);
    return 'PIN salah. Sisa ' + Math.max(0, 4 - gagal) + ' percobaan.';
  }
  c.remove(k);
  return '';
}

// ============================================================================
// KONFIGURASI APLIKASI
// ============================================================================
function getConfig() {
  return cached('cfg_' + ver('cfg'), 3600, function () {
    const cfg = Object.assign({}, CONFIG_DEFAULT);
    readSheet(SH.config).forEach(function (r) { if (r.key) cfg[String(r.key)] = String(r.value); });
    return cfg;
  });
}
function publicConfig() {
  const c = getConfig(), o = {};
  CONFIG_PUBLIC.forEach(function (k) { o[k] = c[k]; });
  o.KATEGORI = String(c.KATEGORI || '').split(',').map(function (s) { return s.trim(); }).filter(String);
  o.PPN_AKTIF = bool(c.PPN_AKTIF);
  o.PPN_PERSEN = num(c.PPN_PERSEN);
  o.TARGET_HARIAN = num(c.TARGET_HARIAN);
  o.TARGET_BULANAN = num(c.TARGET_BULANAN);
  o.MODAL_AWAL_DEFAULT = num(c.MODAL_AWAL_DEFAULT);
  o.VERSION = APP.VERSION;
  return o;
}

// ============================================================================
// PUBLIK & AUTH
// ============================================================================
function apiPing() { return ok({ pong: true, app: APP.NAME, version: APP.VERSION, t: Date.now() }); }

function apiPublicInfo() {
  const c = publicConfig();
  return ok({ outlet: c.OUTLET_NAMA, cabang: c.OUTLET_CABANG, kode: c.OUTLET_KODE, terminal: c.TERMINAL,
              domain: c.EMAIL_DOMAIN, googleClientId: c.GOOGLE_CLIENT_ID, version: APP.VERSION });
}

function findUser(email) {
  const e = lower(email);
  return readSheet(SH.users).filter(function (u) { return lower(u.email) === e; })[0] || null;
}

function issueSession_(u) {
  const jam = num(getConfig().SESI_JAM) || 12;
  const token = signToken({ e: lower(u.email), r: String(u.role).toUpperCase(), n: u.nama, k: u.kode,
                            i: Date.now(), x: Date.now() + jam * 3600e3 });
  touchLastLogin_(u);
  queueLog([lower(u.email), u.role, 'LOGIN', '', '']);
  const ctx = { session: verifyToken(token) };
  return ok({ token: token, exp: ctx.session.exp, boot: bootstrapData_(ctx) }, 'Selamat datang, ' + u.nama + '!');
}

function apiLogin(ctx, d) {
  const u = findUser(d.email);
  if (!u) return fail('Akun kasir tidak terdaftar.');
  if (!bool(u.aktif)) return fail('Akun dinonaktifkan. Hubungi supervisor.');
  const err = checkPin_(u, d.pin);
  if (err) return fail(err);
  return issueSession_(u);
}

/** Login Google Workspace (GIS ID token). Butuh GOOGLE_CLIENT_ID di AppConfig. */
function apiLoginGoogle(ctx, d) {
  const cid = getConfig().GOOGLE_CLIENT_ID;
  if (!cid) return fail('Login Google belum diaktifkan. Isi GOOGLE_CLIENT_ID di Pengaturan.');
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(d.credential || ''),
    { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return fail('Token Google tidak valid.');
  const info = JSON.parse(res.getContentText());
  if (info.aud !== cid) return fail('Client ID tidak cocok.');
  if (String(info.email_verified) !== 'true') return fail('Email Google belum terverifikasi.');
  const dom = getConfig().EMAIL_DOMAIN;
  if (dom && lower(info.email).split('@')[1] !== lower(dom).replace('@', '')) return fail('Wajib memakai akun @' + dom);
  const u = findUser(info.email);
  if (!u) return fail('Email ' + info.email + ' belum didaftarkan sebagai staf.');
  if (!bool(u.aktif)) return fail('Akun dinonaktifkan.');
  return issueSession_(u);
}

function touchLastLogin_(u) {
  const last = toDate(u.lastLogin);
  if (!last || Date.now() - last.getTime() > 6 * 3600e3) {
    try { updateByKey(SH.users, 'email', u.email, { lastLogin: new Date() }); } catch (e) { }
  }
}

function apiChangePin(ctx, d) {
  const u = findUser(ctx.session.email);
  if (!u) return fail('Akun tidak ditemukan.');
  const err = checkPin_(u, d.pinLama);
  if (err) return fail(err);
  if (!/^\d{6}$/.test(String(d.pinBaru))) return fail('PIN baru harus 6 angka.');
  const salt = Utilities.getUuid();
  updateByKey(SH.users, 'email', u.email, { pinSalt: salt, pinHash: hashPin(String(d.pinBaru), salt) });
  logAct(ctx, 'GANTI_PIN', '', u.email);
  return ok(null, 'PIN berhasil diganti.');
}

// ============================================================================
// BOOTSTRAP (1 panggilan = semua data layar pertama)
// ============================================================================
function apiBootstrap(ctx) { return ok(bootstrapData_(ctx)); }

function bootstrapData_(ctx) {
  const s = ctx.session;
  return {
    user: { email: s.email, nama: s.nama, kode: s.kode, role: s.role },
    config: publicConfig(),
    products: catalog_(),
    shift: activeShift_(s.email),
    approvers: approvers_(),
    serverTime: Date.now()
  };
}

/** Daftar supervisor/owner aktif (untuk pilihan verifikator PIN). Tanpa data rahasia. */
function approvers_() {
  return readSheet(SH.users).filter(function (u) { return bool(u.aktif) && (ROLE_RANK[String(u.role).toUpperCase()] || 0) >= ROLE_RANK.SUPERVISOR; })
    .map(function (u) { return { email: lower(u.email), nama: u.nama, kode: u.kode, role: String(u.role).toUpperCase() }; });
}

// ============================================================================
// PRODUK & STOK
// ============================================================================
function productOut_(p) {
  return {
    sku: String(p.sku), barcode: String(p.barcode || ''), nama: String(p.nama || ''), deskripsi: String(p.deskripsi || ''),
    kategori: String(p.kategori || ''), harga: num(p.harga), diskon: num(p.diskon), hpp: num(p.hpp),
    stok: p.stok === '' || p.stok === null || p.stok === undefined ? null : num(p.stok), minStok: num(p.minStok),
    levelPedas: String(p.levelPedas || ''), pajak: p.pajak === '' ? true : bool(p.pajak), fotoId: String(p.fotoId || ''),
    favorit: bool(p.favorit), aktif: p.aktif === '' ? true : bool(p.aktif), diperbarui: iso(p.diperbarui)
  };
}
function catalog_() {
  return cached('cat_' + ver('prod'), 1800, function () { return readSheet(SH.produk).map(productOut_); });
}
function apiProducts() { return ok(catalog_()); }

const KAT_KODE = { 'seblak kuah': 'SBK', 'seblak kering': 'SBKR', 'topping': 'TOP', 'minuman': 'BEV' };

function apiSaveProduct(ctx, d) {
  const nama = String(d.nama || '').trim();
  if (!nama) return fail('Nama produk wajib diisi.');
  if (nama.length > 60) return fail('Nama produk maksimal 60 karakter.');
  const harga = num(d.harga);
  if (harga <= 0) return fail('Harga jual harus lebih dari 0.');
  const rows = readSheet(SH.produk);
  let sku = String(d.sku || '').trim().toUpperCase();
  const isNew = !d.originalSku;
  if (!sku) {
    const pre = 'SKU-' + (KAT_KODE[lower(d.kategori)] || 'PRD') + '-';
    let n = 0;
    rows.forEach(function (r) { if (String(r.sku).indexOf(pre) === 0) n = Math.max(n, num(String(r.sku).slice(pre.length))); });
    sku = pre + ('00' + (n + 1)).slice(-3);
  }
  const dup = rows.filter(function (r) { return String(r.sku).toUpperCase() === sku; })[0];
  if (isNew && dup) return fail('SKU ' + sku + ' sudah dipakai.');
  if (!isNew && String(d.originalSku).toUpperCase() !== sku && dup) return fail('SKU ' + sku + ' sudah dipakai.');

  const rec = {
    sku: sku, barcode: String(d.barcode || ''), nama: nama, deskripsi: String(d.deskripsi || '').slice(0, 500),
    kategori: String(d.kategori || ''), harga: harga, diskon: num(d.diskon), hpp: num(d.hpp),
    stok: d.stok === null || d.stok === '' || d.stok === undefined ? '' : num(d.stok), minStok: num(d.minStok),
    levelPedas: String(d.levelPedas || ''), pajak: d.pajak === false ? 'FALSE' : 'TRUE',
    fotoId: String(d.fotoId || ''), favorit: d.favorit ? 'TRUE' : 'FALSE',
    aktif: d.aktif === false ? 'FALSE' : 'TRUE', diperbarui: new Date()
  };
  if (isNew) {
    appendObjects(SH.produk, [rec]);
    if (rec.stok !== '') appendObjects(SH.stok, [{ id: uid('S'), waktu: new Date(), sku: sku, delta: rec.stok, stokAkhir: rec.stok,
      alasan: 'Stok awal', ref: '', oleh: ctx.session.email }]);
  } else {
    const old = rows.filter(function (r) { return String(r.sku) === String(d.originalSku); })[0];
    if (!old) return fail('Produk tidak ditemukan.');
    updateByKey(SH.produk, 'sku', d.originalSku, rec);
    const delta = rec.stok === '' ? 0 : rec.stok - num(old.stok);
    if (delta) appendObjects(SH.stok, [{ id: uid('S'), waktu: new Date(), sku: sku, delta: delta, stokAkhir: rec.stok,
      alasan: 'Edit produk', ref: '', oleh: ctx.session.email }]);
  }
  bump('prod');
  logAct(ctx, isNew ? 'PRODUK_TAMBAH' : 'PRODUK_UBAH', nama, sku);
  return ok(productOut_(rec), isNew ? 'Menu baru dipublikasikan ke POS.' : 'Perubahan disimpan.');
}

function apiArchiveProduct(ctx, d) {
  const n = updateByKey(SH.produk, 'sku', d.sku, { aktif: d.aktif ? 'TRUE' : 'FALSE', diperbarui: new Date() });
  if (!n) return fail('Produk tidak ditemukan.');
  bump('prod');
  logAct(ctx, d.aktif ? 'PRODUK_AKTIF' : 'PRODUK_ARSIP', '', d.sku);
  return ok({ sku: d.sku, aktif: !!d.aktif }, d.aktif ? 'Produk diaktifkan kembali.' : 'Produk diarsipkan (disembunyikan dari kasir).');
}

function apiAdjustStock(ctx, d) {
  const p = readSheet(SH.produk).filter(function (r) { return String(r.sku) === String(d.sku); })[0];
  if (!p) return fail('Produk tidak ditemukan.');
  const lama = num(p.stok);
  const baru = d.set !== undefined && d.set !== null && d.set !== '' ? num(d.set) : lama + num(d.delta);
  if (baru < 0) return fail('Stok tidak boleh minus.');
  updateByKey(SH.produk, 'sku', d.sku, { stok: baru, diperbarui: new Date() });
  appendObjects(SH.stok, [{ id: uid('S'), waktu: new Date(), sku: d.sku, delta: baru - lama, stokAkhir: baru,
    alasan: String(d.alasan || 'Penyesuaian'), ref: '', oleh: ctx.session.email }]);
  bump('prod');
  return ok({ sku: d.sku, stok: baru }, 'Stok diperbarui: ' + baru);
}

function apiStockHistory(ctx, d) {
  const rows = readTail(SH.stok, 300).filter(function (r) { return !d.sku || String(r.sku) === String(d.sku); });
  return ok(rows.reverse().slice(0, 100).map(function (r) {
    return { waktu: iso(r.waktu), sku: r.sku, delta: num(r.delta), stokAkhir: num(r.stokAkhir), alasan: r.alasan, ref: r.ref, oleh: r.oleh };
  }));
}

function apiUploadPhoto(ctx, d) {
  if (!d.base64) return fail('Berkas kosong.');
  const bytes = Utilities.base64Decode(String(d.base64).replace(/^data:[^,]+,/, ''));
  if (bytes.length > 5 * 1024 * 1024) return fail('Ukuran maksimal 5 MB.');
  const mime = /^image\/(jpeg|png|webp)$/.test(d.mime) ? d.mime : 'image/jpeg';
  const blob = Utilities.newBlob(bytes, mime, String(d.name || 'foto-menu.jpg').replace(/[^\w.\-]/g, '_'));
  const file = DriveApp.getFolderById(CONFIG.UPLOADS_FOLDER).createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* kebijakan Workspace */ }
  return ok({ id: file.getId(), name: file.getName(), size: bytes.length }, 'Foto tersimpan di Google Drive.');
}

// ============================================================================
// TRANSAKSI
// ============================================================================
function nextSeq_(prefix, day) {
  const p = PropertiesService.getScriptProperties(), k = 'SEQ_' + prefix + '_' + day;
  const n = num(p.getProperty(k)) + 1;
  p.setProperty(k, String(n));
  return n;
}

function trxOut_(t) {
  return {
    id: String(t.id), waktu: iso(t.waktu), tanggal: dkey(t.tanggal || t.waktu), shiftId: t.shiftId,
    kasirEmail: t.kasirEmail, kasirNama: t.kasirNama, terminal: t.terminal, tipe: t.tipe, meja: String(t.meja || ''),
    pelanggan: String(t.pelanggan || ''), items: parseJson(t.items, []), jmlItem: num(t.jmlItem),
    subtotal: num(t.subtotal), diskon: num(t.diskon), dpp: num(t.dpp), ppn: num(t.ppn), total: num(t.total),
    metode: t.metode, bayar: num(t.bayar), kembalian: num(t.kembalian), detailBayar: parseJson(t.detailBayar, []),
    status: t.status, catatan: String(t.catatan || ''), voidOleh: t.voidOleh || '', voidAlasan: t.voidAlasan || ''
  };
}

/**
 * Hitung ulang keranjang di server (harga dari katalog, bukan dari klien).
 * items: [{sku, qty, level, catatan}]
 */
function priceCart_(items, diskonOrder) {
  const cfg = publicConfig();
  const map = {};
  readSheet(SH.produk).forEach(function (p) { map[String(p.sku)] = productOut_(p); });
  let subtotal = 0, taxable = 0, jml = 0;
  const lines = [];
  (items || []).forEach(function (it) {
    const p = map[String(it.sku)];
    if (!p) throw new Error('Produk ' + it.sku + ' tidak ditemukan.');
    if (!p.aktif) throw new Error(p.nama + ' sedang tidak dijual.');
    const qty = Math.max(1, Math.floor(num(it.qty)));
    const harga = Math.max(0, p.harga - p.diskon);
    const sub = harga * qty;
    subtotal += sub; jml += qty;
    if (p.pajak) taxable += sub;
    lines.push({ sku: p.sku, nama: p.nama, kategori: p.kategori, qty: qty, harga: harga, subtotal: sub,
                 level: it.level === undefined || it.level === null || it.level === '' ? null : Number(it.level),
                 catatan: String(it.catatan || '').slice(0, 120) });
  });
  if (!lines.length) throw new Error('Keranjang kosong.');
  const diskon = Math.min(subtotal, Math.max(0, Math.round(num(diskonOrder))));
  const dpp = subtotal - diskon;
  const taxBase = subtotal ? dpp * (taxable / subtotal) : 0;
  const ppn = cfg.PPN_AKTIF ? Math.round(taxBase * cfg.PPN_PERSEN / 100) : 0;
  return { lines: lines, subtotal: subtotal, diskon: diskon, dpp: dpp, ppn: ppn, total: dpp + ppn, jmlItem: jml, map: map };
}

function apiCreateTransaction(ctx, d) {
  const s = ctx.session;
  const shift = activeShift_(s.email);
  if (!shift) return fail('Shift belum dibuka. Buka shift dengan modal awal terlebih dahulu.', { code: 'NO_SHIFT' });

  let cart;
  try { cart = priceCart_(d.items, d.diskon); } catch (e) { return fail(errMsg(e)); }

  // Stok: cek & kurangi (stok kosong '' = tidak dilacak)
  const need = {};
  cart.lines.forEach(function (l) { need[l.sku] = (need[l.sku] || 0) + l.qty; });
  const patches = {}, stokLog = [], stokBaru = {};
  for (const sku in need) {
    const p = cart.map[sku];
    if (p.stok === null) continue;
    if (p.stok < need[sku]) return fail('Stok ' + p.nama + ' tinggal ' + p.stok + '.', { code: 'STOCK', sku: sku, stok: p.stok });
    stokBaru[sku] = p.stok - need[sku];
    patches[sku] = { stok: stokBaru[sku] };
  }

  // Pembayaran
  const total = cart.total;
  let detail = [];
  if (Array.isArray(d.split) && d.split.length) {
    detail = d.split.map(function (x) { return { metode: String(x.metode).toUpperCase(), jumlah: Math.round(num(x.jumlah)) }; })
      .filter(function (x) { return METODE.indexOf(x.metode) > -1 && x.jumlah > 0; });
  } else {
    const m = String(d.metode || 'TUNAI').toUpperCase();
    if (METODE.indexOf(m) < 0) return fail('Metode bayar tidak dikenal.');
    detail = [{ metode: m, jumlah: m === 'TUNAI' ? Math.round(num(d.bayar)) : total }];
  }
  const dibayar = detail.reduce(function (a, x) { return a + x.jumlah; }, 0);
  if (dibayar < total) return fail('Uang diterima kurang Rp' + (total - dibayar).toLocaleString('id-ID') + '.');
  const nonTunai = detail.filter(function (x) { return x.metode !== 'TUNAI'; }).reduce(function (a, x) { return a + x.jumlah; }, 0);
  if (nonTunai > total) return fail('Pembayaran non-tunai melebihi tagihan.');
  const kembalian = dibayar - total;
  // simpan porsi TUNAI bersih (setelah kembalian) agar rekonsiliasi laci benar
  detail = detail.map(function (x) { return x.metode === 'TUNAI' ? { metode: 'TUNAI', jumlah: x.jumlah - kembalian, diterima: x.jumlah } : x; });

  const now = new Date(), day = fmt(now, 'yyyyMMdd');
  const id = 'TRX-' + day + '-' + ('000' + nextSeq_('TRX', day)).slice(-4);
  const cfg = publicConfig();
  const tipe = ['DINE_IN', 'TAKE_AWAY', 'ONLINE'].indexOf(d.tipe) > -1 ? d.tipe : 'DINE_IN';
  const rec = {
    id: id, waktu: now, tanggal: dayKey(now), shiftId: shift.id, kasirEmail: s.email, kasirNama: s.nama,
    terminal: cfg.TERMINAL, tipe: tipe, meja: String(d.meja || ''), pelanggan: String(d.pelanggan || '').slice(0, 60),
    items: JSON.stringify(cart.lines), jmlItem: cart.jmlItem, subtotal: cart.subtotal, diskon: cart.diskon, dpp: cart.dpp,
    ppn: cart.ppn, total: total, metode: detail.length > 1 ? 'SPLIT' : detail[0].metode, bayar: dibayar, kembalian: kembalian,
    detailBayar: JSON.stringify(detail), status: 'LUNAS', catatan: String(d.catatan || '').slice(0, 200), voidOleh: '', voidAlasan: ''
  };
  appendObjects(SH.trx, [rec]);
  if (Object.keys(patches).length) {
    updateWhere(SH.produk, 'sku', patches);
    Object.keys(patches).forEach(function (sku) {
      stokLog.push({ id: uid('S'), waktu: now, sku: sku, delta: -need[sku], stokAkhir: stokBaru[sku], alasan: 'Penjualan', ref: id, oleh: s.email });
    });
    appendObjects(SH.stok, stokLog);
    bump('prod');
  }
  bump('trx');
  queueLog([s.email, s.role, 'TRANSAKSI', 'Rp' + total, id]);
  return ok({ trx: trxOut_(rec), stok: stokBaru }, 'Transaksi ' + id + ' lunas.');
}

function apiVoidTransaction(ctx, d) {
  const s = ctx.session;
  let approver = s;
  if ((ROLE_RANK[s.role] || 0) < ROLE_RANK.SUPERVISOR) {
    const spv = findUser(d.spvEmail);
    if (!spv || (ROLE_RANK[String(spv.role).toUpperCase()] || 0) < ROLE_RANK.SUPERVISOR) return fail('Void butuh otorisasi supervisor.');
    const err = checkPin_(spv, d.spvPin);
    if (err) return fail(err);
    approver = { email: lower(spv.email), nama: spv.nama };
  }
  if (String(d.alasan || '').trim().length < 3) return fail('Alasan void wajib diisi.');
  const t = readTail(SH.trx, 3000).filter(function (r) { return String(r.id) === String(d.id); })[0];
  if (!t) return fail('Transaksi tidak ditemukan.');
  if (t.status === 'VOID') return fail('Transaksi sudah di-void.');
  const sh = readSheet(SH.shift).filter(function (r) { return r.id === t.shiftId; })[0];
  if (sh && sh.status === 'DITUTUP') return fail('Shift transaksi ini sudah ditutup. Void tidak diizinkan.');
  updateByKey(SH.trx, 'id', d.id, { status: 'VOID', voidOleh: approver.email, voidAlasan: String(d.alasan).slice(0, 200) });
  // kembalikan stok
  const items = parseJson(t.items, []), prod = {};
  readSheet(SH.produk).forEach(function (p) { prod[String(p.sku)] = p; });
  const patches = {}, logs = [];
  items.forEach(function (l) {
    const p = prod[l.sku];
    if (!p || p.stok === '' || p.stok === null) return;
    const cur = patches[l.sku] ? patches[l.sku].stok : num(p.stok);
    patches[l.sku] = { stok: cur + l.qty };
  });
  if (Object.keys(patches).length) {
    updateWhere(SH.produk, 'sku', patches);
    Object.keys(patches).forEach(function (sku) {
      logs.push({ id: uid('S'), waktu: new Date(), sku: sku, delta: patches[sku].stok - num(prod[sku].stok), stokAkhir: patches[sku].stok, alasan: 'Void', ref: d.id, oleh: approver.email });
    });
    appendObjects(SH.stok, logs);
    bump('prod');
  }
  bump('trx');
  queueLog([s.email, s.role, 'VOID', String(d.alasan), d.id]);
  return ok({ id: d.id, status: 'VOID' }, 'Transaksi ' + d.id + ' dibatalkan.');
}

function apiTransactions(ctx, d) {
  const n = Math.min(num(d.limit) || 50, 500);
  const q = lower(d.q);
  let rows = readTail(SH.trx, 2000).map(trxOut_).reverse();
  if (d.tanggal) rows = rows.filter(function (t) { return t.tanggal === d.tanggal; });
  if (d.shiftId) rows = rows.filter(function (t) { return t.shiftId === d.shiftId; });
  if (q) rows = rows.filter(function (t) { return lower(t.id + ' ' + t.pelanggan + ' ' + t.meja + ' ' + t.kasirNama).indexOf(q) > -1; });
  return ok(rows.slice(0, n));
}

function apiTransaction(ctx, d) {
  const t = readTail(SH.trx, 5000).filter(function (r) { return String(r.id) === String(d.id); })[0];
  return t ? ok(trxOut_(t)) : fail('Transaksi tidak ditemukan.');
}

// ============================================================================
// DASHBOARD
// ============================================================================
function todayTrx_(day) {
  return readTail(SH.trx, 2500).map(trxOut_).filter(function (t) { return t.tanggal === day && t.status === 'LUNAS'; });
}

function apiDashboard(ctx) {
  return ok(cached('dash_' + ver('trx') + '_' + ver('prod') + '_' + dayKey(), 120, buildDashboard_));
}

function buildDashboard_() {
  const now = new Date(), today = dayKey(now), yest = dayKey(new Date(now.getTime() - 864e5));
  const all = readTail(SH.trx, 2500).map(trxOut_).filter(function (t) { return t.status === 'LUNAS'; });
  const T = all.filter(function (t) { return t.tanggal === today; });
  const Y = all.filter(function (t) { return t.tanggal === yest; });
  const sum = function (arr, k) { return arr.reduce(function (a, x) { return a + num(x[k]); }, 0); };
  const cfg = publicConfig();
  const omzet = sum(T, 'total'), omzetY = sum(Y, 'total');

  // per jam 09–21
  const jam = [];
  for (let h = 9; h <= 21; h++) jam.push({ jam: ('0' + h).slice(-2) + ':00', omzet: 0, qty: 0 });
  T.forEach(function (t) {
    const h = Number(fmt(t.waktu, 'H'));
    const b = jam[Math.min(Math.max(h - 9, 0), jam.length - 1)];
    b.omzet += t.total; b.qty += t.jmlItem;
  });

  // menu & topping
  const menu = {}, levels = {}, trxDenganSeblak = { n: 0 };
  let mangkok = 0;
  T.forEach(function (t) {
    let adaSeblak = false;
    t.items.forEach(function (l) {
      const m = menu[l.sku] || (menu[l.sku] = { sku: l.sku, nama: l.nama, kategori: l.kategori, qty: 0, omzet: 0, trx: 0, harga: l.harga });
      m.qty += l.qty; m.omzet += l.subtotal; m.trx++;
      if (/seblak/i.test(l.kategori || '')) {
        adaSeblak = true; mangkok += l.qty;
        if (l.level !== null && l.level !== undefined) levels[l.level] = (levels[l.level] || 0) + l.qty;
      }
    });
    if (adaSeblak) trxDenganSeblak.n++;
  });
  const menuArr = Object.keys(menu).map(function (k) { return menu[k]; }).sort(function (a, b) { return b.qty - a.qty; });
  const prodMap = {};
  catalog_().forEach(function (p) { prodMap[p.sku] = p; });
  const topping = menuArr.filter(function (m) { return /topping/i.test(m.kategori || ''); }).slice(0, 3).map(function (m) {
    const p = prodMap[m.sku] || {};
    return Object.assign({}, m, { stok: p.stok, minStok: p.minStok, fotoId: p.fotoId,
      persen: trxDenganSeblak.n ? Math.round(m.trx / trxDenganSeblak.n * 100) : 0 });
  });
  let favLevel = null, favN = 0;
  Object.keys(levels).forEach(function (l) { if (levels[l] > favN) { favN = levels[l]; favLevel = Number(l); } });

  const menipis = catalog_().filter(function (p) { return p.aktif && p.stok !== null && p.stok <= (p.minStok || 10); })
    .sort(function (a, b) { return a.stok - b.stok; });
  const nonTunai = T.reduce(function (a, t) {
    return a + t.detailBayar.filter(function (x) { return x.metode !== 'TUNAI'; }).reduce(function (s, x) { return s + num(x.jumlah); }, 0);
  }, 0);
  const peak = jam.slice().sort(function (a, b) { return b.omzet - a.omzet; });
  const siang = jam.filter(function (j) { return Number(j.jam.slice(0, 2)) < 16; }).sort(function (a, b) { return b.omzet - a.omzet; })[0];
  const malam = jam.filter(function (j) { return Number(j.jam.slice(0, 2)) >= 16; }).sort(function (a, b) { return b.omzet - a.omzet; })[0];

  return {
    tanggal: today,
    omzet: omzet, omzetKemarin: omzetY, growth: omzetY ? Math.round((omzet - omzetY) / omzetY * 1000) / 10 : null,
    target: cfg.TARGET_HARIAN, jmlTrx: T.length,
    dineIn: T.filter(function (t) { return t.tipe === 'DINE_IN'; }).length,
    takeAway: T.filter(function (t) { return t.tipe !== 'DINE_IN'; }).length,
    avgBasket: T.length ? Math.round(omzet / T.length) : 0,
    avgItem: T.length ? Math.round(sum(T, 'jmlItem') / T.length * 10) / 10 : 0,
    terlaris: menuArr.filter(function (m) { return !/topping|minuman/i.test(m.kategori || ''); })[0] || menuArr[0] || null,
    topMenu: menuArr.slice(0, 5),
    topping: topping,
    perJam: jam, puncakSiang: siang && siang.omzet ? siang : null, puncakMalam: malam && malam.omzet ? malam : null,
    menipis: menipis.slice(0, 6), jmlMenipis: menipis.length,
    favLevel: favLevel, favLevelPersen: mangkok ? Math.round(favN / mangkok * 1000) / 10 : 0,
    nonTunaiPersen: omzet ? Math.round(nonTunai / omzet * 1000) / 10 : 0,
    terbaru: T.slice(-5).reverse(),
    peak: peak[0] && peak[0].omzet ? peak[0] : null
  };
}

// ============================================================================
// LAPORAN
// ============================================================================
function apiReport(ctx, d) {
  const to = d.to || dayKey(), from = d.from || dayKey(new Date(Date.now() - 6 * 864e5));
  if (from > to) return fail('Tanggal awal melebihi tanggal akhir.');
  return ok(cached('rep_' + ver('trx') + '_' + from + '_' + to, 600, function () { return buildReport_(from, to); }));
}

function buildReport_(from, to) {
  const rows = readSheet(SH.trx).map(trxOut_).filter(function (t) { return t.tanggal >= from && t.tanggal <= to; });
  const ok_ = rows.filter(function (t) { return t.status === 'LUNAS'; });
  const shifts = readSheet(SH.shift);
  const days = {};
  // isi semua tanggal dalam rentang (maks 400 hari)
  let k = from, guard = 0;
  while (k <= to && guard++ < 400) {
    days[k] = { tanggal: k, trx: 0, gross: 0, diskon: 0, ppn: 0, netto: 0, void: 0, tunai: 0, nonTunai: 0, statusShift: '' };
    k = addDays(k, 1);
  }
  rows.forEach(function (t) {
    const x = days[t.tanggal]; if (!x) return;
    if (t.status !== 'LUNAS') { x.void++; return; }
    x.trx++; x.gross += t.subtotal; x.diskon += t.diskon; x.ppn += t.ppn; x.netto += t.total;
    t.detailBayar.forEach(function (b) { if (b.metode === 'TUNAI') x.tunai += num(b.jumlah); else x.nonTunai += num(b.jumlah); });
  });
  shifts.forEach(function (s) {
    const k = dkey(s.buka); if (!days[k]) return;
    if (s.status === 'AKTIF') days[k].statusShift = 'AKTIF';
    else if (days[k].statusShift !== 'AKTIF') days[k].statusShift = 'DITUTUP';
  });
  const harian = Object.keys(days).sort().map(function (k) { return days[k]; });
  const menu = {}, metode = {};
  ok_.forEach(function (t) {
    t.items.forEach(function (l) {
      const m = menu[l.sku] || (menu[l.sku] = { sku: l.sku, nama: l.nama, kategori: l.kategori, qty: 0, omzet: 0 });
      m.qty += l.qty; m.omzet += l.subtotal;
    });
    t.detailBayar.forEach(function (b) { metode[b.metode] = (metode[b.metode] || 0) + num(b.jumlah); });
  });
  const menuArr = Object.keys(menu).map(function (k) { return menu[k]; }).sort(function (a, b) { return b.qty - a.qty; });
  const totalQty = menuArr.reduce(function (a, m) { return a + m.qty; }, 0);
  const top5 = menuArr.slice(0, 5);
  const tot = harian.reduce(function (a, x) {
    a.trx += x.trx; a.gross += x.gross; a.diskon += x.diskon; a.ppn += x.ppn; a.netto += x.netto; a.void += x.void; return a;
  }, { trx: 0, gross: 0, diskon: 0, ppn: 0, netto: 0, void: 0 });
  // periode sebelumnya (panjang sama) untuk perbandingan
  const len = harian.length || 1;
  const pFrom = addDays(from, -len), pTo = addDays(from, -1);
  const prevTrx = readSheet(SH.trx).map(trxOut_).filter(function (t) { return t.status === 'LUNAS' && t.tanggal >= pFrom && t.tanggal <= pTo; }).length;
  const cfg = publicConfig();
  return {
    from: from, to: to, harian: harian, total: tot,
    rataHarian: Math.round(tot.gross / len),
    growthTrx: prevTrx ? Math.round((tot.trx - prevTrx) / prevTrx * 1000) / 10 : null,
    topMenu: top5, kontribusiTop: totalQty ? Math.round(top5.reduce(function (a, m) { return a + m.qty; }, 0) / totalQty * 1000) / 10 : 0,
    metode: metode,
    target: cfg.TARGET_HARIAN, targetBulanan: cfg.TARGET_BULANAN,
    capaianBulanan: cfg.TARGET_BULANAN ? Math.round(tot.gross / cfg.TARGET_BULANAN * 1000) / 10 : null
  };
}

// ============================================================================
// SHIFT KASIR
// ============================================================================
function shiftOut_(s) {
  return {
    id: s.id, terminal: s.terminal, kasirEmail: s.kasirEmail, kasirNama: s.kasirNama, buka: iso(s.buka), tutup: iso(s.tutup),
    modalAwal: num(s.modalAwal), tunai: num(s.tunai), qris: num(s.qris), edc: num(s.edc), ewallet: num(s.ewallet),
    total: num(s.total), jmlTrx: num(s.jmlTrx), kasSistem: num(s.kasSistem), kasFisik: num(s.kasFisik), selisih: num(s.selisih),
    denominasi: parseJson(s.denominasi, {}), supervisor: s.supervisor || '', waktuOtorisasi: iso(s.waktuOtorisasi),
    catatan: s.catatan || '', status: s.status
  };
}
function activeShift_(email) {
  const e = lower(email);
  const s = readSheet(SH.shift).filter(function (r) { return lower(r.kasirEmail) === e && r.status === 'AKTIF'; }).pop();
  return s ? shiftOut_(s) : null;
}

function apiOpenShift(ctx, d) {
  const s = ctx.session, ada = activeShift_(s.email);
  if (ada) return ok(ada, 'Shift sudah aktif.');
  const modal = Math.round(num(d.modalAwal));
  if (modal < 0) return fail('Modal awal tidak valid.');
  const now = new Date(), day = fmt(now, 'yyyyMMdd');
  const rec = { id: 'SHF-' + day + '-' + ('0' + nextSeq_('SHF', day)).slice(-2), terminal: publicConfig().TERMINAL,
    kasirEmail: s.email, kasirNama: s.nama, buka: now, tutup: '', modalAwal: modal, tunai: 0, qris: 0, edc: 0, ewallet: 0,
    total: 0, jmlTrx: 0, kasSistem: modal, kasFisik: '', selisih: '', denominasi: '', supervisor: '', waktuOtorisasi: '',
    catatan: '', status: 'AKTIF' };
  appendObjects(SH.shift, [rec]);
  bump('trx');
  logAct(ctx, 'SHIFT_BUKA', 'Modal Rp' + modal, rec.id);
  return ok(shiftOut_(rec), 'Shift dibuka. Selamat bekerja!');
}

function summarizeShift_(shift) {
  const T = readTail(SH.trx, 3000).map(trxOut_).filter(function (t) { return t.shiftId === shift.id; });
  const L = T.filter(function (t) { return t.status === 'LUNAS'; });
  const ch = { TUNAI: { jumlah: 0, trx: 0 }, QRIS: { jumlah: 0, trx: 0 }, EDC: { jumlah: 0, trx: 0 }, EWALLET: { jumlah: 0, trx: 0 } };
  L.forEach(function (t) {
    t.detailBayar.forEach(function (b) { const c = ch[b.metode]; if (c) { c.jumlah += num(b.jumlah); c.trx++; } });
  });
  const total = L.reduce(function (a, t) { return a + t.total; }, 0);
  return { shift: shift, kanal: ch, total: total, jmlTrx: L.length, jmlVoid: T.length - L.length,
           kasSistem: shift.modalAwal + ch.TUNAI.jumlah, ppn: L.reduce(function (a, t) { return a + t.ppn; }, 0),
           diskon: L.reduce(function (a, t) { return a + t.diskon; }, 0) };
}

function apiShiftSummary(ctx, d) {
  const sh = d && d.id ? readSheet(SH.shift).filter(function (r) { return r.id === d.id; }).map(shiftOut_)[0] : activeShift_(ctx.session.email);
  if (!sh) return ok(null, 'Tidak ada shift aktif.');
  return ok(summarizeShift_(sh));
}

function apiShifts(ctx, d) {
  let rows = readSheet(SH.shift).map(shiftOut_);
  if ((ROLE_RANK[ctx.session.role] || 0) < ROLE_RANK.SUPERVISOR) rows = rows.filter(function (r) { return lower(r.kasirEmail) === lower(ctx.session.email); });
  return ok(rows.reverse().slice(0, Math.min(num(d && d.limit) || 60, 300)));
}

const DENOM = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

function apiCloseShift(ctx, d) {
  const s = ctx.session, sh = activeShift_(s.email);
  if (!sh) return fail('Tidak ada shift aktif.');
  const spv = findUser(d.spvEmail);
  if (!spv || (ROLE_RANK[String(spv.role).toUpperCase()] || 0) < ROLE_RANK.SUPERVISOR || !bool(spv.aktif))
    return fail('Verifikator harus akun Supervisor/Owner yang aktif.');
  const err = checkPin_(spv, d.spvPin);
  if (err) return fail(err);
  const den = {};
  let fisik = 0;
  DENOM.forEach(function (v) { const n = Math.max(0, Math.floor(num((d.denominasi || {})[v]))); if (n) { den[v] = n; fisik += v * n; } });
  const sum = summarizeShift_(sh);
  const selisih = fisik - sum.kasSistem;
  const now = new Date();
  const patch = { tutup: now, tunai: sum.kanal.TUNAI.jumlah, qris: sum.kanal.QRIS.jumlah, edc: sum.kanal.EDC.jumlah,
    ewallet: sum.kanal.EWALLET.jumlah, total: sum.total, jmlTrx: sum.jmlTrx, kasSistem: sum.kasSistem, kasFisik: fisik,
    selisih: selisih, denominasi: JSON.stringify(den), supervisor: spv.nama + ' (' + (spv.kode || spv.email) + ')',
    waktuOtorisasi: now, catatan: String(d.catatan || '').slice(0, 200), status: 'DITUTUP' };
  updateByKey(SH.shift, 'id', sh.id, patch);
  bump('trx');
  logAct(ctx, 'SHIFT_TUTUP', 'Selisih Rp' + selisih, sh.id);
  const out = Object.assign({}, sum, { shift: shiftOut_(Object.assign({}, sh, patch, { buka: sh.buka })) , kasFisik: fisik, selisih: selisih });
  return ok(out, selisih === 0 ? 'Shift ditutup. Kas seimbang.' : 'Shift ditutup dengan selisih Rp' + selisih.toLocaleString('id-ID') + '.');
}

// ============================================================================
// PENGGUNA & PENGATURAN
// ============================================================================
function userOut_(u) {
  return { id: u.id, email: lower(u.email), nama: u.nama, kode: u.kode, role: String(u.role).toUpperCase(), outlet: u.outlet,
           aktif: bool(u.aktif), lastLogin: iso(u.lastLogin), adaPin: !!u.pinHash };
}
function apiUsers() { return ok(readSheet(SH.users).map(userOut_)); }

function apiSaveUser(ctx, d) {
  const email = lower(d.email);
  if (!/^[^@\s]+@[^@\s]+$/.test(email)) return fail('Email tidak valid.');
  const role = String(d.role || 'KASIR').toUpperCase();
  if (!ROLE_RANK[role]) return fail('Peran tidak valid.');
  if (d.pin && !/^\d{6}$/.test(String(d.pin))) return fail('PIN harus 6 angka.');
  const ada = findUser(email);
  const rec = { email: email, nama: String(d.nama || '').trim() || email, kode: String(d.kode || '').trim(), role: role,
                outlet: String(d.outlet || ''), aktif: d.aktif === false ? 'FALSE' : 'TRUE' };
  if (d.pin) { rec.pinSalt = Utilities.getUuid(); rec.pinHash = hashPin(String(d.pin), rec.pinSalt); }
  if (ada) {
    if (lower(ctx.session.email) === email && role !== 'OWNER') return fail('Anda tidak dapat menurunkan peran akun sendiri.');
    updateByKey(SH.users, 'email', ada.email, rec);
    if (rec.aktif === 'FALSE' || d.pin) revokeAll(email);
  } else {
    if (!d.pin) return fail('PIN awal wajib diisi untuk staf baru.');
    rec.id = uid('U'); rec.dibuat = new Date(); rec.lastLogin = '';
    appendObjects(SH.users, [rec]);
  }
  logAct(ctx, ada ? 'USER_UBAH' : 'USER_TAMBAH', role, email);
  return ok(userOut_(Object.assign({}, ada || {}, rec)), 'Data staf disimpan.');
}

function apiSettings() {
  const c = getConfig(), o = {};
  CONFIG_PUBLIC.forEach(function (k) { o[k] = c[k]; });
  return ok(o);
}

function apiSaveSettings(ctx, d) {
  const sh = getSheet(SH.config), v = sh.getDataRange().getValues();
  const idx = {};
  for (let i = 1; i < v.length; i++) idx[String(v[i][0])] = i;
  const tambah = [];
  Object.keys(d || {}).forEach(function (k) {
    if (CONFIG_PUBLIC.indexOf(k) < 0) return;
    const val = String(d[k] === undefined || d[k] === null ? '' : d[k]);
    if (idx[k] !== undefined) v[idx[k]][1] = val; else tambah.push([k, val, '']);
  });
  sh.getRange(1, 1, v.length, v[0].length).setValues(v);
  if (tambah.length) sh.getRange(v.length + 1, 1, tambah.length, 3).setValues(tambah);
  invalidateRows(SH.config);
  bump('cfg');
  logAct(ctx, 'PENGATURAN', Object.keys(d || {}).join(','), '');
  return ok(publicConfig(), 'Pengaturan disimpan.');
}

function apiLogs(ctx, d) {
  const sheetRows = readTail(SH.logs, 200).map(function (r) { return { id: r.id, waktu: iso(r.waktu), email: r.email, role: r.role, aksi: r.aksi, detail: r.detail, target: r.target }; });
  const q = JSON.parse(CacheService.getScriptCache().get('logq') || '[]').map(function (r) {
    return { id: r[0], waktu: r[1], email: r[2], role: r[3], aksi: r[4], detail: r[5], target: r[6], antre: true };
  });
  return ok(sheetRows.concat(q).sort(function (a, b) { return a.waktu < b.waktu ? 1 : -1; }).slice(0, 200));
}

// ============================================================================
// SETUP — Jalankan SEKALI dari editor Apps Script
// ============================================================================
function setupAppEnvironment() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('SPREADSHEET_ID')) {
    Logger.log('⚠️ Setup sudah pernah dijalankan. Spreadsheet: ' + props.getProperty('SPREADSHEET_ID'));
    Logger.log('   Untuk menambah sheet/kolom baru setelah upgrade, jalankan migrateSchema().');
    return;
  }
  Logger.log('🚀 Memulai setup ' + APP.NAME + '...');
  const root = DriveApp.createFolder('📁 ' + APP.NAME);
  const uploads = root.createFolder('📂 Foto Menu');
  const exportsF = root.createFolder('📂 Dokumen Terbit');
  const templates = root.createFolder('📂 Template Dokumen');

  const ss = SpreadsheetApp.create('🗃️ Database — ' + APP.NAME);
  DriveApp.getFileById(ss.getId()).moveTo(root);
  props.setProperties({
    SPREADSHEET_ID: ss.getId(), ROOT_FOLDER_ID: root.getId(), UPLOADS_FOLDER: uploads.getId(),
    EXPORTS_FOLDER: exportsF.getId(), TEMPLATES_FOLDER: templates.getId()
  });
  _SS = ss;

  // AppConfig
  const cfg = ss.getSheets()[0].setName(SH.config);
  const cfgRows = [['key', 'value', 'keterangan']];
  Object.keys(CONFIG_DEFAULT).forEach(function (k) { cfgRows.push([k, CONFIG_DEFAULT[k], '']); });
  [['SPREADSHEET_ID', ss.getId(), 'ID spreadsheet ini (catatan)'], ['ROOT_FOLDER_ID', root.getId(), 'Folder Drive aplikasi'],
   ['CREATED_AT', new Date().toISOString(), 'Tanggal setup']].forEach(function (r) { cfgRows.push(r); });
  cfg.getRange(1, 1, cfgRows.length, 3).setNumberFormat('@').setValues(cfgRows);
  styleHeader_(cfg, 3);

  migrateSchema();

  // Data awal
  const owner = lower(Session.getEffectiveUser().getEmail()) || 'owner@dapoermitoha.internal';
  const users = [
    { email: owner, nama: 'Owner Outlet', kode: 'OWN-001', role: 'OWNER', pin: '123456' },
    { email: 'spv01@dapoermitoha.internal', nama: 'Hendra Wijaya', kode: 'SPV-008', role: 'SUPERVISOR', pin: '222222' },
    { email: 'kasir01@dapoermitoha.internal', nama: 'Siti Rahmawati', kode: 'CS-0042', role: 'KASIR', pin: '111111' }
  ].map(function (u) {
    const salt = Utilities.getUuid();
    return { id: uid('U'), email: u.email, nama: u.nama, kode: u.kode, role: u.role, pinHash: hashPin(u.pin, salt), pinSalt: salt,
             outlet: CONFIG_DEFAULT.OUTLET_CABANG, aktif: 'TRUE', lastLogin: '', dibuat: new Date() };
  });
  appendObjects(SH.users, users);
  appendObjects(SH.produk, sampleProducts_());

  try {
    ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'flushLogs') ScriptApp.deleteTrigger(t); });
    ScriptApp.newTrigger('flushLogs').timeBased().everyMinutes(5).create();
  } catch (e) { Logger.log('Trigger flushLogs gagal dibuat: ' + errMsg(e)); }

  try { DE_MIGRASI(); } catch (e) { Logger.log('Skema dokumen: ' + errMsg(e)); }

  Logger.log('');
  Logger.log('✅ Setup selesai!');
  Logger.log('   Spreadsheet : ' + ss.getUrl());
  Logger.log('   Folder Drive: ' + root.getUrl());
  Logger.log('');
  Logger.log('🔑 Akun awal (SEGERA ganti PIN setelah login):');
  Logger.log('   OWNER      : ' + owner + '  PIN 123456');
  Logger.log('   SUPERVISOR : spv01@dapoermitoha.internal  PIN 222222');
  Logger.log('   KASIR      : kasir01@dapoermitoha.internal  PIN 111111');
}

/** Idempoten: menambah sheet/kolom yang belum ada. Aman dijalankan setelah upgrade. */
function migrateSchema() {
  const ss = ss_(), log = [];
  Object.keys(HEADERS).forEach(function (name) {
    const cols = HEADERS[name];
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, cols.length).setValues([cols]);
      styleHeader_(sh, cols.length);
      log.push('+ sheet ' + name);
    } else {
      const ada = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
      const kurang = cols.filter(function (k) { return ada.indexOf(k) < 0; });
      if (kurang.length) {
        sh.getRange(1, ada.filter(String).length + 1, 1, kurang.length).setValues([kurang]);
        log.push('+ kolom ' + name + ': ' + kurang.join(', '));
      }
    }
    // kolom teks: cegah Sheets mengubah barcode/tanggal/PIN menjadi angka atau tanggal
    const textCols = { Produk: ['sku', 'barcode'], Transaksi: ['tanggal', 'meja'], Users: ['kode', 'pinHash', 'pinSalt'] }[name] || [];
    const hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
    textCols.forEach(function (c) { const i = hdr.indexOf(c); if (i > -1) sh.getRange(2, i + 1, Math.max(sh.getMaxRows() - 1, 1), 1).setNumberFormat('@'); });
  });
  Logger.log(log.length ? log.join('\n') : 'Skema sudah lengkap.');
  return log;
}

function styleHeader_(sh, n) {
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#D7261E').setFontColor('#ffffff');
}

function sampleProducts_() {
  const now = new Date();
  return [
    ['SKU-SBK-001', '899201948210', 'Seblak Komplit Spesial', 'Kerupuk aci oranye, makaroni, sosis sapi, ceker, telur orak-arik, kuah kencur', 'Seblak Kuah', 18000, 0, 8500, 45, 10, '0-5', 'TRUE', 'TRUE'],
    ['SKU-SBK-002', '899201948211', 'Seblak Ceker Mercon', 'Ceker empuk pedas mercon dengan kuah kental kencur', 'Seblak Kuah', 20000, 0, 9000, 8, 10, '0-5', 'TRUE', 'TRUE'],
    ['SKU-SBK-003', '899201948212', 'Seblak Seafood', 'Crabstick, dumpling ikan, bakso udang, cumi', 'Seblak Kuah', 25000, 0, 12000, 22, 10, '0-5', 'TRUE', 'FALSE'],
    ['SKU-SBK-004', '899201948213', 'Seblak Tulang Rawan Mercon', 'Tulang rawan sapi empuk, makaroni basah, mie kenyal, kuah rawit', 'Seblak Kuah', 22000, 0, 9500, 50, 10, '0-5', 'TRUE', 'FALSE'],
    ['SKU-SBKR-001', '899201948227', 'Seblak Kering Rafael', 'Kerupuk mawar putih rebus diaduk cobek kering pedas', 'Seblak Kering', 18000, 0, 7000, 28, 10, '0-5', 'TRUE', 'FALSE'],
    ['SKU-SBKR-002', '899201948228', 'Kerupuk Mawar Basah', 'Kerupuk mawar kenyal bumbu kencur', 'Seblak Kering', 12000, 0, 4500, 14, 10, '0-5', 'TRUE', 'FALSE'],
    ['SKU-TOP-001', '899201948301', 'Extra Dumpling Keju', 'Isian lumer keju mozarella', 'Topping', 4000, 0, 2000, 40, 10, '', 'TRUE', 'FALSE'],
    ['SKU-TOP-002', '899201948302', 'Extra Enoki Crispy', 'Jamur enoki renyah', 'Topping', 5000, 0, 2200, 10, 10, '', 'TRUE', 'FALSE'],
    ['SKU-TOP-003', '899201948303', 'Topping Cuanki Lidah', 'Paket 3 cuanki lidah renyah + 4 siomay mini', 'Topping', 6000, 0, 3000, 4, 10, '', 'TRUE', 'FALSE'],
    ['SKU-TOP-004', '899201948304', 'Batagor Kering Mini', 'Batagor goreng mini renyah', 'Topping', 3500, 0, 1500, 87, 10, '', 'TRUE', 'FALSE'],
    ['SKU-BEV-001', '899201948500', 'Es Teh Manis Jumbo', 'Teh melati wangi pekat, gula aren', 'Minuman', 5000, 0, 1500, 120, 20, '', 'TRUE', 'FALSE'],
    ['SKU-BEV-002', '899201948501', 'Es Jeruk Peras', 'Jeruk murni peras segar', 'Minuman', 8000, 0, 3000, 19, 10, '', 'TRUE', 'FALSE']
  ].map(function (r) {
    return { sku: r[0], barcode: r[1], nama: r[2], deskripsi: r[3], kategori: r[4], harga: r[5], diskon: r[6], hpp: r[7],
             stok: r[8], minStok: r[9], levelPedas: r[10], pajak: r[11], fotoId: '', favorit: r[12], aktif: 'TRUE', diperbarui: now };
  });
}

// ---- Migrasi.gs
/**
 * ============================================================================
 *  Migrasi.gs — Modul Import Data dari App POS Lama (Sheets → Sheets)
 *  Pola gas-migrasi-database:
 *   - App lama TIDAK disentuh (sumber hanya DIBACA)
 *   - Baca berdasarkan NAMA header (dengan alias), bukan indeks kolom
 *   - Idempoten: upsert per kunci alami → import ulang = 0 ditambah
 *   - Dry-run (Pindai) dulu, lalu Jalankan; ulangi sebelum cutover = delta sync
 *   - Batch: target dibaca 1×, ditulis 1×
 * ============================================================================
 */

/** Peta per sheet target: kunci alami, alias header sumber, field yang boleh diperbarui. */
const MIG_PLAN = {
  Produk: {
    key: function (o) { return String(o.sku || '').trim().toUpperCase(); },
    alias: {
      sku: ['sku', 'kode', 'kode produk', 'product_id', 'id produk', 'id'],
      barcode: ['barcode', 'ean', 'kode barcode'],
      nama: ['nama', 'nama produk', 'nama menu', 'product', 'product_name', 'name', 'menu'],
      deskripsi: ['deskripsi', 'keterangan', 'description', 'desc'],
      kategori: ['kategori', 'category', 'jenis'],
      harga: ['harga', 'harga jual', 'price', 'harga_jual'],
      diskon: ['diskon', 'discount', 'potongan'],
      hpp: ['hpp', 'modal', 'cost', 'harga pokok'],
      stok: ['stok', 'stock', 'qty', 'jumlah stok'],
      minStok: ['minstok', 'min stok', 'stok minimum', 'min_stock', 'ambang'],
      levelPedas: ['levelpedas', 'level pedas', 'level'],
      pajak: ['pajak', 'ppn', 'tax'],
      fotoId: ['fotoid', 'foto', 'gambar', 'image', 'thumbnail', 'photo'],
      aktif: ['aktif', 'status', 'active']
    },
    updatable: ['nama', 'deskripsi', 'kategori', 'harga', 'diskon', 'hpp', 'stok', 'minStok', 'barcode', 'fotoId'],
    transform: function (o, opt) {
      o.sku = String(o.sku || '').trim().toUpperCase();
      if (!o.sku && o.nama) o.sku = 'SKU-IMP-' + hashShort_(o.nama);
      o.barcode = String(o.barcode === undefined ? '' : o.barcode);
      o.harga = num(o.harga); o.diskon = num(o.diskon); o.hpp = num(o.hpp);
      o.stok = o.stok === '' || o.stok === undefined ? '' : num(o.stok);
      o.minStok = num(o.minStok);
      o.kategori = mapKategori_(o.kategori, opt.kategoriMap);
      o.fotoId = driveIdOf_(o.fotoId);
      o.pajak = o.pajak === undefined || o.pajak === '' ? 'TRUE' : (bool(o.pajak) || /ya|yes/i.test(o.pajak) ? 'TRUE' : 'FALSE');
      o.aktif = o.aktif === undefined || o.aktif === '' ? 'TRUE' : (bool(o.aktif) || /aktif|active|ya/i.test(o.aktif) && !/non/i.test(o.aktif) ? 'TRUE' : 'FALSE');
      o.favorit = 'FALSE';
      o.diperbarui = new Date();
      return o;
    }
  },
  Users: {
    key: function (o) { return lower(o.email); },
    alias: {
      email: ['email', 'e-mail', 'akun', 'username'],
      nama: ['nama', 'name', 'nama lengkap'],
      kode: ['kode', 'kode kasir', 'id karyawan', 'nik'],
      role: ['role', 'peran', 'jabatan', 'level'],
      pinHash: ['pinhash'], pinSalt: ['pinsalt'], pin: ['pin'],
      outlet: ['outlet', 'cabang'],
      aktif: ['aktif', 'status', 'active']
    },
    updatable: [],
    transform: function (o) {
      o.email = lower(o.email);
      let r = String(o.role || 'KASIR').toUpperCase();
      if (/SPV|SUPER/.test(r)) r = 'SUPERVISOR'; else if (/OWN|ADMIN|PEMILIK/.test(r)) r = 'OWNER'; else r = 'KASIR';
      o.role = r;
      if (o.pin && !o.pinHash && /^\d{6}$/.test(String(o.pin))) { o.pinSalt = Utilities.getUuid(); o.pinHash = hashPin(String(o.pin), o.pinSalt); }
      delete o.pin;
      o.aktif = o.aktif === undefined || o.aktif === '' ? 'TRUE' : (bool(o.aktif) || /aktif|active/i.test(o.aktif) && !/non/i.test(o.aktif) ? 'TRUE' : 'FALSE');
      o.id = o.id || uid('U'); o.dibuat = o.dibuat || new Date();
      return o;
    }
  },
  Transaksi: {
    key: function (o) { return String(o.id || '').trim(); },
    alias: {
      id: ['id', 'no struk', 'nomor', 'no transaksi', 'invoice', 'trx_id', 'order_id'],
      waktu: ['waktu', 'tanggal', 'timestamp', 'date', 'created_at'],
      shiftId: ['shiftid', 'shift'],
      kasirEmail: ['kasiremail', 'email kasir', 'kasir'],
      kasirNama: ['kasirnama', 'nama kasir'],
      tipe: ['tipe', 'type', 'jenis pesanan'],
      meja: ['meja', 'table'],
      pelanggan: ['pelanggan', 'customer', 'nama pelanggan'],
      items: ['items', 'item', 'detail', 'pesanan'],
      jmlItem: ['jmlitem', 'jumlah item', 'qty'],
      subtotal: ['subtotal', 'gross', 'omzet kotor'],
      diskon: ['diskon', 'discount'],
      ppn: ['ppn', 'pajak', 'tax'],
      total: ['total', 'grand total', 'tagihan', 'netto'],
      metode: ['metode', 'metode bayar', 'payment', 'pembayaran'],
      bayar: ['bayar', 'dibayar', 'uang diterima'],
      kembalian: ['kembalian', 'change'],
      status: ['status'],
      catatan: ['catatan', 'note', 'keterangan']
    },
    updatable: [],
    sortBy: 'waktu',
    transform: function (o) {
      o.id = String(o.id || '').trim();
      const w = toDate(o.waktu) || new Date();
      o.waktu = w; o.tanggal = dayKey(w);
      o.kasirEmail = /@/.test(o.kasirEmail) ? lower(o.kasirEmail) : '';
      o.kasirNama = o.kasirNama || (o.kasirEmail ? '' : String(o.kasirEmail || ''));
      o.total = num(o.total); o.subtotal = o.subtotal === undefined || o.subtotal === '' ? o.total : num(o.subtotal);
      o.diskon = num(o.diskon); o.ppn = num(o.ppn); o.dpp = o.subtotal - o.diskon;
      o.bayar = o.bayar === undefined || o.bayar === '' ? o.total : num(o.bayar); o.kembalian = num(o.kembalian);
      let m = String(o.metode || 'TUNAI').toUpperCase();
      if (/QR/.test(m)) m = 'QRIS'; else if (/EDC|DEBIT|KARTU|CARD/.test(m)) m = 'EDC'; else if (/OVO|DANA|GOPAY|SHOPEE|WALLET/.test(m)) m = 'EWALLET'; else m = 'TUNAI';
      o.metode = m;
      o.detailBayar = JSON.stringify([{ metode: m, jumlah: o.total }]);
      const t = String(o.tipe || '').toUpperCase();
      o.tipe = /TAKE|BUNGKUS/.test(t) ? 'TAKE_AWAY' : /ONLINE|GRAB|GOFOOD|SHOPEE/.test(t) ? 'ONLINE' : 'DINE_IN';
      o.status = /VOID|BATAL|CANCEL/i.test(o.status || '') ? 'VOID' : 'LUNAS';
      const items = parseJson(o.items, null);
      o.items = JSON.stringify(Array.isArray(items) ? items : [{ sku: '', nama: String(o.items || 'Transaksi impor'), kategori: '', qty: num(o.jmlItem) || 1, harga: o.subtotal, subtotal: o.subtotal, level: null, catatan: '' }]);
      o.jmlItem = num(o.jmlItem) || (Array.isArray(items) ? items.reduce(function (a, l) { return a + num(l.qty); }, 0) : 1);
      o.shiftId = o.shiftId || 'IMPORT';
      o.terminal = o.terminal || 'IMPORT';
      return o;
    }
  },
  Shift: {
    key: function (o) { return String(o.id || '').trim(); },
    alias: {
      id: ['id', 'shift id', 'no shift'], kasirEmail: ['kasiremail', 'email kasir', 'kasir'], kasirNama: ['kasirnama', 'nama kasir'],
      buka: ['buka', 'mulai', 'start'], tutup: ['tutup', 'selesai', 'end'], modalAwal: ['modalawal', 'modal', 'kas awal'],
      total: ['total', 'penjualan'], kasFisik: ['kasfisik', 'kas fisik'], selisih: ['selisih'], status: ['status']
    },
    updatable: [],
    transform: function (o) {
      o.kasirEmail = lower(o.kasirEmail); o.buka = toDate(o.buka) || ''; o.tutup = toDate(o.tutup) || '';
      o.modalAwal = num(o.modalAwal); o.total = num(o.total);
      o.status = 'DITUTUP';                       // shift lama selalu dianggap tutup (tidak boleh ada 2 shift aktif)
      return o;
    }
  },
  StokLog: {
    key: function (o) { return String(o.id || '').trim(); },
    alias: { id: ['id'], waktu: ['waktu', 'tanggal', 'timestamp'], sku: ['sku', 'kode'], delta: ['delta', 'jumlah', 'qty'],
             stokAkhir: ['stokakhir', 'stok akhir', 'sisa'], alasan: ['alasan', 'keterangan'], ref: ['ref'], oleh: ['oleh', 'user'] },
    updatable: [],
    sortBy: 'waktu',
    transform: function (o) { o.waktu = toDate(o.waktu) || new Date(); o.sku = String(o.sku || '').toUpperCase(); o.delta = num(o.delta); o.stokAkhir = num(o.stokAkhir); return o; }
  }
};

const MIG_URUTAN = ['Users', 'Produk', 'Shift', 'Transaksi', 'StokLog'];   // master dulu, baru relasi

function normHeader_(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function hashShort_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .slice(0, 3).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('').toUpperCase();
}
function driveIdOf_(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  const m = s.match(/(?:\/d\/|id=)([A-Za-z0-9_-]{20,})/);
  return m ? m[1] : (/^[A-Za-z0-9_-]{20,}$/.test(s) ? s : '');
}
function mapKategori_(v, map) {
  const k = String(v || '').trim();
  if (map && map[lower(k)]) return map[lower(k)];
  if (/kering/i.test(k)) return 'Seblak Kering';
  if (/seblak|kuah/i.test(k)) return 'Seblak Kuah';
  if (/topping|tambahan|extra/i.test(k)) return 'Topping';
  if (/minum|drink|beverage|es /i.test(k)) return 'Minuman';
  return k || 'Seblak Kuah';
}
/** "lama=baru" per baris → {lama: baru} */
function parseKategoriMap_(txt) {
  const m = {};
  String(txt || '').split(/\n/).forEach(function (l) { const p = l.split('='); if (p.length === 2 && p[0].trim()) m[lower(p[0])] = p[1].trim(); });
  return m;
}

function openSource_(idOrUrl) {
  const m = String(idOrUrl || '').match(/\/d\/([A-Za-z0-9_-]{20,})/);
  const id = m ? m[1] : String(idOrUrl || '').trim();
  if (!id) throw new Error('Tempel URL atau ID spreadsheet app LAMA.');
  if (id === CONFIG.SPREADSHEET_ID) throw new Error('Itu spreadsheet app BARU. Tempel spreadsheet app LAMA.');
  try { return SpreadsheetApp.openById(id); }
  catch (e) { throw new Error('Spreadsheet tidak bisa dibuka. Pastikan ID benar & dimiliki/dibagikan ke akun pemilik script ini.'); }
}

/** Baca sheet sumber → objek dengan kunci = nama field target (via alias). */
function readSourceMapped_(sh, plan) {
  const v = sh.getDataRange().getValues();
  if (v.length <= 1) return { rows: [], kolom: {} };
  const h = v[0].map(normHeader_), kolom = {};
  Object.keys(plan.alias).forEach(function (field) {
    const cands = [normHeader_(field)].concat(plan.alias[field].map(normHeader_));
    for (let i = 0; i < cands.length; i++) { const j = h.indexOf(cands[i]); if (j > -1) { kolom[field] = { idx: j, header: v[0][j] }; break; } }
  });
  const rows = v.slice(1).filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    const o = {};
    Object.keys(kolom).forEach(function (f) { o[f] = r[kolom[f].idx]; });
    return o;
  });
  const terdeteksi = {};
  Object.keys(kolom).forEach(function (f) { terdeteksi[f] = String(kolom[f].header); });
  return { rows: rows, kolom: terdeteksi };
}

/** plan = { target, key(o), rows[], updatable[], sortBy? } — 1× baca, 1× tulis. */
function upsertPlan_(plan, dryRun) {
  const sh = getSheet(plan.target), values = sh.getDataRange().getValues(), h = values[0].map(String);
  const index = {};
  for (let r = 1; r < values.length; r++) {
    const o = {}; h.forEach(function (k, i) { o[k] = values[r][i]; });
    const k = plan.key(o); if (k) index[k] = r;
  }
  const res = { inserted: 0, updated: 0, skipped: 0 }, newRows = [], seen = {};
  plan.rows.forEach(function (src) {
    const k = plan.key(src);
    if (!k || seen[k]) { res.skipped++; return; }
    seen[k] = true;
    if (index[k] !== undefined) {
      const row = values[index[k]];
      let changed = false;
      (plan.updatable || []).forEach(function (f) {
        const i = h.indexOf(f);
        if (i === -1 || src[f] === undefined || src[f] === '') return;
        if (String(row[i]) !== String(src[f])) { row[i] = src[f]; changed = true; }
      });
      if (changed) res.updated++; else res.skipped++;
    } else {
      newRows.push(h.map(function (f) { return src[f] !== undefined && src[f] !== null ? src[f] : ''; }));
      res.inserted++;
    }
  });
  if (!dryRun && (res.updated || newRows.length)) {
    let all = values.concat(newRows);
    if (plan.sortBy && newRows.length) {
      const si = h.indexOf(plan.sortBy);
      all = [values[0]].concat(all.slice(1).sort(function (a, b) { return (toDate(a[si]) || 0) - (toDate(b[si]) || 0); }));
    }
    sh.getRange(1, 1, all.length, h.length).setValues(all);
    invalidateRows(plan.target);
  }
  return res;
}

/**
 * d = { source, sheets:['Produk',...], map:{Produk:'Nama Sheet Sumber'}, overwrite, kategoriMap:"lama=baru\n...", dryRun }
 */
function apiImport(ctx, d) {
  let src;
  try { src = openSource_(d.source); } catch (e) { return fail(errMsg(e)); }
  const sheetsSumber = src.getSheets().map(function (s) {
    return { nama: s.getName(), baris: Math.max(0, s.getLastRow() - 1),
             header: s.getLastColumn() ? s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(String).filter(String) : [] };
  });
  const pilih = (d.sheets && d.sheets.length ? d.sheets : ['Users', 'Produk']).filter(function (t) { return MIG_PLAN[t]; });
  const opt = { kategoriMap: parseKategoriMap_(d.kategoriMap) };
  const report = {}, warnings = [];
  const ownerTarget = readSheet(SH.users).filter(function (u) { return String(u.role).toUpperCase() === 'OWNER'; }).map(function (u) { return lower(u.email); });

  const jalankan = function () {
    MIG_URUTAN.filter(function (t) { return pilih.indexOf(t) > -1; }).forEach(function (target) {
      const P = MIG_PLAN[target];
      const namaSumber = (d.map && d.map[target]) || target;
      const sh = src.getSheetByName(namaSumber);
      if (!sh) { report[target] = { sumber: namaSumber, ada: false, source: 0, inserted: 0, updated: 0, skipped: 0, kolom: {} };
                 warnings.push('Sheet "' + namaSumber + '" tidak ada di app lama — ' + target + ' dilewati.'); return; }
      const baca = readSourceMapped_(sh, P);
      if (!Object.keys(baca.kolom).length) warnings.push(target + ': tidak ada header yang dikenali di sheet "' + namaSumber + '".');
      let rows = baca.rows.map(function (o) { return P.transform(Object.assign({}, o), opt); });

      // peringatan khusus
      if (target === 'Users') {
        const lewat = rows.filter(function (u) { return u.role === 'OWNER' && ownerTarget.indexOf(u.email) < 0; });
        if (lewat.length) warnings.push(lewat.length + ' akun OWNER lama diturunkan menjadi SUPERVISOR (owner app baru tidak berubah).');
        rows.forEach(function (u) { if (u.role === 'OWNER' && ownerTarget.indexOf(u.email) < 0) u.role = 'SUPERVISOR'; });
        const tanpaPin = rows.filter(function (u) { return !u.pinHash; }).length;
        if (tanpaPin) warnings.push(tanpaPin + ' staf tanpa PIN — atur PIN mereka di menu Pengguna sebelum bisa login.');
        const tanpaEmail = rows.filter(function (u) { return !u.email; }).length;
        if (tanpaEmail) warnings.push(tanpaEmail + ' baris staf tanpa email dilewati.');
      }
      if (target === 'Produk') {
        const tanpaHarga = rows.filter(function (p) { return !p.harga; }).length;
        if (tanpaHarga) warnings.push(tanpaHarga + ' produk berharga 0 — periksa setelah import.');
        const auto = rows.filter(function (p) { return /^SKU-IMP-/.test(p.sku); }).length;
        if (auto) warnings.push(auto + ' produk tanpa SKU diberi SKU otomatis (SKU-IMP-xxx).');
      }
      const keys = {}, dup = {};
      rows.forEach(function (o) { const k = P.key(o); if (k) { if (keys[k]) dup[k] = 1; keys[k] = 1; } });
      if (Object.keys(dup).length) warnings.push(target + ': ' + Object.keys(dup).length + ' kunci ganda di sumber (hanya baris pertama dipakai).');

      const r = upsertPlan_({ target: target, key: P.key, rows: rows, updatable: d.overwrite ? P.updatable : [], sortBy: P.sortBy }, !!d.dryRun);
      report[target] = Object.assign({ sumber: namaSumber, ada: true, source: rows.length, kolom: baca.kolom }, r);
    });
  };

  if (d.dryRun) jalankan(); else withLockIfNeeded_(jalankan);

  if (!d.dryRun) {
    ['prod', 'trx', 'cfg'].forEach(bump);
    logAct(ctx, 'IMPORT_RUN', JSON.stringify(Object.keys(report).map(function (k) { return k + '+' + report[k].inserted; })), src.getId());
  }
  return ok({ source: { nama: src.getName(), id: src.getId() }, dryRun: !!d.dryRun, report: report, warnings: warnings, sheetsSumber: sheetsSumber },
    d.dryRun ? 'Pindai selesai — belum ada data yang ditulis.' : 'Import selesai.');
}

/** importRun sudah berada di dalam lock dispatch (write:true); fungsi ini menjaga pemanggilan langsung dari editor. */
function withLockIfNeeded_(fn) { fn(); }

/** Import CSV (mis. ekspor marketplace/POS lain). d = {target:'Produk'|'Users', csv, overwrite, dryRun} */
function apiImportCsv(ctx, d) {
  const P = MIG_PLAN[d.target];
  if (!P || ['Produk', 'Users'].indexOf(d.target) < 0) return fail('Target CSV hanya Produk atau Users.');
  const data = parseCsv_(String(d.csv || ''));
  if (data.length < 2) return fail('CSV kosong atau hanya berisi header.');
  const h = data[0].map(normHeader_), kolom = {};
  Object.keys(P.alias).forEach(function (f) {
    const c = [normHeader_(f)].concat(P.alias[f].map(normHeader_));
    for (let i = 0; i < c.length; i++) { const j = h.indexOf(c[i]); if (j > -1) { kolom[f] = j; break; } }
  });
  const rows = data.slice(1).filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    const o = {}; Object.keys(kolom).forEach(function (f) { o[f] = r[kolom[f]]; }); return P.transform(o, { kategoriMap: {} });
  });
  const r = upsertPlan_({ target: d.target, key: P.key, rows: rows, updatable: d.overwrite ? P.updatable : [] }, !!d.dryRun);
  if (!d.dryRun) { bump('prod'); logAct(ctx, 'IMPORT_CSV', d.target + ' +' + r.inserted, ''); }
  return ok({ report: Object.assign({ source: rows.length, kolom: Object.keys(kolom) }, r), dryRun: !!d.dryRun },
    d.dryRun ? 'Pindai CSV selesai.' : 'Import CSV selesai.');
}

function parseCsv_(s) {
  const rows = [], sep = (s.split('\n')[0].match(/;/g) || []).length > (s.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  let row = [], cur = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      if (ch === '"' && s[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

// ---- DocEngine.gs
/**
 * ============================================================================
 *  DocEngine.gs — Mesin Dokumen Cetak berbasis Template (gas-doc-engine)
 *
 *  Admin (OWNER) mendesain template sendiri di Google Docs / Sheets / Slides
 *  dengan placeholder {{KUNCI}}. Sistem memindai placeholder → membangun form
 *  otomatis → mengisi data dari POS (shift, transaksi, laporan, stok) →
 *  otorisasi PIN supervisor → menerbitkan PDF/DOCX/XLSX/PNG ber-QR verifikasi.
 *
 *  Prinsip: template = skema · master tidak disentuh (makeCopy) · gaya ikut
 *  penanda · TERBIT = beku · nomor/tanggal/kode diputuskan server · aditif.
 *
 *  Placeholder: {{KUNCI}} {{KUNCI|rupiah}} {{KUNCI|tanggal:dd/MM/yyyy}}
 *               {{#BLOK}} di baris tabel (baris berulang) + {{BLOK.KOLOM}}
 *               {{?SYARAT}} … {{/SYARAT}} (dihapus bila SYARAT kosong — Docs)
 *               {{QR}} {{KODE_VERIFIKASI}} {{URL_VERIFIKASI}} {{NOMOR}} {{TANGGAL}}
 *               {{NAMA_PEJABAT_1}} {{JABATAN_1}} {{TTD_1}} ... (slot penanda tangan)
 * ============================================================================
 */

var DE_SKEMA = {
  DE_Template: ['id', 'kode', 'nama', 'sumber', 'engine', 'fileId', 'bidang', 'slotTtd', 'keluaran', 'formatNomor', 'versi', 'aktif', 'diperbarui'],
  DE_Dokumen: ['id', 'templateKode', 'versi', 'nomor', 'judul', 'sumber', 'ref', 'status', 'dataIsian', 'penandatangan',
               'kodeVerifikasi', 'hashPdf', 'berkas', 'dibuat', 'oleh', 'alasanTarik'],
  DE_Persetujuan: ['dokumenId', 'slot', 'pejabatEmail', 'pejabatNama', 'metode', 'catatan', 'waktu'],
  DE_Nomor: ['kode', 'format', 'tahun', 'urut']
};

/** Migrasi idempoten — hanya MENAMBAH sheet/kolom DE_*. */
function DE_MIGRASI() {
  var ss = ss_(), log = [];
  Object.keys(DE_SKEMA).forEach(function (nama) {
    var kolom = DE_SKEMA[nama], sh = ss.getSheetByName(nama);
    if (!sh) {
      sh = ss.insertSheet(nama);
      sh.getRange(1, 1, 1, kolom.length).setValues([kolom]);
      styleHeader_(sh, kolom.length);
      log.push('+ sheet ' + nama);
      return;
    }
    var ada = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
    var kurang = kolom.filter(function (k) { return ada.indexOf(k) < 0; });
    if (kurang.length) {
      sh.getRange(1, ada.filter(String).length + 1, 1, kurang.length).setValues([kurang]).setFontWeight('bold');
      log.push('+ kolom ' + nama + ': ' + kurang.join(', '));
    }
  });
  Logger.log(log.length ? log.join('\n') : 'Skema DE sudah lengkap.');
  return log;
}

// ============================================================================
// PEMINDAI PLACEHOLDER & SKEMA
// ============================================================================
var DE_POLA = /\{\{\s*([#?\/]?)\s*([A-Za-z][A-Za-z0-9_.]*)\s*(?:\|\s*([^}]*?))?\s*\}\}/g;
var DE_SISTEM = ['NOMOR', 'TANGGAL', 'TAHUN', 'BULAN', 'BULAN_ROMAWI', 'HARI', 'JAM', 'NO', 'DICETAK_OLEH'];
var DE_INSTITUSI = /^(INSTITUSI_[A-Z_]+|LOGO|KOP)$/;
var DE_VERIF = ['QR', 'KODE_VERIFIKASI', 'URL_VERIFIKASI'];
var DE_SLOT = /^(NAMA_PEJABAT|JABATAN|NIP|KODE_PEJABAT|TTD|WAKTU_TTD)(?:_(\d+))?$/;
var DE_BAKU = { PERIHAL: 'Perihal', TUJUAN: 'Tujuan / Kepada', ISI: 'Isi', LAMPIRAN: 'Lampiran', TEMBUSAN: 'Tembusan',
                CATATAN: 'Catatan', KETERANGAN: 'Keterangan' };

/** Kunci yang otomatis terisi dari data POS per sumber. */
var DE_SUMBER = {
  manual:    { label: 'Isian manual', kunci: [] },
  shift:     { label: 'Shift kasir (Z-Report)', kunci: ['SHIFT_ID', 'KASIR', 'KODE_KASIR', 'TERMINAL', 'BUKA', 'TUTUP', 'MODAL_AWAL',
              'PENJUALAN_TUNAI', 'PENJUALAN_QRIS', 'PENJUALAN_EDC', 'PENJUALAN_EWALLET', 'TOTAL_PENJUALAN', 'JML_TRX', 'JML_VOID',
              'KAS_SISTEM', 'KAS_FISIK', 'SELISIH', 'STATUS_KAS', 'SUPERVISOR', 'CATATAN_SHIFT', 'TOTAL_PPN', 'TOTAL_DISKON', 'DENOM'] },
  transaksi: { label: 'Transaksi (nota/invoice)', kunci: ['NO_STRUK', 'WAKTU_TRX', 'KASIR', 'TIPE', 'MEJA', 'PELANGGAN', 'ITEM', 'SUBTOTAL',
              'DISKON', 'DPP', 'PPN', 'TOTAL', 'METODE', 'BAYAR', 'KEMBALIAN', 'STATUS_TRX'] },
  laporan:   { label: 'Laporan penjualan periode', kunci: ['PERIODE', 'TGL_AWAL', 'TGL_AKHIR', 'TOTAL_TRX', 'OMZET_KOTOR', 'TOTAL_DISKON',
              'TOTAL_PPN', 'PENJUALAN_BERSIH', 'RATA_HARIAN', 'HARI', 'MENU'] },
  stok:      { label: 'Stok opname', kunci: ['TOTAL_MENU', 'JML_MENIPIS', 'JML_HABIS', 'BARANG'] }
};

function dePindaiTeks(teks) {
  var hasil = [], m;
  DE_POLA.lastIndex = 0;
  while ((m = DE_POLA.exec(String(teks || '')))) {
    hasil.push({ jenis: m[1] || '', kunci: m[2].toUpperCase(), pengubah: (m[3] || '').trim(), mentah: m[0] });
  }
  return hasil;
}

function deKategori(kunci, sumber) {
  if ((DE_SUMBER[sumber] || DE_SUMBER.manual).kunci.indexOf(kunci) >= 0) return 'sumber';
  if (DE_SISTEM.indexOf(kunci) >= 0) return 'sistem';
  if (DE_INSTITUSI.test(kunci)) return 'institusi';
  if (DE_VERIF.indexOf(kunci) >= 0) return 'verifikasi';
  if (DE_SLOT.test(kunci)) return 'pejabat';
  if (DE_BAKU[kunci]) return 'baku';
  return 'kustom';
}

function deTebakTipe(kunci) {
  if (/^(ISI)$/.test(kunci) || /_NASKAH$/.test(kunci)) return 'naskah';
  if (/^(TGL|TANGGAL)_/.test(kunci)) return 'tanggal';
  if (/(JUMLAH|NOMINAL|TOTAL|BIAYA|HARGA|QTY|SUBTOTAL)/.test(kunci)) return 'angka';
  if (/(ALAMAT|KETERANGAN|CATATAN|TEMBUSAN)/.test(kunci)) return 'area';
  return 'teks';
}

function deLabel(kunci) {
  if (DE_BAKU[kunci]) return DE_BAKU[kunci];
  return kunci.replace(/^(TGL|TANGGAL)_/, 'Tanggal ').replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, function (h) { return h.toUpperCase(); });
}

/** Penanda → { bidang:[...], slot:[...], hilang:[...] }. Menggabungkan setelan admin lama. */
function deSusunSkema(penanda, lama, sumber) {
  lama = lama || { bidang: [], slot: [] };
  var petaLama = {};
  (lama.bidang || []).forEach(function (b) { petaLama[b.kunci] = b; });
  var bidang = [], slotPeta = {}, lihat = {};

  penanda.forEach(function (p) {
    if (p.jenis === '#') {
      if (!lihat[p.kunci]) {
        lihat[p.kunci] = true;
        var kb = deKategori(p.kunci, sumber);
        bidang.push(petaLama[p.kunci] || { kunci: p.kunci, label: deLabel(p.kunci), tipe: 'daftar', kolom: [], wajib: false, kategori: kb });
      }
      return;
    }
    if (p.jenis === '/') return;
    if (p.jenis === '?') p = { kunci: p.kunci, pengubah: '' };
    var titik = p.kunci.indexOf('.');
    if (titik > 0) {
      var induk = p.kunci.slice(0, titik), sub = p.kunci.slice(titik + 1);
      var bk = bidang.filter(function (b) { return b.kunci === induk; })[0];
      if (!bk) { bk = { kunci: induk, label: deLabel(induk), tipe: 'daftar', kolom: [], wajib: false, kategori: deKategori(induk, sumber) }; bidang.push(bk); lihat[induk] = true; }
      if (!bk.kolom.some(function (k) { return k.kunci === sub; })) bk.kolom.push({ kunci: sub, label: deLabel(sub), tipe: deTebakTipe(sub) });
      return;
    }
    var kat = deKategori(p.kunci, sumber);
    if (kat === 'pejabat') {
      var s = DE_SLOT.exec(p.kunci), no = Number(s[2] || 1);
      slotPeta[no] = slotPeta[no] || { slot: no, penanda: [] };
      if (slotPeta[no].penanda.indexOf(s[1]) < 0) slotPeta[no].penanda.push(s[1]);
      return;
    }
    if (kat !== 'baku' && kat !== 'kustom' && kat !== 'sumber') return;
    if (lihat[p.kunci]) return;
    lihat[p.kunci] = true;
    var l = petaLama[p.kunci];
    bidang.push(l ? Object.assign({}, l, { kategori: kat }) : { kunci: p.kunci, label: deLabel(p.kunci), tipe: deTebakTipe(p.kunci),
      wajib: kat === 'baku', bantu: '', opsi: [], kategori: kat });
  });

  var urutLama = (lama.bidang || []).map(function (b) { return b.kunci; });
  bidang.sort(function (a, b) {
    var ia = urutLama.indexOf(a.kunci), ib = urutLama.indexOf(b.kunci);
    return (ia < 0 ? 1e6 : ia) - (ib < 0 ? 1e6 : ib);
  });
  var hilang = urutLama.filter(function (k) { return !lihat[k]; });

  var slotLama = {};
  (lama.slot || []).forEach(function (s) { slotLama[s.slot] = s; });
  var slot = Object.keys(slotPeta).map(Number).sort().map(function (no) {
    var l = slotLama[no] || {};
    return { slot: no, penanda: slotPeta[no].penanda, label: l.label || (no === 1 ? 'Mengetahui' : 'Penanda Tangan ' + no),
             peranMin: l.peranMin || 'SUPERVISOR', wajibPin: l.wajibPin !== false };
  });
  return { bidang: bidang, slot: slot, hilang: hilang };
}

function deTeksTemplate(fileId) {
  var f = DriveApp.getFileById(fileId), mime = f.getMimeType(), bagian = [];
  if (mime === MimeType.GOOGLE_DOCS) {
    var d = DocumentApp.openById(fileId);
    bagian.push(d.getBody().getText());
    if (d.getHeader()) bagian.push(d.getHeader().getText());
    if (d.getFooter()) bagian.push(d.getFooter().getText());
    return { engine: 'docs', teks: bagian.join('\n'), nama: f.getName() };
  }
  if (mime === MimeType.GOOGLE_SHEETS) {
    SpreadsheetApp.openById(fileId).getSheets().forEach(function (sh) {
      var r = sh.getDataRange();
      bagian.push(r.getDisplayValues().map(function (b) { return b.join('\t'); }).join('\n'));
      bagian.push(r.getFormulas().map(function (b) { return b.join('\t'); }).join('\n'));
    });
    return { engine: 'sheets', teks: bagian.join('\n'), nama: f.getName() };
  }
  if (mime === MimeType.GOOGLE_SLIDES) {
    SlidesApp.openById(fileId).getSlides().forEach(function (sl) {
      sl.getPageElements().forEach(function (pe) { deTeksElemenSlide_(pe, bagian); });
    });
    return { engine: 'slides', teks: bagian.join('\n'), nama: f.getName() };
  }
  throw new Error('Format belum didukung (' + mime + '). Buka berkasnya lalu File → Simpan sebagai Google Docs/Sheets/Slides.');
}

function deTeksElemenSlide_(pe, bagian) {
  var t = pe.getPageElementType();
  if (t === SlidesApp.PageElementType.SHAPE) bagian.push(pe.asShape().getText().asString());
  else if (t === SlidesApp.PageElementType.TABLE) {
    var tb = pe.asTable();
    for (var r = 0; r < tb.getNumRows(); r++)
      for (var c = 0; c < tb.getNumColumns(); c++) bagian.push(tb.getCell(r, c).getText().asString());
  } else if (t === SlidesApp.PageElementType.GROUP) {
    pe.asGroup().getChildren().forEach(function (ch) { deTeksElemenSlide_(ch, bagian); });
  }
}

// ============================================================================
// API TEMPLATE
// ============================================================================
function deTemplateOut_(t) {
  return { id: t.id, kode: t.kode, nama: t.nama, sumber: t.sumber || 'manual', engine: t.engine, fileId: t.fileId,
           url: t.fileId ? 'https://docs.google.com/open?id=' + t.fileId : '',
           bidang: parseJson(t.bidang, []), slotTtd: parseJson(t.slotTtd, []),
           keluaran: String(t.keluaran || 'pdf').split(',').filter(String), formatNomor: t.formatNomor || '',
           versi: num(t.versi), aktif: t.aktif === '' ? true : bool(t.aktif), diperbarui: iso(t.diperbarui) };
}
function deCariTemplate_(kode) {
  return readSheet('DE_Template').filter(function (t) { return String(t.kode).toUpperCase() === String(kode).toUpperCase(); })[0] || null;
}

function apiDeTemplates() {
  return ok({ templates: readSheet('DE_Template').map(deTemplateOut_).filter(function (t) { return t.aktif; }),
              sumber: Object.keys(DE_SUMBER).map(function (k) { return { kode: k, label: DE_SUMBER[k].label, kunci: DE_SUMBER[k].kunci }; }) });
}

/** d = {kode, nama, url, sumber, keluaran:['pdf'], formatNomor} */
function apiDeScanTemplate(ctx, d) {
  var kode = String(d.kode || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
  if (!kode) return fail('Kode template wajib (huruf/angka, mis. ZREPORT).');
  var id = (String(d.url || '').match(/[-\w]{25,}/) || [])[0];
  if (!id) return fail('URL template Google Docs/Sheets/Slides tidak valid.');
  var sumber = DE_SUMBER[d.sumber] ? d.sumber : 'manual';
  var hasil;
  try { hasil = deTeksTemplate(id); } catch (e) { return fail(errMsg(e)); }
  var penanda = dePindaiTeks(hasil.teks);
  if (!penanda.length) return fail('Tidak ada placeholder {{...}} di template ini.');
  var rec = deCariTemplate_(kode);
  var lama = rec ? { bidang: parseJson(rec.bidang, []), slot: parseJson(rec.slotTtd, []) } : null;
  var skema = deSusunSkema(penanda, lama, sumber);
  var keluaran = (d.keluaran && d.keluaran.length ? d.keluaran : [hasil.engine === 'sheets' ? 'xlsx' : 'pdf']).join(',');
  var baru = { kode: kode, nama: String(d.nama || hasil.nama), sumber: sumber, engine: hasil.engine, fileId: id,
               bidang: JSON.stringify(skema.bidang), slotTtd: JSON.stringify(skema.slot), keluaran: keluaran,
               formatNomor: d.formatNomor || (rec && rec.formatNomor) || '{URUT}/' + kode + '/DM/{BULAN}/{TAHUN}',
               versi: rec ? num(rec.versi) + 1 : 1, aktif: 'TRUE', diperbarui: new Date() };
  withLock(function () {
    if (rec) updateByKey('DE_Template', 'kode', rec.kode, baru);
    else appendObjects('DE_Template', [Object.assign({ id: uid('T') }, baru)]);
  });
  bump('de');
  logAct(ctx, 'DE_PINDAI', kode + ' v' + baru.versi, id);
  return ok({ template: deTemplateOut_(Object.assign({}, rec || {}, baru)), jumlahPenanda: penanda.length, hilang: skema.hilang },
    'Template dipindai: ' + skema.bidang.length + ' kolom, ' + skema.slot.length + ' slot TTD.');
}

/** Simpan setelan kolom/slot hasil edit admin. d = {kode, nama, bidang, slotTtd, keluaran, formatNomor, aktif} */
function apiDeSaveTemplate(ctx, d) {
  var rec = deCariTemplate_(d.kode);
  if (!rec) return fail('Template tidak ditemukan.');
  var patch = { diperbarui: new Date() };
  if (d.nama) patch.nama = String(d.nama);
  if (Array.isArray(d.bidang)) patch.bidang = JSON.stringify(d.bidang);
  if (Array.isArray(d.slotTtd)) patch.slotTtd = JSON.stringify(d.slotTtd);
  if (Array.isArray(d.keluaran)) patch.keluaran = d.keluaran.filter(function (k) { return ['pdf', 'docx', 'xlsx', 'png'].indexOf(k) > -1; }).join(',') || 'pdf';
  if (d.formatNomor) patch.formatNomor = String(d.formatNomor);
  if (d.aktif !== undefined) patch.aktif = d.aktif ? 'TRUE' : 'FALSE';
  updateByKey('DE_Template', 'kode', rec.kode, patch);
  bump('de');
  return ok(deTemplateOut_(Object.assign({}, rec, patch)), 'Setelan template disimpan.');
}

function apiDeDeleteTemplate(ctx, d) {
  var n = updateByKey('DE_Template', 'kode', String(d.kode).toUpperCase(), { aktif: 'FALSE', diperbarui: new Date() });
  bump('de');
  return n ? ok(null, 'Template dinonaktifkan (berkas master di Drive tidak dihapus).') : fail('Template tidak ditemukan.');
}

// ============================================================================
// DATA SUMBER (POS → nilai placeholder)
// ============================================================================
function apiDeSourceData(ctx, d) {
  try { return ok(deSourceData_(d.sumber, d.ref, ctx)); } catch (e) { return fail(errMsg(e)); }
}

function deSourceData_(sumber, ref, ctx) {
  if (sumber === 'shift') {
    var sh = ref ? readSheet(SH.shift).filter(function (r) { return r.id === ref; })[0] : null;
    if (!sh) {   // bawaan: shift terakhir milik user
      var milik = readSheet(SH.shift).filter(function (r) { return lower(r.kasirEmail) === lower(ctx.session.email); });
      sh = milik[milik.length - 1];
    }
    if (!sh) throw new Error('Data shift tidak ditemukan.');
    var so = shiftOut_(sh), sum = summarizeShift_(so);
    var fisik = so.status === 'DITUTUP' ? so.kasFisik : 0;
    var selisih = so.status === 'DITUTUP' ? so.selisih : 0;
    return {
      ref: so.id, judul: 'Z-Report ' + so.id,
      data: { SHIFT_ID: so.id, KASIR: so.kasirNama, KODE_KASIR: so.kasirEmail, TERMINAL: so.terminal, BUKA: so.buka, TUTUP: so.tutup,
        MODAL_AWAL: so.modalAwal, PENJUALAN_TUNAI: sum.kanal.TUNAI.jumlah, PENJUALAN_QRIS: sum.kanal.QRIS.jumlah,
        PENJUALAN_EDC: sum.kanal.EDC.jumlah, PENJUALAN_EWALLET: sum.kanal.EWALLET.jumlah, TOTAL_PENJUALAN: sum.total,
        JML_TRX: sum.jmlTrx, JML_VOID: sum.jmlVoid, KAS_SISTEM: sum.kasSistem, KAS_FISIK: fisik, SELISIH: selisih,
        STATUS_KAS: so.status !== 'DITUTUP' ? 'SHIFT MASIH AKTIF' : (selisih === 0 ? 'SEIMBANG' : (selisih > 0 ? 'LEBIH' : 'KURANG')),
        SUPERVISOR: so.supervisor, CATATAN_SHIFT: so.catatan, TOTAL_PPN: sum.ppn, TOTAL_DISKON: sum.diskon,
        DENOM: Object.keys(so.denominasi || {}).sort(function (a, b) { return b - a; }).map(function (v) {
          return { PECAHAN: Number(v), LEMBAR: so.denominasi[v], JUMLAH: Number(v) * so.denominasi[v] };
        }) }
    };
  }
  if (sumber === 'transaksi') {
    var t = readTail(SH.trx, 5000).filter(function (r) { return String(r.id) === String(ref); })[0];
    if (!t) throw new Error('Transaksi ' + (ref || '') + ' tidak ditemukan.');
    var x = trxOut_(t);
    return { ref: x.id, judul: 'Nota ' + x.id,
      data: { NO_STRUK: x.id, WAKTU_TRX: x.waktu, KASIR: x.kasirNama, TIPE: x.tipe.replace('_', ' '), MEJA: x.meja, PELANGGAN: x.pelanggan || 'Umum',
        ITEM: x.items.map(function (l) { return { NAMA: l.nama + (l.level !== null && l.level !== undefined ? ' (Lv ' + l.level + ')' : ''), QTY: l.qty, HARGA: l.harga, SUBTOTAL: l.subtotal, CATATAN: l.catatan || '' }; }),
        SUBTOTAL: x.subtotal, DISKON: x.diskon, DPP: x.dpp, PPN: x.ppn, TOTAL: x.total, METODE: x.metode, BAYAR: x.bayar, KEMBALIAN: x.kembalian, STATUS_TRX: x.status } };
  }
  if (sumber === 'laporan') {
    var p = String(ref || '').split('|');
    var r = buildReport_(p[0] || addDays(dayKey(), -6), p[1] || dayKey());
    return { ref: r.from + '|' + r.to, judul: 'Rekap Penjualan ' + r.from + ' s/d ' + r.to,
      data: { PERIODE: deTanggalId(r.from) + ' – ' + deTanggalId(r.to), TGL_AWAL: r.from, TGL_AKHIR: r.to, TOTAL_TRX: r.total.trx,
        OMZET_KOTOR: r.total.gross, TOTAL_DISKON: r.total.diskon, TOTAL_PPN: r.total.ppn, PENJUALAN_BERSIH: r.total.netto, RATA_HARIAN: r.rataHarian,
        HARI: r.harian.map(function (h) { return { TANGGAL: h.tanggal, TRX: h.trx, GROSS: h.gross, DISKON: h.diskon, PPN: h.ppn, NETTO: h.netto }; }),
        MENU: r.topMenu.map(function (m) { return { NAMA: m.nama, QTY: m.qty, OMZET: m.omzet }; }) } };
  }
  if (sumber === 'stok') {
    var cat = catalog_().filter(function (p2) { return p2.aktif; });
    return { ref: dayKey(), judul: 'Stok Opname ' + dayKey(),
      data: { TOTAL_MENU: cat.length,
        JML_MENIPIS: cat.filter(function (p2) { return p2.stok !== null && p2.stok > 0 && p2.stok <= (p2.minStok || 10); }).length,
        JML_HABIS: cat.filter(function (p2) { return p2.stok === 0; }).length,
        BARANG: cat.map(function (p2) { return { SKU: p2.sku, NAMA: p2.nama, KATEGORI: p2.kategori, STOK: p2.stok === null ? '∞' : p2.stok, MIN: p2.minStok,
          STATUS: p2.stok === null ? 'Tidak dilacak' : p2.stok === 0 ? 'HABIS' : p2.stok <= (p2.minStok || 10) ? 'Menipis' : 'Aman' }; }) } };
  }
  return { ref: '', judul: '', data: {} };
}

// ============================================================================
// NILAI & PENGUBAH
// ============================================================================
var DE_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
var DE_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
var DE_ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function deTanggalId(v) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) { var p = String(v).split('-'); return Number(p[2]) + ' ' + DE_BULAN[Number(p[1]) - 1] + ' ' + p[0]; }
  var d = toDate(v);
  if (!d) return String(v || '');
  return Number(fmt(d, 'd')) + ' ' + DE_BULAN[Number(fmt(d, 'M')) - 1] + ' ' + fmt(d, 'yyyy');
}
function deRibuan(n) { var x = Math.round(Number(n) || 0); return (x < 0 ? '-' : '') + String(Math.abs(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

function deTerbilang(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  var s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  function t(x) {
    if (x < 12) return s[x];
    if (x < 20) return t(x - 10) + ' belas';
    if (x < 100) return t(Math.floor(x / 10)) + ' puluh ' + t(x % 10);
    if (x < 200) return 'seratus ' + t(x - 100);
    if (x < 1000) return t(Math.floor(x / 100)) + ' ratus ' + t(x % 100);
    if (x < 2000) return 'seribu ' + t(x - 1000);
    if (x < 1e6) return t(Math.floor(x / 1000)) + ' ribu ' + t(x % 1000);
    if (x < 1e9) return t(Math.floor(x / 1e6)) + ' juta ' + t(x % 1e6);
    if (x < 1e12) return t(Math.floor(x / 1e9)) + ' miliar ' + t(x % 1e9);
    return t(Math.floor(x / 1e12)) + ' triliun ' + t(x % 1e12);
  }
  return n === 0 ? 'nol' : t(n).replace(/\s+/g, ' ').trim();
}

function dePengubah(nilai, pengubah) {
  var v = nilai === undefined || nilai === null ? '' : nilai;
  String(pengubah || '').split('|').forEach(function (p) {
    p = p.trim(); if (!p) return;
    var nama = p.split(':')[0].toLowerCase(), arg = p.slice(nama.length + 1);
    if (nama === 'bawaan' && String(v) === '') v = arg;
    else if (nama === 'kapital') v = String(v).toUpperCase();
    else if (nama === 'kecil') v = String(v).toLowerCase();
    else if (nama === 'judul') v = String(v).toLowerCase().replace(/\b\w/g, function (h) { return h.toUpperCase(); });
    else if (nama === 'rupiah') v = (Number(v) < 0 ? '-Rp ' : 'Rp ') + deRibuan(Math.abs(Number(v) || 0));
    else if (nama === 'ribuan') v = deRibuan(v);
    else if (nama === 'terbilang') v = deTerbilang(v) + (arg === 'rupiah' ? ' rupiah' : '');
    else if (nama === 'tanggal') v = arg ? (toDate(v) ? Utilities.formatDate(toDate(v), APP.TZ, arg) : String(v)) : deTanggalId(v);
    else if (nama === 'jam') v = toDate(v) ? fmt(v, 'HH:mm') + ' WIB' : String(v);
  });
  if (v instanceof Date) v = deTanggalId(v);
  return String(v);
}

function deDataLengkap_(dok, isian, cfg, pejabat, sumberData) {
  var kini = toDate(dok.terbit) || new Date();
  var d = {
    NOMOR: dok.nomor || '(nomor otomatis)', TANGGAL: deTanggalId(kini), TAHUN: fmt(kini, 'yyyy'), JAM: fmt(kini, 'HH:mm') + ' WIB',
    BULAN: DE_BULAN[Number(fmt(kini, 'M')) - 1], BULAN_ROMAWI: DE_ROMAWI[Number(fmt(kini, 'M')) - 1], HARI: DE_HARI[Number(fmt(kini, 'u')) % 7],
    KODE_VERIFIKASI: dok.kodeVerifikasi || '', URL_VERIFIKASI: dok.urlVerifikasi || '', DICETAK_OLEH: dok.oleh || '',
    INSTITUSI_NAMA: cfg.OUTLET_NAMA, INSTITUSI_CABANG: cfg.OUTLET_CABANG, INSTITUSI_ALAMAT: cfg.OUTLET_ALAMAT,
    INSTITUSI_TELP: cfg.OUTLET_TELP, INSTITUSI_TAGLINE: cfg.OUTLET_TAGLINE
  };
  Object.keys(sumberData || {}).forEach(function (k) { d[k] = sumberData[k]; });
  (pejabat || []).forEach(function (p) {
    var sfx = '_' + p.slot;
    d['NAMA_PEJABAT' + sfx] = p.nama; d['JABATAN' + sfx] = p.jabatan; d['KODE_PEJABAT' + sfx] = p.kode; d['NIP' + sfx] = p.kode;
    d['WAKTU_TTD' + sfx] = p.waktu ? fmt(p.waktu, 'dd/MM/yyyy HH:mm') + ' WIB' : '';
    d['TTD' + sfx] = p.metode === 'BYPASS' ? '[Disahkan Owner – ' + p.oleh + ']' : '✓ Disetujui elektronik (PIN)';
    if (p.slot === 1) { ['NAMA_PEJABAT', 'JABATAN', 'KODE_PEJABAT', 'NIP', 'WAKTU_TTD', 'TTD'].forEach(function (k) { d[k] = d[k + '_1']; }); }
  });
  // isian operator hanya untuk kolom non-sistem
  var terlarang = DE_SISTEM.concat(DE_VERIF);
  Object.keys(isian || {}).forEach(function (k) { var K = k.toUpperCase(); if (terlarang.indexOf(K) < 0 && !DE_SLOT.test(K)) d[K] = isian[k]; });
  return d;
}

// ============================================================================
// RENDERER GOOGLE DOCS
// ============================================================================
function deReDocs_(kunci) {
  return '(?i)\\{\\{\\s*[#?/]?\\s*' + kunci.replace(/\./g, '\\.') + '\\s*(\\|[^}]*)?\\}\\}';
}
function deWilayahDocs_(doc) { return [doc.getBody(), doc.getHeader(), doc.getFooter()].filter(function (x) { return x; }); }
function deGaya_(teksEl, offset) {
  var a = teksEl.getAttributes(offset), o = {};
  Object.keys(a).forEach(function (k) { if (a[k] !== null && a[k] !== undefined) o[k] = a[k]; });
  return o;
}

function deGantiDocs_(wilayah, data) {
  var POLA = '\\{\\{[^}]+\\}\\}', r, guard = 0;
  while ((r = wilayah.findText(POLA)) && guard++ < 5000) {
    var el = r.getElement().asText(), a = r.getStartOffset(), b = r.getEndOffsetInclusive();
    var p = dePindaiTeks(el.getText().slice(a, b + 1))[0];
    var nilai = (!p || p.jenis) ? '' : dePengubah(data[p.kunci], p.pengubah);
    var gaya = deGaya_(el, a);
    el.deleteText(a, b);
    if (nilai) { el.insertText(a, nilai); el.setAttributes(a, a + nilai.length - 1, gaya); }
  }
}

/** {{?X}} … {{/X}} : hapus seluruh paragraf di antaranya bila X kosong; bila terisi, buang penandanya saja. */
function deSyaratDocs_(body, data) {
  var guard = 0, r;
  while ((r = body.findText('\\{\\{\\s*\\?\\s*[A-Za-z][A-Za-z0-9_.]*\\s*\\}\\}')) && guard++ < 200) {
    var el = r.getElement().asText(), teks = el.getText().slice(r.getStartOffset(), r.getEndOffsetInclusive() + 1);
    var kunci = dePindaiTeks(teks)[0].kunci, isi = data[kunci];
    var kosong = isi === undefined || isi === null || String(isi).trim() === '' || (Array.isArray(isi) && !isi.length);
    var awal = deParagraf_(r.getElement());
    var tutup = body.findText('\\{\\{\\s*/\\s*' + kunci + '\\s*\\}\\}', r);
    if (!tutup) { el.deleteText(r.getStartOffset(), r.getEndOffsetInclusive()); continue; }
    var akhir = deParagraf_(tutup.getElement());
    if (kosong) {
      var wadah = awal.getParent(), i0 = wadah.getChildIndex(awal), i1 = wadah.getChildIndex(akhir);
      for (var i = i1; i >= i0; i--) { if (wadah.getNumChildren() > 1) wadah.removeChild(wadah.getChild(i)); }
    } else {
      tutup.getElement().asText().deleteText(tutup.getStartOffset(), tutup.getEndOffsetInclusive());
      el.deleteText(r.getStartOffset(), r.getEndOffsetInclusive());
    }
  }
}
function deParagraf_(el) {
  while (el.getType() !== DocumentApp.ElementType.PARAGRAPH && el.getType() !== DocumentApp.ElementType.LIST_ITEM) el = el.getParent();
  return el;
}

function deSisipGambarDocs_(wilayah, kunci, blob, lebarPt) {
  var r, guard = 0;
  while ((r = wilayah.findText(deReDocs_(kunci))) && guard++ < 50) {
    var el = r.getElement().asText(), a = r.getStartOffset();
    el.deleteText(a, r.getEndOffsetInclusive());
    var par = deParagraf_(el);
    var img = par.insertInlineImage(par.getChildIndex(el) + (a > 0 ? 1 : 0), blob);
    var w = lebarPt || 72, rasio = img.getHeight() / img.getWidth();
    img.setWidth(w).setHeight(Math.round(w * rasio));
  }
}

function deBarisBerulangDocs_(body, kunci, daftar, dataUmum) {
  var r = body.findText(deReDocs_(kunci));
  if (!r) return;
  var row = r.getElement();
  while (row && row.getType() !== DocumentApp.ElementType.TABLE_ROW) row = row.getParent();
  if (!row) return;
  var tabel = row.getParent(), idx = tabel.getChildIndex(row);
  (daftar || []).forEach(function (item, i) {
    var salin = tabel.insertTableRow(idx + 1 + i, row.copy());
    var data = Object.assign({}, dataUmum);
    Object.keys(item).forEach(function (k) { data[kunci + '.' + k.toUpperCase()] = item[k]; });
    data.NO = String(i + 1);
    data[kunci] = '';
    deGantiDocs_(salin, data);
  });
  tabel.removeRow(idx);
}

function deRenderDocs_(templateId, folder, namaBerkas, data, skema, gambar) {
  var salinan = DriveApp.getFileById(templateId).makeCopy(namaBerkas, folder);
  var doc = DocumentApp.openById(salinan.getId()), body = doc.getBody();
  (skema.bidang || []).forEach(function (b) {
    if (b.tipe === 'daftar') deBarisBerulangDocs_(body, b.kunci, data[b.kunci] || [], data);
  });
  deSyaratDocs_(body, data);
  deWilayahDocs_(doc).forEach(function (w) {
    Object.keys(gambar || {}).forEach(function (k) { deSisipGambarDocs_(w, k, gambar[k].blob, gambar[k].lebar); });
    deGantiDocs_(w, data);
  });
  doc.saveAndClose();
  return salinan;
}

// ============================================================================
// RENDERER GOOGLE SHEETS (XLSX) & SLIDES (PNG/PDF)
// ============================================================================
function deRenderSheets_(templateId, folder, namaBerkas, data, skema) {
  var salinan = DriveApp.getFileById(templateId).makeCopy(namaBerkas, folder);
  var ss = SpreadsheetApp.openById(salinan.getId());
  ss.getSheets().forEach(function (sh) {
    (skema.bidang || []).filter(function (b) { return b.tipe === 'daftar'; })
      .forEach(function (b) { deBarisBerulangSheets_(sh, b.kunci, data[b.kunci] || []); });
    var rg = sh.getDataRange(), nilai = rg.getValues(), rumus = rg.getFormulas(), ubah = false;
    var hasil = nilai.map(function (baris, r) {
      return baris.map(function (v, c) {
        var sumber = rumus[r][c] || v;
        if (typeof sumber !== 'string' || sumber.indexOf('{{') < 0) return rumus[r][c] || v;
        ubah = true;
        var p = dePindaiTeks(sumber);
        if (!rumus[r][c] && p.length === 1 && p[0].mentah === sumber.trim() && !p[0].pengubah) {
          var mentah = data[p[0].kunci];
          if (typeof mentah === 'number') return mentah;
          if (/^\d{4}-\d{2}-\d{2}$/.test(String(mentah))) return mentah;
        }
        return sumber.replace(DE_POLA, function (m, j, k, peng) { return j ? '' : dePengubah(data[k.toUpperCase()], peng); });
      });
    });
    if (ubah) rg.setValues(hasil);
  });
  SpreadsheetApp.flush();
  return salinan;
}

function deBarisBerulangSheets_(sh, kunci, daftar) {
  var tf = sh.createTextFinder('{{#' + kunci).matchCase(false).findNext();
  if (!tf) return;
  var r0 = tf.getRow(), kolom = sh.getLastColumn();
  if (daftar.length > 1) sh.insertRowsAfter(r0, daftar.length - 1);
  var pola = sh.getRange(r0, 1, 1, kolom);
  var isi = pola.getFormulas()[0].map(function (f, c) { return f || pola.getValues()[0][c]; });
  var keluaran = daftar.map(function (item, i) {
    return isi.map(function (sel) {
      if (typeof sel !== 'string') return sel;
      var p = dePindaiTeks(sel).filter(function (x) { return !x.jenis; });
      if (p.length === 1 && !p[0].pengubah && sel.replace(/\{\{\s*#[^}]*\}\}/, '').trim() === p[0].mentah) {
        var sub0 = p[0].kunci.indexOf(kunci + '.') === 0 ? p[0].kunci.slice(kunci.length + 1) : null;
        if (sub0 && typeof item[sub0] === 'number') return item[sub0];
        if (p[0].kunci === 'NO') return i + 1;
      }
      return sel.replace(DE_POLA, function (m, j, k, peng) {
        k = k.toUpperCase();
        if (j) return '';
        if (k === 'NO') return String(i + 1);
        var sub = k.indexOf(kunci + '.') === 0 ? k.slice(kunci.length + 1) : null;
        return sub ? dePengubah(item[sub] !== undefined ? item[sub] : item[sub.toLowerCase()], peng) : m;
      });
    });
  });
  if (daftar.length > 1) pola.copyTo(sh.getRange(r0 + 1, 1, daftar.length - 1, kolom), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  if (keluaran.length) sh.getRange(r0, 1, keluaran.length, kolom).setValues(keluaran);
  else sh.deleteRow(r0);
}

function deRenderSlides_(templateId, folder, namaBerkas, data, gambar) {
  var salinan = DriveApp.getFileById(templateId).makeCopy(namaBerkas, folder);
  var pres = SlidesApp.openById(salinan.getId());
  var mentahSemua = {};
  pres.getSlides().forEach(function (sl) {
    sl.getShapes().forEach(function (sp) {
      var t = sp.getText().asString().trim(), p = dePindaiTeks(t);
      if (p.length === 1 && p[0].mentah === t && gambar && gambar[p[0].kunci]) { sp.replaceWithImage(gambar[p[0].kunci].blob); return; }
      p.forEach(function (x) { mentahSemua[x.mentah] = x; });
    });
  });
  Object.keys(mentahSemua).forEach(function (m) { var x = mentahSemua[m]; pres.replaceAllText(m, dePengubah(data[x.kunci], x.pengubah)); });
  pres.saveAndClose();
  return salinan;
}

function deEkspor_(fileId, format) {
  var f = DriveApp.getFileById(fileId), mime = f.getMimeType(), url;
  if (format === 'pdf' && mime !== MimeType.GOOGLE_SHEETS) return f.getAs(MimeType.PDF);
  if (mime === MimeType.GOOGLE_DOCS) url = 'https://docs.google.com/document/d/' + fileId + '/export?format=' + format;
  else if (mime === MimeType.GOOGLE_SHEETS) {
    url = 'https://docs.google.com/spreadsheets/d/' + fileId + '/export?format=' + format +
      (format === 'pdf' ? '&size=A4&portrait=true&fitw=true&gridlines=false&printtitle=false&sheetnames=false' : '');
  } else if (mime === MimeType.GOOGLE_SLIDES) {
    url = format === 'png'
      ? 'https://docs.google.com/presentation/d/' + fileId + '/export/png?pageid=' + SlidesApp.openById(fileId).getSlides()[0].getObjectId()
      : 'https://docs.google.com/presentation/d/' + fileId + '/export/' + format;
  }
  var res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Ekspor ' + format + ' gagal (' + res.getResponseCode() + ').');
  return res.getBlob();
}

// ============================================================================
// PENOMORAN
// ============================================================================
function deAmbilNomor_(tpl) {
  return withLock(function () {
    var th = Number(fmt(new Date(), 'yyyy')), bln = DE_ROMAWI[Number(fmt(new Date(), 'M')) - 1];
    var r = readSheet('DE_Nomor').filter(function (x) { return String(x.kode) === tpl.kode; })[0];
    var urut = (r && Number(r.tahun) === th ? num(r.urut) : 0) + 1;
    if (r) updateByKey('DE_Nomor', 'kode', tpl.kode, { tahun: th, urut: urut, format: tpl.formatNomor });
    else appendObjects('DE_Nomor', [{ kode: tpl.kode, format: tpl.formatNomor, tahun: th, urut: urut }]);
    var nomor = String(tpl.formatNomor || '{URUT}/{KODE}/{BULAN}/{TAHUN}')
      .replace('{URUT}', ('000' + urut).slice(-3)).replace('{KODE}', tpl.kode).replace('{BULAN}', bln).replace('{TAHUN}', th)
      .replace('{OUTLET}', getConfig().OUTLET_KODE);
    return { nomor: nomor, urut: urut, kode: tpl.kode, tahun: th };
  });
}
function deKembalikanNomor_(ambil) {
  withLock(function () {
    invalidateRows('DE_Nomor');
    var r = readSheet('DE_Nomor').filter(function (x) { return String(x.kode) === ambil.kode; })[0];
    if (r && num(r.urut) === ambil.urut && num(r.tahun) === ambil.tahun) updateByKey('DE_Nomor', 'kode', ambil.kode, { urut: ambil.urut - 1 });
  });
}

// ============================================================================
// TERBITKAN DOKUMEN
// ============================================================================
/**
 * d = { kode, ref, isian:{}, keluaran:['pdf'], ttd:[{slot, email, pin}], bypassAlasan,
 *       verif:{ kode:'20 karakter', qr:'data:image/png;base64,...' } }
 * QR dibuat di peramban (pustaka qrcode-generator) karena GAS tidak punya pembuat QR bawaan;
 * kode verifikasi divalidasi format & keunikannya di server.
 * Aksi ini TIDAK memegang kunci global selama render (render bisa 5–20 detik) agar kasir lain tidak antre.
 */
function apiDeGenerate(ctx, d) {
  var cache = CacheService.getScriptCache(), idem = ctx.reqId ? 'idem_' + ctx.reqId : '';
  if (idem && cache.get(idem)) return JSON.parse(cache.get(idem));

  var rec = deCariTemplate_(d.kode);
  if (!rec || !bool(rec.aktif === '' ? 'TRUE' : rec.aktif)) return fail('Template tidak ditemukan atau nonaktif.');
  var tpl = deTemplateOut_(rec), skema = { bidang: tpl.bidang, slot: tpl.slotTtd };

  // validasi isian wajib
  var isian = d.isian || {};
  var kurang = tpl.bidang.filter(function (b) { return b.wajib && b.kategori !== 'sumber' && (isian[b.kunci] === undefined || String(isian[b.kunci]).trim() === ''); });
  if (kurang.length) return fail('Kolom wajib belum diisi: ' + kurang.map(function (b) { return b.label; }).join(', '));

  // penanda tangan
  var pejabat = [];
  for (var i = 0; i < tpl.slotTtd.length; i++) {
    var slot = tpl.slotTtd[i], kiriman = (d.ttd || []).filter(function (x) { return Number(x.slot) === slot.slot; })[0] || {};
    if (d.bypassAlasan && ctx.session.role === 'OWNER') {
      if (String(d.bypassAlasan).trim().length < 5) return fail('Alasan pengesahan Owner minimal 5 karakter.');
      var pemilik = findUser(kiriman.email || ctx.session.email) || {};
      pejabat.push({ slot: slot.slot, email: lower(pemilik.email || ctx.session.email), nama: pemilik.nama || ctx.session.nama,
        kode: pemilik.kode || '', jabatan: jabatanDari_(pemilik.role || 'OWNER'), metode: 'BYPASS', waktu: new Date(), oleh: ctx.session.nama, catatan: d.bypassAlasan });
      continue;
    }
    var u = findUser(kiriman.email);
    if (!u || !bool(u.aktif)) return fail('Pilih penanda tangan untuk slot "' + slot.label + '".');
    if ((ROLE_RANK[String(u.role).toUpperCase()] || 0) < (ROLE_RANK[slot.peranMin] || 2)) return fail(u.nama + ' tidak berwenang untuk slot "' + slot.label + '".');
    if (slot.wajibPin !== false) { var err = checkPin_(u, kiriman.pin); if (err) return fail(u.nama + ': ' + err); }
    pejabat.push({ slot: slot.slot, email: lower(u.email), nama: u.nama, kode: u.kode, jabatan: jabatanDari_(u.role),
                   metode: slot.wajibPin !== false ? 'PIN' : 'OPERATOR', waktu: new Date(), oleh: ctx.session.nama, catatan: '' });
  }

  // kode verifikasi
  var kodeV = String((d.verif && d.verif.kode) || '').toUpperCase();
  if (!/^[A-Z0-9]{16,32}$/.test(kodeV)) kodeV = Utilities.getUuid().replace(/-/g, '').slice(0, 20).toUpperCase();
  if (readSheet('DE_Dokumen').some(function (x) { return String(x.kodeVerifikasi) === kodeV; })) return fail('Kode verifikasi bentrok. Coba lagi.');
  var cfg = getConfig();
  var urlV = (cfg.VERIFY_BASE_URL ? String(cfg.VERIFY_BASE_URL).replace(/#.*$/, '').replace(/\/?$/, '/') : '') + '#/v/' + kodeV;

  var src = deSourceData_(tpl.sumber, d.ref, ctx);
  var ambil = deAmbilNomor_(tpl);
  var dokId = uid('D'), now = new Date();
  try {
    var dok = { nomor: ambil.nomor, terbit: now, kodeVerifikasi: kodeV, urlVerifikasi: urlV, oleh: ctx.session.nama };
    var data = deDataLengkap_(dok, isian, cfg, pejabat, src.data);
    var gambar = {};
    if (d.verif && d.verif.qr) {
      var m = String(d.verif.qr).match(/^data:(image\/(?:png|gif));base64,(.+)$/);
      if (m) gambar.QR = { blob: Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'qr.' + m[1].split('/')[1]), lebar: 80 };
    }
    if (!gambar.QR) data.QR = '[Kode verifikasi: ' + kodeV + ']';
    var folder = DriveApp.getFolderById(CONFIG.EXPORTS_FOLDER);
    var nama = tpl.nama + ' — ' + ambil.nomor.replace(/\//g, '-');
    var salinan = tpl.engine === 'sheets' ? deRenderSheets_(tpl.fileId, folder, nama, data, skema)
      : tpl.engine === 'slides' ? deRenderSlides_(tpl.fileId, folder, nama, data, gambar)
      : deRenderDocs_(tpl.fileId, folder, nama, data, skema, gambar);

    var keluaran = (d.keluaran && d.keluaran.length ? d.keluaran : tpl.keluaran).filter(function (k) { return tpl.keluaran.indexOf(k) > -1 || k === 'pdf'; });
    var berkas = { sumber: { id: salinan.getId(), url: salinan.getUrl() } }, hash = '', pdfB64 = '';
    keluaran.forEach(function (fmtK) {
      var blob = deEkspor_(salinan.getId(), fmtK).setName(nama + '.' + fmtK);
      var f = folder.createFile(blob);
      try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { }
      berkas[fmtK] = { id: f.getId(), url: f.getUrl(), unduh: 'https://drive.google.com/uc?export=download&id=' + f.getId() };
      if (fmtK === 'pdf') {
        var bytes = blob.getBytes();
        hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
        if (bytes.length < 4 * 1024 * 1024) pdfB64 = Utilities.base64Encode(bytes);
      }
    });
    var ringkasPejabat = pejabat.map(function (p) { return { slot: p.slot, nama: p.nama, jabatan: p.jabatan, kode: p.kode, metode: p.metode, waktu: iso(p.waktu) }; });
    // isian disimpan tanpa data sumber berukuran besar
    withLock(function () {
      appendObjects('DE_Dokumen', [{ id: dokId, templateKode: tpl.kode, versi: tpl.versi, nomor: ambil.nomor, judul: src.judul || tpl.nama,
        sumber: tpl.sumber, ref: src.ref || '', status: 'TERBIT', dataIsian: JSON.stringify(isian).slice(0, 40000),
        penandatangan: JSON.stringify(ringkasPejabat), kodeVerifikasi: kodeV, hashPdf: hash, berkas: JSON.stringify(berkas),
        dibuat: now, oleh: ctx.session.email, alasanTarik: '' }]);
      if (pejabat.length) appendObjects('DE_Persetujuan', pejabat.map(function (p) {
        return { dokumenId: dokId, slot: p.slot, pejabatEmail: p.email, pejabatNama: p.nama, metode: p.metode, catatan: p.catatan || '', waktu: p.waktu };
      }));
    });
    bump('de');
    logAct(ctx, 'DE_TERBIT', tpl.kode + ' ' + ambil.nomor, dokId);
    var out = ok({ id: dokId, nomor: ambil.nomor, judul: src.judul || tpl.nama, kodeVerifikasi: kodeV, urlVerifikasi: urlV, berkas: berkas,
                   hashPdf: hash, pdfBase64: pdfB64, penandatangan: ringkasPejabat }, 'Dokumen ' + ambil.nomor + ' terbit.');
    if (idem) { var s = JSON.stringify(Object.assign({}, out, { data: Object.assign({}, out.data, { pdfBase64: '' }) })); if (s.length < 90000) cache.put(idem, s, 21600); }
    return out;
  } catch (e) {
    deKembalikanNomor_(ambil);
    return fail('Gagal menerbitkan: ' + errMsg(e));
  }
}

function jabatanDari_(role) {
  return { OWNER: 'Owner Outlet', SUPERVISOR: 'Supervisor Outlet', KASIR: 'Kasir' }[String(role).toUpperCase()] || String(role);
}

function deDokOut_(x, lengkap) {
  var o = { id: x.id, templateKode: x.templateKode, nomor: x.nomor, judul: x.judul, sumber: x.sumber, ref: x.ref, status: x.status,
            kodeVerifikasi: x.kodeVerifikasi, dibuat: iso(x.dibuat), oleh: x.oleh, penandatangan: parseJson(x.penandatangan, []),
            berkas: parseJson(x.berkas, {}), alasanTarik: x.alasanTarik || '' };
  if (lengkap) o.hashPdf = x.hashPdf;
  return o;
}

function apiDeDocuments(ctx, d) {
  var rows = readSheet('DE_Dokumen').slice(-300).reverse();
  if (ctx.session.role === 'KASIR') rows = rows.filter(function (x) { return lower(x.oleh) === lower(ctx.session.email); });
  if (d && d.q) { var q = lower(d.q); rows = rows.filter(function (x) { return lower(x.nomor + ' ' + x.judul + ' ' + x.templateKode).indexOf(q) > -1; }); }
  return ok(rows.slice(0, 100).map(function (x) { return deDokOut_(x, false); }));
}

function apiDeRevoke(ctx, d) {
  if (String(d.alasan || '').trim().length < 5) return fail('Alasan penarikan minimal 5 karakter.');
  var x = readSheet('DE_Dokumen').filter(function (r) { return r.id === d.id; })[0];
  if (!x) return fail('Dokumen tidak ditemukan.');
  if (x.status === 'DITARIK') return fail('Dokumen sudah ditarik.');
  updateByKey('DE_Dokumen', 'id', d.id, { status: 'DITARIK', alasanTarik: String(d.alasan).slice(0, 200) });
  bump('de');
  logAct(ctx, 'DE_TARIK', d.alasan, d.id);
  return ok({ id: d.id, status: 'DITARIK' }, 'Dokumen ditarik. Halaman verifikasi kini menampilkan status DITARIK.');
}

/** Publik — halaman verifikasi QR. Tidak mengembalikan data pribadi pelanggan. */
function apiDeVerify(ctx, d) {
  var k = String((d && d.kode) || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (k.length < 16) return fail('Kode verifikasi tidak valid.');
  var c = CacheService.getScriptCache(), gk = 'vfail_' + k.slice(0, 6);
  if (Number(c.get(gk) || 0) > 30) return fail('Terlalu banyak percobaan. Coba lagi nanti.');
  var x = readSheet('DE_Dokumen').filter(function (r) { return String(r.kodeVerifikasi) === k; })[0];
  if (!x) { c.put(gk, String(Number(c.get(gk) || 0) + 1), 600); return fail('Dokumen dengan kode ini tidak terdaftar.', { status: 'TIDAK_DIKENAL' }); }
  var cfg = getConfig();
  return ok({ status: x.status === 'TERBIT' ? 'SAH' : 'DITARIK', nomor: x.nomor, judul: x.judul, jenis: x.templateKode,
              terbit: iso(x.dibuat), outlet: cfg.OUTLET_NAMA + ' — ' + cfg.OUTLET_CABANG, hashPdf: x.hashPdf,
              penandatangan: parseJson(x.penandatangan, []).map(function (p) { return { nama: p.nama, jabatan: p.jabatan, metode: p.metode, waktu: p.waktu }; }),
              alasanTarik: x.status === 'DITARIK' ? x.alasanTarik : '' });
}

// ============================================================================
// TEMPLATE CONTOH (sekali klik) — Z-Report, Nota A4, Rekap Penjualan, Surat Pesanan
// ============================================================================
function apiDeCreateSamples(ctx) {
  var folder = DriveApp.getFolderById(CONFIG.TEMPLATES_FOLDER), dibuat = [];
  var buat = [
    { kode: 'ZREPORT', nama: 'Z-Report Tutup Shift', sumber: 'shift', fn: deContohZReport_, keluaran: ['pdf'] },
    { kode: 'NOTA', nama: 'Nota / Invoice Transaksi A4', sumber: 'transaksi', fn: deContohNota_, keluaran: ['pdf', 'docx'] },
    { kode: 'REKAP', nama: 'Rekap Penjualan Periode', sumber: 'laporan', fn: deContohRekap_, keluaran: ['xlsx', 'pdf'] },
    { kode: 'PESANAN', nama: 'Surat Pesanan Bahan ke Supplier', sumber: 'manual', fn: deContohPesanan_, keluaran: ['pdf', 'docx'] }
  ];
  buat.forEach(function (b) {
    if (deCariTemplate_(b.kode)) return;
    var id = b.fn(folder);
    var res = apiDeScanTemplate(ctx, { kode: b.kode, nama: b.nama, url: 'https://docs.google.com/d/' + id + '/edit', sumber: b.sumber, keluaran: b.keluaran });
    if (res.success) dibuat.push(b.kode); else Logger.log(b.kode + ': ' + res.message);
    invalidateRows('DE_Template');
  });
  return ok({ dibuat: dibuat }, dibuat.length ? 'Template contoh dibuat: ' + dibuat.join(', ') : 'Semua template contoh sudah ada.');
}

function deDocBaru_(folder, nama) {
  var doc = DocumentApp.create(nama);
  DriveApp.getFileById(doc.getId()).moveTo(folder);
  doc.getBody().setMarginTop(36).setMarginBottom(36).setMarginLeft(48).setMarginRight(48);
  return doc;
}
function deKop_(body, judul) {
  var h = body.getParagraphs()[0];
  h.setText('{{INSTITUSI_NAMA|kapital}}').setHeading(DocumentApp.ParagraphHeading.HEADING1).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  h.editAsText().setForegroundColor('#B20007').setFontFamily('Inter');
  body.appendParagraph('{{INSTITUSI_TAGLINE}} · {{INSTITUSI_CABANG}}').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph('{{INSTITUSI_ALAMAT}} · Telp {{INSTITUSI_TELP}}').setAlignment(DocumentApp.HorizontalAlignment.CENTER).editAsText().setFontSize(9);
  body.appendHorizontalRule();
  body.appendParagraph(judul).setHeading(DocumentApp.ParagraphHeading.HEADING2).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph('Nomor: {{NOMOR}}').setAlignment(DocumentApp.HorizontalAlignment.CENTER);
}
function deTabel_(body, rows, headerWarna) {
  var t = body.appendTable(rows);
  if (headerWarna) { var r0 = t.getRow(0); for (var c = 0; c < r0.getNumCells(); c++) r0.getCell(c).setBackgroundColor(headerWarna).editAsText().setBold(true); }
  return t;
}
function deBlokTtd_(body, kotaTanggal) {
  body.appendParagraph('');
  var t = body.appendTable([['Dicetak oleh', 'Mengetahui,'], ['{{DICETAK_OLEH}}', '{{JABATAN_1}}'], ['', '{{TTD_1}}'], ['', '{{NAMA_PEJABAT_1}}'], ['', '{{KODE_PEJABAT_1}} · {{WAKTU_TTD_1}}']]);
  t.setBorderWidth(0);
  body.appendParagraph('');
  var q = body.appendTable([['{{QR}}', 'Pindai QR untuk memeriksa keaslian dokumen.\nKode verifikasi: {{KODE_VERIFIKASI}}\n{{URL_VERIFIKASI}}']]);
  q.setBorderWidth(0); q.setColumnWidth(0, 90);
  q.editAsText().setFontSize(8);
  if (kotaTanggal) body.appendParagraph('Dokumen elektronik — sah tanpa tanda tangan basah selama status verifikasi SAH.').editAsText().setFontSize(8).setItalic(true);
}

function deContohZReport_(folder) {
  var doc = deDocBaru_(folder, 'TEMPLATE — Z-Report Tutup Shift'), b = doc.getBody();
  deKop_(b, 'Z-REPORT TUTUP SHIFT KASIR');
  deTabel_(b, [['ID Shift', '{{SHIFT_ID}}', 'Terminal', '{{TERMINAL}}'], ['Kasir', '{{KASIR}}', 'Supervisor', '{{SUPERVISOR}}'],
    ['Buka', '{{BUKA|tanggal:dd/MM/yyyy HH:mm}}', 'Tutup', '{{TUTUP|tanggal:dd/MM/yyyy HH:mm}}']]);
  b.appendParagraph('Penerimaan per Saluran Bayar').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  deTabel_(b, [['Saluran', 'Jumlah'], ['Tunai (Cash)', '{{PENJUALAN_TUNAI|rupiah}}'], ['QRIS', '{{PENJUALAN_QRIS|rupiah}}'],
    ['Kartu Debit EDC', '{{PENJUALAN_EDC|rupiah}}'], ['E-Wallet', '{{PENJUALAN_EWALLET|rupiah}}'], ['TOTAL PENJUALAN ({{JML_TRX}} trx, {{JML_VOID}} void)', '{{TOTAL_PENJUALAN|rupiah}}'],
    ['Termasuk PPN', '{{TOTAL_PPN|rupiah}}'], ['Total diskon', '{{TOTAL_DISKON|rupiah}}']], '#FFE9E4');
  b.appendParagraph('Rekonsiliasi Kas Laci').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  deTabel_(b, [['No', 'Pecahan', 'Lembar', 'Jumlah'], ['{{#DENOM}}{{NO}}', '{{DENOM.PECAHAN|rupiah}}', '{{DENOM.LEMBAR}}', '{{DENOM.JUMLAH|rupiah}}']], '#FFE9E4');
  deTabel_(b, [['Modal awal', '{{MODAL_AWAL|rupiah}}'], ['Kas sistem (modal + tunai)', '{{KAS_SISTEM|rupiah}}'], ['Kas fisik dihitung', '{{KAS_FISIK|rupiah}}'],
    ['Selisih', '{{SELISIH|rupiah}} — {{STATUS_KAS}}']]);
  b.appendParagraph('{{?CATATAN_SHIFT}}');
  b.appendParagraph('Catatan pergantian shift: {{CATATAN_SHIFT}}');
  b.appendParagraph('{{/CATATAN_SHIFT}}');
  deBlokTtd_(b, true);
  doc.saveAndClose();
  return doc.getId();
}

function deContohNota_(folder) {
  var doc = deDocBaru_(folder, 'TEMPLATE — Nota Invoice A4'), b = doc.getBody();
  deKop_(b, 'NOTA PENJUALAN');
  deTabel_(b, [['No. Struk', '{{NO_STRUK}}', 'Waktu', '{{WAKTU_TRX|tanggal:dd/MM/yyyy HH:mm}}'], ['Pelanggan', '{{PELANGGAN}}', 'Tipe / Meja', '{{TIPE}} {{MEJA}}'], ['Kasir', '{{KASIR}}', 'Metode', '{{METODE}}']]);
  b.appendParagraph('');
  deTabel_(b, [['No', 'Item', 'Qty', 'Harga', 'Subtotal'], ['{{#ITEM}}{{NO}}', '{{ITEM.NAMA}}', '{{ITEM.QTY}}', '{{ITEM.HARGA|rupiah}}', '{{ITEM.SUBTOTAL|rupiah}}']], '#FFE9E4');
  deTabel_(b, [['Subtotal', '{{SUBTOTAL|rupiah}}'], ['Diskon', '{{DISKON|rupiah}}'], ['DPP', '{{DPP|rupiah}}'], ['PPN', '{{PPN|rupiah}}'], ['TOTAL', '{{TOTAL|rupiah}}']]);
  b.appendParagraph('Terbilang: {{TOTAL|terbilang:rupiah}}').editAsText().setItalic(true);
  b.appendParagraph('{{?CATATAN}}'); b.appendParagraph('Catatan: {{CATATAN}}'); b.appendParagraph('{{/CATATAN}}');
  deBlokTtd_(b, false);
  doc.saveAndClose();
  return doc.getId();
}

function deContohPesanan_(folder) {
  var doc = deDocBaru_(folder, 'TEMPLATE — Surat Pesanan Supplier'), b = doc.getBody();
  deKop_(b, 'SURAT PESANAN BAHAN BAKU');
  b.appendParagraph('{{HARI}}, {{TANGGAL}}');
  b.appendParagraph('Kepada Yth. {{SUPPLIER}}\n{{ALAMAT_SUPPLIER}}');
  b.appendParagraph('Dengan hormat, kami memesan bahan berikut untuk dikirim paling lambat {{TGL_KIRIM|tanggal}}:');
  deTabel_(b, [['No', 'Nama Bahan', 'Jumlah', 'Satuan', 'Keterangan'], ['{{#BARANG}}{{NO}}', '{{BARANG.NAMA}}', '{{BARANG.JUMLAH}}', '{{BARANG.SATUAN}}', '{{BARANG.KETERANGAN}}']], '#FFE9E4');
  b.appendParagraph('Perkiraan nilai pesanan: {{TOTAL_NOMINAL|rupiah}} ({{TOTAL_NOMINAL|terbilang:rupiah}}).');
  b.appendParagraph('{{?CATATAN}}'); b.appendParagraph('Catatan: {{CATATAN}}'); b.appendParagraph('{{/CATATAN}}');
  b.appendParagraph('Atas kerja samanya kami ucapkan terima kasih.');
  deBlokTtd_(b, true);
  doc.saveAndClose();
  return doc.getId();
}

function deContohRekap_(folder) {
  var ss = SpreadsheetApp.create('TEMPLATE — Rekap Penjualan');
  DriveApp.getFileById(ss.getId()).moveTo(folder);
  var sh = ss.getSheets()[0].setName('Rekap');
  var v = [
    ['{{INSTITUSI_NAMA|kapital}} — {{INSTITUSI_CABANG}}', '', '', '', '', '', ''],
    ['REKAP PENJUALAN', '', '', '', '', '', ''],
    ['Periode: {{PERIODE}}', '', '', '', '', 'Nomor: {{NOMOR}}', ''],
    ['', '', '', '', '', '', ''],
    ['No', 'Tanggal', 'Transaksi', 'Omzet Kotor', 'Diskon', 'PPN', 'Penjualan Bersih'],
    ['{{#HARI}}{{NO}}', '{{HARI.TANGGAL}}', '{{HARI.TRX}}', '{{HARI.GROSS}}', '{{HARI.DISKON}}', '{{HARI.PPN}}', '{{HARI.NETTO}}'],
    ['', 'TOTAL', '{{TOTAL_TRX}}', '{{OMZET_KOTOR}}', '{{TOTAL_DISKON}}', '{{TOTAL_PPN}}', '{{PENJUALAN_BERSIH}}'],
    ['', '', '', '', '', '', ''],
    ['Dicetak {{TANGGAL}} {{JAM}} oleh {{DICETAK_OLEH}} · Verifikasi: {{KODE_VERIFIKASI}}', '', '', '', '', '', '']
  ];
  sh.getRange(1, 1, v.length, 7).setValues(v);
  sh.getRange('A1:G2').setFontWeight('bold'); sh.getRange('A1').setFontSize(14).setFontColor('#B20007');
  sh.getRange('A5:G5').setFontWeight('bold').setBackground('#D7261E').setFontColor('#ffffff');
  sh.getRange('A7:G7').setFontWeight('bold').setBackground('#FFE9E4');
  sh.getRange('D6:G7').setNumberFormat('"Rp "#,##0');
  sh.setColumnWidths(1, 7, 120);
  SpreadsheetApp.flush();
  return ss.getId();
}


function seedDemo_() {
  setupAppEnvironment();
  resetMemo_();
  var prods = readSheet(SH.produk).map(productOut_);
  var kasir = findUser('kasir01@dapoermitoha.internal'), spv = findUser('spv01@dapoermitoha.internal');
  var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(42);
  var pick = function (arr) { return arr[Math.floor(rnd() * arr.length)]; };
  var seblak = prods.filter(function (p) { return /Seblak/.test(p.kategori); }), top = prods.filter(function (p) { return p.kategori === 'Topping'; }), bev = prods.filter(function (p) { return p.kategori === 'Minuman'; });
  var jamBobot = [9, 10, 11, 12, 12, 12, 13, 13, 14, 15, 16, 17, 18, 18, 18, 19, 19, 20, 21];
  var names = ['Kak Dinda', 'Mas Budi', 'Neng Gita', 'Pak Rahmat', 'Teh Rina', 'A Ujang', 'Bu Sari', 'GrabFood #882', 'Kang Asep', ''];
  var trxRows = [], shiftRows = [], now = new Date();
  for (var back = 7; back >= 0; back--) {
    var day = addDays(dayKey(now), -back), n = back === 0 ? 14 : 22 + Math.floor(rnd() * 14);
    var shId = 'SHF-' + day.replace(/-/g, '') + '-01', tun = 0, ch = { QRIS: 0, EDC: 0, EWALLET: 0 }, tot = 0, cnt = 0;
    var dayRows = [];
    for (var i = 0; i < n; i++) {
      var h = pick(jamBobot); if (back === 0 && h > Number(fmt(now, 'H'))) h = Math.max(9, Number(fmt(now, 'H')) - Math.floor(rnd() * 3));
      var waktu = new Date(day + 'T' + ('0' + h).slice(-2) + ':' + ('0' + Math.floor(rnd() * 60)).slice(-2) + ':' + ('0' + Math.floor(rnd() * 60)).slice(-2) + '+07:00');
      if (waktu > now) waktu = new Date(now.getTime() - (n - i) * 60000);
      var lines = [], s = pick(seblak), q = 1 + (rnd() < .3 ? 1 : 0);
      lines.push({ sku: s.sku, nama: s.nama, kategori: s.kategori, qty: q, harga: s.harga, subtotal: s.harga * q, level: Math.min(5, Math.floor(rnd() * 4) + (rnd() < .5 ? 2 : 1)), catatan: '' });
      if (rnd() < .65) { var t = pick(top); lines.push({ sku: t.sku, nama: t.nama, kategori: t.kategori, qty: 1, harga: t.harga, subtotal: t.harga, level: null, catatan: '' }); }
      if (rnd() < .55) { var b = pick(bev), bq = 1 + (rnd() < .4 ? 1 : 0); lines.push({ sku: b.sku, nama: b.nama, kategori: b.kategori, qty: bq, harga: b.harga, subtotal: b.harga * bq, level: null, catatan: '' }); }
      var sub = lines.reduce(function (a, l) { return a + l.subtotal; }, 0), disk = rnd() < .15 ? 3000 : 0, dpp = sub - disk, ppn = Math.round(dpp * .11), total = dpp + ppn;
      var m = rnd(), met = m < .45 ? 'TUNAI' : m < .78 ? 'QRIS' : m < .93 ? 'EDC' : 'EWALLET';
      var bayar = met === 'TUNAI' ? Math.ceil(total / 10000) * 10000 : total;
      var tipe = rnd() < .55 ? 'DINE_IN' : rnd() < .85 ? 'TAKE_AWAY' : 'ONLINE';
      var voided = rnd() < .03;
      dayRows.push({ id: '', waktu: waktu, tanggal: day, shiftId: shId, kasirEmail: kasir.email, kasirNama: kasir.nama, terminal: 'T-01', tipe: tipe,
        meja: tipe === 'DINE_IN' ? ('0' + (1 + Math.floor(rnd() * 12))).slice(-2) : '', pelanggan: pick(names), items: JSON.stringify(lines),
        jmlItem: lines.reduce(function (a, l) { return a + l.qty; }, 0), subtotal: sub, diskon: disk, dpp: dpp, ppn: ppn, total: total, metode: met, bayar: bayar,
        kembalian: bayar - total, detailBayar: JSON.stringify([met === 'TUNAI' ? { metode: 'TUNAI', jumlah: total, diterima: bayar } : { metode: met, jumlah: total }]),
        status: voided ? 'VOID' : 'LUNAS', catatan: rnd() < .2 ? pick(['Kuah nyemek kencur pekat', 'Pisah kuah dan kerupuk', 'Tanpa daun bawang', 'Sedikit cabai, kuah banjir']) : '',
        voidOleh: voided ? spv.email : '', voidAlasan: voided ? 'Salah input' : '' });
    }
    dayRows.sort(function (a, b) { return a.waktu - b.waktu; }).forEach(function (r, i) {
      r.id = 'TRX-' + day.replace(/-/g, '') + '-' + ('000' + (i + 1)).slice(-4);
      if (r.status === 'LUNAS') { cnt++; tot += r.total; if (r.metode === 'TUNAI') tun += r.total; else ch[r.metode] += r.total; }
    });
    PropertiesService.getScriptProperties().setProperty('SEQ_TRX_' + day.replace(/-/g, ''), String(dayRows.length));
    PropertiesService.getScriptProperties().setProperty('SEQ_SHF_' + day.replace(/-/g, ''), '1');
    trxRows = trxRows.concat(dayRows);
    var buka = new Date(day + 'T08:00:00+07:00'), tutup = new Date(day + 'T21:30:00+07:00'), kasSis = 200000 + tun, selisih = back === 3 ? -2000 : 0;
    shiftRows.push({ id: shId, terminal: 'T-01', kasirEmail: kasir.email, kasirNama: kasir.nama, buka: buka, tutup: back ? tutup : '', modalAwal: 200000,
      tunai: back ? tun : 0, qris: back ? ch.QRIS : 0, edc: back ? ch.EDC : 0, ewallet: back ? ch.EWALLET : 0, total: back ? tot : 0, jmlTrx: back ? cnt : 0,
      kasSistem: back ? kasSis : 200000, kasFisik: back ? kasSis + selisih : '', selisih: back ? selisih : '', denominasi: back ? JSON.stringify({ 100000: Math.floor((kasSis + selisih) / 100000) }) : '',
      supervisor: back ? spv.nama + ' (' + spv.kode + ')' : '', waktuOtorisasi: back ? tutup : '', catatan: '', status: back ? 'DITUTUP' : 'AKTIF' });
  }
  apiSaveSettings({ session: { email: 'owner@dapoermitoha.internal', role: 'OWNER' } }, { TARGET_HARIAN: '1200000', TARGET_BULANAN: '30000000' });
  appendObjects(SH.trx, trxRows);
  appendObjects(SH.shift, shiftRows);
}
var KEY = 'dm:demo:db:v3', saveT = null;
try { var saved = localStorage.getItem(KEY); if (saved) MockGAS.load(saved); } catch (e) { }
MockGAS.setOnChange(function () { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEY, MockGAS.dump()); } catch (e) { } }, 300); });
if (!PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')) { seedDemo_(); try { localStorage.setItem(KEY, MockGAS.dump()); } catch (e) { } }
window.DemoServer = {
  handle: function (body) { return JSON.parse(doPost({ postData: { contents: JSON.stringify(body) } }).getContent()); },
  get: function (params) { return JSON.parse(doGet({ parameter: params }).getContent()); },
  reset: function () { localStorage.removeItem(KEY); location.reload(); }
};
})();
