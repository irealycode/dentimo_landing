/* ============================================================================
   Dentimo demo — Part 2 : Rendez-vous (src/code/Appointments.js, hours view)
   and Agenda (src/code/DrAppointments.js). Mock data, real behavior.
   ============================================================================ */
(function () {
'use strict';
var U = window.__dmoUtil, D = window.__dmoData, S = window.__dmoState;
var A = U.A, esc = U.esc, cap = U.capFirstLetter, chipHTML = U.chipHTML, Q = U.qAnim;
var daysInFrench = U.daysInFrench, monthsInFrench = U.monthsInFrench, getWholeDate = U.getWholeDate;
var dentalCareTypes = D.dentalCareTypes, DRS = D.DRS, ROOMS = D.ROOMS, APPOINTMENTS = D.APPOINTMENTS, TODAY = D.TODAY;
function warn(t, c) { window.__dmo.customWarning(t, c || 'rgb(0, 149, 212)'); }
function demoOnly() { window.__dmo.demoOnly(); }
function renderShell() { window.__dmoRenderShell(); }

/* ------------------------- Appointments state ---------------------------- */
var R = {
  valDate: new Date(TODAY),
  daysCount: 3,
  DrChosen: '--', RoomChosen: '--', patientFilter: '',
  startHour: null, endHour: null,
  dentalCareTypesSelected: [],
  filterUpcoming: true, filterPending: true, filterTreating: true, filterCompleted: true, filterCanceled: true,
  choosingDr: false, choosingRoom: false, selectingType: false,
  closeLeftBar: false,
  appointmentHeight: 300,
  hourStart: 7
};
var HOUR_BLOCK = R.appointmentHeight + 19; // 319
function hoursList() {
  var r = [];
  for (var i = 0; i < 24; i++) { var h = (R.hourStart + i) % 24; r.push((h < 10 ? '0' + h : h) + ':00'); }
  return r;
}
function calculateYfromHour(time) {
  var p = time.split(':').map(Number);
  var adjusted = p[0] >= R.hourStart ? p[0] - R.hourStart : p[0] + (24 - R.hourStart);
  var quarterHours = (adjusted * 4) + p[1] / 15;
  return (quarterHours * HOUR_BLOCK / 4) + 15.5;
}
function quartersBetween(start, end) {
  var s = start.split(':').map(Number), e = end.split(':').map(Number);
  return ((e[0] * 60 + e[1]) - (s[0] * 60 + s[1])) / 15;
}
function dayOffsetOf(date) { // whole-day difference vs TODAY
  var a = new Date(date); a.setHours(0, 0, 0, 0);
  var b = new Date(TODAY); b.setHours(0, 0, 0, 0);
  return Math.round((a - b) / 86400000);
}
function toMin(t) { var p = t.split(':').map(Number); return p[0] * 60 + p[1]; }

function filteredApps() {
  var apps = APPOINTMENTS.slice();
  if (R.DrChosen !== '--' || R.RoomChosen !== '--') {
    apps = apps.filter(function (a) { return (R.DrChosen !== '--' ? R.DrChosen === a.dr : true) && (R.RoomChosen !== '--' ? R.RoomChosen === a.room : true); });
  }
  if (R.patientFilter !== '') {
    apps = apps.filter(function (a) { return (a.firstName + ' ' + a.lastName).toLowerCase().indexOf(R.patientFilter.toLowerCase()) >= 0; });
  }
  apps = apps.filter(function (a) {
    return (R.filterCompleted && a.completed) || (R.filterPending && a.pending) || (R.filterCanceled && a.canceled) || (R.filterTreating && a.treating) || (R.filterUpcoming && !a.pending && !a.completed && !a.canceled && !a.treating);
  });
  if (R.dentalCareTypesSelected.length !== 0) {
    var sel = R.dentalCareTypesSelected.map(function (d) { return d.type; });
    apps = apps.filter(function (a) { return a.dentalCareTypes.some(function (d) { return sel.indexOf(d.type) >= 0; }); });
  }
  return apps;
}
/* overlap columns (countOverlaps equivalent) : sweep line, greedy columns,
   cluster width = max concurrent columns in the connected group             */
function layoutDay(apps) {
  var sorted = apps.slice().sort(function (a, b) { return toMin(a.start) - toMin(b.start); });
  var active = [], clusterApps = [], clusterMaxCol = 0;
  function closeCluster() {
    clusterApps.forEach(function (x) { x._n = clusterMaxCol + 1; });
    clusterApps = []; clusterMaxCol = 0;
  }
  sorted.forEach(function (a) {
    active = active.filter(function (x) { return toMin(x.end) > toMin(a.start); });
    if (active.length === 0) closeCluster();
    var used = active.map(function (x) { return x._col; });
    var col = 0; while (used.indexOf(col) >= 0) col++;
    a._col = col;
    clusterMaxCol = Math.max(clusterMaxCol, col);
    active.push(a); clusterApps.push(a);
  });
  closeCluster();
  return sorted;
}

/* ------------------------------ render ----------------------------------- */
function filterRow(label, valueHTML, editAct, padRight) {
  return '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
    '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px ' + (padRight || 10) + 'px 12px 10px;margin-top:0;margin-bottom:0;">' + label + '</p>' +
    valueHTML +
    (editAct ? '<p data-act="' + editAct + '" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;position:absolute;right:0;">Editer</p>' : '') +
    '</div>';
}
function checkRow(label, key, ml) {
  return '<div style="display:flex;flex-direction:row;align-items:center;justify-content:start;width:100%;margin-top:10px;">' +
    '<h1 style="font-family:Rubik;font-size:16px;color:rgb(44, 79, 94);font-weight:500;margin-top:0;align-self:start;margin-left:25px;margin-bottom:0;">' + label + '</h1>' +
    '<div data-act="rdvFilter" data-k="' + key + '" style="width:15px;height:15px;margin-left:' + ml + 'px;border:2px solid rgb(44, 79, 94);background-color:' + (R[key] ? 'rgb(44, 79, 94)' : 'white') + ';border-radius:7px;cursor:pointer;"></div></div>';
}

function statusIcons(a) {
  var s = '';
  if (a.pending) s += '<img src="' + A + 'pendingThick.svg" style="position:absolute;top:5px;right:5px;width:20px;background-color:white;border-radius:5px;">';
  if (a.treating) s += '<img src="' + A + 'treating.svg" style="position:absolute;top:5px;right:5px;width:24px;background-color:white;border-radius:5px;">';
  if (a.completed) s += '<img src="' + A + 'checkGreen.svg" style="position:absolute;top:0;right:5px;width:24px;background-color:white;border-radius:5px;">';
  if (a.canceled) s += '<img src="' + A + 'canceled.svg" style="position:absolute;top:4px;right:4px;height:20px;background-color:white;border-radius:5px;">';
  if (a.new) s += '<img src="' + A + 'new.svg" style="position:absolute;bottom:4px;right:4px;height:20px;background-color:white;border-radius:5px;">';
  return s;
}

function renderRdv(view) {
  var days = [];
  for (var i = 0; i < R.daysCount; i++) { var d = new Date(R.valDate); d.setDate(d.getDate() + i); days.push(d); }
  var hours = hoursList();
  var calendarHeight = hours.length * HOUR_BLOCK;
  var apps = filteredApps();

  /* ---- left filter bar ---- */
  var typeRows = R.dentalCareTypesSelected.map(function (dc, i) {
    return '<div class="sd-78" style="width:calc(100% - 20px);margin-top:10px;text-align:center;position:relative;padding:12px 0px;display:flex;flex-direction:row;align-items:center;justify-content:center;box-shadow:0px 0px 7px rgb(201, 201, 201);border-radius:7px;font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.7);background-color:white;">' +
      '<div style="width:25px;height:25px;border-radius:4px;background-color:' + dc.color + ';position:absolute;left:7px;border:2px solid rgba(0,0,0,0.5);"></div>' + esc(dc.type) +
      '<img src="' + A + 'closeRed.svg" data-act="rdvRemoveType" data-i="' + i + '" style="width:20px;height:20px;position:absolute;right:7px;cursor:pointer;opacity:0;transition:0.3s;"></div>';
  }).join('');

  var drOptions = ['--'].concat(DRS.map(function (d) { return d.name; }));
  var sidebar =
  '<div id="dmoRdvSide" style="max-width:333px;width:' + (R.closeLeftBar ? '42px' : 'calc(25% - 10px)') + ';height:calc(100% - 40px);box-sizing:border-box;max-height:calc(100% - 40px);padding-bottom:10px;transition:0.3s;overflow-x:hidden;overflow-y:' + (R.closeLeftBar ? 'hidden' : 'scroll') + ';position:relative;background-color:white;border-radius:7px;margin-left:20px;box-shadow:0px 2px 3px rgb(201, 201, 201);display:flex;flex-direction:column;align-items:center;justify-content:start;flex-shrink:0;">' +
    '<h1 style="font-family:Rubik;font-size:24px;color:rgb(70,70,70);">Filtres</h1>' +
    '<img class="cx-37" data-act="rdvReset" src="' + A + 'reset.svg" style="height:20px;opacity:0.75;cursor:pointer;z-index:1;position:absolute;top:15px;left:13px;">' +
    '<div id="dmoRdvCover" style="position:absolute;z-index:' + (R.closeLeftBar ? 5 : -1) + ';height:100%;width:100%;background-color:white;transition:0.1s;opacity:' + (R.closeLeftBar ? 1 : 0) + ';"></div>' +
    '<img id="dmoRdvArrow" data-act="rdvToggleBar" src="' + A + 'arrow.svg" style="cursor:pointer;z-index:5;transition:0.3s;rotate:' + (R.closeLeftBar ? '180deg' : '0deg') + ';position:absolute;top:13px;opacity:0.75;right:7px;height:30px;">' +
    '<h1 style="font-family:Rubik;font-size:24px;color:rgb(70,70,70);rotate:270deg;display:' + (R.closeLeftBar ? 'block' : 'none') + ';z-index:5;margin-top:70px;">Filtres</h1>' +
    '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
      '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">' + daysInFrench[R.valDate.getDay()] + ' ' + R.valDate.getDate() + ' ' + monthsInFrench[R.valDate.getMonth()] + ' ' + R.valDate.getFullYear() + '</p>' +
      '<p data-act="rdvEditDate" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;position:absolute;right:0;">Editer</p></div>' +
    '<div style="width:calc(100% - 20px);margin-top:10px;display:flex;flex-direction:row;align-items:center;justify-content:space-between;">' +
      '<p data-act="rdvToday" style="flex:1;margin-right:5px;margin-top:0;margin-bottom:0;text-align:center;cursor:pointer;font-family:Rubik;font-size:14px;font-weight:500;color:white;background-color:rgb(23, 189, 244);padding:10px 0;border-radius:7px;">Aujourd\'hui</p>' +
      '<p data-act="rdvMonthView" style="flex:1;margin-left:5px;margin-top:0;margin-bottom:0;text-align:center;cursor:pointer;font-family:Rubik;font-size:14px;font-weight:500;color:rgb(0, 149, 212);background-color:white;box-shadow:0px 0px 5px rgb(201, 201, 201);padding:10px 0;border-radius:7px;">Vue mois</p></div>' +
    // Dr
    '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
      '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 35px 12px 10px;margin-top:0;margin-bottom:0;">Dr</p>' +
      '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgb(0, 149, 212);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">' + esc(R.DrChosen) + '</p>' +
      '<p data-act="rdvChooseDr" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;position:absolute;right:0;">Editer</p>' +
      '<div id="dmoDrDrop" style="position:absolute;z-index:7;transition:0.5s;max-height:' + (R.choosingDr ? 200 : 0) + 'px;overflow-y:scroll;top:100%;display:flex;flex-direction:column;background-color:white;border-left:2px solid rgba(0,0,0,0.1);border-bottom:' + (R.choosingDr ? 2 : 0) + 'px solid rgba(0,0,0,0.1);border-right:2px solid rgba(0,0,0,0.1);border-radius:0 0 7px 7px;left:61px;width:calc(100% - 126px);">' +
      drOptions.map(function (n) { return '<p data-act="rdvPickDr" data-v="' + esc(n) + '" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.7);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">' + esc(n) + '</p>'; }).join('') +
      '</div></div>' +
    // Sale
    '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
      '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 22px 12px 10px;margin-top:0;margin-bottom:0;">Sale</p>' +
      '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgb(0, 149, 212);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">' + esc(R.RoomChosen) + '</p>' +
      '<p data-act="rdvChooseRoom" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;position:absolute;right:0;">Editer</p>' +
      '<div id="dmoRoomDrop" style="position:absolute;z-index:6;transition:0.5s;max-height:' + (R.choosingRoom ? 200 : 0) + 'px;overflow-y:scroll;top:100%;display:flex;flex-direction:column;background-color:white;border-left:2px solid rgba(0,0,0,0.1);border-bottom:' + (R.choosingRoom ? 2 : 0) + 'px solid rgba(0,0,0,0.1);border-right:2px solid rgba(0,0,0,0.1);border-radius:0 0 7px 7px;left:61px;width:calc(100% - 126px);">' +
      ROOMS.map(function (n) { return '<p data-act="rdvPickRoom" data-v="' + esc(n) + '" class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.7);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">' + esc(n) + '</p>'; }).join('') +
      '</div></div>' +
    // Debut / Fin
    ['Debut', 'Fin'].map(function (lbl) {
      return '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
        '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px ' + (lbl === 'Fin' ? 30 : 10) + 'px 12px 10px;margin-top:0;margin-bottom:0;">' + lbl + '</p>' +
        '<p data-act="rdvHour" style="font-family:Rubik;font-weight:500;color:rgb(0, 149, 212);font-size:14px;margin:0 0 0 10px;cursor:pointer;">--:--</p>' +
        '<p class="ud-43" style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-left:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;position:absolute;right:0;">Retirer</p></div>';
    }).join('') +
    // Patient
    '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
      '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">Patient</p>' +
      '<input autocomplete="off" data-inp="rdvPatient" placeholder="Nom..." value="' + esc(R.patientFilter) + '" style="font-family:Rubik;border:0;font-weight:500;color:rgb(0, 149, 212);font-size:14px;margin:0 0 0 10px;"></div>' +
    // dental care selector
    '<div style="width:calc(100% - 20px);height:200px;min-height:170px;overflow:scroll;padding-bottom:10px;box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;background-color:white;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:start;flex-shrink:0;">' +
      '<p class="jd-62" data-act="rdvSelectType" style="width:calc(100% - 20px);margin-top:10px;margin-bottom:0;text-align:center;padding:10px 0px;border:2px solid rgb(23, 189, 244);border-radius:7px;font-family:Rubik;font-weight:500;color:white;background-color:rgb(23, 189, 244);cursor:pointer;">Ajouter un soin dentaire</p>' +
      (!R.dentalCareTypesSelected[0] ? '<p style="color:rgba(0,0,0,0.4);transition:0.3s;font-family:Rubik;font-weight:500;font-size:17px;margin:20px 0 0 0;">Aucun soin dentaire.</p>' : '') + typeRows +
    '</div>' +
    '<h1 style="font-family:Rubik;font-size:18px;color:rgb(70,70,70);margin-top:20px;">Afficher que</h1>' +
    checkRow('À venir', 'filterUpcoming', 59).replace('margin-top:10px', 'margin-top:0') +
    checkRow('En attente', 'filterPending', 30) +
    checkRow('En cours', 'filterTreating', 45) +
    checkRow('Complété', 'filterCompleted', 38) +
    checkRow('Annulé', 'filterCanceled', 58) +
    '<div style="width:100%;border-top:2px dashed rgba(0,0,0,0.1);margin-top:20px;height:2px;"></div>' +
    '<h1 style="font-family:Rubik;font-size:24px;color:rgb(70,70,70);margin-top:7px;">Options</h1>' +
    '<div style="width:calc(100% - 20px);box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
      '<p style="font-family:Rubik;font-size:14px;font-weight:500;margin-left:0;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 10px;margin-top:0;margin-bottom:0;">Nbr de jours</p>' +
      '<input autocomplete="off" data-inp="rdvDays" type="number" value="' + R.daysCount + '" style="font-family:Rubik;border:0;font-weight:500;color:rgb(0, 149, 212);font-size:14px;margin:0 0 0 10px;width:60px;"></div>' +
  '</div>';

  /* ---- calendar (hours viewer) ---- */
  var headers = days.map(function (day) {
    var isToday = getWholeDate(day) === getWholeDate(TODAY);
    return '<div style="width:' + (100 / R.daysCount) + '%;font-size:16px;font-family:Rubik;font-weight:500;color:' + (isToday ? 'rgb(23, 189, 244)' : 'rgba(0,0,0,0.7)') + ';text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span>' + day.getDate() + ' ' + daysInFrench[day.getDay()] + '</span></div>';
  }).join('');

  var hourLabels = hours.map(function (h) {
    return '<p style="text-align:center;font-size:16px;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.7);margin:0 0 ' + R.appointmentHeight + 'px 0;">' + h + '</p>';
  }).join('');

  var cols = days.map(function (day, ii) {
    var seps = '';
    if (ii === 0) {
      hours.forEach(function (_, i) {
        var base = i * HOUR_BLOCK;
        seps += '<div style="height:1px;width:' + (R.daysCount * 100) + '%;z-index:1;position:absolute;top:' + (base + 19.5) + 'px;background-color:rgba(0,0,0,0.1);"></div>';
        [0.25, 0.5, 0.75].forEach(function (q) {
          seps += '<div style="height:1px;width:' + (R.daysCount * 100) + '%;z-index:1;position:absolute;top:' + (base + HOUR_BLOCK * q + 19.5) + 'px;border-top:1px dashed rgba(0,0,0,0.1);"></div>';
        });
      });
    }
    var isToday = getWholeDate(day) === getWholeDate(new Date());
    var nowLine = '';
    if (isToday) {
      var now = U.getCurrentTime();
      nowLine = '<div style="height:2px;width:100%;position:absolute;left:0;top:' + calculateYfromHour(now) + 'px;background-color:#ff4747;z-index:2;">' +
        '<div style="position:absolute;left:0;background-color:#ff4747;padding:3px;border-radius:7px;top:0;transform:translateX(-100%) translateY(-50%);z-index:2;"><p style="text-align:center;font-size:16px;font-family:Rubik;font-weight:500;color:white;margin:0;">' + now + '</p></div></div>';
    }
    // click-to-add slots
    var slots = '';
    for (var q = 0; q < hours.length * 4; q++) {
      slots += '<div data-act="rdvSlot" class="fi-82" style="position:relative;width:calc(100% - 4px);height:' + ((HOUR_BLOCK * 0.25) - 8) + 'px;margin-top:8px;margin-left:2px;z-index:1;border-radius:7px;box-sizing:border-box;background-color:rgba(0,0,0,0);cursor:pointer;"></div>';
    }
    var dayApps = layoutDay(apps.filter(function (a) { return a.off === dayOffsetOf(day); }));
    var cards = dayApps.map(function (app) {
      var minHeight = (HOUR_BLOCK * quartersBetween(app.start, app.end)) - 8;
      var tooClose = U.isTooCloseToWhite(app.dentalCareTypes[0].color);
      var noCrosses = app._n <= 1 || R.RoomChosen !== '--';
      var leftPct = noCrosses ? 0 : (app._col * (100 / app._n));
      var wCss = noCrosses ? 'min-width:calc(100% - 4px);max-width:calc(100% - 4px);' : 'min-width:calc(' + (100 / app._n) + '% - 4px);max-width:calc(' + (100 / app._n) + '% - 4px);';
      var isTodayActual = app.off === 0;
      minHeight = minHeight / 4; // quarter units : HOUR_BLOCK covers 4 quarters
      minHeight = (HOUR_BLOCK / 4) * quartersBetween(app.start, app.end) - 8;
      return '<div class="cu-78" data-app="' + app.id + '" style="position:absolute;left:' + leftPct + '%;display:flex;flex-direction:row;' + wCss + 'top:' + calculateYfromHour(app.start) + 'px;height:' + minHeight + 'px;min-height:' + minHeight + 'px;margin-top:8px;margin-left:2px;z-index:2;max-height:1000px;border-radius:7px;box-sizing:border-box;background-color:' + app.dentalCareTypes[0].color + ';cursor:' + (app.completed || app.canceled ? 'default' : 'grab') + ';box-shadow:0 2px 4px rgba(0,0,0,0.08);">' +
        '<div class="gi-30" style="height:100%;position:relative;padding-right:5px;z-index:2;min-width:calc(100% - 60px);max-width:calc(100% - 55px);overflow:hidden;border:3px solid ' + app.dentalCareTypes[0].color + ';box-sizing:border-box;border-radius:7px;background-color:white;">' +
          '<p data-act="goPatients" class="patname-01" style="margin-top:5px;transition:color 0.3s;margin-bottom:0;cursor:pointer;margin-left:5px;color:black;font-family:Rubik;font-weight:500;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:fit-content;max-width:100%;">' + cap(app.firstName) + ' ' + cap(app.lastName) + '</p>' +
          '<p style="margin-top:0;margin-bottom:5px;margin-left:5px;color:black;font-family:Rubik;font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + app.number + '</p>' +
          '<p style="margin-top:0;margin-bottom:0;margin-left:5px;color:rgb(0, 149, 212);font-family:Rubik;font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Dr. ' + app.dr + '</p>' +
          '<p style="margin-top:0;margin-bottom:0;margin-left:5px;color:rgb(0, 149, 212);font-family:Rubik;font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + app.room + '</p>' +
          statusIcons(app) +
        '</div>' +
        '<div style="position:relative;z-index:2;height:100%;width:55px;background-color:' + app.dentalCareTypes[0].color + ';border-radius:7px;overflow:hidden;">' +
          '<p style="position:absolute;margin:0;font-family:Rubik;font-weight:500;color:' + (app.canceled ? 'red' : !tooClose ? 'white' : 'black') + ';font-size:15px;left:5px;top:5px;">' + app.start + '</p>' +
          '<div style="position:absolute;width:3px;background-color:' + (!tooClose ? 'white' : 'black') + ';opacity:0.5;height:calc(100% - 52px);left:25px;top:26px;border-radius:7px;"></div>' +
          '<p style="position:absolute;margin:0;font-family:Rubik;font-weight:500;color:' + (app.canceled ? 'red' : !tooClose ? 'white' : 'black') + ';font-size:15px;left:5px;bottom:5px;">' + app.end + '</p>' +
        '</div>' +
        // hover action bar
        '<div class="oh-83" style="position:absolute;display:flex;flex-direction:row;align-items:center;justify-content:center;right:30px;bottom:2px;z-index:1;width:fit-content;padding:0px 5px;min-height:43px;height:fit-content;border-radius:0px 0px 5px 5px;background-color:' + app.dentalCareTypes[0].color + ';flex-wrap:wrap;">' +
          '<img data-act="rdvInfo" src="' + A + 'info.svg" style="width:28px;cursor:pointer;height:auto;filter:' + (tooClose ? 'invert(100%)' : 'invert(0%)') + ';">' +
          (!app.completed ? '<img data-act="rdvEdit" src="' + A + 'edit.svg" style="width:25px;margin:2px;cursor:pointer;height:auto;filter:' + (tooClose ? 'invert(100%)' : 'invert(0%)') + ';">' +
          '<img data-act="rdvDelete" src="' + A + 'close.svg" style="width:28px;cursor:pointer;height:auto;filter:' + (tooClose ? 'invert(100%)' : 'invert(0%)') + ';">' : '') +
        '</div>' +
        (!app.pending && !app.completed && !app.canceled && !app.treating && isTodayActual ?
          '<div class="oh-84" style="position:absolute;right:11px;padding:7px 7px 7px 11px;height:25px;border-radius:0 5px 5px 0;background-color:rgb(255, 179, 0);"><img data-act="rdvPend" src="' + A + 'pending.svg" style="width:25px;transition:0.3s;cursor:pointer;filter:grayscale(100%) brightness(200%);"></div>' : '') +
        (app.pending && !app.completed && !app.canceled && isTodayActual ?
          '<div class="oh-84" style="position:absolute;right:11px;padding:7px 7px 7px 11px;height:25px;border-radius:0 5px 5px 0;background-color:rgb(23, 189, 244);"><img data-act="rdvTreat" src="' + A + 'next.svg" style="width:25px;transition:0.3s;cursor:pointer;filter:invert(100%);"></div>' +
          '<div class="oh-84" style="position:absolute;right:11px;top:35px;padding:7px 7px 7px 11px;height:25px;border-radius:0 5px 5px 0;background-color:rgb(23, 189, 244);"><img data-act="rdvUnpend" src="' + A + 'next.svg" style="width:25px;transition:0.3s;cursor:pointer;filter:invert(100%);rotate:180deg;"></div>' : '') +
        (app.treating && !app.pending && !app.completed && !app.canceled && isTodayActual ?
          '<div class="oh-84" style="position:absolute;right:11px;padding:7px 7px 7px 11px;height:25px;border-radius:0 5px 5px 0;background-color:rgb(255, 179, 0);"><img data-act="rdvPend" src="' + A + 'next.svg" style="width:25px;transition:0.3s;cursor:pointer;filter:invert(100%);rotate:180deg;"></div>' : '') +
        (!app.completed && !app.canceled ?
          '<div style="position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);width:46px;height:12px;border-radius:8px;background-color:rgba(255,255,255,0.92);border:2px solid ' + app.dentalCareTypes[0].color + ';box-shadow:0 2px 7px rgba(0,0,0,0.22);z-index:7;cursor:ns-resize;display:flex;align-items:center;justify-content:center;"><div style="width:24px;height:3px;border-radius:3px;background-color:' + app.dentalCareTypes[0].color + ';opacity:0.85;"></div></div>' : '') +
        '</div>';
    }).join('');

    return '<div style="width:' + (100 / R.daysCount) + '%;position:relative;height:' + calendarHeight + 'px;background-color:white;padding-top:15.5px;box-sizing:border-box;border-right:1px solid rgba(0,0,0,0.1);">' +
      nowLine + slots + seps + cards + '</div>';
  }).join('');

  var typesOverlay = R.selectingType ?
    '<div data-act="rdvCloseTypes" style="position:absolute;z-index:7;top:0;left:0;height:100%;width:100%;background-color:rgba(0,0,0,0.3);"></div>' +
    '<div style="position:absolute;width:80%;max-width:1000px;justify-content:center;align-items:center;display:flex;flex-direction:row;flex-wrap:wrap;z-index:9;top:50%;transform:translateY(-50%) translateX(-50%);left:50%;">' +
    dentalCareTypes.map(function (dc, i) {
      return '<div data-act="rdvAddType" data-i="' + i + '" class="dh-78" style="margin:10px;cursor:pointer;background-color:rgb(24, 59, 74);border-radius:7px;padding:10px 10px;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
        '<div style="width:25px;height:25px;border-radius:4px;background-color:' + dc.color + ';pointer-events:none;"></div>' +
        '<p style="margin-left:7px;font-family:Rubik;font-weight:lighter;font-size:15px;margin-top:0;margin-bottom:0;color:white;pointer-events:none;">' + esc(dc.type) + '</p></div>';
    }).join('') + '</div>' : '';

  view.innerHTML =
    '<div style="background-color:rgb(242, 246, 248);overflow:hidden;width:100%;height:100%;display:flex;flex-direction:row;justify-content:start;align-items:center;position:relative;">' +
      sidebar +
      '<div style="position:relative;height:calc(100% - 40px);overflow:hidden;background-color:white;border-radius:7px;margin-left:10px;box-shadow:0px 2px 3px rgb(201, 201, 201);display:flex;flex-direction:column;justify-content:start;align-items:center;flex-grow:1;margin-right:20px;">' +
        '<img data-act="rdvPrev" class="ar-03" src="' + A + 'arrow.svg" style="width:30px;position:absolute;top:10px;right:40px;opacity:0.6;cursor:pointer;z-index:3;">' +
        '<img data-act="rdvNext" class="ar-03" src="' + A + 'arrow.svg" style="width:30px;position:absolute;top:10px;right:10px;opacity:0.6;cursor:pointer;rotate:180deg;z-index:3;">' +
        '<div style="height:50px;width:100%;border-bottom:2px solid rgba(0,0,0,0.1);display:flex;flex-direction:row;flex-shrink:0;">' +
          '<div style="height:100%;width:50px;"></div>' +
          '<div style="height:100%;width:calc(100% - 50px);display:flex;flex-direction:row;align-items:center;justify-content:center;">' + headers + '</div>' +
        '</div>' +
        '<div id="dmoCalScroll" style="height:calc(100% - 52px);overflow-y:scroll;padding-bottom:30px;width:100%;display:flex;flex-direction:row;justify-content:start;align-items:start;">' +
          '<div style="width:50px;height:' + calendarHeight + 'px;display:flex;flex-direction:column;align-items:center;justify-content:start;border-right:2px solid rgba(0,0,0,0.1);flex-shrink:0;">' +
            '<div style="height:calc(100% - 50px);width:100%;padding-top:10px;">' + hourLabels + '</div>' +
          '</div>' +
          '<div style="width:calc(100% - 50px);height:100%;display:flex;flex-direction:row;justify-content:start;align-items:start;position:relative;">' + cols + '</div>' +
        '</div>' +
      '</div>' +
      typesOverlay +
    '</div>';

  var sc = view.querySelector('#dmoCalScroll');
  if (sc) sc.scrollTop = calculateYfromHour('08:00') - 45;
  var pi = view.querySelector('[data-inp="rdvPatient"]');
  if (pi) pi.addEventListener('input', function () { R.patientFilter = this.value; refreshCalOnly(view); });
  var di = view.querySelector('[data-inp="rdvDays"]');
  if (di) di.addEventListener('change', function () {
    var v = parseInt(this.value, 10);
    if (v && v > 0 && v <= 7) { R.daysCount = v; renderShell(); }
  });
}
function refreshCalOnly(view) {
  // re-render pane but restore patient input focus/caret
  var val = R.patientFilter;
  renderRdv(view);
  var pi = view.querySelector('[data-inp="rdvPatient"]');
  if (pi) { pi.focus(); pi.setSelectionRange(val.length, val.length); }
}

/* ========================= PANE 2 : AGENDA ================================
   Port of src/code/DrAppointments.js                                       */
var G = { appClicked: null, appSelected: null, modalTypes: [], selectingType: false };
function minsDiff(a, b) {
  if (!a) return '';
  var e = b ? toMin(b) : (new Date().getHours() * 60 + new Date().getMinutes());
  var m = Math.max(0, e - toMin(a));
  return m + ' min';
}
function agendaRow(a, i, colorName, color, nextAct, backAct, expandColor) {
  var expanded = G.appClicked === a.id;
  var actions = '';
  if (backAct) actions += '<img data-act="' + backAct + '" data-id="' + a.id + '" src="' + A + 'next.svg" style="width:25px;transition:0.3s;cursor:pointer;filter:invert(100%);transform:rotate(180deg);margin-right:15px;">';
  actions += '<img data-act="agdInfo" src="' + A + 'info.svg" style="width:25px;transition:0.3s;cursor:pointer;' + (nextAct ? 'margin-right:15px;' : 'margin-left:15px;') + '">';
  if (nextAct) actions += '<img data-act="' + nextAct + '" data-id="' + a.id + '" src="' + A + 'next.svg" style="width:25px;transition:0.3s;cursor:pointer;filter:invert(100%);">';
  return '<div data-act="agdExpand" data-id="' + a.id + '" class="' + colorName + '" style="width:calc(100% - 20px);padding-bottom:' + (expanded ? 50 : 0) + 'px;position:relative;overflow:visible;border:' + (expanded ? '2px solid ' + expandColor : '2px solid white') + ';background-color:' + (expanded ? color : 'transparent') + ';border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
    (a.comments > 0 ? '<div style="position:absolute;top:5px;left:5px;width:10px;height:10px;border-radius:10px;background-color:#08E625;"></div>' : '') +
    '<p style="width:20%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;">' + a.start + '</p>' +
    '<div style="width:25%;text-align:center;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
      (a.new ? '<img style="height:15px;margin-bottom:1px;margin-right:3px;" src="' + A + 'new.svg">' : '') +
      '<p data-act="goPatients" style="cursor:pointer;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;font-family:Rubik;font-weight:500;color:rgb(0, 149, 212);">' + cap(a.firstName) + ' ' + cap(a.lastName) + '</p></div>' +
    '<p style="width:25%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;">' + a.number + '</p>' +
    '<div style="width:30%;position:relative;cursor:default;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
      '<div class="nf-95">' + chipHTML(a.dentalCareTypes[0]) + '</div>' +
      (a.dentalCareOperations.length !== 0 ? '<div class="ln-32" style="position:absolute;z-index:7;right:50%;top:calc(100% - 5px);max-width:0;max-height:0;opacity:1;transition:0.3s;background-color:rgb(44, 79, 94);border-radius:7px 0px 7px 7px;overflow:hidden;"><p style="font-family:Rubik;font-weight:lighter;font-size:13.7px;margin:0;color:white;padding:8px 12px;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;">' + esc(a.dentalCareOperations[0].operation) + '</p></div>' : '') +
    '</div>' +
    (a.medicalDesc ? '<img class="nf-95" src="' + A + 'warning.svg" style="position:absolute;left:8px;height:27px;">' +
      '<div class="ln-32" style="position:absolute;z-index:5;left:20px;top:36px;max-width:0;max-height:0;opacity:1;transition:0.3s;background-color:rgb(255, 179, 0);border-radius:0px 7px 7px 7px;overflow:hidden;"><p style="font-family:Rubik;font-weight:lighter;font-size:13.7px;margin:0;color:white;padding:8px 12px;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;">' + esc(a.medicalDesc) + '</p></div>' : '') +
    '<div class="' + (i === 0 ? 'next-02' : 'next-01') + '" style="position:absolute;z-index:6;background-color:' + expandColor + ';height:25px;padding:6px;">' + actions + '</div>' +
    (expanded ? '<div style="width:100%;position:absolute;top:50px;left:0;border-top:2px dashed ' + expandColor + ';display:flex;flex-direction:row;justify-content:start;align-items:center;">' +
      '<p style="width:10%;margin-left:5%;font-family:Rubik;font-weight:500;color:rgb(255, 179, 0);text-align:center;text-wrap:nowrap;">' + (a.pended_at || '') + '</p>' +
      (a.treated_at ? '<img src="' + A + 'arrow.svg" style="width:20px;rotate:180deg;"><p style="width:10%;font-family:Rubik;font-weight:500;color:rgb(23, 189, 244);text-align:center;text-wrap:nowrap;">' + a.treated_at + '</p>' : '') +
      (a.completed_at ? '<img src="' + A + 'arrow.svg" style="width:20px;rotate:180deg;"><p style="width:10%;font-family:Rubik;font-weight:500;color:#08E625;text-align:center;text-wrap:nowrap;">' + a.completed_at + '</p>' : '') +
      '<p style="width:30%;position:absolute;right:0;font-family:Rubik;font-weight:500;color:rgb(255, 179, 0);text-align:center;text-wrap:nowrap;">' + minsDiff(a.pended_at, a.treated_at) + '</p>' +
    '</div>' : '') +
    '</div>';
}
function agendaHeaderRow() {
  return '<div style="width:100%;padding:0px 10px;box-sizing:border-box;display:flex;flex-direction:row;align-items:center;justify-content:center;margin-top:0;position:relative;">' +
    '<p style="width:20%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;margin:0 0 10px 0;">Temps</p>' +
    '<p style="width:25%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;margin:0 0 10px 0;">Nom</p>' +
    '<p style="width:25%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;margin:0 0 10px 0;">Telephone</p>' +
    '<p style="width:30%;font-family:Rubik;font-weight:500;color:rgba(0,0,0,0.9);text-align:center;margin:0 0 10px 0;">Soin</p>' +
    '<div style="width:100%;height:2px;background-color:rgba(0,0,0,0.1);border-radius:4px;position:absolute;bottom:0;"></div></div>';
}
function renderAgenda(view) {
  var today = D.appsToday().filter(function (a) { return a.dr === S.actingDr.name || S.actingDr.name === 'Youssef Bennani'; });
  var upcoming = today.filter(function (a) { return !a.pending && !a.treating && !a.completed && !a.canceled; });
  var pending = today.filter(function (a) { return a.pending; });
  var treating = today.filter(function (a) { return a.treating; });
  var completed = today.filter(function (a) { return a.completed; });

  var modal = '';
  if (G.appSelected) {
    var ap = G.appSelected;
    modal =
    '<div data-act="agdCloseModal" style="position:absolute;top:0;left:0;height:100%;width:100%;background-color:rgba(0,0,0,0.3);z-index:8;"></div>' +
    '<div style="position:absolute;top:50%;left:50%;transform:translateX(-50%) translateY(-50%);background-color:white;border-radius:12px;padding:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9;">' +
      '<h1 style="font-size:18px;color:rgb(44, 79, 94);width:100%;text-align:center;font-family:Rubik;margin-bottom:20px;">Prochain rendez-vous</h1>' +
      '<div style="display:flex;flex-direction:row;margin-top:15px;">' +
        '<div style="width:50%;min-width:200px;cursor:default;box-shadow:0px 0px 5px rgb(201, 201, 201);border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
          '<p style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 8px 12px 10px;margin:0;">Prenom</p>' +
          '<p style="font-family:Rubik;font-size:14px;font-weight:500;color:rgb(0, 149, 212);display:inline;padding:12px 10px;margin:0;">' + cap(ap.firstName) + '</p></div>' +
        '<div style="width:50%;min-width:200px;cursor:default;box-shadow:0px 0px 5px rgb(201, 201, 201);margin-left:10px;border-radius:7px;display:flex;flex-direction:row;align-items:center;justify-content:start;position:relative;">' +
          '<p style="font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.5);border-right:2px solid rgba(0,0,0,0.1);display:inline;padding:12px 30px 12px 10px;margin:0;">Nom</p>' +
          '<p style="font-family:Rubik;font-size:14px;font-weight:500;color:rgb(0, 149, 212);display:inline;padding:12px 10px;margin:0;">' + cap(ap.lastName) + '</p></div>' +
      '</div>' +
      '<div data-act="agdCloseModal" style="position:absolute;top:5px;right:5px;padding:7px 14px;background-color:rgb(255, 179, 0);border-radius:7px;cursor:pointer;"><p style="font-family:Rubik;font-size:14px;font-weight:500;margin:0;color:white;pointer-events:none;">Ignorer</p></div>' +
      '<div style="width:300px;height:250px;overflow:scroll;padding-bottom:10px;box-shadow:0px 0px 5px rgb(201, 201, 201);margin-top:10px;background-color:white;border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:start;">' +
        '<p class="jd-62" data-act="agdSelectType" style="width:calc(100% - 20px);margin-top:10px;margin-bottom:0;text-align:center;padding:10px 0px;border:2px solid rgb(23, 189, 244);border-radius:7px;font-family:Rubik;font-weight:500;color:white;background-color:rgb(23, 189, 244);cursor:pointer;">Ajouter un soin dentaire</p>' +
        (G.modalTypes.length === 0 ? '<p style="color:rgba(0,0,0,0.4);font-family:Rubik;font-weight:500;font-size:17px;margin:20px 0 0 0;">Aucun soin dentaire.</p>' : '') +
        G.modalTypes.map(function (dc, i) {
          return '<div class="sd-78" style="width:calc(100% - 20px);margin-top:10px;text-align:center;position:relative;padding:12px 0px;display:flex;flex-direction:row;align-items:center;justify-content:center;box-shadow:0px 0px 7px rgb(201, 201, 201);border-radius:7px;font-family:Rubik;font-size:14px;font-weight:500;color:rgba(0,0,0,0.7);background-color:white;">' +
            '<div style="width:25px;height:25px;border-radius:4px;background-color:' + dc.color + ';position:absolute;left:7px;border:2px solid rgba(0,0,0,0.5);"></div>' + esc(dc.type) +
            '<img src="' + A + 'closeRed.svg" data-act="agdRemoveType" data-i="' + i + '" style="width:20px;height:20px;position:absolute;right:7px;cursor:pointer;opacity:0;transition:0.3s;"></div>';
        }).join('') +
      '</div>' +
      '<p class="jd-62" data-act="agdSend" style="width:100%;margin-top:10px;margin-bottom:0;text-align:center;padding:10px 0px;border:2px solid rgb(23, 189, 244);border-radius:7px;font-family:Rubik;font-weight:500;color:white;background-color:rgb(23, 189, 244);cursor:pointer;">Envoyer</p>' +
    '</div>' +
    (G.selectingType ?
      '<div data-act="agdCloseTypes" style="position:absolute;z-index:10;top:0;left:0;height:100%;width:100%;background-color:rgba(0,0,0,0.3);"></div>' +
      '<div style="position:absolute;width:80%;max-width:1000px;justify-content:center;align-items:center;display:flex;flex-direction:row;flex-wrap:wrap;z-index:11;top:50%;transform:translateY(-50%) translateX(-50%);left:50%;">' +
      dentalCareTypes.map(function (dc, i) {
        return '<div data-act="agdAddType" data-i="' + i + '" class="dh-78" style="margin:10px;cursor:pointer;background-color:rgb(24, 59, 74);border-radius:7px;padding:10px 10px;display:flex;flex-direction:row;align-items:center;justify-content:center;">' +
          '<div style="width:25px;height:25px;border-radius:4px;background-color:' + dc.color + ';pointer-events:none;"></div>' +
          '<p style="margin-left:7px;font-family:Rubik;font-weight:lighter;font-size:15px;margin:0 0 0 7px;color:white;pointer-events:none;">' + esc(dc.type) + '</p></div>';
      }).join('') + '</div>' : '');
  }

  view.innerHTML =
  '<div style="background-color:rgb(242, 246, 248);overflow:hidden;width:100%;height:100%;display:flex;flex-direction:row;justify-content:center;align-items:center;position:relative;">' +
    '<div style="width:calc(50% - 20px);height:calc(100% - 40px);border-radius:7px;background-color:white;box-shadow:0px 2px 3px rgb(201, 201, 201);overflow:hidden;">' +
      '<h1 style="font-family:Rubik;font-size:17px;font-weight:500;color:rgb(0, 148, 212);width:100%;padding:10px 10px;margin:0;box-sizing:border-box;">Rendez-vous à venir <span style="font-weight:bold;">(' + upcoming.length + ')</span></h1>' +
      agendaHeaderRow() +
      '<div style="width:100%;height:calc(100% - 89px);overflow-x:hidden;overflow-y:scroll;padding:10px 0;display:flex;flex-direction:column;align-items:center;justify-content:start;">' +
        upcoming.map(function (a, i) { return agendaRow(a, i, 'os-38', 'transparent', 'agdNext0', null, 'rgb(0, 149, 212)'); }).join('') +
        (upcoming.length === 0 ? '<h1 style="font-family:Rubik;text-align:center;font-size:17px;font-weight:500;color:rgb(150,150,150);width:100%;padding:10px 10px;margin:0;box-sizing:border-box;align-self:center;">Aucun rendez-vous à venir.</h1>' : '') +
      '</div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:calc(100% - 40px);width:calc(50% - 30px);margin-left:10px;">' +
      '<div style="height:calc(50% - 80px);flex-shrink:1;width:100%;border-radius:7px;background-color:white;box-shadow:0px 2px 3px rgb(201, 201, 201);">' +
        '<h1 style="font-family:Rubik;font-size:17px;font-weight:500;color:rgb(255, 179, 0);width:100%;padding:10px 10px;margin:0;box-sizing:border-box;">Rendez-vous en attente <span style="font-weight:bold;">(' + pending.length + ')</span></h1>' +
        agendaHeaderRow() +
        '<div style="width:100%;height:calc(100% - 69px);overflow-x:hidden;overflow-y:scroll;padding:10px 0;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:start;">' +
          pending.map(function (a, i) { return agendaRow(a, i, 'os-39', 'rgba(255, 179, 0, 0.075)', 'agdNext1', 'agdBack1', 'rgb(255, 179, 0)'); }).join('') +
          (pending.length === 0 ? '<h1 style="font-family:Rubik;text-align:center;font-size:17px;font-weight:500;color:rgb(150,150,150);width:100%;padding:10px 10px;margin:0;box-sizing:border-box;align-self:center;">Aucun rendez-vous en attente.</h1>' : '') +
        '</div>' +
      '</div>' +
      '<div style="margin-top:10px;width:100%;flex-grow:1;border-radius:7px;background-color:white;box-shadow:0px 2px 3px rgb(201, 201, 201);">' +
        '<h1 style="font-family:Rubik;font-size:17px;font-weight:500;color:rgb(23, 189, 244);width:100%;padding:10px 10px;margin:0;box-sizing:border-box;">Rendez-vous en cours <span style="font-weight:bold;">(' + treating.length + ')</span></h1>' +
        agendaHeaderRow() +
        '<div style="width:100%;padding:10px 0;display:flex;flex-direction:column;align-items:center;justify-content:start;">' +
          treating.map(function (a, i) { return agendaRow(a, i, 'os-41', 'rgba(23, 189, 244, 0.075)', 'agdNext2', 'agdBack2', 'rgb(23, 189, 244)'); }).join('') +
          (treating.length === 0 ? '<h1 style="font-family:Rubik;text-align:center;font-size:17px;font-weight:500;color:rgb(150,150,150);width:100%;padding:10px 10px;margin:0;box-sizing:border-box;align-self:center;">Aucun rendez-vous en cours.</h1>' : '') +
        '</div>' +
      '</div>' +
      '<div style="height:calc(50% - 80px);flex-shrink:1;margin-top:10px;width:100%;border-radius:7px;background-color:white;box-shadow:0px 2px 3px rgb(201, 201, 201);">' +
        '<h1 style="font-family:Rubik;font-size:17px;font-weight:500;color:#08E625;width:100%;padding:10px 10px;margin:0;box-sizing:border-box;">Rendez-vous terminés <span style="font-weight:bold;">(' + completed.length + ')</span></h1>' +
        agendaHeaderRow() +
        '<div style="width:100%;height:calc(100% - 69px);overflow-x:hidden;overflow-y:scroll;padding:10px 0;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:start;">' +
          completed.map(function (a, i) { return agendaRow(a, i, 'os-40', 'rgba(8, 230, 37, 0.075)', null, 'agdBack3', 'rgb(8, 230, 37)'); }).join('') +
          (completed.length === 0 ? '<h1 style="font-family:Rubik;text-align:center;font-size:17px;font-weight:500;color:rgb(150,150,150);width:100%;padding:10px 10px;margin:0;box-sizing:border-box;align-self:center;">Aucun rendez-vous terminé.</h1>' : '') +
        '</div>' +
      '</div>' +
    '</div>' + modal +
  '</div>';
}

/* ------------------------------ actions ---------------------------------- */
function findApp(id) { return APPOINTMENTS.filter(function (a) { return a.id === id; })[0]; }
var prevClick = window.__dmoClick;
window.__dmoClick = function (act, t, e) {
  var id = t.getAttribute('data-id');
  var a = id ? findApp(id) : null;
  switch (act) {
    /* --- Rendez-vous --- */
    case 'rdvReset':
      if (R.choosingDr) Q('#dmoDrDrop', { maxHeight: '200px' });
      if (R.choosingRoom) Q('#dmoRoomDrop', { maxHeight: '200px' });
      R.DrChosen = '--'; R.RoomChosen = '--'; R.dentalCareTypesSelected = []; R.patientFilter = ''; R.valDate = new Date(TODAY); R.choosingDr = false; R.choosingRoom = false; renderShell(); return;
    case 'rdvToggleBar':
      Q('#dmoRdvSide', { width: R.closeLeftBar ? '42px' : 'calc(25% - 10px)' });
      Q('#dmoRdvCover', { opacity: R.closeLeftBar ? '1' : '0' });
      Q('#dmoRdvArrow', { rotate: R.closeLeftBar ? '180deg' : '0deg' });
      R.closeLeftBar = !R.closeLeftBar; renderShell(); return;
    case 'rdvToday': R.valDate = new Date(TODAY); renderShell(); return;
    case 'rdvMonthView': case 'rdvEditDate': case 'rdvHour': case 'rdvInfo': case 'rdvEdit': case 'agdInfo': demoOnly(); return;
    case 'rdvChooseDr':
      if (!R.choosingDr) Q('#dmoDrDrop', { maxHeight: '0px' });
      if (R.choosingRoom) Q('#dmoRoomDrop', { maxHeight: '200px' });
      R.choosingDr = true; R.choosingRoom = false; renderShell(); return;
    case 'rdvChooseRoom':
      if (!R.choosingRoom) Q('#dmoRoomDrop', { maxHeight: '0px' });
      if (R.choosingDr) Q('#dmoDrDrop', { maxHeight: '200px' });
      R.choosingRoom = true; R.choosingDr = false; renderShell(); return;
    case 'rdvPickDr': Q('#dmoDrDrop', { maxHeight: '200px' }); R.DrChosen = t.getAttribute('data-v'); R.choosingDr = false; renderShell(); return;
    case 'rdvPickRoom': Q('#dmoRoomDrop', { maxHeight: '200px' }); R.RoomChosen = t.getAttribute('data-v'); R.choosingRoom = false; renderShell(); return;
    case 'rdvFilter': { var k = t.getAttribute('data-k'); R[k] = !R[k]; renderShell(); return; }
    case 'rdvSelectType': R.selectingType = true; renderShell(); return;
    case 'rdvCloseTypes': R.selectingType = false; renderShell(); return;
    case 'rdvAddType': {
      var dc = dentalCareTypes[parseInt(t.getAttribute('data-i'), 10)];
      if (R.dentalCareTypesSelected.indexOf(dc) < 0) R.dentalCareTypesSelected.push(dc);
      R.selectingType = false; renderShell(); return;
    }
    case 'rdvRemoveType': R.dentalCareTypesSelected.splice(parseInt(t.getAttribute('data-i'), 10), 1); renderShell(); return;
    case 'rdvPrev': R.valDate.setDate(R.valDate.getDate() - R.daysCount); renderShell(); return;
    case 'rdvNext': R.valDate.setDate(R.valDate.getDate() + R.daysCount); renderShell(); return;
    case 'rdvSlot': warn('La fenêtre « Nouveau rendez-vous » s’ouvre dans l’application complète.', 'rgb(0, 149, 212)'); return;
    case 'rdvDelete': warn('Suppression désactivée dans la démo.', 'rgb(255, 179, 0)'); return;
    case 'rdvPend': { var ap2 = t.closest('[data-app]'); a = findApp(ap2.getAttribute('data-app')); a.pending = true; a.treating = false; a.pended_at = U.getCurrentTime(); renderShell(); return; }
    case 'rdvTreat': { var ap3 = t.closest('[data-app]'); a = findApp(ap3.getAttribute('data-app')); a.pending = false; a.treating = true; a.treated_at = U.getCurrentTime(); renderShell(); return; }
    case 'rdvUnpend': { var ap4 = t.closest('[data-app]'); a = findApp(ap4.getAttribute('data-app')); a.pending = false; renderShell(); return; }
    /* --- Agenda --- */
    case 'agdExpand': G.appClicked = (G.appClicked === id) ? null : id; renderShell(); return;
    case 'agdNext0': a.pending = true; a.pended_at = U.getCurrentTime(); renderShell(); return;
    case 'agdBack1': a.pending = false; renderShell(); return;
    case 'agdNext1': a.pending = false; a.treating = true; a.treated_at = U.getCurrentTime(); renderShell(); return;
    case 'agdBack2': a.treating = false; a.pending = true; renderShell(); return;
    case 'agdNext2': a.treating = false; a.completed = true; a.completed_at = U.getCurrentTime(); G.appSelected = a; G.modalTypes = []; renderShell(); return;
    case 'agdBack3': a.completed = false; a.treating = true; renderShell(); return;
    case 'agdCloseModal': G.appSelected = null; G.selectingType = false; renderShell(); return;
    case 'agdSelectType': G.selectingType = true; renderShell(); return;
    case 'agdCloseTypes': G.selectingType = false; renderShell(); return;
    case 'agdAddType': { var dc2 = dentalCareTypes[parseInt(t.getAttribute('data-i'), 10)]; if (G.modalTypes.indexOf(dc2) < 0) G.modalTypes.push(dc2); G.selectingType = false; renderShell(); return; }
    case 'agdRemoveType': G.modalTypes.splice(parseInt(t.getAttribute('data-i'), 10), 1); renderShell(); return;
    case 'agdSend': {
      if (G.modalTypes.length === 0) { warn('Vous devez choisir un soin dentaire !', 'rgb(255, 0, 36)'); return; }
      G.appSelected = null; G.selectingType = false;
      warn('Rendez-vous envoyé aux rendez-vous à venir.', 'rgb(0, 149, 212)');
      renderShell(); return;
    }
  }
  if (prevClick) prevClick(act, t, e);
};

window.__dmoPanes[1] = renderRdv;
window.__dmoPanes[2] = renderAgenda;
})();
