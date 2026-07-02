/* ============================================================================
   Dentimo demo — Part 4 : Paiements (src/code/Payment.js) and
   Analytique (src/code/Analytics.js). Mock data, real behavior.
   ============================================================================ */
(function () {
'use strict';
var U = window.__dmoUtil, D = window.__dmoData, S = window.__dmoState;
var A = U.A, esc = U.esc, cap = U.capFirstLetter, Q = U.qAnim;
var monthsInFrench = U.monthsInFrench, getWholeDate = U.getWholeDate;
var DRS = D.DRS, TODAY = D.TODAY;
function warn(t, c) { window.__dmo.customWarning(t, c || 'rgb(0, 149, 212)'); }
function demoOnly() { window.__dmo.demoOnly(); }
function renderShell() { window.__dmoRenderShell(); }

/* ========================= PANE 4 : PAIEMENTS ============================ */
var Y = {
  windows: [1, 0],
  titles: ['Paiement en attente', 'Historique'],
  DrChosen: { name: '--' }, choosingDr: false,
  lastName: '', firstName: '', number: '', email: '',
  minPlans: '', maxPlans: '', minPayment: '', maxPayment: '',
  orderBy: null, closeLeftBar: false
};
function payRowsData() {
  var PATIENTS = window.__dmoPatients;
  var T = window.__dmoPatTotals;
  return PATIENTS.map(function (p) {
    return { patientInfo: p, totalPrice: T.plans(p), totalPayments: T.pays(p), lastDate: p.payments.length ? p.payments[0].date : '--' };
  }).filter(function (pp) { return pp.totalPrice > 0 || pp.totalPayments > 0; });
}
function filteredPays(pendingOnly) {
  var rows = payRowsData();
  if (pendingOnly) rows = rows.filter(function (pp) { return (pp.totalPrice - pp.totalPayments) > 0; });
  rows = rows.filter(function (pp) {
    var p = pp.patientInfo;
    return p.lastName.toLowerCase().indexOf(Y.lastName.toLowerCase()) >= 0 &&
      p.firstName.toLowerCase().indexOf(Y.firstName.toLowerCase()) >= 0 &&
      p.number.indexOf(Y.number) >= 0 &&
      (Y.email === '' || (p.email || '').toLowerCase().indexOf(Y.email.toLowerCase()) >= 0) &&
      (Y.minPlans === '' || pp.totalPrice >= parseFloat(Y.minPlans)) &&
      (Y.maxPlans === '' || pp.totalPrice <= parseFloat(Y.maxPlans)) &&
      (Y.minPayment === '' || (pp.totalPrice - pp.totalPayments) >= parseFloat(Y.minPayment)) &&
      (Y.maxPayment === '' || (pp.totalPrice - pp.totalPayments) <= parseFloat(Y.maxPayment));
  });
  if (Y.orderBy) {
    var k = Y.orderBy.name, dir = Y.orderBy.order === 'asc' ? 1 : -1;
    rows.sort(function (a, b) {
      var va = k === 'totalPrice' ? a.totalPrice : k === 'totalPayments' ? a.totalPayments : k === 'debt' ? (a.totalPrice - a.totalPayments) : a.lastDate;
      var vb = k === 'totalPrice' ? b.totalPrice : k === 'totalPayments' ? b.totalPayments : k === 'debt' ? (b.totalPrice - b.totalPayments) : b.lastDate;
      return va > vb ? dir : va < vb ? -dir : 0;
    });
  }
  return rows;
}
function payInpRow(label, key, padR, ph) {
  return '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
    '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px ' + padR + 'px 12px 10px;margin-top:0;margin-bottom:0;">' + label + '</p>' +
    '<input autocomplete="off" data-yinp="' + key + '" placeholder="' + ph + '" value="' + esc(Y[key]) + '" style="font-family:Rubik;border:0;font-weight:500;color:rgb(0, 149, 212);font-size:14px;margin:0 0 0 10px;"></div>';
}
function payHeader(label, key, w, align) {
  var arrow = (Y.orderBy && Y.orderBy.name === key) ? '<img src="' + A + 'arrow.svg" style="height:20px;position:absolute;opacity:0.76;rotate:' + (Y.orderBy.order === 'asc' ? '90deg' : '-90deg') + ';">' : '';
  return '<p data-act="payOrder" data-k="' + key + '" style="cursor:pointer;width:' + w + ';' + (align === 'start' ? 'padding-left:10px;box-sizing:border-box;' : '') + 'max-width:300px;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:' + align + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;position:relative;">' + label + ' ' + arrow + '</p>';
}
function renderPaiements(view) {
  var pending = Y.windows[0] === 1;
  var rows = filteredPays(pending);
  var tabs = Y.titles.map(function (tt, ii) {
    var v = Y.windows[ii];
    return '<div data-act="payTab" data-i="' + ii + '" class="windows" style="z-index:3;cursor:pointer;max-width:180px;width:164px;height:25px;background-color:' + (v === 1 ? 'white' : 'rgb(84, 113, 124)') + ';border-radius:6px;margin:0px 5px;padding:0px 10px;box-sizing:border-box;display:flex;flex-direction:row;">' +
      (v === 1 ? '<div class="drc-92"></div>' : '<div class="drc-93"></div>') +
      '<h1 style="font-family:Quicksand;font-size:15px;line-break:unset;color:' + (v === 1 ? 'black' : 'white') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;pointer-events:none;">' + tt + '</h1></div>';
  }).join('');

  var body = rows.map(function (pp) {
    var p = pp.patientInfo;
    var debt = pp.totalPrice - pp.totalPayments;
    var debtColor = debt >= 0 ? (debt === 0 ? 'rgb(70, 70, 70)' : 'rgb(0, 148, 212)') : 'rgb(255, 0, 36)';
    return '<div data-act="payOpenPatient" data-id="' + p.id + '" class="ft-91" style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:start;margin-top:0;position:relative;padding:10px 0px;cursor:pointer;">' +
      '<p style="width:20%;max-width:220px;margin:0;font-family:Rubik;font-weight:500;font-size:14px;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + cap(p.lastName) + ' ' + cap(p.firstName) + '</p>' +
      '<p style="width:10%;max-width:220px;margin:0;font-family:Rubik;font-weight:500;font-size:14px;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + pp.lastDate + '</p>' +
      '<p style="width:23.33%;padding-left:10px;box-sizing:border-box;max-width:300px;margin:0;font-family:Rubik;font-size:14px;font-weight:500;color:rgb(70,70,70);text-align:start;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + pp.totalPrice.toFixed(2) + '</p>' +
      '<p style="width:23.33%;padding-left:10px;box-sizing:border-box;max-width:300px;margin:0;font-family:Rubik;font-size:14px;font-weight:500;color:rgb(0, 149, 212);text-align:start;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + pp.totalPayments.toFixed(2) + '</p>' +
      '<p style="width:23.33%;padding-left:10px;box-sizing:border-box;max-width:300px;margin:0;font-family:Rubik;font-size:14px;font-weight:500;color:' + debtColor + ';text-align:start;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + debt.toFixed(2) + '</p></div>';
  }).join('');

  view.innerHTML =
  '<div style="background-color:rgb(242, 246, 248);overflow:hidden;width:100%;height:100%;display:flex;flex-direction:row;justify-content:start;align-items:center;position:relative;">' +
    '<div id="dmoPaySide" style="width:' + (Y.closeLeftBar ? '42px' : '25%') + ';height:calc(100% - 40px);max-width:333px;transition:width 0.3s;margin-left:20px;flex-shrink:0;">' +
      '<div style="width:100%;height:100%;box-sizing:border-box;max-height:100%;padding-bottom:10px;overflow-x:hidden;overflow-y:' + (Y.closeLeftBar ? 'hidden' : 'scroll') + ';position:relative;background-color:white;border-radius:7px;box-shadow:0px 2px 3px rgb(201, 201, 201);display:flex;flex-direction:column;align-items:center;justify-content:start;">' +
        '<h1 style="font-family:Rubik;font-size:24px;color:rgb(70,70,70);">Filtres</h1>' +
        '<img data-act="payReset" class="cx-37" src="' + A + 'reset.svg" style="height:20px;opacity:0.75;cursor:pointer;z-index:1;position:absolute;top:15px;left:13px;">' +
        '<div id="dmoPayCover" style="position:absolute;z-index:' + (Y.closeLeftBar ? 5 : -1) + ';height:100%;width:100%;background-color:white;transition:0.1s;opacity:' + (Y.closeLeftBar ? 1 : 0) + ';"></div>' +
        '<img id="dmoPayArrow" data-act="payToggleBar" src="' + A + 'arrow.svg" style="cursor:pointer;z-index:5;transition:0.3s;rotate:' + (Y.closeLeftBar ? '180deg' : '0deg') + ';position:absolute;top:13px;opacity:0.75;right:7px;height:30px;">' +
        '<h1 style="font-family:Rubik;font-size:24px;color:rgb(70,70,70);rotate:270deg;display:' + (Y.closeLeftBar ? 'block' : 'none') + ';z-index:5;margin-top:70px;">Filtres</h1>' +
        '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
          '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 7px 12px 10px;margin-top:0;margin-bottom:0;">Date</p>' +
          '<p style="cursor:pointer;font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgb(0, 149, 212);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">--</p>' +
          '<p data-act="demoOnly" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;position:absolute;right:0;">Editer</p></div>' +
        '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
          '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 23px 12px 10px;margin-top:0;margin-bottom:0;">Dr</p>' +
          '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgb(0, 149, 212);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">' + esc(Y.DrChosen.name) + '</p>' +
          '<p data-act="payChooseDr" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;position:absolute;right:0;">Editer</p>' +
          '<div id="dmoPayDrDrop" style="position:absolute;z-index:7;transition:0.5s;max-height:' + (Y.choosingDr ? 200 : 0) + 'px;overflow-y:scroll;top:100%;display:flex;flex-direction:column;background-color:white;border-left:2px solid rgba(0,0,0,0.1);border-bottom:' + (Y.choosingDr ? 2 : 0) + 'px solid rgba(0,0,0,0.1);border-right:2px solid rgba(0,0,0,0.1);border-radius:0 0 7px 7px;left:61px;width:calc(100% - 126px);">' +
          ['--'].concat(DRS.map(function (d) { return d.name; })).map(function (n) { return '<p data-act="payPickDr" data-v="' + esc(n) + '" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.7);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">' + esc(n) + '</p>'; }).join('') +
          '</div></div>' +
        '<div style="height:2px;width:80%;border-radius:3px;background-color:rgb(220,220,220);margin-top:10px;"></div>' +
        payInpRow('Nom', 'lastName', 29, 'Nom...') +
        payInpRow('Prenom', 'firstName', 7, 'Prenom...') +
        payInpRow('Telephone', 'number', 7, 'Telephone...') +
        payInpRow('Email', 'email', 7, 'Email...') +
        '<div style="height:2px;width:80%;border-radius:3px;background-color:rgb(220,220,220);margin-top:10px;"></div>' +
        payInpRow('Min plan', 'minPlans', 7, 'Min plan...') +
        payInpRow('Max plan', 'maxPlans', 7, 'Max plan...') +
        '<div style="height:2px;width:80%;border-radius:3px;background-color:rgb(220,220,220);margin-top:10px;"></div>' +
        payInpRow('Min solde dû', 'minPayment', 7, 'Min paiement...') +
        payInpRow('Max solde dû', 'maxPayment', 7, 'Max paiement...') +
      '</div>' +
    '</div>' +
    '<div style="flex-grow:1;height:calc(100% - 40px);transition:width 0.3s;position:relative;border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:start;margin-left:10px;margin-right:20px;">' +
      '<div style="display:flex;flex-direction:row;height:fit-content;position:absolute;top:0;left:45px;justify-content:start;align-items:center;max-width:70%;">' + tabs + '</div>' +
      '<div style="height:calc(100% - 33px);width:100%;background-color:white;margin-top:33px;box-shadow:0px 3px 3px rgb(201, 201, 201);border-radius:7px;z-index:3;overflow:hidden;">' +
        '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:start;margin-top:0;position:relative;padding:10px 0px;border-bottom:2px solid rgb(225, 225, 225);">' +
          '<p style="width:20%;max-width:220px;margin:0;font-family:Rubik;font-weight:500;color:rgb(70,70,70);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Patient</p>' +
          payHeader('Date', 'date', '10%', 'center') +
          payHeader('Total plans', 'totalPrice', '23.33%', 'start') +
          payHeader('Total effectués', 'totalPayments', '23.33%', 'start') +
          payHeader('Solde dû', 'debt', '23.33%', 'start') +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:start;justify-content:start;height:calc(100% - 42px);overflow-y:scroll;width:100%;">' +
          body +
          (rows.length === 0 ? '<p style="width:100%;box-sizing:border-box;margin-top:15px;margin-bottom:0;font-family:Rubik;font-weight:500;color:rgb(120,120,120);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (pending ? 'Aucun paiement en attente.' : 'Aucun paiement.') + '</p>' : '') +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

  view.querySelectorAll('[data-yinp]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      Y[inp.getAttribute('data-yinp')] = inp.value;
      var k = inp.getAttribute('data-yinp');
      renderPaiements(view);
      var el = view.querySelector('[data-yinp="' + k + '"]');
      if (el) { var v = el.value; el.focus(); el.setSelectionRange(v.length, v.length); }
    });
  });
}

