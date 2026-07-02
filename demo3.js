/* ============================================================================
   Dentimo demo — Part 3 : Patients (src/code/Patients/* + imports/DentalChart.js)
   List -> patient sheet -> dental plan, with the app's real tooth renderer.
   ============================================================================ */
(function () {
'use strict';
var U = window.__dmoUtil, D = window.__dmoData, S = window.__dmoState;
var A = U.A, esc = U.esc, cap = U.capFirstLetter, getWholeDate = U.getWholeDate, Q = U.qAnim;
var daysInFrench = U.daysInFrench, monthsInFrench = U.monthsInFrench;
var dentalCareTypes = D.dentalCareTypes, TODAY = D.TODAY;
function warn(t, c) { window.__dmo.customWarning(t, c || 'rgb(0, 149, 212)'); }
function demoOnly() { window.__dmo.demoOnly(); }
function renderShell() { window.__dmoRenderShell(); }
function DCTcolor(type) { for (var i = 0; i < dentalCareTypes.length; i++) if (dentalCareTypes[i].type === type) return dentalCareTypes[i].color; return '#fff'; }

/* ==================== hexToFilter (imports/color-to-filter.js) =========== */
var hexToFilter = (function () {
  function hexToRgb(hex) {
    hex = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, function (_, r, g, b) { return r + r + g + g + b + b; });
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
  }
  function Color(r, g, b) { this.set(r, g, b); }
  Color.prototype = {
    set: function (r, g, b) { this.r = this.clamp(r); this.g = this.clamp(g); this.b = this.clamp(b); },
    clamp: function (v) { return Math.max(0, Math.min(255, v)); },
    multiply: function (m) {
      var newR = this.clamp(this.r * m[0] + this.g * m[1] + this.b * m[2]);
      var newG = this.clamp(this.r * m[3] + this.g * m[4] + this.b * m[5]);
      var newB = this.clamp(this.r * m[6] + this.g * m[7] + this.b * m[8]);
      this.r = newR; this.g = newG; this.b = newB;
    },
    hueRotate: function (angle) {
      angle = (angle || 0) / 180 * Math.PI;
      var sin = Math.sin(angle), cos = Math.cos(angle);
      this.multiply([
        0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928,
        0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.140, 0.072 - cos * 0.072 - sin * 0.283,
        0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072]);
    },
    grayscale: function (v) { this.multiply([0.2126 + 0.7874 * (1 - v), 0.7152 - 0.7152 * (1 - v), 0.0722 - 0.0722 * (1 - v), 0.2126 - 0.2126 * (1 - v), 0.7152 + 0.2848 * (1 - v), 0.0722 - 0.0722 * (1 - v), 0.2126 - 0.2126 * (1 - v), 0.7152 - 0.7152 * (1 - v), 0.0722 + 0.9278 * (1 - v)]); },
    sepia: function (v) { this.multiply([0.393 + 0.607 * (1 - v), 0.769 - 0.769 * (1 - v), 0.189 - 0.189 * (1 - v), 0.349 - 0.349 * (1 - v), 0.686 + 0.314 * (1 - v), 0.168 - 0.168 * (1 - v), 0.272 - 0.272 * (1 - v), 0.534 - 0.534 * (1 - v), 0.131 + 0.869 * (1 - v)]); },
    saturate: function (v) { this.multiply([0.213 + 0.787 * v, 0.715 - 0.715 * v, 0.072 - 0.072 * v, 0.213 - 0.213 * v, 0.715 + 0.285 * v, 0.072 - 0.072 * v, 0.213 - 0.213 * v, 0.715 - 0.715 * v, 0.072 + 0.928 * v]); },
    brightness: function (v) { this.linear(v); },
    contrast: function (v) { this.linear(v, -(0.5 * v) + 0.5); },
    linear: function (slope, intercept) {
      slope = slope == null ? 1 : slope; intercept = (intercept || 0) * 255;
      this.r = this.clamp(this.r * slope + intercept); this.g = this.clamp(this.g * slope + intercept); this.b = this.clamp(this.b * slope + intercept);
    },
    invert: function (v) {
      this.r = this.clamp((v + this.r / 255 * (1 - 2 * v)) * 255);
      this.g = this.clamp((v + this.g / 255 * (1 - 2 * v)) * 255);
      this.b = this.clamp((v + this.b / 255 * (1 - 2 * v)) * 255);
    },
    hsl: function () {
      var r = this.r / 255, g = this.g / 255, b = this.b / 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;
      if (max === min) { h = s = 0; }
      else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return { h: h * 100, s: s * 100, l: l * 100 };
    }
  };
  function Solver(target) {
    this.target = target;
    this.targetHSL = target.hsl();
    this.reusedColor = new Color(0, 0, 0);
  }
  Solver.prototype = {
    solve: function () { var result = this.solveNarrow(this.solveWide()); return { values: result.values, loss: result.loss, css: this.css(result.values) }; },
    solveWide: function () {
      var A0 = 5, c = 15, a = [60, 180, 18000, 600, 1.2, 1.2];
      var best = { loss: Infinity };
      for (var i = 0; best.loss > 25 && i < 3; i++) {
        var initial = [50, 20, 3750, 50, 100, 100];
        var result = this.spsa(A0, a, c, initial, 1000);
        if (result.loss < best.loss) best = result;
      }
      return best;
    },
    solveNarrow: function (wide) {
      var A0 = wide.loss, c = 2, A1 = A0 + 1;
      var a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
      return this.spsa(A0, a, c, wide.values, 500);
    },
    spsa: function (A0, a, c, values, iters) {
      var alpha = 1, gamma = 0.16666666666666666;
      var best = null, bestLoss = Infinity;
      var deltas = new Array(6), highArgs = new Array(6), lowArgs = new Array(6);
      for (var k = 0; k < iters; k++) {
        var ck = c / Math.pow(k + 1, gamma);
        for (var i = 0; i < 6; i++) {
          deltas[i] = Math.random() > 0.5 ? 1 : -1;
          highArgs[i] = values[i] + ck * deltas[i];
          lowArgs[i] = values[i] - ck * deltas[i];
        }
        var lossDiff = this.loss(highArgs) - this.loss(lowArgs);
        for (i = 0; i < 6; i++) {
          var g = lossDiff / (2 * ck) * deltas[i];
          var ak = a[i] / Math.pow(A0 + k + 1, alpha);
          values[i] = fix(values[i] - ak * g, i);
        }
        var loss = this.loss(values);
        if (loss < bestLoss) { best = values.slice(0); bestLoss = loss; }
      }
      function fix(value, idx) {
        var max = 100;
        if (idx === 2) max = 7500; else if (idx === 4 || idx === 5) max = 200;
        if (idx === 3) { if (value > max) value %= max; else if (value < 0) value = max + value % max; }
        else if (value < 0) value = 0; else if (value > max) value = max;
        return value;
      }
      return { values: best, loss: bestLoss };
    },
    loss: function (filters) {
      var color = this.reusedColor;
      color.set(0, 0, 0);
      color.invert(filters[0] / 100);
      color.sepia(filters[1] / 100);
      color.saturate(filters[2] / 100);
      color.hueRotate(filters[3] * 3.6);
      color.brightness(filters[4] / 100);
      color.contrast(filters[5] / 100);
      var colorHSL = color.hsl();
      return Math.abs(color.r - this.target.r) + Math.abs(color.g - this.target.g) + Math.abs(color.b - this.target.b) +
        Math.abs(colorHSL.h - this.targetHSL.h) + Math.abs(colorHSL.s - this.targetHSL.s) + Math.abs(colorHSL.l - this.targetHSL.l);
    },
    css: function (f) {
      function fmt(idx, mult) { return Math.round(f[idx] * (mult || 1)); }
      return 'brightness(0) saturate(100%) invert(' + fmt(0) + '%) sepia(' + fmt(1) + '%) saturate(' + fmt(2) + '%) hue-rotate(' + fmt(3, 3.6) + 'deg) brightness(' + fmt(4) + '%) contrast(' + fmt(5) + '%)';
    }
  };
  var cache = {};
  return function (hex) {
    if (!hex) return { css: 'none' };
    if (cache[hex]) return cache[hex];
    var rgb = hexToRgb(hex);
    if (!rgb) return { css: 'none' };
    var res = new Solver(new Color(rgb[0], rgb[1], rgb[2])).solve();
    cache[hex] = res;
    return res;
  };
})();

/* ============= getOperationParts (imports/ChildDentalChart.js) ============ */
var LAYER_KEYS = ['remove', 'abscent', 'erupted', 'erupting', 'empty', 'canal', 'pulp', 'root', 'vain', 'accessory', 'implant', 'crown', 'filling'];
var NO_DISPLAY = ['remove', 'implant', 'accessory', 'abscent', 'erupted', 'erupting', 'empty'];
function getOperationParts(operation) {
  var parts = {};
  switch (operation) {
    case '$abscent$': parts.abscent = { visible: true }; break;
    case '$erupted$': parts.erupted = { visible: true }; break;
    case 'Extraction (dent permanente)': parts.remove = { visible: true, color: '#ff4d4d' }; break;
    case 'Extraction (dent de sagesse)': parts.remove = { visible: true, color: '#ff6b6b' }; break;
    case 'Extraction chirurgicale': parts.remove = { visible: true, color: '#d63031' }; break;
    case 'Extraction de racine incluse': parts.remove = { visible: true, color: '#8e0000' }; break;
    case 'Chirurgie implantaire': parts.implant = { visible: true, color: '#636e72' }; break;
    case 'Mini-implants de stabilisation': parts.implant = { visible: true, color: '#95a5a6' }; break;
    case 'Suivi implantaire (Vis de cicatrisation)': parts.implant = { visible: true, color: '#a4b0be' }; break;
    case 'Couronne sur implant': parts.crown = { visible: true, color: '#fbc531' }; break;
    case 'Gingivectomie (par arcade)': parts.vain = { visible: true, color: '#ff7675' }; break;
    case 'Freinectomie': parts.vain = { visible: true, color: '#fd79a8' }; break;
    case 'Facette céramique unitaire': parts.crown = { visible: true, color: '#fff5d6' }; break;
    case 'Couronne céramo-métallique "CCM"': parts.crown = { visible: true, color: '#b2bec3' }; break;
    case 'Couronne céramo-zircone "CCZ"': parts.crown = { visible: true, color: '#ecf0f1' }; break;
    case 'Couronne Emax céramique': parts.crown = { visible: true, color: '#f5f6fa' }; break;
    case 'Couronne provisoire': parts.crown = { visible: true, color: '#f6e58d' }; break;
    case 'Composite': case 'Composite antérieur': case 'Composite antérieure esthétique': case 'Composite (M.O.D.)':
      parts.filling = { visible: true, color: '#ffffff' }; break;
    case 'Reconstitution "verre ionomère"': parts.filling = { visible: true, color: '#dfe6e9' }; break;
    case 'Réimplantation (par dent)': parts.root = { visible: true, color: '#43a996' }; break;
  }
  return parts;
}

/* ================= DentalChartRenderer (imports/DentalChart.js) =========== */
var UPPER_ROW = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
var LOWER_ROW = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
var TOOTH_SIZES = [7, 7, 7, 5, 5, 4.5, 4.5, 4.5];
function getToothSize(i) { return i < 8 ? TOOTH_SIZES[i] : TOOTH_SIZES[15 - i]; }
function getToothImageData(n) {
  if (n >= 21 && n <= 28) return { img: 28 - n, mirrored: true };
  if (n >= 11 && n <= 18) return { img: 18 - n, mirrored: false };
  if (n >= 31 && n <= 38) return { img: 16 + (38 - n), mirrored: false };
  if (n >= 41 && n <= 48) return { img: 16 + (48 - n), mirrored: true };
  return { img: 0, mirrored: false };
}
function toothStatesFrom(ops) {
  var state = {};
  ops.forEach(function (item) {
    var parts = getOperationParts(item.operation);
    (item.tooth || []).forEach(function (tooth) {
      if (!state[tooth]) state[tooth] = {};
      for (var k in parts) {
        if (LAYER_KEYS.indexOf(k) < 0) continue;
        state[tooth][k] = { visible: parts[k].visible !== false, opacity: parts[k].opacity != null ? parts[k].opacity : 1, color: parts[k].color || null };
      }
    });
  });
  return state;
}
var toothImgStyle = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;user-select:none;pointer-events:none;';
function toothHTML(number, layerState, size, numberPosition, selected) {
  var info = getToothImageData(number);
  var remove = 'remove' in layerState, implant = 'implant' in layerState, abscent = 'abscent' in layerState;
  var visibleLayers = LAYER_KEYS.filter(function (k) { return layerState[k] && layerState[k].visible === true && NO_DISPLAY.indexOf(k) < 0; });
  var inner = '';
  if (!remove && !implant && !abscent) inner += '<img src="' + A + 'teeth_individuals/' + info.img + '.png" draggable="false" style="' + toothImgStyle + 'transform:' + (info.mirrored ? 'scaleX(-1)' : 'none') + ';">';
  if (remove) inner += '<img src="' + A + 'close.svg" style="position:absolute;width:30px;filter:brightness(0) saturate(100%) invert(50%) sepia(44%) saturate(5327%) hue-rotate(334deg) brightness(109%) contrast(107%);pointer-events:none;">';
  if (implant) inner += '<img src="' + A + 'teeth_accesories/screw1.png" style="position:absolute;width:40%;rotate:' + (numberPosition === 'top' ? '0deg' : '180deg') + ';z-index:2;pointer-events:none;">';
  if (implant && !('crown' in layerState)) inner += '<img src="' + A + 'teeth_crown/' + info.img + '.png" draggable="false" style="' + toothImgStyle + 'transform:' + (info.mirrored ? 'scaleX(-1)' : 'none') + ';border:0;outline:0;z-index:2;">';
  if (abscent) inner += '<h1 style="color:white;font-size:27.6px;font-family:Rubik;font-weight:300;position:absolute;pointer-events:none;margin:0;">M</h1>';
  visibleLayers.forEach(function (layerKey) {
    if (implant && (layerKey === 'root' || layerKey === 'vain')) return;
    var ls = layerState[layerKey];
    inner += '<img src="' + A + 'teeth_' + layerKey + '/' + info.img + '.png" draggable="false" style="' + toothImgStyle + 'opacity:' + (ls.opacity != null ? ls.opacity : 1) + ';transform:' + (info.mirrored ? 'scaleX(-1)' : 'none') + ';border:0;outline:0;filter:' + (ls.color ? hexToFilter(ls.color).css : 'none') + ';z-index:' + ((implant && (layerKey === 'crown' || layerKey === 'filling')) ? 2 : 0) + ';">';
  });
  var numberEl = '<div class="tooth_number">' + number + '</div>';
  return '<div data-act="tooth" data-n="' + number + '" class="tooth_holder' + (selected ? ' selected' : '') + '" style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;width:' + size + '%;">' +
    (numberPosition === 'top' ? numberEl : '') +
    '<div style="position:relative;display:flex;justify-content:center;align-items:center;width:100%;height:84.5px;border-width:' + (numberPosition === 'top' ? '2px 0 0 0' : '0 0 2px 0') + ';border-color:' + (selected ? '#71ffa3' : '#ffffff00') + ';transition:border-color 0.3s;border-style:solid;border-radius:10px;pointer-events:none;">' + inner + '</div>' +
    (numberPosition === 'bottom' ? numberEl : '') +
    '</div>';
}
function dentalChartHTML(ops, selectedTeeth) {
  var states = toothStatesFrom(ops);
  function row(teeth, pos) {
    return '<div style="display:flex;justify-content:center;width:100%;"><div style="display:flex;align-items:center;justify-content:center;gap:0;width:100%;height:50%;">' +
      teeth.map(function (n, i) { return toothHTML(n, states[n] || {}, getToothSize(i), pos, selectedTeeth.indexOf(n) >= 0); }).join('') +
      '</div></div>';
  }
  return '<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;">' +
    row(UPPER_ROW, 'bottom') + row(LOWER_ROW, 'top') + '</div>';
}

/* ---------------------------- mock patients ------------------------------ */
var Inssurances = ['--', 'CNOPS', 'CNSS', 'AXA Assurance', 'Saham', 'RMA'];
var Types = ['--', 'Adulte', 'Enfant', 'Etudiant', 'Retraité'];
var Sexes = ['--', 'Homme', 'Femme'];
var paymentMethods = ['Espèces', 'Chèque', 'Carte', 'Virement'];
var t0 = getWholeDate(TODAY);
function mkOps(list) {
  return list.map(function (o) {
    return { id: U.generateId(), valid: o.valid || false, tooth: o.tooth, operation: o.op, stable: o.p, unstable: o.p, solde: o.solde || 0, modify: [false, false], dr: o.dr || 'Youssef Bennani', date: o.date || t0, hour: o.hour || '09:12', color: o.sys ? '#fff' : DCTcolor(o.type), check: false, dentalCareType: o.type };
  });
}
var PATIENTS = [
  { id: 'p1', firstName: 'Mariem', lastName: 'Benali', sexe: 'Femme', number: '0639061952', email: 'mariem.benali@gmail.com', birthDate: '22/09/2005', inssurance: 'CNOPS', title: 'Enfant', age: 20, code: 'CNO-A-F-0-20-2005',
    ops: mkOps([
      { tooth: [25], op: '$abscent$', type: '$SYSTEM$', p: 0, sys: true, date: '03/06/2026', hour: '21:20', valid: true },
      { tooth: [18], op: 'Extraction chirurgicale', type: 'Chirurgie', p: 2700, valid: true, date: '03/06/2026', hour: '21:27' },
      { tooth: [47], op: 'Chirurgie implantaire', type: 'Implantologie', p: 1600, valid: true, date: '06/06/2026', hour: '15:53' },
      { tooth: [16], op: 'Couronne céramo-métallique "CCM"', type: 'P. Conjointe', p: 1600, solde: 1600 }
    ]),
    payments: [
      { id: 'py1', date: '03/06/2026', payment: 3400, method: 'Espèces', valid: true, by: 'Youssef Bennani' },
      { id: 'py2', date: '17/05/2026', payment: 900, method: 'Espèces', valid: true, by: 'Youssef Bennani' }
    ] },
  { id: 'p2', firstName: 'Sohaib', lastName: 'Boulaich', sexe: 'Homme', number: '0652953743', email: '--', birthDate: '14/03/1992', inssurance: 'CNSS', title: 'Adulte', age: 34, code: 'CNS-A-H-1-34-1992',
    ops: mkOps([{ tooth: [36], op: 'Composite', type: 'S. Conserv.', p: 600, valid: true, date: '11/06/2026' }, { tooth: [37], op: 'Composite (M.O.D.)', type: 'S. Conserv.', p: 700, solde: 300 }]),
    payments: [{ id: 'py3', date: '11/06/2026', payment: 1000, method: 'Carte', valid: true, by: 'Youssef Bennani' }] },
  { id: 'p3', firstName: 'Fatima', lastName: 'Zouhri', sexe: 'Femme', number: '0640138007', email: 'fatima.zouhri@gmail.com', birthDate: '02/11/1988', inssurance: 'AXA Assurance', title: 'Adulte', age: 37, code: 'AXA-A-F-0-37-1988',
    ops: mkOps([{ tooth: [11], op: 'Facette céramique unitaire', type: 'P. Conjointe', p: 2800, valid: true, date: '20/06/2026' }]),
    payments: [{ id: 'py4', date: '20/06/2026', payment: 2800, method: 'Chèque', valid: true, by: 'Youssef Bennani' }] },
  { id: 'p4', firstName: 'Imane', lastName: 'Berrada', sexe: 'Femme', number: '0662568330', email: '--', birthDate: '30/01/2001', inssurance: '--', title: 'Etudiant', age: 25, code: 'NON-E-F-0-25-2001', ops: [], payments: [] },
  { id: 'p5', firstName: 'Khadija', lastName: 'Mansouri', sexe: 'Femme', number: '0694045885', email: 'khadija.mansouri@gmail.com', birthDate: '19/07/1979', inssurance: 'CNOPS', title: 'Adulte', age: 46, code: 'CNO-A-F-0-46-1979',
    ops: mkOps([{ tooth: [46], op: 'Couronne sur implant', type: 'Implantologie', p: 3000, solde: 1200, date: '28/06/2026' }]),
    payments: [{ id: 'py5', date: '28/06/2026', payment: 1800, method: 'Espèces', valid: true, by: 'Youssef Bennani' }] },
  { id: 'p6', firstName: 'Hamza', lastName: 'Ouazzani', sexe: 'Homme', number: '0678120953', email: '--', birthDate: '07/04/1969', inssurance: 'CNSS', title: 'Retraité', age: 57, code: 'CNS-R-H-0-57-1969', ops: [], payments: [] },
  { id: 'p7', firstName: 'Nadia', lastName: 'Cherkaoui', sexe: 'Femme', number: '0691227384', email: 'nadia.cherkaoui@gmail.com', birthDate: '25/12/1995', inssurance: 'RMA', title: 'Adulte', age: 30, code: 'RMA-A-F-0-30-1995', ops: [], payments: [] },
  { id: 'p8', firstName: 'Yassine', lastName: 'Lahlou', sexe: 'Homme', number: '0655443322', email: '--', birthDate: '09/09/1999', inssurance: '--', title: 'Adulte', age: 26, code: 'NON-A-H-0-26-1999', ops: [], payments: [] }
];
window.__dmoPatients = PATIENTS;

/* mock operation catalogues per care type (dentalOperations) */
var OPS_CATALOG = {
  'Bilans et Examens': [['Consultation', 200], ['Bilan parodontal', 300], ['Radiographie panoramique', 350], ['Téléradiographie de profil', 400]],
  'S. Conserv.': [['Composite', 500], ['Composite antérieur', 600], ['Composite (M.O.D.)', 700], ['Reconstitution "verre ionomère"', 450]],
  'Parodontologie': [['Détartrage complet', 400], ['Surfaçage radiculaire', 800], ['Gingivectomie (par arcade)', 1200]],
  'Chirurgie': [['Extraction (dent permanente)', 500], ['Extraction chirurgicale', 2700], ['Extraction (dent de sagesse)', 900], ['Extraction de racine incluse', 1100], ['Freinectomie', 1600]],
  'Implantologie': [['Chirurgie implantaire', 1600], ['Couronne sur implant', 3000], ['Mini-implants de stabilisation', 2500], ['Suivi implantaire (Vis de cicatrisation)', 500]],
  'P. Conjointe': [['Facette céramique unitaire', 2800], ['Couronne céramo-métallique "CCM"', 1600], ['Couronne céramo-zircone "CCZ"', 2500], ['Couronne provisoire', 400], ['Couronne Emax céramique', 3200]]
};
function opsFor(type) { return OPS_CATALOG[type] || [['Consultation', 200], ['Contrôle', 150]]; }

/* ------------------------------ pane state ------------------------------- */
var P = {
  filters: { lastName: '', firstName: '', number: '', email: '', inssurance: '--', type: '--', sexe: '--' },
  choosing: null,                 // which filter dropdown is open
  closeLeftBar: false,
  selectedPatient: null,
  openSelectedPatient: false,
  openDentalPlan: false,
  dentalWindows: [1, 0, 0, 0],
  selectedType: 'Bilans et Examens',
  search: '',
  toothSelected: [],
  selectMultiple: false,
  toothHovered: null,
  minimize: false,
  selectAll: false,
  saved: false,
  chartAnim: false
};
/* slide the sheet / plan overlays in or out (Patients/index.js keeps them
   mounted and toggles translateX — the 0.4s backdrop + 0.7s panel stagger) */
function qPatientSheet(open) {
  var from = { transform: open ? 'translateX(100%)' : 'translateX(0px)' };
  Q('#dmoPatBack', from); Q('#dmoPatPanel', from);
}
function qDentalPlan(open) {
  var from = { transform: open ? 'translateX(100%)' : 'translateX(0px)' };
  Q('#dmoPlanBack', from); Q('#dmoPlanPanel', from);
}
window.__dmoOpenPatient = function (id) {
  var p = PATIENTS.filter(function (x) { return x.id === id; })[0] || PATIENTS[0];
  if (!P.openSelectedPatient) qPatientSheet(true);
  if (P.openDentalPlan) qDentalPlan(false);
  P.selectedPatient = p; P.openSelectedPatient = true; P.openDentalPlan = false;
  S.windows = [0, 0, 0, 1, 0, 0];
  renderShell();
};
window.__dmoOpenDental = function () {
  if (!P.openSelectedPatient) qPatientSheet(true);
  if (!P.openDentalPlan) { qDentalPlan(true); P.chartAnim = true; }
  P.selectedPatient = PATIENTS[0]; P.openSelectedPatient = true; P.openDentalPlan = true;
  P.dentalWindows = [1, 0, 0, 0];
  S.windows = [0, 0, 0, 1, 0, 0];
  renderShell();
};

function shownPatients() {
  var f = P.filters;
  return PATIENTS.filter(function (p) {
    return p.lastName.toLowerCase().indexOf(f.lastName.toLowerCase()) >= 0 &&
      p.firstName.toLowerCase().indexOf(f.firstName.toLowerCase()) >= 0 &&
      p.number.indexOf(f.number) >= 0 &&
      (f.email === '' || (p.email || '').toLowerCase().indexOf(f.email.toLowerCase()) >= 0) &&
      (f.inssurance === '--' || p.inssurance === f.inssurance) &&
      (f.type === '--' || p.title === f.type) &&
      (f.sexe === '--' || p.sexe === f.sexe);
  });
}
function getTotalPlans(p) { return p.ops.filter(function (o) { return o.color !== '#fff'; }).reduce(function (a, o) { return a + o.unstable; }, 0); }
function getTotalPayments(p) { return p.payments.filter(function (x) { return x.valid; }).reduce(function (a, x) { return a + parseFloat(x.payment || 0); }, 0); }
window.__dmoPatTotals = { plans: getTotalPlans, pays: getTotalPayments };

/* ------------------------------ sub-renders ------------------------------ */
function filtersBarHTML() {
  function dropRow(label, val, key, options, padR, left) {
    return '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
      '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px ' + padR + 'px 12px 10px;margin-top:0;margin-bottom:0;">' + label + '</p>' +
      '<p style="font-family:Rubik;width:calc(100% - 164px);font-size:14px;font-weight:500;margin-left:0;color:rgb(0, 149, 212);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(val) + '</p>' +
      '<p data-act="patChoose" data-k="' + key + '" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;position:absolute;right:0;">Editer</p>' +
      '<div data-drop="' + key + '" style="position:absolute;z-index:7;transition:0.5s;max-height:' + (P.choosing === key ? 200 : 0) + 'px;overflow-x:hidden;overflow-y:scroll;top:100%;display:flex;flex-direction:column;background-color:white;border-left:2px solid rgba(0,0,0,0.1);border-bottom:' + (P.choosing === key ? 2 : 0) + 'px solid rgba(0,0,0,0.1);border-right:2px solid rgba(0,0,0,0.1);border-radius:0 0 7px 7px;left:' + left + 'px;width:calc(100% - ' + (left + 65) + 'px);">' +
      options.map(function (o) { return '<p data-act="patPick" data-k="' + key + '" data-v="' + esc(o) + '" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.7);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">' + esc(o) + '</p>'; }).join('') +
      '</div></div>';
  }
  function inpRow(label, key, padR, ph) {
    return '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
      '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px ' + padR + 'px 12px 10px;margin-top:0;margin-bottom:0;">' + label + '</p>' +
      '<input autocomplete="off" data-pinp="' + key + '" placeholder="' + ph + '" value="' + esc(P.filters[key]) + '" style="font-family:Rubik;border:0;font-weight:500;color:rgb(0, 149, 212);font-size:14px;margin:0 0 0 10px;"></div>';
  }
  return '<div id="dmoPatSide" style="width:' + (P.closeLeftBar ? '42px' : 'calc(25% - 0px)') + ';height:calc(100% - 40px);max-width:333px;transition:width 0.3s;margin-left:20px;flex-shrink:0;">' +
    '<div data-act="patNew" class="nh-28" style="background-color:rgb(23, 189, 244);overflow:hidden;cursor:pointer;position:relative;padding:14px 0px;box-sizing:border-box;border-radius:7px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;">' +
      '<p id="dmoPatNewA" style="font-family:Rubik;font-weight:500;color:white;font-size:18px;margin:0;transition:opacity 0.3s;opacity:' + (P.closeLeftBar ? 0 : 1) + ';">Nouveau patient</p>' +
      '<p id="dmoPatNewB" style="font-family:Rubik;font-weight:500;color:white;font-size:16px;margin:0;transition:opacity 0.3s;opacity:' + (P.closeLeftBar ? 1 : 0) + ';rotate:270deg;position:absolute;right:-6px;">Ajouter</p></div>' +
    '<div style="width:100%;height:' + (P.closeLeftBar ? 'calc(100% - 82px)' : 'calc(100% - 60px)') + ';box-sizing:border-box;max-height:calc(100% - 60px);padding-bottom:10px;overflow-x:hidden;overflow-y:' + (P.closeLeftBar ? 'hidden' : 'scroll') + ';position:relative;background-color:white;border-radius:7px;box-shadow:0px 2px 3px rgb(201, 201, 201);display:flex;flex-direction:column;align-items:center;justify-content:start;">' +
      '<h1 style="font-family:Rubik;font-size:24px;color:rgb(70,70,70);">Filtres</h1>' +
      '<img data-act="patReset" class="cx-37" src="' + A + 'reset.svg" style="height:20px;opacity:0.75;cursor:pointer;z-index:1;position:absolute;top:15px;left:13px;">' +
      '<div id="dmoPatCover" style="position:absolute;z-index:' + (P.closeLeftBar ? 5 : -1) + ';height:100%;width:100%;background-color:white;transition:0.1s;opacity:' + (P.closeLeftBar ? 1 : 0) + ';"></div>' +
      '<img id="dmoPatArrow" data-act="patToggleBar" src="' + A + 'arrow.svg" style="cursor:pointer;z-index:5;transition:0.3s;rotate:' + (P.closeLeftBar ? '180deg' : '0deg') + ';position:absolute;top:13px;opacity:0.75;right:7px;height:30px;">' +
      '<h1 style="font-family:Rubik;font-size:24px;color:rgb(70,70,70);rotate:270deg;display:' + (P.closeLeftBar ? 'block' : 'none') + ';z-index:5;margin-top:70px;">Filtres</h1>' +
      '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
        '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 7px 12px 10px;margin-top:0;margin-bottom:0;">Date de nais...</p>' +
        '<p style="cursor:pointer;font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgb(0, 149, 212);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">--</p>' +
        '<p data-act="patDateFilter" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;position:absolute;right:0;">Editer</p></div>' +
      dropRow('Assurance', P.filters.inssurance, 'inssurance', Inssurances, 7, 89) +
      dropRow('Titre', P.filters.type, 'type', Types, 28, 70) +
      dropRow('Sexe', P.filters.sexe, 'sexe', Sexes, 28, 71) +
      inpRow('Nom', 'lastName', 29, 'Nom...') +
      inpRow('Prenom', 'firstName', 7, 'Prenom...') +
      inpRow('Telephone', 'number', 7, 'Telephone...') +
      inpRow('Email', 'email', 7, 'Email...') +
    '</div></div>';
}

function patientsListHTML() {
  var list = shownPatients();
  var cols = ['Sexe', 'Nom', 'Prenom', 'Telephone', 'Email', 'Date de naissance', 'Assurance'];
  return '<div style="width:100%;height:34px;min-height:34px;box-sizing:border-box;display:flex;flex-direction:row;align-items:center;justify-content:space-between;padding:0px 12px;border-bottom:1px solid rgb(235, 235, 235);">' +
      '<div data-act="patExport" style="display:flex;align-items:center;gap:6px;cursor:pointer;background-color:rgb(23, 189, 244);border-radius:5px;padding:5px 12px;"><p style="margin:0;font-family:Rubik;font-weight:500;font-size:12px;color:white;">Exporter Excel</p></div>' +
      '<p style="margin:0;font-family:Rubik;font-weight:500;font-size:13px;color:rgb(0, 149, 212);">' + list.length + ' patient' + (list.length > 1 ? 's' : '') + '</p></div>' +
    '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:center;margin-top:0;position:relative;padding:15px 0px;border-bottom:2px solid rgb(225, 225, 225);">' +
      cols.map(function (c) { return '<p style="width:14.285%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + c + '</p>'; }).join('') + '</div>' +
    '<div style="width:100%;height:calc(100% - 75px);display:flex;flex-direction:column;align-items:center;justify-content:start;overflow-x:hidden;overflow-y:scroll;">' +
      list.map(function (p) {
        function cell(v, cls) { return '<p class="' + (cls || '') + '" style="width:14.285%;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(v || '--') + '</p>'; }
        return '<div data-act="patOpen" data-id="' + p.id + '" class="ft-91" style="display:flex;cursor:pointer;max-height:45px;flex-direction:row;width:100%;background-color:white;padding:5px 0px;">' +
          cell(p.sexe) + cell(p.lastName, 'lname') + cell(p.firstName, 'fname') + cell(p.number) + cell(p.email) + cell(p.birthDate) + cell(p.inssurance) + '</div>';
      }).join('') +
      (list.length === 0 ? '<p style="font-family:Rubik;font-weight:500;color:rgb(120,120,120);text-align:center;">Aucun patient trouvé.</p>' : '') +
    '</div>';
}

function operationsSorted(p) {
  var by = {};
  p.ops.forEach(function (o) { (by[o.date] = by[o.date] || []).push(o); });
  return by;
}
function patientPanelHTML() {
  var p = P.selectedPatient;
  if (!p) return '';
  function fieldRow(w, label, valueHTML, mr) {
    return '<div style="width:' + w + ';box-shadow:0px 0px 5px rgb(201, 201, 201);margin-bottom:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;' + (mr ? 'margin-right:10px;' : '') + 'overflow:hidden;">' +
      '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 7px 8px 8px;margin-top:0;margin-bottom:0;">' + label + '</p>' + valueHTML + '</div>';
  }
  var sorted = operationsSorted(p);
  var planRows = Object.keys(sorted).map(function (day) {
    var fo = sorted[day].filter(function (o) { return o.color !== '#fff'; });
    if (fo.length === 0) return '';
    var tot = fo.reduce(function (a, o) { return a + o.unstable; }, 0);
    return '<div data-act="patOpenPlan" data-day="' + day + '" class="ft-91" style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:center;margin-top:0;position:relative;padding:10px 0px;cursor:pointer;">' +
      '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(44, 79, 94);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">' + day + '</p>' +
      '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(0, 148, 212);cursor:pointer;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">Dr. ' + fo[0].dr + '</p>' +
      '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(44, 79, 94);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">' + tot.toFixed(2) + '</p>' +
      '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(44, 79, 94);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">' + esc(fo[fo.length - 1].operation) + '</p>' +
      '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(0, 148, 212);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">' + fo[fo.length - 1].tooth.join(' ') + '</p></div>';
  }).reverse().join('');

  var payRows = p.payments.slice().map(function (py) {
    return '<div class="ft-91" style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:start;margin-top:0;position:relative;padding:0px 0px;">' +
      '<div data-act="patValidPay" data-id="' + py.id + '" class="dl-20" style="width:20%;height:40px;margin:0;z-index:1;overflow:hidden;font-size:14px;display:flex;flex-direction:row;align-items:center;justify-content:center;position:relative;"><img src="' + A + 'check1.svg" style="height:70%;cursor:pointer;z-index:1;position:absolute;transition:0.3s;background-color:' + (!py.valid ? 'transparent' : 'rgb(23, 189, 244)') + ';filter:' + (py.valid ? 'invert(0%)' : 'invert(75%)') + ';border-radius:100%;pointer-events:none;"></div>' +
      '<p style="width:25%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">' + py.date + '</p>' +
      (py.valid || !py.modify ?
        '<p style="width:35%;cursor:default;margin:0;font-family:Rubik;font-weight:500;color:rgb(0, 148, 212);text-align:start;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">' + parseFloat(py.payment).toFixed(2) + '</p>' :
        '<div style="width:35%;position:relative;display:flex;align-items:center;justify-content:start;"><input autocomplete="off" data-payinp="' + py.id + '" value="' + py.payment + '" placeholder="0.00" style="width:100%;max-width:120px;background-color:transparent;margin:0;font-family:Rubik;z-index:1;font-weight:500;color:rgb(70,70,70);text-align:start;border:0;font-size:14px;"></div>') +
      '<div style="width:20%;height:100%;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
        '<p data-act="patPayMethod" data-id="' + py.id + '" style="cursor:' + (!py.valid ? 'pointer' : 'default') + ';margin:0;font-family:Rubik;font-weight:500;color:rgb(0, 148, 212);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:16px;">' + py.method + '</p>' +
        (!py.valid ? '<div data-paydrop="' + py.id + '" style="position:absolute;z-index:7;transition:0.5s;max-height:' + (py.choosingMethod ? 200 : 0) + 'px;overflow-x:hidden;overflow-y:scroll;top:100%;display:flex;flex-direction:column;background-color:white;border-left:2px solid rgba(0,0,0,0.1);border-bottom:' + (py.choosingMethod ? 2 : 0) + 'px solid rgba(0,0,0,0.1);border-right:2px solid rgba(0,0,0,0.1);border-radius:0 0 7px 7px;width:100%;">' +
          paymentMethods.map(function (m) { return '<p data-act="patPickMethod" data-id="' + py.id + '" data-v="' + m + '" class="ud-43" style="font-family:Rubik;text-align:center;font-size:14px;font-weight:500;color:rgba(0,0,0,0.7);display:inline;padding:12px 10px;margin:0;">' + m + '</p>'; }).join('') + '</div>' : '') +
      '</div><div style="width:5%;"></div>' +
      (!py.valid ? '<img data-act="patDelPay" data-id="' + py.id + '" src="' + A + 'trash.svg" style="position:absolute;cursor:pointer;height:20px;padding:5px;border-radius:5px;right:5px;background-color:rgb(255, 0, 36);">' : '') +
      '</div>';
  }).reverse().join('');

  var totalPlans = getTotalPlans(p), totalPays = getTotalPayments(p);
  return '<div id="dmoPatPanel" style="width:100%;height:100%;z-index:5;transition:transform 0.7s;border-radius:5px;position:absolute;right:0;transform:translateX(' + (P.openSelectedPatient ? '0' : '100%') + ');top:0;background-color:rgb(44, 79, 94);display:flex;flex-direction:row;align-items:start;justify-content:start;flex-wrap:wrap;">' +
    '<div data-act="patMore" style="width:41px;height:41px;overflow:hidden;transition:0.3s;background-color:rgb(44, 79, 94);border-radius:7px;position:absolute;z-index:7;left:427px;top:10px;display:flex;flex-direction:row;align-items:center;justify-content:center;cursor:pointer;"><img src="' + A + 'add.svg" style="width:31px;filter:invert(100%);pointer-events:none;"></div>' +
    // top-left : identity
    '<div style="width:40%;height:50%;box-sizing:border-box;display:flex;flex-direction:column;align-items:start;justify-content:start;border-right:1px solid rgb(44, 79, 94);border-bottom:2px solid rgb(44, 79, 94);border-bottom-right-radius:7px;background-color:rgb(44, 79, 94);">' +
      '<div style="width:100%;height:fit-content;padding-bottom:10px;padding-left:10px;box-sizing:border-box;display:flex;flex-direction:column;align-items:start;justify-content:start;background-color:white;border-bottom-right-radius:7px;">' +
        '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:start;margin-top:10px;">' +
          '<div data-act="patClose" style="width:41px;height:41px;border-radius:7px;background-color:rgb(44, 79, 94);cursor:pointer;display:flex;flex-direction:row;align-items:center;justify-content:center;"><img src="' + A + 'arrow.svg" style="width:31px;filter:invert(100%);rotate:180deg;pointer-events:none;"></div>' +
          '<div data-act="patCopyId" style="width:255px;cursor:pointer;margin-left:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;background-color:rgb(44, 79, 94);">' +
            '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgb(255,255,255);border-right:2px solid rgba(0,0,0,0.2);display:inline;padding:12px 10px 12px 10px;margin-top:0;margin-bottom:0;">ID</p>' +
            '<p style="font-family:Rubik;border:0;font-weight:500;color:rgb(255,255,255);font-size:14px;margin:0 0 0 10px;">' + p.code + '</p></div>' +
          '<div data-act="patSave" style="width:41px;height:41px;border-radius:7px;background-color:#00ff5a;filter:grayscale(40%);margin-left:10px;cursor:pointer;display:flex;flex-direction:row;align-items:center;justify-content:center;"><img src="' + A + (P.saved ? 'checkWhite.svg' : 'save.svg') + '" style="width:31px;pointer-events:none;"></div>' +
          '<div data-act="patApps" style="width:41px;height:41px;border-radius:7px;background-color:rgb(44, 79, 94);margin-left:10px;cursor:pointer;display:flex;flex-direction:row;align-items:center;justify-content:center;"><img src="' + A + 'calendarSearch.svg" style="width:31px;pointer-events:none;"></div>' +
        '</div>' +
        '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:start;">' +
          '<div style="width:calc(50% - 10px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;margin-right:10px;overflow:hidden;">' +
            '<p style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 7px 8px 8px;margin:0;">Nom</p>' +
            '<input autocomplete="off" value="' + esc(p.lastName) + '" style="font-family:Rubik;border:0;font-weight:500;color:rgb(44, 79, 94);font-size:14px;margin:0 0 0 10px;"></div>' +
          '<div style="width:calc(50% - 10px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;overflow:hidden;">' +
            '<p style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 7px 8px 8px;margin:0;">Prenom</p>' +
            '<input autocomplete="off" value="' + esc(p.firstName) + '" style="font-family:Rubik;border:0;font-weight:500;color:rgb(44, 79, 94);font-size:14px;margin:0 0 0 10px;"></div>' +
        '</div>' +
        '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:start;">' +
          '<div style="width:calc(100% - 93.13px);box-shadow:0px 0px 5px rgb(201, 201, 201);border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;margin-top:10px;">' +
            '<p style="font-family:Rubik;width:120px;box-sizing:border-box;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 0px 8px 8px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Date de naissance</p>' +
            '<p style="font-family:Rubik;width:calc(100% - 203px);font-size:14px;font-weight:500;color:rgb(44, 79, 94);display:inline;padding:8px 10px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.birthDate + '</p>' +
            '<p data-act="demoOnly" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 10px;margin:0;position:absolute;right:0;">Editer</p></div>' +
          '<div style="width:73.13px;box-shadow:0px 0px 5px rgb(201, 201, 201);cursor:default;margin-left:10px;margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:center;position:relative;"><p style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);display:inline;padding:8px 0px;margin:0;">' + p.age + ' ans</p></div>' +
        '</div>' +
        '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
          '<div style="width:calc(50% - 10px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
            '<p style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 8px 8px 10px;margin:0;">Titre</p>' +
            '<p style="font-family:Rubik;width:calc(100% - 125px);font-size:14px;font-weight:500;color:rgb(44, 79, 94);display:inline;padding:8px 10px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.title + '</p>' +
            '<p data-act="demoOnly" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 10px;margin:0;position:absolute;right:0;">Editer</p></div>' +
          '<div style="width:calc(50% - 10px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-left:10px;margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
            '<p style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 8px 8px 10px;margin:0;">Sexe</p>' +
            '<p style="font-family:Rubik;width:calc(100% - 125px);font-size:14px;font-weight:500;color:rgb(44, 79, 94);display:inline;padding:8px 10px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.sexe + '</p>' +
            '<p data-act="demoOnly" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 10px;margin:0;position:absolute;right:0;">Editer</p></div>' +
        '</div>' +
        '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:start;">' +
          '<div style="width:calc(100% - 93.13px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
            '<p style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 12px 8px 10px;margin:0;">Assurance</p>' +
            '<p style="font-family:Rubik;width:calc(100% - 169px);font-size:14px;font-weight:500;color:rgb(44, 79, 94);display:inline;padding:8px 10px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.inssurance + '</p>' +
            '<p data-act="demoOnly" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 10px;margin:0;position:absolute;right:0;">Editer</p></div>' +
          '<div data-act="demoOnly" style="width:73.13px;box-shadow:0px 0px 5px rgb(201, 201, 201);cursor:pointer;margin-left:10px;margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:center;position:relative;"><p class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);display:inline;padding:8px 12px 8px 10px;margin:0;">Ajouter</p></div>' +
        '</div>' +
      '</div>' +
      '<div style="width:100%;overflow:hidden;height:calc(100% - 233px);border-top:3px solid rgb(44, 79, 94);background-color:white;border-radius:0px 7px 7px 0px;">' +
        '<textarea placeholder="Commentaire Medical..." style="padding:10px 13px;height:100%;align-self:center;box-sizing:border-box;width:100%;font-family:Rubik;font-weight:500;border:0;border-radius:3px;resize:none;">' + (p.id === 'p1' ? '' : '') + '</textarea></div>' +
    '</div>' +
    // top-right : contact fields
    '<div style="width:60%;height:50%;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;flex-wrap:wrap;align-items:start;justify-content:start;padding:10px;border-left:2px solid rgb(44, 79, 94);border-bottom:2px solid rgb(44, 79, 94);border-bottom-left-radius:7px;background-color:white;">' +
      fieldRow('calc(50% - 10px)', 'Profession', '<input autocomplete="off" placeholder="Profession..." style="font-family:Rubik;border:0;font-weight:500;color:rgb(44, 79, 94);font-size:14px;margin:0 0 0 10px;width:calc(100% - 100px);">', true) +
      fieldRow('calc(50% - 10px)', 'Telephone', '<input autocomplete="off" value="' + p.number + '" style="font-family:Rubik;width:calc(100% - 96px);border:0;font-weight:500;color:rgb(44, 79, 94);font-size:14px;margin:0 0 0 10px;">', true) +
      fieldRow('calc(50% - 10px)', 'GSM (parents)', '<input autocomplete="off" placeholder="GSM..." style="font-family:Rubik;border:0;font-weight:500;color:rgb(44, 79, 94);font-size:14px;margin:0 0 0 10px;width:calc(100% - 132px);">', true) +
      fieldRow('calc(50% - 10px)', 'Pays', '<p style="font-family:Rubik;width:calc(100% - 169px);font-size:14px;font-weight:500;color:rgb(44, 79, 94);display:inline;padding:8px 10px;margin:0;">--</p><p data-act="demoOnly" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 10px;margin:0;position:absolute;right:0;">Editer</p>', true) +
      fieldRow('calc(50% - 10px)', 'Ville', '<input style="font-family:Rubik;border:0;width:calc(100% - 169px);font-size:14px;font-weight:500;color:rgb(44, 79, 94);display:inline;padding:8px 10px;margin:0;"><p data-act="demoOnly" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:8px 10px;margin:0;position:absolute;right:0;">Editer</p>', true) +
      fieldRow('calc(50% - 10px)', 'Adresse', '<input autocomplete="off" placeholder="Adresse..." style="font-family:Rubik;border:0;font-weight:500;color:rgb(44, 79, 94);font-size:14px;margin:0 0 0 10px;width:calc(100% - 82px);">', true) +
      fieldRow('calc(50% - 10px)', 'Code Postal', '<input autocomplete="off" placeholder="Code Postal..." style="font-family:Rubik;border:0;font-weight:500;color:rgb(44, 79, 94);font-size:14px;margin:0 0 0 10px;width:calc(100% - 117px);">', true) +
      fieldRow('calc(50% - 10px)', 'Email', '<input autocomplete="off" value="' + esc(p.email === '--' ? '' : p.email) + '" placeholder="Email..." style="font-family:Rubik;width:calc(100% - 54px);border:0;font-weight:500;color:rgb(44, 79, 94);font-size:14px;margin:0 0 0 10px;">', true) +
      '<textarea placeholder="Description..." style="padding:10px 13px;box-shadow:0px 0px 5px rgb(201, 201, 201);height:75px;box-sizing:border-box;width:calc(50% - 10px);margin-bottom:10px;font-family:Rubik;font-weight:500;border:0;border-radius:7px;resize:none;"></textarea>' +
      fieldRow('calc(50% - 10px)', 'Affiche Assurance', '<p data-act="demoOnly" style="font-family:Rubik;cursor:pointer;font-size:14px;font-weight:500;color:rgb(44, 79, 94);display:inline;padding:8px 7px 8px 8px;margin:0;">Afficher</p>', true) +
    '</div>' +
    // bottom-left : plans
    '<div style="width:60%;height:50%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:start;border-right:2px solid rgb(44, 79, 94);border-top:1px solid rgb(44, 79, 94);border-top-right-radius:7px;background-color:white;">' +
      '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:center;margin-top:0;position:relative;padding:10px 0px;border-bottom:2px solid rgb(225, 225, 225);">' +
        ['Date', 'Docteur', 'Total plan', 'Dernier acte', "Dent d'acte"].map(function (c) { return '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + c + '</p>'; }).join('') + '</div>' +
      '<div data-act="patOpenPlan" data-day="' + t0 + '" style="padding:10px 15px;border-radius:5px;background-color:rgba(23, 189, 244,0.1);margin-top:10px;margin-bottom:10px;cursor:pointer;"><p style="font-family:Rubik;font-weight:500;color:rgb(0, 148, 212);margin:0;pointer-events:none;">Ajouter un plan</p></div>' +
      '<div style="width:100%;height:calc(100% - 41px);display:flex;flex-direction:column;align-items:center;justify-content:start;overflow-y:scroll;">' +
        (Object.keys(sorted).length === 0 ? '<p style="width:100%;font-family:Rubik;font-weight:500;color:rgb(120,120,120);text-align:center;">Aucun plan.</p>' : planRows) +
      '</div></div>' +
    // bottom-right : payments
    '<div style="width:40%;height:50%;box-sizing:border-box;display:flex;position:relative;flex-direction:column;align-items:center;justify-content:start;border-left:1px solid rgb(44, 79, 94);border-top:1px solid rgb(44, 79, 94);border-top-left-radius:7px;background-color:white;">' +
      '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:center;margin-top:0;position:relative;padding:10px 0px;border-bottom:2px solid rgb(225, 225, 225);">' +
        '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;">Validé</p>' +
        '<p style="width:25%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;">Date</p>' +
        '<p style="width:35%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:start;">Paiements</p>' +
        '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;">Méthode</p><div style="width:5%;"></div></div>' +
      '<div style="width:100%;height:calc(100% - 126px);display:flex;flex-direction:column;align-items:center;justify-content:start;overflow-y:scroll;padding-bottom:10px;box-sizing:border-box;">' +
        '<div data-act="patAddPay" style="padding:10px 15px;border-radius:5px;margin-bottom:10px;background-color:rgba(23, 189, 244,0.1);margin-top:10px;cursor:pointer;"><p style="font-family:Rubik;font-weight:500;color:rgb(0, 148, 212);margin:0;pointer-events:none;">Ajouter un paiement</p></div>' +
        (p.payments.length === 0 ? '<p style="width:100%;font-family:Rubik;font-weight:500;color:rgb(120,120,120);text-align:center;">Aucun paiement.</p>' : payRows) +
      '</div>' +
      '<div style="width:100%;display:flex;flex-direction:row;align-items:center;background-color:white;bottom:45px;z-index:2;justify-content:center;margin-top:0;position:absolute;padding:9px 0px;border-top:2px solid rgb(225, 225, 225);">' +
        '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;">Total plans</p>' +
        '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:start;">Total effectués</p>' +
        '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;">Solde dû</p></div>' +
      '<div style="width:100%;display:flex;flex-direction:row;align-items:center;background-color:white;bottom:0;z-index:2;justify-content:center;margin-top:0;position:absolute;padding:10px 0px;border-top:2px solid rgb(225, 225, 225);">' +
        '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(44, 79, 94);text-align:center;">' + totalPlans.toFixed(2) + '</p>' +
        '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:rgb(0, 148, 212);text-align:center;">' + totalPays.toFixed(2) + '</p>' +
        '<p style="width:20%;margin:0;font-family:Rubik;font-weight:500;color:' + ((totalPlans - totalPays) >= 0 ? 'rgb(0, 148, 212)' : 'rgb(255, 0, 36)') + ';text-align:center;">' + (totalPlans - totalPays).toFixed(2) + '</p></div>' +
    '</div>' +
  '</div>';
}

/* ------------------------ dental plan (DentalPlanPanel) ------------------- */
function dentalPlanHTML() {
  var p = P.selectedPatient;
  if (!p) return '';
  var ops = p.ops;
  var dw = P.dentalWindows;
  var catalogue = opsFor(P.selectedType).filter(function (o) { return o[0].toLowerCase().indexOf(P.search.toLowerCase()) >= 0; });

  var typeChips = dentalCareTypes.map(function (type) {
    var sel = P.selectedType === type.type;
    return '<div data-act="dplType" data-t="' + esc(type.type) + '" style="margin:5px;cursor:pointer;background-color:' + (sel ? 'white' : 'rgb(44, 79, 94)') + ';padding:6px 6px;width:calc(50% - 10px);position:relative;box-sizing:border-box;border:2px solid rgb(44, 79, 94);border-radius:4px;display:flex;flex-direction:row;align-items:center;justify-content:start;">' +
      '<div style="width:16.4px;align-self:start;height:17.8px;max-width:21px;max-height:21px;border-radius:4px;background-color:' + type.color + ';pointer-events:none;"></div>' +
      '<p style="margin-left:7px;font-family:Rubik;font-weight:' + (sel ? '500' : '300') + ';font-size:13.7px;margin-top:0;margin-bottom:0;color:' + (sel ? 'rgb(44, 79, 94)' : 'white') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:calc(100% - 17.8px);pointer-events:none;">' + esc(type.type) + '</p></div>';
  }).join('');

  var opRows = catalogue.map(function (o) {
    return '<div data-act="dplApply" data-op="' + esc(o[0]) + '" data-price="' + o[1] + '" class="ft-91" style="text-align:start;cursor:default;font-family:Rubik;color:rgb(4, 39, 54);font-size:15px;font-weight:500;width:100%;margin:0;padding:8px 12px;position:relative;display:flex;flex-direction:row;align-items:center;box-sizing:border-box;">' + esc(o[0]) + '</div>';
  }).join('');

  function hovered(teeth) { return teeth && teeth.indexOf && teeth.indexOf(P.toothHovered) >= 0; }
  var tableRows = ops.map(function (op, _) {
    var borderB = '2px solid ' + (hovered(op.tooth) ? '#8bff4d' : 'rgb(225, 225, 225)');
    if (op.operation === '$abscent$') {
      return '<div data-teeth="' + op.tooth.join(',') + '" style="width:100%;cursor:default;display:flex;flex-direction:row;align-items:center;justify-content:center;margin-top:0;position:relative;padding:13px 0px;transition:border 0.3s;border-bottom:' + borderB + ';">' +
        '<p style="font-family:Rubik;z-index:1;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:17px;margin:0;">La dent <span style="color:' + (hovered(op.tooth) ? '#8bff4d' : 'rgb(23, 189, 244)') + ';">' + op.tooth.join(' ') + '</span> est déclarée absente (M)</p></div>';
    }
    return '<div data-teeth="' + op.tooth.join(',') + '" style="width:100%;cursor:default;display:flex;flex-direction:row;align-items:center;justify-content:start;margin-top:0;position:relative;padding:5px 0px;transition:border 0.3s;border-bottom:' + borderB + ';">' +
      '<div data-act="dplCheck" data-id="' + op.id + '" style="width:15px;height:15px;min-width:15px;margin-left:10px;border:2px solid rgb(44, 79, 94);z-index:1;border-radius:7px;cursor:pointer;background-color:' + (op.check ? 'rgb(44, 79, 94)' : 'white') + ';"></div>' +
      '<div style="position:absolute;height:100%;width:44px;z-index:0;top:0;left:0;background-color:' + op.color + ';"><div style="position:absolute;width:20%;height:100%;background-color:white;right:0;border-top-left-radius:7px;border-bottom-left-radius:7px;"></div></div>' +
      '<div style="width:calc(100% - 15px);height:100%;display:flex;align-items:center;justify-content:start;position:relative;">' +
        '<div data-act="dplValid" data-id="' + op.id + '" class="dl-20" style="width:7%;height:40px;cursor:pointer;margin:0;z-index:1;overflow:hidden;font-size:14px;display:flex;flex-direction:row;align-items:center;justify-content:center;position:relative;"><img src="' + A + 'check1.svg" style="height:70%;z-index:1;position:absolute;transition:0.3s;background-color:' + (!op.valid ? 'transparent' : 'rgb(23, 189, 244)') + ';filter:' + (op.valid ? 'invert(0%)' : 'invert(75%)') + ';border-radius:100%;pointer-events:none;"></div>' +
        '<p style="width:10%;max-width:10%;margin:0;overflow-x:hidden;font-family:Rubik;z-index:1;font-weight:500;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">' +
          op.tooth.map(function (t) { return '<span data-tooth="' + t + '" style="color:' + (P.toothHovered === t ? '#59ff00' : 'rgb(70,70,70)') + ';transition:color 0.3s;">' + t + ' </span>'; }).join('') + '</p>' +
        '<p style="width:18%;margin:0;font-family:Rubik;z-index:1;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">' + esc(op.operation) + '</p>' +
        '<p class="jl-38" style="width:10%;margin:0;font-family:Rubik;z-index:1;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-right:3px;font-size:14px;cursor:default;">' + op.stable.toFixed(2) + '</p>' +
        '<p class="jl-38" style="width:10%;margin:0;font-family:Rubik;z-index:1;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;cursor:' + (!op.valid ? 'pointer' : 'default') + ';">' + op.unstable.toFixed(2) + '</p>' +
        '<p class="jl-38" style="width:10%;margin:0;font-family:Rubik;z-index:1;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;cursor:' + (!op.valid ? 'pointer' : 'default') + ';">' + op.solde.toFixed(2) + '</p>' +
        '<p class="jl-38" style="width:16%;margin:0;font-family:Rubik;z-index:1;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;cursor:pointer;">Dr. ' + op.dr + '</p>' +
        '<p style="width:10%;margin:0;font-family:Rubik;z-index:1;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">' + op.date + '</p>' +
        '<p style="width:9%;margin:0;font-family:Rubik;z-index:1;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">' + op.hour + '</p>' +
      '</div></div>';
  }).reverse().join('');

  var visOps = ops.filter(function (o) { return o.color !== '#fff'; });
  var totS = visOps.reduce(function (a, o) { return a + o.stable; }, 0), totU = visOps.reduce(function (a, o) { return a + o.unstable; }, 0), totD = visOps.reduce(function (a, o) { return a + o.solde; }, 0);
  var anyChecked = ops.some(function (o) { return o.check; });

  var dentalWindowsBar =
    '<div id="dmoWinBar" style="position:absolute;top:' + (P.minimize ? 0 : -48) + 'px;transition:top 0.4s;height:45px;width:100%;background-color:white;z-index:-1;border-top-left-radius:5px;outline:3px solid rgb(44, 79, 94);display:flex;flex-direction:row;align-items:center;justify-content:start;">' +
    [['plan.svg', 'Plan de traitement', 0, 23], ['notes.svg', 'Notes', 1, 20], ['ordo.svg', 'Ordonnances', 2, 20], ['skeleton.svg', 'Céphalométrie', 3, 20]].map(function (w) {
      var on = dw[w[2]] === 1;
      return '<div data-act="dplWindow" data-i="' + w[2] + '" style="display:flex;flex-direction:row;align-items:center;border:' + (on ? '2px solid rgb(44, 79, 94)' : '0') + ';box-sizing:border-box;justify-content:center;height:33px;padding:0px 8px;cursor:pointer;background-color:' + (on ? 'rgb(255,255,255)' : 'rgb(44, 79, 94)') + ';border-radius:7px;margin-left:7px;">' +
        '<img src="' + A + w[0] + '" style="height:' + w[3] + 'px;margin-right:5px;filter:' + (on ? '' : 'invert(100%) brightness(200%)') + ';pointer-events:none;">' +
        '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin:0;color:' + (on ? 'rgb(44, 79, 94)' : 'rgb(255,255,255)') + ';pointer-events:none;">' + w[1] + '</p></div>';
    }).join('') + '</div>';

  var mainWindow = '';
  if (dw[0] === 1) {
    mainWindow =
    '<div style="width:100%;height:calc(60% - 3px);background:#64c3fa;border-bottom-left-radius:5px;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;">' +
      '<div id="dmoMultiBtn" data-act="dplMulti" style="position:absolute;transition:0.2s;z-index:3;opacity:' + (P.minimize ? 0 : 1) + ';top:' + (P.minimize ? 50 : 5) + 'px;right:5px;display:flex;flex-direction:row;cursor:pointer;align-items:center;justify-content:center;padding:11px 15px;border-radius:5px;background-color:rgb(44, 79, 94);">' +
        '<div style="width:15px;height:15px;border:2px solid white;margin-right:10px;background-color:' + (P.selectMultiple ? 'white' : 'rgb(44, 79, 94)') + ';border-radius:7px;cursor:pointer;pointer-events:none;"></div>' +
        '<p style="font-family:Rubik;color:white;font-size:16px;font-weight:200;margin:0;pointer-events:none;">Sélectionner plusieurs</p></div>' +
      '<div data-act="dplMinimize" style="width:41px;height:41px;border-radius:7px;background-color:rgb(44, 79, 94);z-index:3;cursor:pointer;display:flex;flex-direction:row;align-items:center;justify-content:center;position:absolute;top:5px;left:5px;">' +
        '<img id="dmoMinArrow" src="' + A + 'arrow.svg" style="width:31px;filter:invert(100%);transition:rotate 0.5s;rotate:' + (P.minimize ? '270deg' : '90deg') + ';pointer-events:none;"></div>' +
      '<div style="width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;z-index:2;">' +
        '<div class="' + (P.chartAnim ? 'load-in' : '') + '" id="dmoToothChart" style="width:85%;height:70%;position:absolute;display:flex;flex-direction:column;z-index:9;">' + dentalChartHTML(ops, P.toothSelected) + '</div>' +
      '</div>' +
    '</div>';
  } else if (dw[1] === 1) {
    mainWindow = '<div style="width:100%;height:calc(100% - 30px);overflow:hidden;background-color:rgb(44, 79, 94);border-bottom-left-radius:5px;display:flex;padding:18px 15px;box-sizing:border-box;flex-direction:column;align-items:center;justify-content:start;position:relative;">' +
      '<h1 style="font-family:Rubik;font-weight:500;font-size:21px;color:white;margin:0 0 20px 0;">Notes médicales</h1>' +
      '<p style="font-family:Rubik;font-weight:500;font-size:16px;color:rgba(255,255,255,0.8);padding:10px 20px;border-radius:7px;width:fit-content;cursor:default;">Il n\'y aucun notes dentaires.</p></div>';
  } else if (dw[2] === 1) {
    mainWindow = '<div style="width:100%;height:calc(100% - 30px);overflow:hidden;background-color:rgb(44, 79, 94);border-bottom-left-radius:5px;display:flex;padding:18px 15px;box-sizing:border-box;flex-direction:column;align-items:center;justify-content:start;position:relative;">' +
      '<h1 style="font-family:Rubik;font-weight:500;font-size:21px;color:white;margin:0 0 20px 0;">Ordonnances</h1>' +
      '<p style="font-family:Rubik;font-weight:500;font-size:16px;color:rgba(255,255,255,0.8);padding:10px 20px;border-radius:7px;width:fit-content;cursor:default;">Aucune ordonnance enregistrée</p>' +
      '<p data-act="demoOnly" class="jd-62" style="margin-top:10px;text-align:center;padding:10px 30px;border:2px solid rgb(23, 189, 244);border-radius:7px;font-family:Rubik;font-weight:500;color:white;background-color:rgb(23, 189, 244);cursor:pointer;">NOUVELLE</p></div>';
  } else {
    mainWindow = '<div style="width:100%;height:calc(100% - 30px);overflow:hidden;background-color:rgb(44, 79, 94);border-bottom-left-radius:5px;display:flex;padding:18px 15px;box-sizing:border-box;flex-direction:row;align-items:start;justify-content:center;position:relative;">' +
      '<div style="display:flex;flex-direction:column;height:100%;width:50%;align-items:center;">' +
        '<h1 style="font-family:Rubik;font-weight:500;font-size:21px;color:white;margin:0 0 20px 0;">Céphalométries</h1>' +
        '<p style="font-family:Rubik;font-weight:500;font-size:16px;color:rgba(255,255,255,0.8);padding:10px 20px;border-radius:7px;width:fit-content;cursor:default;">Aucune radiographie.</p></div>' +
      '<div style="display:flex;flex-direction:column;height:calc(100% - 47px);width:50%;align-items:center;justify-content:center;border-radius:7px;border:2px dashed white;position:relative;">' +
        '<p style="font-family:Rubik;font-weight:500;font-size:21px;color:white;padding:10px 20px;border-radius:7px;width:fit-content;text-align:center;">Déposez la radiographie ici</p>' +
        '<img src="' + A + 'skeleton.svg" style="height:50px;margin-right:5px;filter:invert(100%) brightness(200%);"></div></div>';
  }

  var showTable = !(dw[3] === 1 || dw[2] === 1);
  return '<div id="dmoPlanPanel" style="width:100%;height:100%;z-index:6;transition:transform 0.7s;border-radius:5px;position:absolute;right:0;transform:translateX(' + (P.openDentalPlan ? '0' : '100%') + ');top:0;background-color:rgb(44, 79, 94);display:flex;flex-direction:row;align-items:center;justify-content:start;">' +
    '<img data-act="dplBack" src="' + A + 'arrow.svg" style="position:absolute;top:6px;left:5px;width:30px;height:30px;filter:invert(100%);rotate:180deg;cursor:pointer;z-index:3;">' +
    // left column
    '<div style="width:30%;max-width:420px;height:100%;background-color:white;display:flex;flex-direction:column;">' +
      '<div style="width:100%;background-color:rgb(44, 79, 94);position:relative;display:flex;align-items:center;justify-content:center;">' +
        '<p style="padding:12px 0px;color:white;margin:0;text-align:center;font-family:Rubik;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:fit-content;max-width:300px;">' + cap(p.firstName) + ' ' + cap(p.lastName) + '</p>' +
        '<div class="dd-43"></div></div>' +
      '<div style="padding:8px 0px;width:100%;background-color:white;border-radius:7px;z-index:1;"><p style="color:rgb(44, 79, 94);margin:0;text-align:center;font-family:Rubik;font-weight:500;">Né(e) le ' + p.birthDate + '</p></div>' +
      '<p style="color:rgb(44, 79, 94);margin:0;text-align:center;font-family:Rubik;font-size:14px;font-weight:500;">Les Operations</p>' +
      '<div style="display:flex;flex-direction:row;flex-wrap:wrap;margin-top:15px;padding:0px 12px;">' + typeChips + '</div>' +
      '<div style="display:flex;flex-direction:row;align-items:center;justify-content:center;margin-top:10px;">' +
        '<div style="width:100%;margin:0px 10px;box-sizing:border-box;overflow:hidden;border:2px solid rgb(44, 79, 94);display:flex;flex-direction:row;align-items:center;justify-content:start;border-radius:5px;">' +
          '<img src="' + A + 'searchDarkBlue.svg" style="width:22px;margin-left:4px;">' +
          '<input autocomplete="off" data-pinp="dplSearch" value="' + esc(P.search) + '" placeholder="Chercher..." style="font-family:Rubik;border:0;width:calc(100% - 27px);box-sizing:border-box;font-weight:500;color:rgb(44, 79, 94);padding:8px 5px;"></div>' +
        '<p data-act="demoOnly" style="cursor:pointer;transition:background-color 0.3s;font-family:Rubik;color:white;font-size:15px;font-weight:500;margin:0 10px 0 0;padding:8px 12px;border-radius:5px;height:35px;background-color:rgb(44, 79, 94);box-sizing:border-box;">Editer</p>' +
      '</div>' +
      '<div style="width:100%;display:flex;border-top:3px solid rgba(44, 79, 94,0.2);flex-direction:column;align-items:start;justify-content:start;overflow-y:scroll;margin-top:10px;height:100%;padding-right:3px;">' + opRows + '</div>' +
    '</div>' +
    // right column
    '<div style="width:70%;min-width:calc(100% - 420px);height:100%;position:relative;margin-left:3px;display:flex;flex-direction:column;">' +
      mainWindow +
      '<div id="dmoOpsTable" style="width:100%;height:' + (showTable ? (P.minimize ? 'calc(100% - 53px)' : '40%') : '0') + ';border-top:3px solid rgb(44, 79, 94);border-left:3px solid rgb(44, 79, 94);min-height:' + (showTable ? '200px' : '0') + ';position:absolute;transition:height 0.35s, min-height 0.5s;z-index:2;bottom:0;left:-3px;background-color:white;border-top-left-radius:7px;margin-top:3px;display:flex;flex-direction:column;' + (showTable ? '' : 'overflow:hidden;border:0;') + '">' +
        '<img data-act="dplTrash" src="' + A + 'trash.svg" style="height:30px;position:absolute;top:-40px;right:10px;box-sizing:border-box;transition:0.3s;padding:3px;background-color:' + (anyChecked ? 'rgb(255, 0, 36)' : 'rgb(140,140,140)') + ';border-radius:5px;cursor:' + (anyChecked ? 'pointer' : 'default') + ';">' +
        dentalWindowsBar +
        '<div style="width:100%;display:flex;background-color:white;flex-direction:row;align-items:center;justify-content:start;margin-top:0;position:relative;padding:10px 0px;' + (ops.length === 0 ? 'border-bottom:2px solid rgb(225, 225, 225);' : '') + '">' +
          '<div data-act="dplSelectAll" style="width:15px;height:15px;margin-left:10px;border:2px solid rgb(44, 79, 94);background-color:' + (P.selectAll ? 'rgb(44, 79, 94)' : 'white') + ';border-radius:7px;cursor:pointer;"></div>' +
          '<div style="width:calc(100% - 15px);height:100%;display:flex;align-items:center;justify-content:start;">' +
            '<p style="width:7%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Validé</p>' +
            '<p style="width:10%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Dent</p>' +
            '<p style="width:18%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Acte</p>' +
            '<div style="width:10%;overflow:hidden;position:relative;height:19px;margin-right:3px;"><p style="width:100%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;position:absolute;top:0;z-index:2;cursor:default;">Honoraire statutaire</p></div>' +
            '<div style="width:10%;overflow:hidden;position:relative;height:19px;"><p style="width:100%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block;position:absolute;top:0;z-index:2;cursor:default;">Honoraire contractelle</p></div>' +
            '<p style="width:10%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Solde</p>' +
            '<p style="width:16%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Docteur</p>' +
            '<p style="width:10%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Date</p>' +
            '<p style="width:9%;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Heure</p>' +
          '</div></div>' +
        '<div style="width:100%;height:calc(100% - 41px);display:flex;flex-direction:column;overflow-y:scroll;padding-bottom:37px;background-color:white;">' +
          (ops.length === 0 ? '<p style="font-family:Rubik;z-index:1;font-size:17px;font-weight:500;color:rgb(70,70,70);text-align:center;">Aucune operation.</p>' : tableRows) +
          '<div style="position:absolute;background-color:white;z-index:2;width:100%;display:flex;flex-direction:row;align-items:center;bottom:0;padding:10px 0px;border-top:2px solid rgb(225, 225, 225);">' +
            '<p style="width:8%;margin:0;font-size:14px;"></p>' +
            '<p style="width:calc(23% + 44px);margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;">Total</p>' +
            '<p style="width:10%;margin:0 3px 0 0;font-family:Rubik;font-weight:500;color:rgb(0, 148, 212);text-align:center;font-size:14px;">' + totS.toFixed(2) + '</p>' +
            '<p style="width:10%;margin:0;font-family:Rubik;font-weight:500;color:rgb(0, 148, 212);text-align:center;font-size:14px;">' + totU.toFixed(2) + '</p>' +
            '<p style="width:10%;margin:0;font-family:Rubik;font-weight:500;color:rgb(0, 148, 212);text-align:center;font-size:14px;">' + totD.toFixed(2) + '</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

/* ------------------------------- pane root ------------------------------- */
function renderPatients(view) {
  view.innerHTML =
  '<div style="background-color:rgb(242, 246, 248);overflow:hidden;width:100%;height:100%;display:flex;flex-direction:row;justify-content:start;align-items:center;position:relative;">' +
    filtersBarHTML() +
    '<div style="flex-grow:1;height:calc(100% - 40px);box-sizing:border-box;max-height:calc(100% - 40px);transition:0.3s;overflow:hidden;position:relative;background-color:white;border-radius:7px;margin-left:10px;margin-right:20px;box-shadow:0px 2px 3px rgb(201, 201, 201);display:flex;flex-direction:column;align-items:center;justify-content:start;">' +
      patientsListHTML() +
      '<div id="dmoPatBack" style="width:100%;height:100%;z-index:4;transition:transform 0.4s;border-radius:10px;position:absolute;right:0;transform:translateX(' + (P.openSelectedPatient ? '0' : '100%') + ');top:0;background-color:rgb(44, 79, 94);"></div>' +
      patientPanelHTML() +
      '<div id="dmoPlanBack" style="width:100%;height:100%;z-index:5;transition:transform 0.4s;border-radius:5px;position:absolute;right:0;transform:translateX(' + (P.openDentalPlan ? '0' : '100%') + ');top:0;background-color:rgb(44, 79, 94);"></div>' +
      dentalPlanHTML() +
    '</div>' +
  '</div>';

  // filter inputs
  view.querySelectorAll('[data-pinp]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var k = inp.getAttribute('data-pinp');
      if (k === 'dplSearch') { P.search = inp.value; refreshKeepFocus(view, '[data-pinp="dplSearch"]'); }
      else { P.filters[k] = inp.value; refreshKeepFocus(view, '[data-pinp="' + k + '"]'); }
    });
  });
  view.querySelectorAll('[data-payinp]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var py = P.selectedPatient.payments.filter(function (x) { return x.id === inp.getAttribute('data-payinp'); })[0];
      if (py) py.payment = parseFloat(inp.value) || 0;
    });
  });
  // tooth hover (direct DOM update, like onToothHover -> setToothHovered)
  view.querySelectorAll('.tooth_holder').forEach(function (th) {
    th.addEventListener('mouseenter', function () {
      P.toothHovered = parseInt(th.getAttribute('data-n'), 10);
      view.querySelectorAll('[data-teeth]').forEach(function (row) {
        var teeth = row.getAttribute('data-teeth').split(',').map(Number);
        row.style.borderBottomColor = teeth.indexOf(P.toothHovered) >= 0 ? '#8bff4d' : 'rgb(225, 225, 225)';
      });
      view.querySelectorAll('[data-tooth]').forEach(function (sp) {
        sp.style.color = parseInt(sp.getAttribute('data-tooth'), 10) === P.toothHovered ? '#59ff00' : 'rgb(70,70,70)';
      });
    });
  });
  P.chartAnim = false; // the load-in fade only plays on the render that opened the plan
}
function refreshKeepFocus(view, sel) {
  renderPatients(view);
  var inp = view.querySelector(sel);
  if (inp) { var v = inp.value; inp.focus(); inp.setSelectionRange(v.length, v.length); }
}

/* -------------------------------- actions -------------------------------- */
var prevClick = window.__dmoClick;
window.__dmoClick = function (act, t, e) {
  var p = P.selectedPatient;
  switch (act) {
    case 'demoOnly': demoOnly(); return;
    case 'patChoose': {
      var ck = t.getAttribute('data-k');
      if (P.choosing !== ck) Q('[data-drop="' + ck + '"]', { maxHeight: '0px' });
      if (P.choosing && P.choosing !== ck) Q('[data-drop="' + P.choosing + '"]', { maxHeight: '200px' });
      P.choosing = ck; renderShell(); return;
    }
    case 'patPick': Q('[data-drop="' + t.getAttribute('data-k') + '"]', { maxHeight: '200px' }); P.filters[t.getAttribute('data-k')] = t.getAttribute('data-v'); P.choosing = null; renderShell(); return;
    case 'patReset':
      if (P.choosing) Q('[data-drop="' + P.choosing + '"]', { maxHeight: '200px' });
      P.filters = { lastName: '', firstName: '', number: '', email: '', inssurance: '--', type: '--', sexe: '--' }; P.choosing = null; renderShell(); return;
    case 'patToggleBar':
      Q('#dmoPatSide', { width: P.closeLeftBar ? '42px' : 'calc(25% - 0px)' });
      Q('#dmoPatCover', { opacity: P.closeLeftBar ? '1' : '0' });
      Q('#dmoPatArrow', { rotate: P.closeLeftBar ? '180deg' : '0deg' });
      Q('#dmoPatNewA', { opacity: P.closeLeftBar ? '0' : '1' });
      Q('#dmoPatNewB', { opacity: P.closeLeftBar ? '1' : '0' });
      P.closeLeftBar = !P.closeLeftBar;
      if (P.closeLeftBar) {
        if (P.openDentalPlan) qDentalPlan(false);
        if (P.openSelectedPatient) qPatientSheet(false);
        P.openDentalPlan = false; P.openSelectedPatient = false;
      }
      renderShell(); return;
    case 'patNew': warn('La fenêtre « Nouveau patient » s’ouvre dans l’application complète.', 'rgb(0, 149, 212)'); return;
    case 'patExport': warn('Export Excel disponible dans l’application complète.', 'rgb(0, 149, 212)'); return;
    case 'patDateFilter': demoOnly(); return;
    case 'patOpen': window.__dmoOpenPatient(t.getAttribute('data-id')); return;
    case 'patClose':
      if (P.openDentalPlan) qDentalPlan(false);
      if (P.openSelectedPatient) qPatientSheet(false);
      P.openSelectedPatient = false; P.openDentalPlan = false; renderShell(); return;
    case 'patCopyId': if (navigator.clipboard) navigator.clipboard.writeText(p ? p.code : ''); warn('Identifiant copié', 'rgb(44, 79, 94)'); return;
    case 'patSave': P.saved = true; warn('Sauvegardé', 'rgb(44, 79, 94)'); renderShell(); return;
    case 'patApps': case 'patMore': demoOnly(); return;
    case 'patOpenPlan':
      if (!P.openDentalPlan) { qDentalPlan(true); P.chartAnim = true; }
      P.openDentalPlan = true; P.toothSelected = []; renderShell(); return;
    case 'patAddPay': p.payments.push({ id: U.generateId(), date: getWholeDate(TODAY), payment: 0, method: 'Espèces', valid: false, modify: true, by: 'Youssef Bennani' }); renderShell(); return;
    case 'patValidPay': {
      var py = p.payments.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0];
      if (py && !py.valid) { py.valid = true; py.modify = false; }
      renderShell(); return;
    }
    case 'patDelPay': p.payments = p.payments.filter(function (x) { return x.id !== t.getAttribute('data-id'); }); renderShell(); return;
    case 'patPayMethod': {
      var py2 = p.payments.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0];
      if (py2 && !py2.valid) {
        Q('[data-paydrop="' + py2.id + '"]', { maxHeight: py2.choosingMethod ? '200px' : '0px' });
        py2.choosingMethod = !py2.choosingMethod; renderShell();
      }
      return;
    }
    case 'patPickMethod': {
      var py3 = p.payments.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0];
      if (py3) { Q('[data-paydrop="' + py3.id + '"]', { maxHeight: '200px' }); py3.method = t.getAttribute('data-v'); py3.choosingMethod = false; }
      renderShell(); return;
    }
    /* dental plan */
    case 'dplBack':
      qDentalPlan(false);
      P.openDentalPlan = false; P.toothSelected = []; P.selectMultiple = false; renderShell(); return;
    case 'dplType': P.selectedType = t.getAttribute('data-t'); renderShell(); return;
    case 'dplWindow': {
      var i = parseInt(t.getAttribute('data-i'), 10);
      var wasShown = !(P.dentalWindows[3] === 1 || P.dentalWindows[2] === 1);
      var willShow = !(i === 2 || i === 3);
      if (wasShown !== willShow) Q('#dmoOpsTable', { height: wasShown ? (P.minimize ? 'calc(100% - 53px)' : '40%') : '0px', minHeight: wasShown ? '200px' : '0px' });
      P.dentalWindows = [0, 0, 0, 0]; P.dentalWindows[i] = 1; renderShell(); return;
    }
    case 'dplMulti': P.selectMultiple = !P.selectMultiple; if (!P.selectMultiple && P.toothSelected.length > 1) P.toothSelected = [P.toothSelected[0]]; renderShell(); return;
    case 'dplMinimize':
      Q('#dmoWinBar', { top: P.minimize ? '0px' : '-48px' });
      Q('#dmoOpsTable', { height: P.minimize ? 'calc(100% - 53px)' : '40%' });
      Q('#dmoMultiBtn', { opacity: P.minimize ? '0' : '1', top: P.minimize ? '50px' : '5px' });
      Q('#dmoMinArrow', { rotate: P.minimize ? '270deg' : '90deg' });
      P.minimize = !P.minimize; renderShell(); return;
    case 'tooth': {
      var n = parseInt(t.getAttribute('data-n'), 10);
      if (P.selectMultiple) {
        if (P.toothSelected.indexOf(n) >= 0) P.toothSelected = P.toothSelected.filter(function (x) { return x !== n; });
        else P.toothSelected.push(n);
      } else P.toothSelected = [n];
      renderShell(); return;
    }
    case 'dplApply': {
      if (P.toothSelected.length === 0) { warn('Sélectionnez d’abord une dent sur le schéma !', 'rgb(255, 0, 36)'); return; }
      var price = parseFloat(t.getAttribute('data-price'));
      p.ops.push({ id: U.generateId(), valid: false, tooth: P.toothSelected.slice(), operation: t.getAttribute('data-op'), stable: price, unstable: price, solde: price, modify: [false, false], dr: 'Youssef Bennani', date: getWholeDate(TODAY), hour: U.getCurrentTime(), color: DCTcolor(P.selectedType), check: false, dentalCareType: P.selectedType });
      renderShell(); return;
    }
    case 'dplValid': {
      var op = p.ops.filter(function (o) { return o.id === t.getAttribute('data-id'); })[0];
      if (op) { op.valid = !op.valid; if (op.valid) op.solde = 0; }
      renderShell(); return;
    }
    case 'dplCheck': {
      var op2 = p.ops.filter(function (o) { return o.id === t.getAttribute('data-id'); })[0];
      if (op2) op2.check = !op2.check;
      renderShell(); return;
    }
    case 'dplSelectAll': {
      P.selectAll = !P.selectAll;
      p.ops.forEach(function (o) { o.check = P.selectAll; });
      renderShell(); return;
    }
    case 'dplTrash': {
      if (!p.ops.some(function (o) { return o.check; })) return;
      p.ops = p.ops.filter(function (o) { return !o.check; });
      P.selectAll = false;
      renderShell(); return;
    }
  }
  if (prevClick) prevClick(act, t, e);
};

window.__dmoPanes[3] = renderPatients;
})();
