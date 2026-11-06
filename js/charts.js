/* charts.js — grafik SVG ringan (tanpa pustaka). Satu sumbu, tooltip hover/fokus, batang ujung membulat. */
'use strict';
const CH = { bar: '#E8A317', hi: '#D7261E', line: '#D7261E', grid: '#F1DCCF', ink: '#5C403C', muted: '#8A6A5E' };

function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function svgEl(w, h, inner) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img">' + inner + '</svg>'; }
function tipFor(host) { let t = host.querySelector('.tip'); if (!t) { t = document.createElement('div'); t.className = 'tip'; host.appendChild(t); } return t; }
function showTip(host, x, y, lines) {
  const t = tipFor(host), svg = host.querySelector('svg'), r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  t.innerHTML = '';
  lines.forEach((l, i) => { const d = document.createElement(i === 0 ? 'b' : 'div'); d.textContent = l; t.appendChild(d); });
  const px = x * r.width / vb.width, py = y * r.height / vb.height;
  t.style.left = Math.max(70, Math.min(r.width - 70, px)) + 'px'; t.style.top = Math.max(40, py) + 'px'; t.classList.add('on');
}
function hideTip(host) { const t = host.querySelector('.tip'); if (t) t.classList.remove('on'); }

/** data: [{label, value, sub, hi}] — batang vertikal. */
function barChart(host, data, opt) {
  opt = opt || {};
  const W = 700, H = opt.height || 250, L = 52, R = 8, T = 12, B = 30;
  const max = niceMax(Math.max.apply(null, data.map(d => d.value).concat([0])));
  const iw = W - L - R, ih = H - T - B, step = iw / Math.max(data.length, 1), bw = Math.min(30, step * 0.56);
  let g = '';
  for (let i = 0; i <= 4; i++) {
    const y = T + ih - ih * i / 4;
    g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="' + CH.grid + '" stroke-width="1"' + (i ? ' stroke-dasharray="3 4"' : '') + '/>';
    g += '<text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="' + CH.muted + '" font-family="JetBrains Mono,monospace">' + (opt.fmtAxis ? opt.fmtAxis(max * i / 4) : Math.round(max * i / 4)) + '</text>';
  }
  data.forEach((d, i) => {
    const x = L + step * i + (step - bw) / 2, h = Math.max(d.value ? 3 : 0, ih * d.value / max), y = T + ih - h, r = Math.min(4, bw / 2, h);
    const col = d.hi ? CH.hi : CH.bar;
    if (h > 0) g += '<path d="M' + x + ' ' + (T + ih) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y + ' ' + (x + bw) + ' ' + (y + r) + 'V' + (T + ih) + 'Z" fill="' + col + '"/>';
    g += '<rect class="hit" data-i="' + i + '" x="' + (L + step * i) + '" y="' + T + '" width="' + step + '" height="' + ih + '" fill="transparent" tabindex="0"/>';
    const showLbl = data.length <= 14 || i % Math.ceil(data.length / 12) === 0 || i === data.length - 1;
    if (showLbl) g += '<text x="' + (L + step * i + step / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11.5" fill="' + (d.hi ? CH.hi : CH.ink) + '" font-weight="' + (d.hi ? 700 : 400) + '" font-family="JetBrains Mono,monospace">' + esc(d.label) + '</text>';
  });
  host.innerHTML = svgEl(W, H, g);
  host.querySelectorAll('.hit').forEach(el => {
    const on = () => { const d = data[+el.dataset.i]; el.setAttribute('fill', 'rgba(215,38,30,.06)'); showTip(host, +el.getAttribute('x') + step / 2, T + ih - ih * d.value / max, [opt.fmt ? opt.fmt(d.value) : d.value, d.label + (d.sub ? ' · ' + d.sub : '')]); };
    const off = () => { el.setAttribute('fill', 'transparent'); hideTip(host); };
    el.addEventListener('pointerenter', on); el.addEventListener('focus', on); el.addEventListener('pointerleave', off); el.addEventListener('blur', off);
  });
}

/** Garis + area dengan garis target (rujukan), crosshair tooltip. */
function lineChart(host, labels, values, opt) {
  opt = opt || {};
  const W = 700, H = opt.height || 250, L = 56, R = 10, T = 16, B = 30;
  const max = niceMax(Math.max.apply(null, values.concat([opt.target || 0, 1])) * 1.08);
  const iw = W - L - R, ih = H - T - B, n = values.length;
  const X = i => L + (n <= 1 ? iw / 2 : iw * i / (n - 1)), Y = v => T + ih - ih * v / max;
  let g = '<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + CH.line + '" stop-opacity=".22"/><stop offset="1" stop-color="' + CH.line + '" stop-opacity="0"/></linearGradient></defs>';
  for (let i = 0; i <= 4; i++) {
    const y = T + ih - ih * i / 4;
    g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="' + CH.grid + '"' + (i ? ' stroke-dasharray="3 4"' : '') + '/>';
    g += '<text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="' + CH.muted + '" font-family="JetBrains Mono,monospace">' + (opt.fmtAxis ? opt.fmtAxis(max * i / 4) : Math.round(max * i / 4)) + '</text>';
  }
  if (opt.target) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(opt.target) + '" y2="' + Y(opt.target) + '" stroke="' + CH.muted + '" stroke-width="1.5" stroke-dasharray="6 5"/>' +
    '<text x="' + (W - R) + '" y="' + (Y(opt.target) - 6) + '" text-anchor="end" font-size="11" fill="' + CH.ink + '" font-family="JetBrains Mono,monospace">Target ' + esc(opt.fmtAxis ? opt.fmtAxis(opt.target) : opt.target) + '</text>';
  if (n) {
    const pts = values.map((v, i) => [X(i), Y(v)]);
    let d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (let i = 1; i < n; i++) { const p0 = pts[i - 1], p1 = pts[i], cx = (p0[0] + p1[0]) / 2; d += 'C' + cx + ' ' + p0[1] + ' ' + cx + ' ' + p1[1] + ' ' + p1[0] + ' ' + p1[1]; }
    g += '<path d="' + d + 'L' + pts[n - 1][0] + ' ' + (T + ih) + 'L' + pts[0][0] + ' ' + (T + ih) + 'Z" fill="url(#ag)"/>';
    g += '<path d="' + d + '" fill="none" stroke="' + CH.line + '" stroke-width="2.25" stroke-linecap="round"/>';
    const mi = values.indexOf(Math.max.apply(null, values));
    if (values[mi] > 0) g += '<circle cx="' + pts[mi][0] + '" cy="' + pts[mi][1] + '" r="5" fill="' + CH.line + '" stroke="#fff" stroke-width="2"/>';
    g += '<line class="xh" x1="0" x2="0" y1="' + T + '" y2="' + (T + ih) + '" stroke="' + CH.ink + '" stroke-width="1" opacity="0"/><circle class="xd" r="5" fill="' + CH.line + '" stroke="#fff" stroke-width="2" opacity="0"/>';
  }
  const every = Math.ceil(n / 6);
  labels.forEach((l, i) => { if (i % every === 0 || i === n - 1) g += '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '" font-size="11.5" fill="' + CH.ink + '" font-family="JetBrains Mono,monospace">' + esc(l) + '</text>'; });
  g += '<rect class="hitarea" x="' + L + '" y="' + T + '" width="' + iw + '" height="' + ih + '" fill="transparent"/>';
  host.innerHTML = svgEl(W, H, g);
  const svg = host.querySelector('svg'), xh = host.querySelector('.xh'), xd = host.querySelector('.xd');
  if (!n) return;
  svg.addEventListener('pointermove', e => {
    const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width;
    const i = Math.max(0, Math.min(n - 1, Math.round((x - L) / (n <= 1 ? 1 : iw / (n - 1)))));
    xh.setAttribute('x1', X(i)); xh.setAttribute('x2', X(i)); xh.setAttribute('opacity', '.35');
    xd.setAttribute('cx', X(i)); xd.setAttribute('cy', Y(values[i])); xd.setAttribute('opacity', '1');
    showTip(host, X(i), Y(values[i]), [opt.fmt ? opt.fmt(values[i]) : values[i], labels[i] + (opt.sub ? ' · ' + opt.sub(i) : '')]);
  });
  svg.addEventListener('pointerleave', () => { xh.setAttribute('opacity', '0'); xd.setAttribute('opacity', '0'); hideTip(host); });
}