/* ========================= PANE 5 : ANALYTIQUE =========================== */
var AN = {
  week: (function () { var d = new Date(TODAY); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })()
};
var weekApps = [
  { day: 'Lundi', pv: 5, np: 2 }, { day: 'Mardi', pv: 2, np: 0 }, { day: 'Mercredi', pv: 1, np: 1 },
  { day: 'Jeudi', pv: 5, np: 1 }, { day: 'Vendredi', pv: 3, np: 0 }, { day: 'Samedi', pv: 2, np: 1 }, { day: 'Dimanche', pv: 0, np: 0 }
];
var sexeApps = [{ name: 'Femme', value: 58 }, { name: 'Homme', value: 42 }];
var ages = [{ name: '0-18', value: 18 }, { name: '19-30', value: 24 }, { name: '31-45', value: 32 }, { name: '46-60', value: 17 }, { name: '60+', value: 9 }];
var drsApps = [{ name: 'Youssef Bennani', value: 46 }, { name: 'Omar Tazi', value: 27 }, { name: 'Khalid Alaoui', value: 17 }, { name: 'Salma Idrissi', value: 10 }];
var drsColors = ['rgb(23, 189, 244)', 'rgb(0, 119, 182)', '#FFBB28', '#FF8042'];
var paysApps = [
  { day: 'Lundi', value: 9800 }, { day: 'Mardi', value: 5400 }, { day: 'Mercredi', value: 2200 },
  { day: 'Jeudi', value: 11200 }, { day: 'Vendredi', value: 7600 }, { day: 'Samedi', value: 4100 }, { day: 'Dimanche', value: 0 }
];
var monthExpenses = [{ week: 'S1', value: 3400 }, { week: 'S2', value: 1850 }, { week: 'S3', value: 4200 }, { week: 'S4', value: 3000 }];
var yearSum = [
  { name: 'Jan', value: 31200 }, { name: 'Fév', value: 28900 }, { name: 'Mar', value: 35400 }, { name: 'Avr', value: 33100 },
  { name: 'Mai', value: 38800 }, { name: 'Juin', value: 45400 }, { name: 'Juil', value: 48250 }, { name: 'Août', value: 36900 },
  { name: 'Sep', value: 41200 }, { name: 'Oct', value: 44800 }, { name: 'Nov', value: 40100 }, { name: 'Déc', value: 46700 }
];
var expensesSum = 12450, monthBrut = 48250, monthAvg = 640, lastMonthBrut = 43080, lastAvg = 610;
function getDoctorPercentage(v) { var tot = drsApps.reduce(function (a, d) { return a + d.value; }, 0); return v * 100 / tot; }

