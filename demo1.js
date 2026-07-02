/* ============================================================================
   Dentimo interactive demo — faithful port of the desktop app's components
   (src/code/Home.js, HomePage.js, ...) filled with mock data.
   Part 1: shell (window chrome + tab bar), utilities, chart builders, Accueil.
   ============================================================================ */
(function () {
'use strict';

var A = 'assets/app/'; // app icons copied from the real app's public/assets

/* ------------------------------ utilities ------------------------------- */
function capFirstLetter(s) {
  if (!s || s.trim() === '') return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
var daysInFrench = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
var monthsInFrench = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
function getWholeDate(d) {
  var date = new Date(d);
  var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  var month = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1);
  return day + '/' + month + '/' + date.getFullYear();
}
function getCurrentTime() {
  var d = new Date();
  return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
}
function lightenColor(color, f) { // same intent as the app's lightenColor
  var m = color.match(/\d+/g).map(Number);
  var r = Math.round(m[0] + (255 - m[0]) * f), g = Math.round(m[1] + (255 - m[1]) * f), b = Math.round(m[2] + (255 - m[2]) * f);
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}
function isTooCloseToWhite(rgbColor) {
  var m = rgbColor.match(/\d+/g).map(Number);
  return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) > 190;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
var _id = 1000;
function generateId() { return 'op-' + (_id++); }

/* --------------------------- shared mock data --------------------------- */
var dentalCareTypes = [
  { type: 'Bilans et Examens', color: 'rgb(23, 189, 244)' },
  { type: 'S. Conserv.', color: 'rgb(255, 204, 0)' },
  { type: 'Parodontologie', color: 'rgb(255, 189, 73)' },
  { type: 'Chirurgie', color: 'rgb(255, 153, 153)' },
  { type: 'Implantologie', color: 'rgb(255, 179, 255)' },
  { type: 'P. Conjointe', color: 'rgb(204, 204, 255)' },
  { type: 'P. Adjointe', color: 'rgb(255, 179, 179)' },
  { type: 'BL & Depig.', color: 'rgb(230, 255, 230)' },
  { type: 'Communication', color: 'rgb(255, 204, 77)' },
  { type: 'Maint. & Suivi', color: 'rgb(255, 230, 179)' },
  { type: 'Equipements', color: 'rgb(204, 255, 255)' },
  { type: 'Divers', color: 'rgb(230, 179, 255)' },
  { type: 'Orthodontie', color: 'rgb(179, 255, 179)' },
  { type: 'Pédodontie', color: 'rgb(255, 179, 179)' }
];
function DCT(name) { for (var i = 0; i < dentalCareTypes.length; i++) if (dentalCareTypes[i].type === name) return dentalCareTypes[i]; return dentalCareTypes[0]; }

var USER = { firstName: 'youssef', lastName: 'bennani', dr: true, role: 0, id: 'u-admin' };
var DRS = [
  { firstName: 'youssef', lastName: 'bennani', dr: true, title: 'Dentiste' },
  { firstName: 'omar', lastName: 'tazi', dr: true, title: 'Dentiste' },
  { firstName: 'khalid', lastName: 'alaoui', dr: true, title: 'Dentiste' },
  { firstName: 'salma', lastName: 'idrissi', dr: true, title: 'Orthodontiste' }
];
DRS.forEach(function (d) { d.name = capFirstLetter(d.firstName) + ' ' + capFirstLetter(d.lastName); });
var ROOMS = ['--', 'Salle 1', 'Salle 2', 'Salle 3'];

var TODAY = new Date();
function dayPlus(n) { var d = new Date(TODAY); d.setDate(d.getDate() + n); return d; }

/* Appointments — matches the app's data shape (status flags per appointment) */
var APPOINTMENTS = [
  { id: 'a1', firstName: 'fatima', lastName: 'zouhri', number: '0640138007', dr: 'Youssef Bennani', room: 'Salle 1', off: 0, start: '08:15', end: '09:00', type: 'Chirurgie', completed: true, pended_at: '08:02', treated_at: '08:14', completed_at: '09:01', operation: 'Extraction chirurgicale' },
  { id: 'a2', firstName: 'khadija', lastName: 'mansouri', number: '0694045885', dr: 'Youssef Bennani', room: 'Salle 1', off: 0, start: '08:45', end: '09:15', type: 'Bilans et Examens', treating: true, pended_at: '08:40', treated_at: '08:47', operation: 'Consultation' },
  { id: 'a3', firstName: 'sohaib', lastName: 'boulaich', number: '0652953743', dr: 'Youssef Bennani', room: 'Salle 1', off: 0, start: '08:00', end: '08:30', type: 'S. Conserv.', comments: 2, operation: 'Composite' },
  { id: 'a4', firstName: 'fatima', lastName: 'zouhri', number: '0640138007', dr: 'Youssef Bennani', room: 'Salle 1', off: 0, start: '09:30', end: '10:15', type: 'Chirurgie', pending: true, pended_at: '09:21', operation: 'Extraction (dent permanente)', medicalDesc: 'Allergie à la pénicilline' },
  { id: 'a5', firstName: 'mariem', lastName: 'benali', number: '0639061952', dr: 'Youssef Bennani', room: 'Salle 1', off: 0, start: '10:45', end: '11:45', type: 'S. Conserv.', operation: 'Composite (M.O.D.)' },
  { id: 'a6', firstName: 'imane', lastName: 'berrada', number: '0662568330', dr: 'Youssef Bennani', room: 'Salle 2', off: 0, start: '11:45', end: '12:30', type: 'Bilans et Examens', new: true, operation: 'Consultation' },
  { id: 'a7', firstName: 'hamza', lastName: 'ouazzani', number: '0678120953', dr: 'Omar Tazi', room: 'Salle 2', off: 1, start: '09:00', end: '10:00', type: 'Implantologie', operation: 'Chirurgie implantaire' },
  { id: 'a8', firstName: 'nadia', lastName: 'cherkaoui', number: '0691227384', dr: 'Khalid Alaoui', room: 'Salle 3', off: 1, start: '11:00', end: '11:30', type: 'Parodontologie', operation: 'Détartrage' },
  { id: 'a9', firstName: 'yassine', lastName: 'lahlou', number: '0655443322', dr: 'Youssef Bennani', room: 'Salle 1', off: 2, start: '08:30', end: '09:30', type: 'P. Conjointe', operation: 'Couronne céramo-métallique "CCM"' }
];
APPOINTMENTS.forEach(function (a) { a.dentalCareTypes = [DCT(a.type)]; a.dentalCareOperations = a.operation ? [{ operation: a.operation }] : []; });
function appsToday() { return APPOINTMENTS.filter(function (a) { return a.off === 0; }); }
function upcomingToday() { return appsToday().filter(function (a) { return !a.completed && !a.canceled && !a.treating; }); }

/* --------------------------- root + scale logic -------------------------- */
var shell = document.getElementById('demoShell');
var stage = shell.querySelector('.demo-stage');
var root = document.createElement('div');
root.id = 'dentimoDemo';
root.className = 'main-window noselect';
stage.appendChild(root);
var W = 1366, H = 768;
function rescale() {
  var w = stage.clientWidth;
  var s = w / W;
  root.style.transform = 'scale(' + s + ')';
  if (document.fullscreenElement === shell) {
    var s2 = Math.min(shell.clientWidth / W, shell.clientHeight / H);
    root.style.transform = 'translate(' + Math.max(0, (shell.clientWidth - W * s2) / 2) + 'px,' + Math.max(0, (shell.clientHeight - H * s2) / 2) + 'px) scale(' + s2 + ')';
    stage.style.height = '100%';
  } else {
    stage.style.height = (H * s) + 'px';
  }
}
window.addEventListener('resize', rescale);
document.addEventListener('fullscreenchange', rescale);
var fsBtn = document.getElementById('demoFsBtn');
if (fsBtn) fsBtn.addEventListener('click', function () {
  if (document.fullscreenElement) { document.exitFullscreen(); }
  else if (shell.requestFullscreen) { shell.requestFullscreen(); }
});

/* ------------------------------ app state -------------------------------- */
var S = {
  windows: [1, 0, 0, 0, 0, 0],           // Accueil, Rendez-vous, Agenda, Patients, Paiements, Analytique
  closeBar: true,                        // sidebar collapsed
  openActingDrs: false,
  actingDr: DRS[0],
  nextPatient: 0,
  showRooms: false,
  week: (function () { var d = new Date(TODAY); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })()
};
var titles = ['Accueil', 'Rendez-vous', 'Agenda', 'Patients', 'Paiements', 'Analytique'];

/* app-style warning pill (customWarning from Home.js) */
function customWarning(text, color) {
  var old = root.querySelector('.warning-01'); if (old) old.remove();
  var div = document.createElement('div');
  div.className = 'warning-01';
  div.style.cssText = 'background-color:' + lightenColor(color, 0.94) + ';left:50%;transform:translateX(-50%);border-radius:3px;position:absolute;border-left:4px solid ' + lightenColor(color, 0.3) + ';top:30px;opacity:0;padding:10px 17px;z-index:30;';
  div.innerHTML = '<p style="font-family:Rubik;font-weight:200;color:' + color + ';font-size:13.7px;margin:0;">' + esc(text) + '</p>';
  root.appendChild(div);
  setTimeout(function () { div.remove(); }, 3900);
}
function demoOnly() { customWarning('Disponible dans l’application complète — ceci est une démo.', 'rgb(0, 149, 212)'); }
window.__dmo = { customWarning: customWarning, demoOnly: demoOnly };

/* post-render animation queue — the demo re-renders panes with innerHTML, so
   the app's CSS transitions (sidebar slide, patient sheet, dropdowns…) would
   never play. Actions queue the element's PREVIOUS value; after the render the
   element is laid out at that value, reflowed, then released to its new inline
   style so the ported transition runs (FLIP). */
var animQ = [];
function qAnim(sel, from) { animQ.push([sel, from]); }
function runAnimQ() {
  if (animQ.length === 0) return;
  var q = animQ; animQ = [];
  var jobs = [];
  q.forEach(function (it) {
    root.querySelectorAll(it[0]).forEach(function (el) {
      var saved = { transition: el.style.transition }, k;
      for (k in it[1]) { saved[k] = el.style[k]; el.style[k] = it[1][k]; }
      el.style.transition = 'none'; // commit the previous value without triggering anything
      jobs.push([el, saved]);
    });
  });
  root.getBoundingClientRect(); // ONE flush: every element commits at its previous value
  jobs.forEach(function (j) { for (var k in j[1]) j[0].style[k] = j[1][k]; });
}

/* ============================ chart builders =============================
   Hand-built SVG that mirrors the recharts output used by the app
   (CartesianGrid strokeDasharray="3 3", rounded bars, pies with labels,
   monotone area charts with fade gradient).                                */
function svgEl(w, h) {
  var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('width', w); s.setAttribute('height', h);
  s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  s.style.display = 'block';
  return s;
}
function roundedTopBar(x, y, w, h, r, fill) {
  if (h <= 0) return '';
  r = Math.min(r, w / 2, h);
  return '<path d="M' + x + ',' + (y + h) + ' v' + (-(h - r)) + ' a' + r + ',' + r + ' 0 0 1 ' + r + ',-' + r + ' h' + (w - 2 * r) + ' a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r + ' v' + (h - r) + ' z" fill="' + fill + '"/>';
}
/* grouped bar chart (recharts BarChart + CartesianGrid + XAxis + YAxis) */
function rechartsBar(host, cfg) {
  host.innerHTML = '';
  var w = host.clientWidth, h = host.clientHeight;
  if (w < 10 || h < 10) return;
  var m = cfg.margin || { t: 25, r: 50, b: 10, l: 0 };
  var axW = cfg.noYAxis ? 8 : 42, axH = 26;
  var px = m.l + axW, pw = w - px - m.r, py = m.t, ph = h - py - m.b - axH;
  var yMax = cfg.yMax, ticks = cfg.yTicks;
  var svg = svgEl(w, h), out = '';
  var grid = cfg.gridColor || '#ccc';
  // grid
  ticks.forEach(function (t) {
    var y = py + ph - (t / yMax) * ph;
    out += '<line x1="' + px + '" y1="' + y + '" x2="' + (px + pw) + '" y2="' + y + '" stroke="' + grid + '" stroke-dasharray="3 3"/>';
  });
  var n = cfg.data.length, band = pw / n;
  cfg.data.forEach(function (d, i) {
    var cx = px + band * i + band / 2;
    out += '<line x1="' + cx + '" y1="' + py + '" x2="' + cx + '" y2="' + (py + ph) + '" stroke="' + grid + '" stroke-dasharray="3 3"/>';
  });
  // axis lines (recharts default)
  if (!cfg.noAxisLines) {
    out += '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + (py + ph) + '" stroke="' + (cfg.axisColor || '#666') + '"/>';
    out += '<line x1="' + px + '" y1="' + (py + ph) + '" x2="' + (px + pw) + '" y2="' + (py + ph) + '" stroke="' + (cfg.axisColor || '#666') + '"/>';
  }
  // bars
  var totalBars = cfg.series.length;
  cfg.data.forEach(function (d, i) {
    var cx = px + band * i + band / 2;
    var gw = cfg.series.reduce(function (a, s) { return a + s.barSize; }, 0) + (totalBars - 1) * 4;
    var bx = cx - gw / 2;
    cfg.series.forEach(function (s) {
      var v = d[s.key] || 0;
      var bh = (v / yMax) * ph;
      out += roundedTopBar(bx, py + ph - bh, s.barSize, bh, s.radius != null ? s.radius : 3, typeof s.color === 'function' ? s.color(d) : s.color);
      bx += s.barSize + 4;
    });
  });
  // x labels
  cfg.data.forEach(function (d, i) {
    var cx = px + band * i + band / 2;
    var col = cfg.xTickColor ? (typeof cfg.xTickColor === 'function' ? cfg.xTickColor(d) : cfg.xTickColor) : '#666';
    out += '<text x="' + cx + '" y="' + (py + ph + 16) + '" text-anchor="middle" font-family="Rubik" font-weight="500" font-size="' + (cfg.xFont || 11.7) + '" fill="' + col + '">' + esc(d[cfg.xKey]) + '</text>';
  });
  // y labels
  if (!cfg.noYAxis) ticks.forEach(function (t) {
    var y = py + ph - (t / yMax) * ph;
    out += '<text x="' + (px - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-family="Rubik" font-size="' + (cfg.yFont || 12.3) + '" fill="' + (cfg.yTickColor || '#666') + '">' + (cfg.yFmt ? cfg.yFmt(t) : t) + '</text>';
  });
  svg.innerHTML = out;
  host.appendChild(svg);
}
/* pie chart (recharts Pie with value labels) */
function rechartsPie(host, cfg) {
  host.innerHTML = '';
  var w = host.clientWidth, h = host.clientHeight;
  if (w < 10 || h < 10) return;
  var cx = w / 2, cy = h / 2;
  var R = Math.min(w, h) / 2 * (cfg.outerRadius || 0.6);
  var total = cfg.data.reduce(function (a, d) { return a + d.value; }, 0) || 1;
  var svg = svgEl(w, h), out = '';
  var ang = -90; // recharts starts at 12 o'clock visually for label readability
  cfg.data.forEach(function (d, i) {
    var frac = d.value / total;
    var a0 = ang * Math.PI / 180, a1 = (ang + frac * 360) * Math.PI / 180;
    var x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    var x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    var large = frac > 0.5 ? 1 : 0;
    var color = cfg.colors[i % cfg.colors.length];
    if (frac >= 0.999) out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + color + '" stroke="' + (cfg.stroke || '#fff') + '"/>';
    else out += '<path d="M' + cx + ',' + cy + ' L' + x0 + ',' + y0 + ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + x1 + ',' + y1 + ' z" fill="' + color + '" stroke="' + (cfg.stroke || '#fff') + '" stroke-width="1"/>';
    if (cfg.label && d.value > 0) {
      var am = (a0 + a1) / 2;
      var lx0 = cx + R * Math.cos(am), ly0 = cy + R * Math.sin(am);
      var lx1 = cx + (R + 10) * Math.cos(am), ly1 = cy + (R + 10) * Math.sin(am);
      var lx2 = cx + (R + 18) * Math.cos(am), ly2 = cy + (R + 18) * Math.sin(am);
      out += '<path d="M' + lx0 + ',' + ly0 + ' L' + lx1 + ',' + ly1 + '" stroke="' + color + '" fill="none"/>';
      out += '<text x="' + lx2 + '" y="' + (ly2 + 4) + '" text-anchor="' + (Math.cos(am) >= 0 ? 'start' : 'end') + '" font-family="Rubik" font-weight="500" font-size="13.7" fill="' + (cfg.labelColor || color) + '">' + d.value + (cfg.labelSuffix || '') + '</text>';
    }
    ang += frac * 360;
  });
  svg.innerHTML = out;
  host.appendChild(svg);
}
/* monotone area chart (recharts AreaChart with fade gradient) */
var _gradN = 0;
function rechartsArea(host, cfg) {
  host.innerHTML = '';
  var w = host.clientWidth, h = host.clientHeight;
  if (w < 10 || h < 10) return;
  var m = cfg.margin || { t: 25, r: 50, b: 10, l: 0 };
  var axW = 42, axH = 24;
  var px = m.l + axW, pw = w - px - m.r, py = m.t, ph = h - py - m.b - axH;
  var yMax = cfg.yMax, ticks = cfg.yTicks;
  var gid = 'dmoGrad' + (++_gradN);
  var svg = svgEl(w, h);
  var out = '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgb(23, 189, 244)" stop-opacity="0.8"/><stop offset="100%" stop-color="rgb(23, 189, 244)" stop-opacity="0"/></linearGradient></defs>';
  if (cfg.grid !== false) ticks.forEach(function (t) {
    var y = py + ph - (t / yMax) * ph;
    out += '<line x1="' + px + '" y1="' + y + '" x2="' + (px + pw) + '" y2="' + y + '" stroke="' + (cfg.gridColor || '#1d353f') + '" stroke-dasharray="3 3"/>';
  });
  var n = cfg.data.length, band = pw / n;
  var pts = cfg.data.map(function (d, i) {
    return [px + band * i + band / 2, py + ph - ((d[cfg.yKey] || 0) / yMax) * ph];
  });
  if (cfg.grid !== false) pts.forEach(function (p) {
    out += '<line x1="' + p[0] + '" y1="' + py + '" x2="' + p[0] + '" y2="' + (py + ph) + '" stroke="' + (cfg.gridColor || '#1d353f') + '" stroke-dasharray="3 3"/>';
  });
  // monotone cubic path (curveMonotoneX)
  function monoPath(pts) {
    if (pts.length < 2) return '';
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var n = pts.length, dx = [], dy = [], ms = [], cs = [n];
    for (var i = 0; i < n - 1; i++) { dx[i] = xs[i + 1] - xs[i]; dy[i] = ys[i + 1] - ys[i]; ms[i] = dy[i] / dx[i]; }
    var t = [ms[0]];
    for (i = 1; i < n - 1; i++) t[i] = (ms[i - 1] * ms[i] <= 0) ? 0 : (ms[i - 1] + ms[i]) / 2;
    t[n - 1] = ms[n - 2];
    var d = 'M' + xs[0] + ',' + ys[0];
    for (i = 0; i < n - 1; i++) {
      var c1x = xs[i] + dx[i] / 3, c1y = ys[i] + t[i] * dx[i] / 3;
      var c2x = xs[i + 1] - dx[i] / 3, c2y = ys[i + 1] - t[i + 1] * dx[i] / 3;
      d += ' C' + c1x + ',' + c1y + ' ' + c2x + ',' + c2y + ' ' + xs[i + 1] + ',' + ys[i + 1];
    }
    return d;
  }
  var line = monoPath(pts);
  out += '<path d="' + line + ' L' + pts[pts.length - 1][0] + ',' + (py + ph) + ' L' + pts[0][0] + ',' + (py + ph) + ' z" fill="url(#' + gid + ')" stroke="none"/>';
  out += '<path d="' + line + '" fill="none" stroke="rgb(23, 189, 244)" stroke-width="1.5"/>';
  out += '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + (py + ph) + '" stroke="' + (cfg.axisColor || '#1f3742') + '"/>';
  out += '<line x1="' + px + '" y1="' + (py + ph) + '" x2="' + (px + pw) + '" y2="' + (py + ph) + '" stroke="' + (cfg.axisColor || '#1f3742') + '"/>';
  cfg.data.forEach(function (d, i) {
    if (cfg.xEvery && i % cfg.xEvery !== 0) return;
    out += '<text x="' + pts[i][0] + '" y="' + (py + ph + 15) + '" text-anchor="middle" font-family="Rubik" font-weight="500" font-size="' + (cfg.xFont || 11) + '" fill="' + (cfg.tickColor || '#fff') + '">' + esc(cfg.xFmt ? cfg.xFmt(d[cfg.xKey]) : d[cfg.xKey]) + '</text>';
  });
  ticks.forEach(function (t) {
    var y = py + ph - (t / yMax) * ph;
    out += '<text x="' + (px - 7) + '" y="' + (y + 4) + '" text-anchor="end" font-family="Rubik" font-size="' + (cfg.yFont || 11) + '" fill="' + (cfg.tickColor || '#fff') + '">' + (cfg.yFmt ? cfg.yFmt(t) : t) + '</text>';
  });
  svg.innerHTML = out;
  host.appendChild(svg);
}
function formatYAxis(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'm';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
  return v;
}

/* ============================ window shell ================================ */
function chipHTML(dc, mLeft) {
  return '<div style="margin:5px;background-color:rgb(44, 79, 94);padding:6px 6px;width:fit-content;border-radius:4px;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
    '<div style="width:16.4px;height:17.8px;max-width:21px;max-height:21px;border-radius:4px;background-color:' + dc.color + ';"></div>' +
    '<p style="margin-left:7px;font-family:Rubik;font-weight:300;font-size:13.7px;margin-top:0;margin-bottom:0;color:white;">' + esc(dc.type) + '</p></div>';
}

function renderShell() {
  var tabIcons = { 0: 'home.svg', 1: 'calendar1.svg', 2: 'agenda.svg', 3: 'patients.svg', 5: 'analytics.svg', 4: 'money.svg' };
  var tabs = '';
  titles.forEach(function (t, ii) {
    var v = S.windows[ii] === 1 ? 1 : 0;
    var iconW = ii === 3 ? 20 : ii === 0 ? 17 : ii === 4 ? 25 : 18;
    var iconH = ii === 0 ? 20 : ii === 3 ? 20 : ii === 4 ? 25 : 18;
    tabs += '<div data-act="tab" data-i="' + ii + '" class="windows" style="z-index:3;cursor:pointer;max-width:180px;width:164px;height:25px;background-color:' + (v === 1 ? 'rgb(242, 246, 248)' : 'rgb(84, 113, 124)') + ';border-radius:6px;margin:0px 5px;padding:0px 10px;box-sizing:border-box;display:flex;flex-direction:row;position:relative;">' +
      (v === 1 ? '<div class="drc-90"></div>' : '<div class="drc-91"></div>') +
      '<img src="' + A + tabIcons[ii] + '" style="width:' + iconW + 'px;height:' + iconH + 'px;filter:' + (v === 1 ? 'invert(0%)' : 'invert(100%) brightness(200%)') + ';margin-right:10px;position:absolute;z-index:2;left:' + (ii === 0 ? 7 : 6) + 'px;pointer-events:none;">' +
      (ii === 2 ? '<p style="position:absolute;left:10px;top:0;font-size:9px;color:' + (v === 1 ? 'white' : 'rgb(44, 79, 94)') + ';z-index:4;pointer-events:none;">' + (TODAY.getDate() < 10 ? '0' + TODAY.getDate() : TODAY.getDate()) + '</p>' : '') +
      '<h1 style="font-family:Quicksand;font-size:15px;color:' + (v === 1 ? 'black' : 'white') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;">' + t + '</h1></div>';
  });

  var drsList = DRS.map(function (d) {
    return '<h1 class="gn-59" data-act="pickActingDr" data-name="' + esc(d.name) + '" style="font-family:Rubik;transition:0.3s;font-size:15px;line-break:unset;color:rgb(44, 79, 94);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;padding:9px 12px;text-align:center;cursor:pointer;font-weight:500;margin:0;">' + esc(d.name) + '</h1>';
  }).join('');

  root.innerHTML =
    // window controls
    '<img data-act="winBtn" class="close" src="' + A + 'close.svg" style="height:15px;width:15px;position:absolute;right:0;top:0;cursor:pointer;padding:13px 15px;z-index:20;">' +
    '<img data-act="winBtn" class="min" src="' + A + 'min.svg" style="height:15px;width:15px;position:absolute;right:90px;top:0;padding:13px 15px;cursor:pointer;z-index:20;">' +
    '<img data-act="winBtn" class="min" src="' + A + 'unmaximize.svg" style="height:15px;width:15px;position:absolute;z-index:20;right:45px;top:0;padding:13px 15px;cursor:pointer;">' +
    // title bar
    '<div style="position:absolute;top:0;height:41px;width:100%;background-color:rgb(44, 79, 94);"></div>' +
    // click-away overlay for menus
    (S.openActingDrs || !S.closeBar ? '<div data-act="closeMenus" style="position:absolute;width:100%;height:100%;z-index:12;"></div>' : '') +
    // sidebar
    '<div id="dmoSidebar" style="position:absolute;transition:0.4s;height:100%;width:25%;max-width:355px;background-color:rgb(44, 79, 94);left:0;transform:translateX(' + (S.closeBar ? '-100%' : '0') + ');top:0;z-index:12;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
      '<img id="dmoSideLogo" src="assets/logo.svg" style="width:62%;height:auto;position:absolute;top:66px;z-index:2;opacity:' + (S.closeBar ? 0 : 1) + ';transition:opacity 0.3s;">' +
      '<img id="dmoSideArrow" data-act="toggleBar" src="' + A + 'sidebar/arrow.svg" style="width:35px;height:auto;cursor:pointer;position:absolute;top:10px;right:10px;z-index:2;transition:rotate 0.3s;rotate:' + (S.closeBar ? '180deg' : '0deg') + ';">' +
      '<h1 style="position:absolute;top:137px;color:white;font-family:Rubik;font-weight:100;margin:0;font-size:19px;">Dr. ' + esc(S.actingDr.name) + '</h1>' +
      '<div style="height:34%;max-height:270px;width:100%;background:linear-gradient(to bottom, rgb(33, 126, 156), rgb(23, 189, 244));border-bottom-right-radius:30%;"></div>' +
      '<div style="height:calc(100% - min(34%, 270px));width:100%;display:flex;flex-direction:column;align-items:center;justify-content:start;">' +
      [['home', 'Accueil', 1], ['account', 'Profil', 0], ['pref', 'Suivi des Dépenses', 0], ['settings', 'Paramètres', 0], ['people', 'Personnel', 0]].map(function (it) {
        return '<div class="' + (it[2] ? 'bar-02' : 'bar-01') + '" data-act="sideItem" style="width:calc(100% - 20px);position:relative;padding:10px 20px;box-sizing:border-box;border-radius:7px;background-color:' + (it[2] ? 'rgb(242, 246, 248)' : 'transparent') + ';margin-top:' + (it[1] === 'Accueil' ? 20 : 10) + 'px;display:flex;flex-direction:row;align-items:center;justify-content:start;cursor:pointer;">' +
          '<img src="' + A + 'sidebar/' + (it[0] === 'home' ? '' : '') + it[0] + '.svg" onerror="this.style.display=\'none\'" style="height:20px;filter:' + (it[2] ? '' : 'invert(100%) brightness(200%)') + ';">' +
          '<p style="color:' + (it[2] ? 'rgb(44, 79, 94)' : 'white') + ';font-size:14px;font-family:Rubik;font-weight:100;margin:0 0 0 10px;">' + it[1] + '</p></div>';
      }).join('') +
      '<div class="bar-01" data-act="sideItem" style="width:calc(100% - 20px);position:absolute;bottom:10px;padding:10px 20px;box-sizing:border-box;border-radius:7px;background-color:transparent;display:flex;flex-direction:row;align-items:center;justify-content:start;cursor:pointer;">' +
        '<img src="' + A + 'sidebar/logout.svg" onerror="this.style.display=\'none\'" style="height:20px;filter:invert(100%) brightness(200%);">' +
        '<p style="color:white;font-size:14px;font-family:Rubik;font-weight:100;margin:0 0 0 10px;">Déconnecter</p></div>' +
      '</div></div>' +
    // acting dr selector (admin)
    '<div id="dmoDrsBox" data-act="toggleActingDrs" style="position:absolute;cursor:pointer;top:5px;right:150px;z-index:12;background-color:rgb(242, 246, 248);padding:6px 0px 6px 20px;width:170px;border-radius:' + (S.openActingDrs ? '5px 5px 0px 0px' : '5px') + ';transition:border-radius 0.3s;display:flex;align-items:center;justify-content:center;">' +
      '<h1 style="font-family:Rubik;font-size:15px;line-break:unset;color:rgb(0, 149, 212);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:fit-content;max-width:150px;padding:0px 7px;font-weight:500;margin:0;pointer-events:none;">' + esc(S.actingDr.name) + '</h1>' +
      '<img id="dmoDrsArrow" src="' + A + 'arrow.svg" style="position:absolute;height:20px;left:5px;rotate:' + (S.openActingDrs ? '90deg' : '-90deg') + ';transition:rotate 0.3s;opacity:0.7;margin-top:2px;pointer-events:none;">' +
      '<div id="dmoDrsList" style="position:absolute;top:100%;left:0;background-color:rgb(242, 246, 248);width:100%;max-height:' + (S.openActingDrs ? '150px' : '0') + ';opacity:' + (S.openActingDrs ? 1 : 0) + ';overflow-y:scroll;overflow-x:hidden;transition:0.3s;border-radius:0px 0px 5px 5px;">' + drsList + '</div></div>' +
    // sidebar opener
    '<img data-act="openBar" src="' + A + 'sidebar/arrow1.svg" style="height:18px;position:absolute;top:8px;left:8px;cursor:pointer;background-color:rgb(242, 246, 248);padding:3px;border-radius:6px;z-index:8;rotate:180deg;">' +
    // tabs
    '<div style="display:flex;flex-direction:row;height:41px;position:absolute;top:0;left:36px;justify-content:start;align-items:center;max-width:70%;">' + tabs + '</div>' +
    // view port
    '<div class="view-port" id="dmoView"></div>';

  var view = root.querySelector('#dmoView');
  var pane = S.windows.indexOf(1);
  if (window.__dmoPanes && window.__dmoPanes[pane]) window.__dmoPanes[pane](view);
  runAnimQ();
}
window.__dmoRenderShell = renderShell;
window.__dmoState = S;
window.__dmoData = { APPOINTMENTS: APPOINTMENTS, DRS: DRS, ROOMS: ROOMS, dentalCareTypes: dentalCareTypes, USER: USER, TODAY: TODAY, dayPlus: dayPlus, appsToday: appsToday, upcomingToday: upcomingToday };
window.__dmoUtil = { capFirstLetter: capFirstLetter, getWholeDate: getWholeDate, getCurrentTime: getCurrentTime, daysInFrench: daysInFrench, monthsInFrench: monthsInFrench, esc: esc, chipHTML: chipHTML, isTooCloseToWhite: isTooCloseToWhite, generateId: generateId, A: A, rechartsBar: rechartsBar, rechartsPie: rechartsPie, rechartsArea: rechartsArea, formatYAxis: formatYAxis, svgEl: svgEl, roundedTopBar: roundedTopBar, qAnim: qAnim };

/* ========================= PANE 0 : ACCUEIL ==============================
   Port of src/code/HomePage.js                                             */
var colorMapping = { 'À venir': 'rgb(0, 148, 212)', 'En attente': 'rgb(255, 179, 0)', 'En cours': 'rgb(23, 189, 244)', 'Terminés': '#08E625' };
function weekData() {
  // getAnalyticsPublic mock : appointments per weekday (pv) + new patients (np)
  return [
    { day: 'Lundi', pv: 5, np: 2 }, { day: 'Mardi', pv: 2, np: 0 }, { day: 'Mercredi', pv: 1, np: 1 },
    { day: 'Jeudi', pv: 5, np: 1 }, { day: 'Vendredi', pv: 3, np: 0 }, { day: 'Samedi', pv: 2, np: 1 }, { day: 'Dimanche', pv: 0, np: 0 }
  ];
}
function todaysAnalytics() {
  var ana = [{ title: 'À venir', number: 0 }, { title: 'En attente', number: 0 }, { title: 'En cours', number: 0 }, { title: 'Terminés', number: 0 }];
  appsToday().forEach(function (ap) {
    if (!ap.completed && !ap.pending && !ap.treating && !ap.canceled) ana[0].number += 1;
    else if (ap.pending) ana[1].number += 1;
    else if (ap.treating) ana[2].number += 1;
    else if (ap.completed) ana[3].number += 1;
  });
  return ana;
}
function circularProgress(completed, toComplete, color, otherColor) {
  var radius = 50, strokeWidth = 10;
  var nr = radius - strokeWidth / 2;
  var c = 2 * Math.PI * nr;
  var progress = toComplete ? (completed / toComplete) * c : 0;
  return '<svg viewBox="0 0 100 100" style="width:90%;height:85%;">' +
    '<circle stroke="' + otherColor + '" fill="transparent" stroke-width="' + (strokeWidth * 0.6) + '" r="' + nr + '" cx="50" cy="50"/>' +
    '<circle stroke="' + color + '" fill="transparent" stroke-width="' + strokeWidth + '" stroke-dasharray="' + progress + ' ' + c + '" r="' + nr + '" cx="50" cy="50" stroke-linecap="round" transform="rotate(-90 50 50)"/></svg>';
}

function renderAccueil(view) {
  var apps = appsToday();
  var notCompleted = upcomingToday();
  if (S.nextPatient >= notCompleted.length) S.nextPatient = 0;
  var np = notCompleted[S.nextPatient];
  var ana = todaysAnalytics();

  var rows = notCompleted.map(function (a) {
    return '<div class="' + (a.pending ? 'os-39' : 'os-38') + '" style="width:calc(100% - 20px);position:relative;overflow:visible;border:2px solid white;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
      '<p style="width:10%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;">' + a.start + '</p>' +
      '<p data-act="goPatients" style="width:20%;font-family:Rubik;font-weight:500;color:rgb(0, 149, 212);text-align:center;cursor:pointer;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;">' + capFirstLetter(a.firstName) + ' ' + capFirstLetter(a.lastName) + '</p>' +
      '<p style="width:20%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;">' + a.number + '</p>' +
      '<p data-act="goRdv" style="width:20%;font-family:Rubik;font-weight:500;color:rgb(0, 149, 212);text-align:center;cursor:pointer;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;">Dr. ' + a.dr + '</p>' +
      '<div style="width:30%;position:relative;cursor:default;display:flex;flex-direction:row;align-items:center;justify-content:center;">' + chipHTML(a.dentalCareTypes[0]) + '</div>' +
      (a.comments ? '<div style="display:flex;flex-direction:row;position:absolute;right:10px;cursor:default;"><h3 style="color:#08E625;font-family:Rubik;font-size:16px;font-weight:500;margin:0 5px 0 0;display:flex;align-items:center;">' + a.comments + '</h3><img src="' + A + 'comment.svg" style="height:25px;filter:brightness(0) saturate(100%) invert(29%) sepia(9%) saturate(2060%) hue-rotate(153deg) brightness(90%) contrast(92%);"></div>' : '') +
      '</div>';
  }).join('');

  var roomsRows = ROOMS.filter(function (_, i) { return i !== 0; }).map(function (room) {
    var available = apps.filter(function (ap) { return ap.room === room && ap.treating; }).length === 0;
    return '<div data-act="goRdv" class="hy-92" style="width:100%;display:flex;padding:7px 0;align-items:center;justify-content:center;">' +
      '<p style="font-weight:500;font-family:Rubik;color:rgb(23, 189, 244);cursor:pointer;width:50%;text-align:center;margin:0;">' + room + '</p>' +
      '<div style="width:50%;text-align:center;display:flex;align-items:center;justify-content:center;cursor:default;"><p style="font-weight:500;font-family:Rubik;color:' + (available ? 'rgb(44, 79, 94)' : 'white') + ';text-align:center;margin:0;background-color:' + (available ? 'white' : 'rgb(23, 189, 244)') + ';border-radius:5px;padding:6px 10px;">' + (available ? 'Disponible' : 'Occupée') + '</p></div></div>';
  }).join('');

  view.innerHTML =
  '<div style="background-color:rgb(242, 246, 248);overflow:hidden;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;">' +
    '<div style="width:100%;height:calc(50% - 10px);background-color:rgb(242, 246, 248);display:flex;flex-direction:row;justify-content:center;align-items:center;">' +
      // ---- stats card
      '<div class="tf-62">' +
        '<h1 style="font-family:Rubik;font-size:14px;font-weight:bold;margin-left:20px;margin-top:20px;color:rgba(0,0,0,0.7);">Statistiques de rendez-vous</h1>' +
        '<div style="position:absolute;top:10px;right:10px;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
          '<img data-act="weekBack" src="' + A + 'arrow.svg" style="height:20px;margin-right:15px;filter:invert(30%);cursor:pointer;">' +
          '<p style="font-family:Rubik;font-size:15px;font-weight:500;color:rgb(70,70,70);">' + getWholeDate(S.week) + '</p>' +
          '<img data-act="weekFwd" src="' + A + 'arrow.svg" style="height:20px;rotate:180deg;filter:invert(30%);cursor:pointer;margin-left:15px;">' +
        '</div>' +
        '<div class="wh-12" id="dmoWeekChart"></div>' +
      '</div>' +
      // ---- middle + right card
      '<div class="tf-62" style="background-color:rgb(242, 246, 248);box-shadow:none;border:0;margin-left:10px;display:flex;flex-direction:row;justify-content:center;align-items:center;">' +
        '<div style="width:50%;height:100%;background-color:rgb(242, 246, 248);display:flex;flex-direction:column;justify-content:center;align-items:start;">' +
          '<div class="pf-39">' +
            '<h1 style="width:60%;margin-right:10px;font-family:Rubik;font-size:17.8px;font-weight:lighter;color:rgb(240,240,240);">Rendez-vous terminés</h1>' +
            '<div style="height:100%;display:flex;justify-content:center;align-items:center;position:relative;">' +
              circularProgress(apps.filter(function (a) { return a.completed && !a.canceled; }).length, apps.filter(function (a) { return !a.canceled; }).length, 'rgb(23, 189, 244)', 'rgb(74, 109, 124)') +
              '<h1 style="position:absolute;font-size:20.5px;font-family:Rubik;font-weight:lighter;color:rgb(230,230,230);"><span style="color:rgb(23, 189, 244);">' + apps.filter(function (a) { return a.completed; }).length + '</span>/' + apps.filter(function (a) { return !a.canceled; }).length + '</h1>' +
            '</div>' +
          '</div>' +
          // prochain patient
          '<div style="margin-top:10px;position:relative;width:calc(100% - 10px);height:60%;background-color:rgb(44, 79, 94);border-radius:7px;display:flex;flex-direction:column;align-items:start;justify-content:start;">' +
            '<h1 style="font-family:Rubik;margin-bottom:13px;margin-left:13px;margin-top:13px;font-size:14.3px;font-weight:lighter;color:rgb(242, 246, 248);text-align:start;">Prochain patient</h1>' +
            '<div style="display:flex;flex-direction:row;align-items:center;justify-content:center;position:absolute;right:10px;top:12px;">' +
              '<img data-act="npPrev" src="' + A + 'arrow.svg" style="width:19px;cursor:' + (notCompleted[S.nextPatient - 1] ? 'pointer' : 'default') + ';filter:invert(100%);opacity:' + (notCompleted[S.nextPatient - 1] ? 1 : 0.3) + ';">' +
              '<img data-act="npNext" src="' + A + 'arrow.svg" style="width:19px;cursor:' + (notCompleted[S.nextPatient + 1] ? 'pointer' : 'default') + ';filter:invert(100%);opacity:' + (notCompleted[S.nextPatient + 1] ? 1 : 0.3) + ';margin-left:10px;rotate:180deg;">' +
            '</div>' +
            (np ?
            '<div style="width:100%;height:calc(100% - 14.3px - 60px);position:relative;overflow-x:hidden;overflow-y:scroll;padding-bottom:10px;border-top:1px solid rgba(242, 246, 248,0.2);">' +
              '<h1 data-act="goPatients" style="font-family:Rubik;margin-bottom:0;margin-left:13px;margin-top:5px;font-size:16.4px;font-weight:500;color:rgb(23, 189, 244);text-align:start;cursor:pointer;">' + capFirstLetter(np.firstName) + ' ' + capFirstLetter(np.lastName) + '</h1>' +
              '<h1 style="font-family:Rubik;margin-bottom:0;margin-left:13px;margin-top:0;font-size:13.7px;font-weight:lighter;color:rgb(230, 230, 230);text-align:start;">' + np.number + '</h1>' +
              '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:start;flex-wrap:wrap;margin-left:5px;">' +
                '<div style="margin:5px;background-color:rgba(0,0,0,0.3);padding:6px 6px;width:fit-content;border-radius:4px;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
                  '<div style="width:16.4px;height:17.8px;max-width:21px;max-height:21px;border-radius:4px;background-color:' + np.dentalCareTypes[0].color + ';"></div>' +
                  '<p style="margin-left:7px;font-family:Rubik;font-weight:lighter;font-size:13.7px;margin-top:0;margin-bottom:0;color:white;">' + np.dentalCareTypes[0].type + '</p></div>' +
              '</div>' +
              (np.treating ? '<img src="' + A + 'treating.svg" style="position:absolute;top:5px;right:5px;width:28px;">' : '') +
              (np.pending ? '<img src="' + A + 'pendingThick.svg" style="position:absolute;top:5px;right:5px;width:28px;">' : '') +
              '<h1 data-act="goRdv" style="font-family:Rubik;margin-bottom:0;margin-left:13px;margin-top:0;font-size:13.7px;font-weight:500;color:rgb(23, 189, 244);text-align:start;cursor:pointer;">Dr. ' + np.dr + ' <span style="color:rgba(255,255,255,0.3);cursor:default;">|</span> ' + np.room + '</h1>' +
            '</div>' +
            '<div style="height:50px;width:100%;position:relative;bottom:0;left:0;display:flex;flex-direction:row;align-items:center;justify-content:center;border-top:1px dashed rgba(242, 246, 248,0.2);box-sizing:border-box;">' +
              '<p style="font-family:Rubik;font-weight:500;font-size:15px;margin:0;color:rgb(240,240,240);">' + np.start + '</p>' +
              '<div style="width:40px;height:4px;border-radius:4px;background-color:rgb(74, 109, 124);margin-left:10px;"></div>' +
              '<p style="font-family:Rubik;font-weight:500;font-size:15px;margin:0;color:rgb(240,240,240);margin-left:10px;">' + np.end + '</p>' +
            '</div>'
            : '<h1 style="font-family:Rubik;color:rgba(255,255,255,0.6);text-align:center;font-weight:500;font-size:15px;margin-top:10px;width:100%;">Aucun patient.</h1>') +
          '</div>' +
        '</div>' +
        // right half : today analytics chart OR rooms (change.svg toggles)
        (!S.showRooms ?
        '<div style="width:50%;height:100%;background-color:rgb(242, 246, 248);display:flex;flex-direction:column;justify-content:center;align-items:end;position:relative;">' +
          '<img data-act="toggleRooms" class="zk-48" src="' + A + 'change.svg" style="position:absolute;z-index:2;top:12px;right:7px;height:27px;opacity:0.5;filter:invert(100%);transition:opacity 0.3s;cursor:pointer;">' +
          '<div style="background-color:rgb(44, 79, 94);width:100%;height:100%;border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:start;padding:0 35.5px;box-sizing:border-box;position:relative;">' +
            '<div id="dmoTodayChart" style="width:100%;height:100%;"></div>' +
            '<div style="height:50px;position:absolute;top:0;left:35.5px;width:calc(100% - 71px);display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
              ana.map(function (a) { return '<p style="font-family:Rubik;font-weight:500;font-size:19.1px;color:' + (colorMapping[a.title] || '#000') + ';width:25%;margin:0;text-align:center;">' + a.number + '</p>'; }).join('') +
            '</div>' +
          '</div>' +
        '</div>'
        :
        '<div style="width:50%;height:100%;background-color:rgb(242, 246, 248);display:flex;flex-direction:column;justify-content:center;align-items:end;position:relative;">' +
          '<div style="background-color:rgb(44, 79, 94);width:100%;height:100%;border-radius:7px;display:flex;flex-direction:column;align-items:start;justify-content:start;">' +
            '<div class="pv-41" style="width:calc(100% - 50px);height:35px;margin-left:10px;margin-bottom:10px;display:flex;overflow:hidden;flex-direction:row;align-items:center;justify-content:start;min-height:35px;background-color:rgb(44, 79, 94);border-radius:6px;outline:2px solid rgb(74, 109, 124);margin-top:10px;">' +
              '<input autocomplete="off" class="dn-65" data-inp="roomSearch" placeholder="Nom du salle..." style="width:calc(100% - 50px);height:80%;border:0;font-family:Rubik;font-weight:500;padding:0 10px;background-color:rgb(44, 79, 94);color:rgb(23, 189, 244);">' +
              '<img src="' + A + 'searchBlue.svg" style="height:60%;opacity:0.6;">' +
            '</div>' +
            '<img data-act="toggleRooms" class="zk-48" src="' + A + 'change.svg" style="position:absolute;top:12px;right:7px;height:27px;opacity:0.5;filter:invert(100%);transition:opacity 0.3s;cursor:pointer;">' +
            '<div style="width:calc(100% - 20px);height:2px;min-height:2px;background-color:rgba(255, 255, 255, 0.22);border-radius:4px;margin-left:10px;"></div>' +
            '<div style="width:100%;display:flex;padding:7px 0;"><p style="font-weight:500;font-family:Rubik;color:white;width:50%;text-align:center;margin:0;">Salle</p><p style="font-weight:500;font-family:Rubik;color:white;width:50%;text-align:center;margin:0;">Statut</p></div>' +
            '<div style="width:calc(100% - 20px);height:2px;min-height:2px;background-color:rgba(255, 255, 255, 0.22);border-radius:4px;margin-left:10px;"></div>' +
            '<div style="max-height:calc(100% - 89px);overflow-y:scroll;width:100%;">' + roomsRows + '</div>' +
          '</div>' +
        '</div>') +
      '</div>' +
    '</div>' +
    // ---- appointments list
    '<div style="width:100%;height:50%;background-color:rgb(242, 246, 248);">' +
      '<div class="us-23">' +
        '<h1 style="font-family:Rubik;font-size:17px;font-weight:bold;left:20px;top:10px;color:rgba(0,0,0,0.8);position:absolute;">Rendez-vous à venir (' + notCompleted.length + ')</h1>' +
        '<button data-act="newRdv" class="si-30" style="border:2px solid rgb(23, 189, 244);font-family:Rubik;font-weight:lighter;padding:10px 18px;border-radius:7px;color:white;background-color:rgb(23, 189, 244);box-sizing:border-box;position:absolute;top:10px;right:10px;font-size:16px;cursor:pointer;">Nouveau rendez-vous</button>' +
        '<div style="width:calc(100% - 20px);display:flex;flex-direction:row;align-items:center;justify-content:center;margin-top:62px;position:relative;">' +
          '<div style="width:calc(100% - 20px);height:2px;background-color:rgba(0,0,0,0.1);border-radius:4px;position:absolute;top:0;"></div>' +
          '<p style="width:10%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;">Temps</p>' +
          '<p style="width:20%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;">Nom</p>' +
          '<p style="width:20%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;">Telephone</p>' +
          '<p style="width:20%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;">Docteur</p>' +
          '<p style="width:30%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;">Soin</p>' +
          '<div style="width:calc(100% - 20px);height:2px;background-color:rgba(0,0,0,0.1);border-radius:4px;position:absolute;bottom:0;"></div>' +
        '</div>' +
        '<div style="width:100%;overflow-y:scroll;padding:10px 0px;display:flex;flex-direction:column;align-items:center;justify-content:start;">' +
          (notCompleted.length === 0 ? '<p style="font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.8);font-size:18px;">Aucun rendez-vous à venir.</p>' : rows) +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

  // charts (after layout)
  requestAnimationFrame(function () {
    var wc = view.querySelector('#dmoWeekChart');
    if (wc) rechartsBar(wc, {
      data: weekData(), xKey: 'day', yMax: 8, yTicks: [0, 2, 4, 6, 8],
      series: [{ key: 'pv', color: 'rgb(23, 189, 244)', barSize: 12, radius: 3 }, { key: 'np', color: 'rgb(54, 239, 91)', barSize: 12, radius: 3 }]
    });
    var tc = view.querySelector('#dmoTodayChart');
    if (tc) rechartsBar(tc, {
      data: todaysAnalytics().map(function (a) { return { title: a.title, number: a.number }; }), xKey: 'title',
      yMax: Math.max.apply(null, todaysAnalytics().map(function (a) { return a.number; }).concat([4])), yTicks: [],
      margin: { t: 100, r: 0, b: 10, l: 0 }, noYAxis: true, noAxisLines: false, axisColor: '#1f3742', gridColor: 'transparent',
      xTickColor: function (d) { return colorMapping[d.title] || '#000'; }, xFont: 11.7,
      series: [{ key: 'number', color: function (d) { return colorMapping[d.title] || '#000'; }, barSize: 20, radius: 5 }]
    });
  });
}

/* pane registry (parts 2 & 3 fill the rest) */
window.__dmoPanes = { 0: renderAccueil };

/* --------------------------- event delegation ---------------------------- */
/* queue the sidebar / acting-dr menu at their CURRENT (pre-change) styles so
   the re-render animates from them (Home.js transitions: 0.4s slide, 0.3s
   opacity / rotate / border-radius / max-height) */
function qSidebarFrom(onlyIfOpen) {
  if (onlyIfOpen && S.closeBar) return;
  qAnim('#dmoSidebar', { transform: S.closeBar ? 'translateX(-100%)' : 'translateX(0px)' });
  qAnim('#dmoSideLogo', { opacity: S.closeBar ? '0' : '1' });
  qAnim('#dmoSideArrow', { rotate: S.closeBar ? '180deg' : '0deg' });
}
function qDrsFrom(onlyIfOpen) {
  if (onlyIfOpen && !S.openActingDrs) return;
  qAnim('#dmoDrsBox', { borderRadius: S.openActingDrs ? '5px 5px 0px 0px' : '5px' });
  qAnim('#dmoDrsArrow', { rotate: S.openActingDrs ? '90deg' : '-90deg' });
  qAnim('#dmoDrsList', { maxHeight: S.openActingDrs ? '150px' : '0px', opacity: S.openActingDrs ? '1' : '0' });
}
root.addEventListener('click', function (e) {
  var t = e.target.closest('[data-act]');
  if (!t || !root.contains(t)) return;
  var act = t.getAttribute('data-act');
  var handled = true;
  switch (act) {
    case 'tab': {
      var i = parseInt(t.getAttribute('data-i'), 10);
      S.windows = S.windows.map(function (_, k) { return k === i ? 1 : 0; });
      renderShell();
      break;
    }
    case 'winBtn': customWarning('Ceci est une démo — la fenêtre reste ouverte.', 'rgb(0, 149, 212)'); break;
    case 'toggleBar': case 'openBar':
      qSidebarFrom(); qDrsFrom(true);
      S.closeBar = !S.closeBar; S.openActingDrs = false; renderShell(); break;
    case 'closeMenus': case 'sideItem':
      qSidebarFrom(true); qDrsFrom(true);
      S.closeBar = true; S.openActingDrs = false;
      if (act === 'sideItem') demoOnly();
      renderShell(); break;
    case 'toggleActingDrs': qDrsFrom(); S.openActingDrs = !S.openActingDrs; renderShell(); break;
    case 'pickActingDr': {
      var nm = t.getAttribute('data-name');
      S.actingDr = DRS.filter(function (d) { return d.name === nm; })[0] || DRS[0];
      qDrsFrom(true);
      S.openActingDrs = false;
      renderShell();
      break;
    }
    case 'goPatients': S.windows = [0, 0, 0, 1, 0, 0]; renderShell(); break;
    case 'goRdv': S.windows = [0, 1, 0, 0, 0, 0]; renderShell(); break;
    case 'npPrev': if (upcomingToday()[S.nextPatient - 1]) { S.nextPatient--; renderShell(); } break;
    case 'npNext': if (upcomingToday()[S.nextPatient + 1]) { S.nextPatient++; renderShell(); } break;
    case 'weekBack': S.week.setDate(S.week.getDate() - 7); renderShell(); break;
    case 'weekFwd': S.week.setDate(S.week.getDate() + 7); renderShell(); break;
    case 'newRdv': customWarning('La fenêtre « Nouveau rendez-vous » s’ouvre dans l’application complète.', 'rgb(0, 149, 212)'); break;
    case 'toggleRooms': S.showRooms = !S.showRooms; renderShell(); break;
    default: handled = false;
  }
  if (!handled && window.__dmoClick) window.__dmoClick(act, t, e);
});

/* boot after all parts are loaded — desktop only; mobile gets the screenshot
   tour instead (index.html), so the demo DOM (and its assets) is never built.
   If the viewport later grows past the breakpoint, boot once, lazily. */
window.__dmoBoot = function () {
  var booted = false;
  function boot() {
    if (booted) return; booted = true;
    // deep link : #demo-rdv / #demo-patients / ...
    var map = { accueil: 0, rdv: 1, agenda: 2, patients: 3, paiements: 4, analytique: 5 };
    var m = location.hash.match(/^#demo-([a-z]+)/);
    if (m && map[m[1]] != null) S.windows = S.windows.map(function (_, k) { return k === map[m[1]] ? 1 : 0; });
    document.querySelectorAll('[data-open-tab]').forEach(function (a) {
      a.addEventListener('click', function () {
        var key = a.getAttribute('data-open-tab');
        if (key === 'dental' && window.__dmoOpenDental) { window.__dmoOpenDental(); return; }
        var i = map[key];
        if (i != null) { S.windows = S.windows.map(function (_, k) { return k === i ? 1 : 0; }); renderShell(); }
      });
    });
    rescale();
    if (m && m[1] === 'dental' && window.__dmoOpenDental) window.__dmoOpenDental();
    else renderShell();
  }
  var mq = window.matchMedia('(min-width: 821px)');
  if (mq.matches) boot();
  else if (mq.addEventListener) mq.addEventListener('change', function (e) { if (e.matches) boot(); });
  else if (mq.addListener) mq.addListener(function (e) { if (e.matches) boot(); });
};
})();