function renderAnalytics(view) {
  var revenueNet = monthBrut - expensesSum;
  var upBrut = monthBrut >= lastMonthBrut, upAvg = monthAvg >= lastAvg;
  var drList = DRS.map(function (Dr) {
    var da = drsApps.filter(function (d) { return d.name === Dr.name; })[0];
    return '<div data-act="demoOnly" class="hy-92" style="position:relative;cursor:pointer;display:flex;flex-direction:row;align-items:center;justify-content:start;width:100%;background-color:rgba(0,0,0,0);padding:10px 15px;box-sizing:border-box;">' +
      '<div style="height:40px;width:40px;border-radius:40px;margin-right:10px;overflow:hidden;background-color:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;"><img src="' + A + 'sidebar/empptyProfile.svg" style="width:70%;object-fit:contain;filter:invert(100%) brightness(200%);opacity:0.8;"></div>' +
      '<div style="display:flex;flex-direction:column;width:calc(100% - 50px);">' +
        '<p style="font-family:Rubik;width:fit-content;max-width:calc(100% - 70px);font-size:15px;margin:0;color:rgb(23, 189, 244);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Dr. ' + esc(Dr.name) + '</p>' +
        '<p style="font-family:Rubik;font-size:13px;margin:5px 0 0 0;color:rgb(230, 230, 230);font-weight:300;">' + (da ? getDoctorPercentage(da.value).toFixed(2) : '0.00') + '%</p></div></div>';
  }).join('');

  view.innerHTML =
  '<div style="background-color:rgb(242, 246, 248);overflow:hidden;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;">' +
    '<div style="height:50%;width:100%;display:flex;flex-direction:row;justify-content:start;align-items:center;padding:0px 10px;box-sizing:border-box;">' +
      '<div class="tf-62">' +
        '<h1 style="font-family:Rubik;font-size:14px;font-weight:bold;margin-left:20px;margin-top:20px;color:rgba(0,0,0,0.7);">Statistiques de rendez-vous</h1>' +
        '<div style="position:absolute;top:10px;right:10px;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
          '<img data-act="anWeekBack" src="' + A + 'arrow.svg" style="height:20px;margin-right:15px;filter:invert(30%);cursor:pointer;">' +
          '<p style="font-family:Rubik;font-size:15px;font-weight:500;color:rgb(70,70,70);">' + getWholeDate(AN.week) + '</p>' +
          '<img data-act="anWeekFwd" src="' + A + 'arrow.svg" style="height:20px;rotate:180deg;filter:invert(30%);cursor:pointer;margin-left:15px;"></div>' +
        '<div class="wh-12" id="anWeek"></div>' +
      '</div>' +
      // sexe + ages
      '<div style="height:calc(100% - 20px);width:calc(25% - 15px);overflow:hidden;box-shadow:0px 2px 3px rgb(201, 201, 201);border-radius:7px;margin-left:10px;background-color:white;position:relative;display:flex;flex-direction:column;align-items:start;justify-content:start;">' +
        '<p style="font-family:Rubik;font-size:17.8px;top:10px;position:absolute;font-weight:500;margin:0;left:50%;transform:translateX(-50%);color:rgb(44, 79, 94);">Sexe</p>' +
        '<div style="height:50%;width:100%;display:flex;align-items:center;justify-content:start;">' +
          '<div style="width:50%;height:164px;" id="anSexe"></div>' +
          '<div style="width:50%;height:100%;display:flex;flex-direction:column;align-items:start;justify-content:center;padding-left:10%;box-sizing:border-box;">' +
            '<div style="display:flex;align-items:center;justify-content:center;"><div style="height:10px;width:10px;border-radius:10px;background-color:rgb(23, 189, 244);"></div>' +
            '<p style="font-family:Rubik;font-size:12.3px;font-weight:500;margin-left:10px;color:rgb(44, 79, 94);">Femme <br><span style="color:gray;font-weight:200;">(' + (sexeApps[0].value * 100 / (sexeApps[0].value + sexeApps[1].value)).toFixed(2) + '%)</span></p></div>' +
            '<div style="display:flex;align-items:center;justify-content:center;"><div style="height:10px;width:10px;border-radius:10px;background-color:rgb(0, 119, 182);"></div>' +
            '<p style="font-family:Rubik;font-size:12.3px;font-weight:500;margin-left:10px;color:rgb(44, 79, 94);">Homme <br><span style="color:gray;font-weight:200;">(' + (sexeApps[1].value * 100 / (sexeApps[0].value + sexeApps[1].value)).toFixed(2) + '%)</span></p></div>' +
          '</div>' +
        '</div>' +
        '<div style="height:50%;width:100%;display:flex;align-items:center;justify-content:start;position:relative;">' +
          '<p style="font-family:Rubik;font-size:17.8px;top:-13.7px;position:absolute;font-weight:500;margin:0;left:50%;transform:translateX(-50%);color:rgb(44, 79, 94);">Groupes d\'âge</p>' +
          '<div style="width:100%;height:100%;" id="anAges"></div>' +
        '</div>' +
      '</div>' +
      // daily summary btn + expenses card
      '<div style="display:flex;flex-direction:column;height:calc(100% - 20px);width:calc(25% + 17px);margin-left:12px;gap:10px;">' +
        '<div style="height:35px;width:100%;overflow:hidden;border-radius:7px;background-color:rgb(255, 255, 255);position:relative;display:flex;flex-direction:column;align-items:start;justify-content:start;box-shadow:0px 2px 3px rgb(201, 201, 201);">' +
          '<div data-act="demoOnly" style="width:100%;height:100%;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:10px;cursor:pointer;">' +
            '<h1 style="font-family:Rubik;font-size:15px;font-weight:500;margin:0;color:rgb(44, 79, 94);">Résumé quotidien</h1>' +
            '<img src="' + A + 'arrow1.svg" style="filter:invert(70%);height:20px;width:20px;"></div></div>' +
        '<div style="height:calc(100% - 40px);width:100%;overflow:hidden;border-radius:7px;background-color:rgb(44, 79, 94);position:relative;display:flex;flex-direction:column;align-items:start;justify-content:start;">' +
          '<div style="width:100%;height:50%;display:flex;flex-direction:column;align-items:start;justify-content:start;">' +
            '<h1 style="font-family:Rubik;font-size:13.7px;font-weight:200;margin-left:20px;margin-top:10px;margin-bottom:0;color:white;">Dépenses du mois (<span style="font-weight:500;color:rgb(23, 189, 244);">' + monthsInFrench[TODAY.getMonth()] + '</span>)</h1>' +
            '<div style="display:flex;flex-direction:row;align-items:center;justify-content:center;width:100%;"><h1 style="font-family:Rubik;font-size:19.1px;text-align:center;font-weight:100;color:white;"><span style="font-weight:500;">' + expensesSum.toFixed(2) + '</span> DH</h1></div>' +
            '<h1 style="font-family:Rubik;font-size:15px;font-weight:200;margin-left:20px;margin-top:0;margin-bottom:0;color:white;">Revenu <span style="font-weight:500;">NET</span></h1>' +
            '<div style="width:100%;display:flex;flex-direction:row;align-items:center;justify-content:center;"><h1 style="font-family:Rubik;font-size:27.3px;text-align:center;font-weight:100;color:white;margin:5px 0 0 0;"><span style="font-weight:500;color:' + (revenueNet >= 0 ? 'rgb(54, 239, 91)' : '#ff3333') + ';">' + revenueNet.toFixed(2) + '</span> DH</h1></div>' +
          '</div>' +
          '<div style="width:100%;height:50%;position:relative;">' +
            '<h1 style="font-family:Rubik;font-size:13.7px;font-weight:200;margin-left:20px;position:absolute;top:-13.7px;margin-bottom:0;color:white;">Dépenses variables</h1>' +
            '<div style="width:100%;height:100%;" id="anExpenses"></div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div style="height:50%;width:100%;display:flex;flex-direction:row;justify-content:start;align-items:start;box-sizing:border-box;padding:0 10px;">' +
      // doctors
      '<div style="height:calc(100% - 10px);width:25%;display:flex;flex-direction:column;align-items:start;justify-content:start;background-color:rgb(44, 79, 94);border-radius:7px;">' +
        '<p style="font-family:Rubik;cursor:pointer;width:fit-content;text-align:start;max-width:calc(100% - 70px);margin-left:10px;font-size:15px;margin-bottom:0;color:white;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:10px;">Statistiques des docteurs</p>' +
        '<div style="height:calc(50% - 20px);margin-top:9px;width:100%;display:flex;align-items:center;justify-content:start;">' +
          '<div style="width:calc(100% - 20px);height:100%;border-radius:5px;margin-left:10px;background-color:rgb(44, 79, 94);" id="anDrs"></div></div>' +
        '<div style="height:calc(50% - 15px);width:calc(100% - 20px);margin-top:9px;margin-left:10px;padding-bottom:10px;display:flex;flex-direction:column;overflow-x:hidden;overflow-y:scroll;align-items:center;justify-content:start;background-color:rgb(44, 79, 94);">' + drList + '</div>' +
      '</div>' +
      // revenue area
      '<div style="height:calc(100% - 10px);width:calc(50% - 35px);display:flex;margin-left:10px;flex-direction:column;position:relative;align-items:start;justify-content:end;background-color:rgb(44, 79, 94);border-radius:7px;">' +
        '<h1 style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:20px;margin-top:20px;color:white;">Statistiques de revenus</h1>' +
        '<div style="position:absolute;top:10px;right:10px;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
          '<img data-act="anWeekBack" src="' + A + 'arrow.svg" style="height:20px;margin-right:15px;filter:invert(100%);cursor:pointer;">' +
          '<p style="font-family:Rubik;font-size:15px;font-weight:500;color:white;">' + getWholeDate(AN.week) + '</p>' +
          '<img data-act="anWeekFwd" src="' + A + 'arrow.svg" style="height:20px;rotate:180deg;filter:invert(100%);cursor:pointer;margin-left:15px;"></div>' +
        '<div class="wh-12" id="anPays"></div>' +
      '</div>' +
      // brut + year
      '<div style="height:calc(100% - 10px);width:calc(25% + 20px);display:flex;margin-left:10px;flex-direction:column;position:relative;align-items:start;justify-content:end;border-radius:7px;">' +
        '<div style="height:calc(50% - 5px);width:100%;border-radius:7px;background-color:rgb(44, 79, 94);display:flex;flex-direction:column;">' +
          '<h1 style="font-family:Rubik;font-size:13.7px;font-weight:200;margin-left:20px;margin-top:10px;margin-bottom:0;color:white;">Revenu <span style="font-weight:500;">BRUT</span> du mois (<span style="font-weight:500;color:rgb(23, 189, 244);">' + monthsInFrench[TODAY.getMonth()] + '</span>)</h1>' +
          '<div style="display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
            '<img src="' + A + (upBrut ? 'arrowStockUp.svg' : 'arrowStockDown.svg') + '" style="width:27.3px;margin-right:4px;rotate:' + (upBrut ? '180deg' : '0deg') + ';">' +
            '<h1 style="font-family:Rubik;font-size:27.3px;text-align:center;font-weight:100;color:white;"><span style="font-weight:500;color:' + (upBrut ? 'rgb(54, 239, 91)' : '#ff3333') + ';">' + monthBrut.toFixed(2) + '</span> DH</h1></div>' +
          '<h1 style="font-family:Rubik;font-size:13.7px;font-weight:200;margin-left:20px;margin-top:0;margin-bottom:9.6px;color:rgb(230,230,230);">Moyenne du paiement</h1>' +
          '<div style="display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
            '<img src="' + A + (upAvg ? 'arrowStockUp.svg' : 'arrowStockDown.svg') + '" style="width:19.1px;margin-right:4px;rotate:' + (upAvg ? '180deg' : '0deg') + ';">' +
            '<h1 style="font-family:Rubik;font-size:19.1px;text-align:center;font-weight:100;color:white;"><span style="font-weight:500;color:' + (upAvg ? 'rgb(54, 239, 91)' : '#ff3333') + ';">' + monthAvg.toFixed(2) + '</span> DH</h1></div>' +
        '</div>' +
        '<div style="height:calc(50% - 5px);width:100%;margin-top:10px;border-radius:7px;background-color:rgb(44, 79, 94);position:relative;">' +
          '<h1 style="font-family:Rubik;font-size:16.4px;text-align:center;font-weight:100;color:white;position:absolute;right:10px;margin:0;top:8px;">' + TODAY.getFullYear() + '</h1>' +
          '<div style="width:100%;height:100%;padding:5.5px 6.8px 1.4px 0;box-sizing:border-box;" id="anYear"></div></div>' +
      '</div>' +
    '</div>' +
  '</div>';

  requestAnimationFrame(function () {
    var el;
    if ((el = view.querySelector('#anWeek'))) U.rechartsBar(el, {
      data: weekApps, xKey: 'day', yMax: 8, yTicks: [0, 2, 4, 6, 8],
      series: [{ key: 'pv', color: 'rgb(23, 189, 244)', barSize: 12, radius: 3 }, { key: 'np', color: 'rgb(54, 239, 91)', barSize: 12, radius: 3 }]
    });
    if ((el = view.querySelector('#anSexe'))) U.rechartsPie(el, { data: sexeApps, colors: ['rgb(23, 189, 244)', 'rgb(0, 119, 182)'], outerRadius: 0.6, label: true });
    if ((el = view.querySelector('#anAges'))) U.rechartsBar(el, {
      data: ages, xKey: 'name', yMax: 100, yTicks: [0, 25, 50, 75, 100], yFmt: function (v) { return v + '%'; }, xFont: 10.9, yFont: 10.9,
      series: [{ key: 'value', color: 'rgb(23, 189, 244)', barSize: 20, radius: 3 }], margin: { t: 25, r: 30, b: 10, l: 0 }
    });
    if ((el = view.querySelector('#anExpenses'))) U.rechartsBar(el, {
      data: monthExpenses, xKey: 'week', yMax: 5000, yTicks: [0, 2500, 5000], yFmt: U.formatYAxis, gridColor: '#1f3742', axisColor: '#1f3742', xTickColor: '#ffffff', yTickColor: '#ffffff', xFont: 10.9, yFont: 10.9,
      series: [{ key: 'value', color: 'rgb(23, 189, 244)', barSize: 20, radius: 3 }], margin: { t: 25, r: 40, b: 10, l: 0 }
    });
    if ((el = view.querySelector('#anDrs'))) U.rechartsPie(el, { data: drsApps, colors: drsColors, outerRadius: 0.6, label: true, stroke: 'rgb(44, 79, 94)' });
    if ((el = view.querySelector('#anPays'))) U.rechartsArea(el, {
      data: paysApps, xKey: 'day', yKey: 'value', yMax: 12000, yTicks: [0, 4000, 8000, 12000], yFmt: U.formatYAxis, gridColor: '#1d353f', axisColor: '#1f3742', tickColor: '#fff', xFont: 11.7
    });
    if ((el = view.querySelector('#anYear'))) U.rechartsArea(el, {
      data: yearSum, xKey: 'name', yKey: 'value', yMax: 50000, yTicks: [0, 25000, 50000], yFmt: U.formatYAxis, gridColor: 'transparent', axisColor: '#1d353f', tickColor: '#fff', xFont: 9.6, grid: false
    });
  });
}

/* -------------------------------- actions -------------------------------- */
var prevClick = window.__dmoClick;
window.__dmoClick = function (act, t, e) {
  switch (act) {
    case 'payTab': { var i = parseInt(t.getAttribute('data-i'), 10); Y.windows = Y.windows.map(function (_, k) { return k === i ? 1 : 0; }); renderShell(); return; }
    case 'payReset':
      if (Y.choosingDr) Q('#dmoPayDrDrop', { maxHeight: '200px' });
      Y.lastName = Y.firstName = Y.number = Y.email = Y.minPlans = Y.maxPlans = Y.minPayment = Y.maxPayment = ''; Y.DrChosen = { name: '--' }; Y.orderBy = null; Y.choosingDr = false; renderShell(); return;
    case 'payToggleBar':
      Q('#dmoPaySide', { width: Y.closeLeftBar ? '42px' : '25%' });
      Q('#dmoPayCover', { opacity: Y.closeLeftBar ? '1' : '0' });
      Q('#dmoPayArrow', { rotate: Y.closeLeftBar ? '180deg' : '0deg' });
      Y.closeLeftBar = !Y.closeLeftBar; renderShell(); return;
    case 'payChooseDr':
      if (!Y.choosingDr) Q('#dmoPayDrDrop', { maxHeight: '0px' });
      Y.choosingDr = true; renderShell(); return;
    case 'payPickDr': Q('#dmoPayDrDrop', { maxHeight: '200px' }); Y.DrChosen = { name: t.getAttribute('data-v') }; Y.choosingDr = false; renderShell(); return;
    case 'payOrder': {
      var k = t.getAttribute('data-k');
      Y.orderBy = (Y.orderBy && Y.orderBy.name === k) ? { name: k, order: Y.orderBy.order === 'asc' ? 'desc' : 'asc' } : { name: k, order: 'asc' };
      renderShell(); return;
    }
    case 'payOpenPatient': window.__dmoOpenPatient(t.getAttribute('data-id')); return;
    case 'anWeekBack': AN.week.setDate(AN.week.getDate() - 7); renderShell(); return;
    case 'anWeekFwd': AN.week.setDate(AN.week.getDate() + 7); renderShell(); return;
  }
  if (prevClick) prevClick(act, t, e);
};

window.__dmoPanes[4] = renderPaiements;
window.__dmoPanes[5] = renderAnalytics;

/* everything registered — boot */
window.__dmoBoot();
})();
