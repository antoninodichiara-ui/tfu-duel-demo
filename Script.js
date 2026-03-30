// ── BENUTZER ──────────────────────────────────────────
var USERS = {
  'DICHIAN1': { pw: 'admin123', name: 'A. Di Chiara', role: 'admin', firstLogin: false },
  'MUSTERP1': { pw: 'novartis2', name: 'P. Muster', role: 'pruefer', firstLogin: false },
  'NEWUSER1': { pw: 'change123', name: 'Neuer User', role: 'operator', firstLogin: true }
};
// ─────────────────────────────────────────────────────
var currentUser = null;
var D = {};

function doLogin() {
  var uid = document.getElementById('login-uid').value.trim().toUpperCase();
  var pw = document.getElementById('login-pw').value;
  var err = document.getElementById('login-err');
  if (USERS[uid] && USERS[uid].pw === pw && USERS[uid].active !== false) {
    currentUser = { id: uid, name: USERS[uid].name, role: USERS[uid].role };
    if (USERS[uid].firstLogin) {
      document.getElementById('login-box-main').classList.add('hidden');
      document.getElementById('login-box-first').classList.remove('hidden');
      return;
    }
    completeLogin();
    err.style.display = 'none';
  } else {
    err.style.display = 'block';
  }
}

function doChangePw() {
  var p1 = document.getElementById('new-pw1').value;
  var p2 = document.getElementById('new-pw2').value;
  var err = document.getElementById('pw-err');
  if (!p1 || p1 !== p2) { err.style.display = 'block'; return; }
  USERS[currentUser.id].pw = p1;
  USERS[currentUser.id].firstLogin = false;
  err.style.display = 'none';
  completeLogin();
}

function completeLogin() {
  var loginScreen = document.getElementById('login-screen');
  var wrap = document.querySelector('.wrap');

  // Zoom-out Animation starten
  loginScreen.classList.add('zooming-out');

  setTimeout(function() {
    loginScreen.classList.add('hidden');
    loginScreen.classList.remove('zooming-out');

    // App einblenden
    if (wrap) {
      wrap.classList.add('appearing');
      setTimeout(function() {
        wrap.classList.remove('appearing');
        wrap.classList.add('visible');
      }, 1100);
    }

    var roleMap = {
      admin: '<span class="role-ad">ADMIN</span>',
      operator: '<span class="role-op">OPERATOR</span>',
      pruefer: '<span class="role-pr">PRÜFER</span>'
    };
    var badge = document.getElementById('user-badge');
    var adminBtn = currentUser.role === 'admin'
      ? '&nbsp;<button onclick="openAdmin()" style="background:none;border:none;color:#ff9f43;font-family:\'Space Mono\',monospace;font-size:0.65rem;cursor:pointer;">⚙ Admin</button>'
      : '';
    badge.innerHTML = '👤 ' + currentUser.id + '&nbsp;' + (roleMap[currentUser.role] || '')
      + adminBtn
      + '&nbsp;<button onclick="doLogout()" style="background:none;border:none;color:var(--muted);font-family:\'Space Mono\',monospace;font-size:0.65rem;cursor:pointer;">✕</button>';
    badge.classList.add('show');
    setTimeout(function() {
      badge.classList.add('expanded');
      setTimeout(function() { badge.classList.remove('expanded'); }, 2500);
    }, 400);
    initBadgeEvents();
    var step1 = document.getElementById('b-step1');
    if (step1) step1.classList.add('section-wrap-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    startSessionTimer();
  }, 550);
}

// ── SESSION TIMEOUT ────────────────────────────────────────────────────────
var sessionTimer = null;
var countdownTimer = null;
var TIMEOUT_MS = 9 * 60 * 1000;
var COUNTDOWN_S = 60;

var sessionListenersActive = false;

function startSessionTimer() {
  clearSessionTimers();
  sessionTimer = setTimeout(showTimeoutWarning, TIMEOUT_MS);
  if (!sessionListenersActive) {
    ['click','touchstart','keydown','input'].forEach(function(evt) {
      document.addEventListener(evt, resetSessionTimer, true);
    });
    sessionListenersActive = true;
  }
}

function resetSessionTimer() {
  if (!currentUser) return;
  clearSessionTimers();
  sessionTimer = setTimeout(showTimeoutWarning, TIMEOUT_MS);
}

function clearSessionTimers() {
  if (sessionTimer)   { clearTimeout(sessionTimer);   sessionTimer = null; }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

function showTimeoutWarning() {
  if (!currentUser) return;
  var remaining = COUNTDOWN_S;
  var dialog = document.getElementById('timeout-dialog');
  var countEl = document.getElementById('timeout-count');
  countEl.textContent = remaining;
  dialog.style.display = 'flex';
  countdownTimer = setInterval(function() {
    remaining--;
    countEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      hideTimeoutDialog();
      doLogout();
    }
  }, 1000);
}

function hideTimeoutDialog() {
  document.getElementById('timeout-dialog').style.display = 'none';
}

function stayLoggedIn() {
  hideTimeoutDialog();
  resetSessionTimer();
}

function stopSessionTimer() {
  clearSessionTimers();
  ['click','touchstart','keydown','input'].forEach(function(evt) {
    document.removeEventListener(evt, resetSessionTimer, true);
  });
  sessionListenersActive = false;
}

function doLogout() {
  stopSessionTimer();
  hideTimeoutDialog();
  currentUser = null;
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-box-main').classList.remove('hidden');
  document.getElementById('login-box-first').classList.add('hidden');
  document.getElementById('user-badge').classList.remove('show');
  document.getElementById('login-uid').value = '';
  document.getElementById('login-pw').value = '';
  document.getElementById('login-err').style.display = 'none';
  resetForLogout();
}

function openAdmin() {
  renderUserTable();
  document.getElementById('admin-panel').classList.add('show');
}

function closeAdmin() {
  document.getElementById('admin-panel').classList.remove('show');
  document.getElementById('admin-ok').style.display = 'none';
  document.getElementById('admin-err').style.display = 'none';
}

function renderUserTable() {
  var roleMap = {
    admin: '<span class="badge-role badge-admin">Admin</span>',
    operator: '<span class="badge-role badge-op">Operator</span>',
    pruefer: '<span class="badge-role badge-pr">Prüfer</span>'
  };
  var html = '<tr><th>User ID</th><th>Name</th><th>Rolle</th><th>Status</th><th>Aktionen</th></tr>';
  for (var uid in USERS) {
    var u = USERS[uid];
    var status = u.active === false
      ? '<span class="badge-role" style="background:rgba(255,107,107,0.1);color:var(--anti);">Inaktiv</span>'
      : u.firstLogin
        ? '<span class="badge-role badge-first">Erstes Login</span>'
        : '<span class="badge-role" style="background:rgba(0,255,157,0.1);color:var(--accent3);border:1px solid rgba(0,255,157,0.3);">Aktiv</span>';
    var actions = uid === currentUser.id
      ? '<span style="color:var(--muted);font-size:0.65rem;">(aktueller User)</span>'
      : '<button class="btn-warn" onclick="resetPw(\'' + uid + '\')">Reset PW</button>'
        + (u.active === false
          ? '<button class="btn-warn" onclick="toggleUser(\'' + uid + '\',true)">Aktivieren</button>'
          : '<button class="btn-danger" onclick="toggleUser(\'' + uid + '\',false)">Deaktivieren</button>');
    html += '<tr><td>' + uid + '</td><td>' + u.name + '</td><td>' + (roleMap[u.role] || u.role) + '</td><td>' + status + '</td><td>' + actions + '</td></tr>';
  }
  document.getElementById('user-table').innerHTML = html;
}

function addUser() {
  var uid = document.getElementById('new-uid').value.trim().toUpperCase();
  var name = document.getElementById('new-name').value.trim();
  var pw = document.getElementById('new-temp-pw').value.trim();
  var role = document.getElementById('new-role').value;
  var err = document.getElementById('admin-err');
  var ok = document.getElementById('admin-ok');
  if (!uid || !name || !pw) { err.style.display = 'block'; ok.style.display = 'none'; return; }
  if (USERS[uid]) { err.style.display = 'block'; err.textContent = '⚠ User ID already exists.'; ok.style.display = 'none'; return; }
  USERS[uid] = { pw: pw, name: name, role: role, firstLogin: true, active: true };
  err.style.display = 'none'; ok.style.display = 'block';
  document.getElementById('new-uid').value = '';
  document.getElementById('new-name').value = '';
  document.getElementById('new-temp-pw').value = '';
  renderUserTable();
}

function toggleUser(uid, active) {
  USERS[uid].active = active;
  renderUserTable();
}

function resetPw(uid) {
  USERS[uid].pw = 'change123';
  USERS[uid].firstLogin = true;
  showInfo('Password reset for ' + uid + '. Temp password: change123');
  renderUserTable();
}

function fmtN(v, d) {
  if (d === undefined) d = 3;
  var n = parseFloat(v);
  if (isNaN(n)) return '---';
  return n.toFixed(d).replace('.', ',');
}

function parseVal(id) {
  var v = document.getElementById(id).value.replace(',', '.');
  return parseFloat(v);
}

function showEl(id) {
  var groupMap = {
    'b-calc85': { group: 'b-group85', inner: 'b-calc85-inner' },
    'b-ein85':  { group: 'b-group85', inner: 'b-ein85-inner'  },
    'b-calc15': { group: 'b-group15', inner: 'b-calc15-inner' },
    'b-ein15':  { group: 'b-group15', inner: 'b-ein15-inner'  },
  };
  if (groupMap[id]) {
    var gid = groupMap[id].group;
    var iid = groupMap[id].inner;
    var grp = document.getElementById(gid);
    if (grp) grp.classList.remove('hidden');
    var inner = document.getElementById(iid);
    if (inner) inner.classList.remove('hidden');
    var wrap = grp ? grp.querySelector('.section-wrap') : null;
    if (wrap) {
      document.querySelectorAll('.section-wrap-active').forEach(function(w) { w.classList.remove('section-wrap-active'); });
      wrap.classList.add('section-wrap-active');
    }
    return;
  }

  var el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  var wrap = el.classList.contains('section-wrap') ? el : el.querySelector('.section-wrap');
  var card = el.querySelector('.card');
  var target = card || wrap;
  if (target) {
    target.classList.remove('card-animate');
    void target.offsetWidth;
    target.classList.add('card-animate');
  } else {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'card-appear 0.4s cubic-bezier(0.22,1,0.36,1) forwards';
  }
  var glowTarget = el.classList.contains('section-wrap') ? el : wrap;
  if (glowTarget) {
    document.querySelectorAll('.section-wrap-active').forEach(function(w) { w.classList.remove('section-wrap-active'); });
    glowTarget.classList.add('section-wrap-active');
  }
}
function hideEl(id) { var el = document.getElementById(id); if (el) el.classList.add('hidden'); }
function goTo(id) {
  var goMap = { 'b-calc85': 'b-group85', 'b-ein85': 'b-group85', 'b-calc15': 'b-group15', 'b-ein15': 'b-group15' };
  var targetId = goMap[id] || id;
  setTimeout(function() {
    var el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function makeRI(lbl, val, unit, cls) {
  if (!unit) unit = '';
  if (!cls) cls = '';
  return '<div class="ri ' + cls + '"><div class="rl">' + lbl + '</div><div class="rv">' + val + '<span class="u">' + unit + '</span></div></div>';
}

function stepDone(n) {
  var el = document.getElementById('si' + n);
  el.classList.remove('active');
  el.classList.add('done');
  if (n < 4) document.getElementById('si' + (n + 1)).classList.add('active');
  el.classList.add('just-done');
  setTimeout(function() { el.classList.remove('just-done'); }, 900);
  var done = document.querySelectorAll('.si.done').length;
  var bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = (done / 4 * 100) + '%';
}

function calcStep1() {
  var batch_produkt = document.getElementById('batch_produkt').value.trim();
  var batch_sense = document.getElementById('batch_sense').value.trim();
  var batch_antisense = document.getElementById('batch_antisense').value.trim();
  if (!batch_produkt || !batch_sense || !batch_antisense) {
    ['batch_produkt','batch_sense','batch_antisense'].forEach(function(id) {
      var el = document.getElementById(id);
      if (!el.value.trim()) el.style.borderColor = 'var(--anti)';
    });
    showInfo('Bitte alle Batch-Nummern eingeben (Pflichtfelder).');
    return;
  }
  ['batch_produkt','batch_sense','batch_antisense'].forEach(function(id) {
    document.getElementById(id).style.borderColor = '';
  });
  var A = parseVal('A');
  var G = parseVal('G');
  var MR1 = parseVal('MR1');
  if (isNaN(A) || isNaN(G) || isNaN(MR1)) { showInfo('Bitte alle Felder ausfüllen.'); return; }
  // Alle nachgelagerten Blöcke schliessen bevor neu berechnet wird
  ['b-group85','b-calc85-inner','b-ein85-inner','b-pak85','b-pak85nok',
   'b-rpak85-2','b-rpak85','b-rpak85-weiter','b-group15','b-calc15-inner',
   'b-ein15-inner','b-pak15','b-pak15nok','b-rpak15-2','b-rpak15','b-done',
   'b-pak85-seite2-print','b-ein15-print','pak85-nok','pak85-2-nok',
   'pak15-nok','pak15-2-nok','uberschuss85-result','uberschuss15-result'].forEach(hideEl);
  var kaEl = document.getElementById('ka-val'); if(kaEl) kaEl.textContent='---';
  var ka2El = document.getElementById('ka2-val'); if(ka2El) ka2El.textContent='---';
  // Step-Indicator zurücksetzen ab Schritt 2
  ['si2','si3','si4'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) { el.classList.remove('active','done'); }
  });
  document.getElementById('si2').classList.add('active');
  var MR2 = A / G, B = G * 0.85, F = A * 0.85, isSense = MR1 < MR2;
  // C = B × MR1 (Anti-Sense Sollmenge wenn SENSE limitierend)
  // H = B / MR1 (Sense Sollmenge wenn ANTI-SENSE limitierend)
  var C = isSense ? B * MR1 : null, H = !isSense ? B / MR1 : null;
  D = {
    A: A, G: G, MR1: MR1, MR2: MR2, B: B, F: F, C: C, H: H, isSense: isSense,
    ts_start: new Date(),
    user_t1: currentUser ? { id: currentUser.id, name: currentUser.name } : null,
    batch_produkt: document.getElementById('batch_produkt').value || '---',
    batch_sense: document.getElementById('batch_sense').value || '---',
    batch_antisense: document.getElementById('batch_antisense').value || '---'
  };
  document.getElementById('ac-kz85').innerHTML = '<div class="rg">' + makeRI('MR2', fmtN(MR2, 4)) + '</div>';
  var badge = isSense
    ? '<span class="badge bs">● Limitierender Strang: SENSE</span>'
    : '<span class="badge ba">● Limitierender Strang: ANTI-SENSE</span>';
  var html = '<div>' + badge + '</div><div class="rg">';
  if (isSense) {
    html += makeRI('C — Menge UF Anti-Sense', fmtN(C), ' kg', 'hl') + makeRI('B — Menge UF Sense', fmtN(B), ' kg', 'hlg');
  } else {
    html += makeRI('H — Menge UF Sense', fmtN(H), ' kg', 'hlg') + makeRI('F — Menge UF Anti-Sense', fmtN(F), ' kg', 'hl');
  }
  document.getElementById('r-calc85').innerHTML = html + '</div>';
  document.getElementById('lbl-o').textContent = isSense ? 'Ist Anti-Sense (= C) [kg]' : 'Ist Anti-Sense (= F) [kg]';
  document.getElementById('lbl-p').textContent = isSense ? 'Ist Sense (= B) [kg]' : 'Ist Sense (= H) [kg]';
  showEl('b-calc85'); showEl('b-ein85');
  if (!document.getElementById('si1').classList.contains('done')) stepDone(1);
  goTo('b-calc85');
}

function confirmOP() {
  var O = parseVal('O');
  var P = parseVal('P');
  if (isNaN(O) || isNaN(P)) { showInfo('Bitte O und P eingeben.'); return; }
  var diffAS = O - (D.isSense ? D.C : D.F);
  var diffS  = P - (D.isSense ? D.B : D.H);
  var TOLERANZ = 0.1;
  var verletzt = Math.abs(diffAS) > TOLERANZ || Math.abs(diffS) > TOLERANZ;
  if (verletzt) {
    var msg = '';
    if (Math.abs(diffAS) > TOLERANZ) msg += 'Anti-Sense (O): ' + (diffAS >= 0 ? '+' : '') + fmtN(diffAS) + ' kg\n';
    if (Math.abs(diffS)  > TOLERANZ) msg += 'Sense (P): '      + (diffS  >= 0 ? '+' : '') + fmtN(diffS)  + ' kg\n';
    showTolDialog(msg, function() { confirmOPexec(O, P, diffAS, diffS); }, 'Einwaage 85%');
    return;
  }
  confirmOPexec(O, P, diffAS, diffS);
}

function confirmOPexec(O, P, diffAS, diffS) {
  D.O = O; D.P = P;
  D.ts_ein85 = new Date();
  D.user_t2 = currentUser ? { id: currentUser.id, name: currentUser.name } : null;
  var TOLERANZ = 0.1;
  var diffColorAS = Math.abs(diffAS) <= TOLERANZ ? 'var(--accent3)' : 'var(--anti)';
  var diffColorS  = Math.abs(diffS)  <= TOLERANZ ? 'var(--accent3)' : 'var(--anti)';
  var tolBadgeAS  = Math.abs(diffAS) <= TOLERANZ
    ? '<span style="font-size:0.6rem;color:var(--accent3);margin-left:4px;">✓ i.T.</span>'
    : '<span style="font-size:0.6rem;color:var(--anti);margin-left:4px;">✗ Toleranz überschritten</span>';
  var tolBadgeS   = Math.abs(diffS)  <= TOLERANZ
    ? '<span style="font-size:0.6rem;color:var(--accent3);margin-left:4px;">✓ i.T.</span>'
    : '<span style="font-size:0.6rem;color:var(--anti);margin-left:4px;">✗ Toleranz überschritten</span>';
  var kzContent = '<div class="rg">'
    + makeRI('MR2', fmtN(D.MR2, 4))
    + '<div class="ri' + (Math.abs(diffAS) > TOLERANZ ? ' ri-warn' : '') + '"><div class="rl">Differenz Soll/Ist Anti-Sense 85%</div><div class="rv" style="color:' + diffColorAS + '">' + (diffAS >= 0 ? '+' : '') + fmtN(diffAS) + '<span class="u"> kg</span>' + tolBadgeAS + '</div></div>'
    + '<div class="ri' + (Math.abs(diffS)  > TOLERANZ ? ' ri-warn' : '') + '"><div class="rl">Differenz Soll/Ist Sense 85%</div><div class="rv" style="color:' + diffColorS + '">' + (diffS >= 0 ? '+' : '') + fmtN(diffS) + '<span class="u"> kg</span>' + tolBadgeS + '</div></div>'
    + '</div>';
  document.getElementById('ac-kz85').innerHTML = kzContent;
  showEl('b-pak85');
  var p2btn = document.getElementById('b-pak85-seite2-print');
  if (p2btn) p2btn.classList.remove('hidden');
  goTo('b-pak85');
}

function updateKA() {
  var E = parseVal('E');
  var Dv = parseVal('D');
  var el = document.getElementById('ka-val');
  if (el) el.textContent = (!isNaN(E) && !isNaN(Dv)) ? fmtN((1 + 2 * E / 100) / (1 + 2 * Dv / 100), 4) : '---';
}

function updateKA2() {
  var E2 = parseVal('E2');
  var D2 = parseVal('D2');
  var el = document.getElementById('ka2-val');
  if (el) el.textContent = (!isNaN(E2) && !isNaN(D2)) ? fmtN((1 + 2 * E2 / 100) / (1 + 2 * D2 / 100), 4) : '---';
}

function pak85(ok, btn) {
  D.pak85 = ok ? 'i.O.' : 'n.i.O.';
  // Alle nachgelagerten Blöcke immer schliessen
  ['b-pak85nok','b-rpak85-2','pak85-2-nok','b-rpak85-weiter',
   'b-group15','b-calc15-inner','b-ein15-inner',
   'b-pak15','pak15-nok','b-pak15nok','b-rpak15-2','b-rpak15','b-done'].forEach(hideEl);
  if (ok) {
    D.ts_pak85 = new Date();
    D.user_t3 = currentUser ? { id: currentUser.id, name: currentUser.name } : null;
    hideEl('pak85-nok');
    // n.i.O. Felder leeren
    ['E_nok','D_nok','Z_ist','E2','D2'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    var badge = document.getElementById('uberschuss85-badge'); if(badge) badge.style.display='none';
    var res85 = document.getElementById('uberschuss85-result'); if(res85) res85.classList.add('hidden');
    if (btn) { btn.classList.add('pak-pulse'); setTimeout(function(){ btn.classList.remove('pak-pulse'); }, 1500); }
    showEl('b-rpak85');
    goTo('b-rpak85');
  } else {
    hideEl('b-rpak85');
    // i.O. Felder leeren
    ['E','D'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    var kaEl = document.getElementById('ka-val'); if(kaEl) kaEl.textContent='---';
    var res85 = document.getElementById('uberschuss85-result'); if(res85) res85.classList.add('hidden');
    // Interne Hilfswerte löschen
    delete D._enok_for_calc; delete D._dnok_for_calc;
    if (btn) { btn.classList.add('pak-pulse-red'); setTimeout(function(){ btn.classList.remove('pak-pulse-red'); }, 1500); }
    showEl('pak85-nok');
  }
}

function confirmEDnok85() {
  var E = parseVal('E_nok');
  var Dv = parseVal('D_nok');
  if (isNaN(E) || isNaN(Dv)) { showInfo('Bitte E und D eingeben.'); return; }
  var span = document.getElementById('uberschuss85-span');
  var antiBtn = document.getElementById('btn-pak85nok-anti');
  var senseBtn = document.getElementById('btn-pak85nok-sense');
  antiBtn.removeAttribute('style'); senseBtn.removeAttribute('style');
  var bsStyle = 'display:inline-flex;align-items:center;gap:0.4rem;background:linear-gradient(135deg,#003d1a,#006630);border:2px solid #00ff9d;color:#00ff9d;box-shadow:0 0 16px rgba(0,255,157,0.4);font-family:Space Mono,monospace;font-weight:700;font-size:0.78rem;padding:0.45rem 1.1rem;border-radius:20px;';
  var baStyle = 'display:inline-flex;align-items:center;gap:0.4rem;background:linear-gradient(135deg,#3d0000,#660000);border:2px solid #ff6b6b;color:#ff6b6b;box-shadow:0 0 16px rgba(255,107,107,0.4);font-family:Space Mono,monospace;font-weight:700;font-size:0.78rem;padding:0.45rem 1.1rem;border-radius:20px;';
  var ylStyle = 'display:inline-flex;align-items:center;gap:0.4rem;background:rgba(255,214,0,0.15);border:2px solid #ffd600;color:#ffd600;font-family:Space Mono,monospace;font-weight:700;font-size:0.78rem;padding:0.45rem 1.1rem;border-radius:20px;';
  if (E > Dv) {
    span.setAttribute('style', bsStyle);
    span.innerHTML = '● SENSE Überschuss';
    senseBtn.className = 'btn bok'; senseBtn.style.cssText = 'flex:1;min-height:52px;';
    antiBtn.className = 'btn'; antiBtn.style.cssText = 'flex:1;min-height:52px;background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);opacity:0.5;';
  } else if (Dv > E) {
    span.setAttribute('style', baStyle);
    span.innerHTML = '● ANTI-SENSE Überschuss';
    antiBtn.className = 'btn bnok'; antiBtn.style.cssText = 'flex:1;min-height:52px;';
    senseBtn.className = 'btn'; senseBtn.style.cssText = 'flex:1;min-height:52px;background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);opacity:0.5;';
  } else {
    span.setAttribute('style', ylStyle);
    span.innerHTML = '● Ausgeglichen (E = D)';
    antiBtn.className = 'btn bnok'; antiBtn.style.cssText = 'flex:1;min-height:52px;';
    senseBtn.className = 'btn bok'; senseBtn.style.cssText = 'flex:1;min-height:52px;';
  }
  document.getElementById('uberschuss85-result').classList.remove('hidden');
}

function confirmUVnok15() {
  var U = parseVal('U_nok');
  var V = parseVal('V_nok');
  if (isNaN(U) || isNaN(V)) { showInfo('Bitte U und V eingeben.'); return; }
  var span = document.getElementById('uberschuss15-span');
  var antiBtn = document.getElementById('btn-pak15nok-anti');
  var senseBtn = document.getElementById('btn-pak15nok-sense');
  antiBtn.removeAttribute('style'); senseBtn.removeAttribute('style');
  var bsStyle = 'display:inline-flex;align-items:center;gap:0.4rem;background:linear-gradient(135deg,#003d1a,#006630);border:2px solid #00ff9d;color:#00ff9d;box-shadow:0 0 16px rgba(0,255,157,0.4);font-family:Space Mono,monospace;font-weight:700;font-size:0.78rem;padding:0.45rem 1.1rem;border-radius:20px;';
  var baStyle = 'display:inline-flex;align-items:center;gap:0.4rem;background:linear-gradient(135deg,#3d0000,#660000);border:2px solid #ff6b6b;color:#ff6b6b;box-shadow:0 0 16px rgba(255,107,107,0.4);font-family:Space Mono,monospace;font-weight:700;font-size:0.78rem;padding:0.45rem 1.1rem;border-radius:20px;';
  var ylStyle = 'display:inline-flex;align-items:center;gap:0.4rem;background:rgba(255,214,0,0.15);border:2px solid #ffd600;color:#ffd600;font-family:Space Mono,monospace;font-weight:700;font-size:0.78rem;padding:0.45rem 1.1rem;border-radius:20px;';
  if (U > V) {
    span.setAttribute('style', bsStyle);
    span.innerHTML = '● SENSE Überschuss';
    senseBtn.className = 'btn bok'; senseBtn.style.cssText = 'flex:1;min-height:52px;';
    antiBtn.className = 'btn'; antiBtn.style.cssText = 'flex:1;min-height:52px;background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);opacity:0.5;';
  } else if (V > U) {
    span.setAttribute('style', baStyle);
    span.innerHTML = '● ANTI-SENSE Überschuss';
    antiBtn.className = 'btn bnok'; antiBtn.style.cssText = 'flex:1;min-height:52px;';
    senseBtn.className = 'btn'; senseBtn.style.cssText = 'flex:1;min-height:52px;background:rgba(255,255,255,0.04);color:var(--muted);border:1px solid var(--border);opacity:0.5;';
  } else {
    span.setAttribute('style', ylStyle);
    span.innerHTML = '● Ausgeglichen (U = V)';
    antiBtn.className = 'btn bnok'; antiBtn.style.cssText = 'flex:1;min-height:52px;';
    senseBtn.className = 'btn bok'; senseBtn.style.cssText = 'flex:1;min-height:52px;';
  }
  document.getElementById('uberschuss15-result').classList.remove('hidden');
}

function pak85nok(uberschuss) {
  D.pak85_uberschuss = uberschuss;
    var E = parseVal('E_nok');   // J = Sense [%]
  var Dv = parseVal('D_nok');  // I = Anti-Sense [%]
  var O = parseVal('O');       // AS503 = Anti-Sense [kg]
  var P = parseVal('P');       // AS508 = Sense [kg]

  if (isNaN(E) || isNaN(Dv)) {
    showInfo('Bitte E und D eingeben.');
    return;
  }

  if (isNaN(O) || isNaN(P)) {
    showInfo('Bitte zuerst O und P eingeben.');
    return;
  }

  var diffWert, zugabeWert, zugabeLabel, diffLabel, basisLabel;

  if (uberschuss === 'anti') {
    diffWert = Dv - E;
    if (diffWert < 0) diffWert = 0;

    zugabeWert = 2 * diffWert * P / 100;

    diffLabel = 'Wert X – Differenz ANTI-SENSE minus SENSE';
    zugabeLabel = 'Wert K – Zugabe SENSE';
    basisLabel = 'Menge aus AS508 (SENSE)';
    D.pak85nok_label = 'Wert K (Zugabe SENSE)';
  } else {
    diffWert = E - Dv;
    if (diffWert < 0) diffWert = 0;

    zugabeWert = 2 * diffWert * O / 100;

    diffLabel = 'Wert Y – Differenz SENSE minus ANTI-SENSE';
    zugabeLabel = 'Wert Z – Zugabe ANTI-SENSE';
    basisLabel = 'Menge aus AS503 (ANTI-SENSE)';
    D.pak85nok_label = 'Wert Z (Zugabe ANTI-SENSE)';
  }

  D.pak85nok_diff = diffWert;
  D.pak85nok_basis = (uberschuss === 'anti') ? P : O;
  D.pak85nok_basis_label = basisLabel;
  D.pak85nok_wert = zugabeWert;

  var zugabeColor85 = uberschuss === 'anti'
  ? 'hlg pulse-green'
  : 'hl pulse-red';
    var html = '<div style="margin-bottom:0.8rem;">'
    + '<span class="badge ' + (uberschuss === 'anti' ? 'ba' : 'bs') + '">● '
    + (uberschuss === 'anti' ? 'ANTI-SENSE Überschuss' : 'SENSE Überschuss')
    + '</span></div>'
    + '<div class="rg">'
    + makeRI(diffLabel, fmtN(diffWert, 3), ' %', 'ri')
    + makeRI(basisLabel, fmtN(D.pak85nok_basis, 3), ' kg', 'ri')
    + makeRI(zugabeLabel, fmtN(zugabeWert, 3), ' kg', zugabeColor85)
    + '</div>';
  document.getElementById('r-pak85nok').innerHTML = html;
    document.getElementById('lbl-zist').textContent =
    uberschuss === 'anti'
      ? 'Ist-Menge Zugabe SENSE [kg]'
      : 'Ist-Menge Zugabe ANTI-SENSE [kg]';

  var zField = document.getElementById('Z_ist');
zField.className = uberschuss === 'anti' ? 'input-sense' : 'input-anti';
zField.classList.remove('pulse-red', 'pulse-green');

showEl('b-pak85nok');
goTo('b-pak85nok');
}

function confirmZugabe() {
  var Zist = parseVal('Z_ist');
  if (isNaN(Zist)) { showInfo('Bitte Ist-Menge Zugabe eingeben.'); return; }
  var soll = D.pak85nok_wert || 0;
  var diff = Zist - soll;
  var TOLERANZ = 0.1;
  if (Math.abs(diff) > TOLERANZ) {
    var msg = 'Zugabe ' + (D.pak85nok_label || 'Z/K') + ':\n'
      + 'Soll: ' + fmtN(soll) + ' kg\n'
      + 'Ist: ' + fmtN(Zist) + ' kg\n'
      + 'Differenz: ' + (diff >= 0 ? '+' : '') + fmtN(diff) + ' kg';
    showTolDialog(msg, function() { confirmZugabeExec(Zist); }, 'Korrektur PAK85 n.i.O.');
    return;
  }
  confirmZugabeExec(Zist);
}
function confirmZugabeExec(Zist) {
  D.Z_ist = Zist;
  // E/D intern speichern (NICHT in UI-Felder kopieren — GMP: User muss selbst eingeben)
  var E = parseVal('E_nok');
  var Dv = parseVal('D_nok');
  if (!isNaN(E) && !isNaN(Dv)) {
    D._enok_for_calc = E;
    D._dnok_for_calc = Dv;
  }
  showEl('b-rpak85-2');
  goTo('b-rpak85-2');
}

function pak85v2(ok) {
  D.pak85_2 = ok ? 'i.O.' : 'n.i.O.';
  // Alle nachgelagerten Blöcke immer schliessen
  ['b-group15','b-calc15-inner','b-ein15-inner',
   'b-pak15','pak15-nok','b-pak15nok','b-rpak15-2','b-rpak15','b-done'].forEach(hideEl);
  if (ok) {
    hideEl('pak85-2-nok');
    hideEl('b-rpak85');
    // E_nok/D_nok/Z_ist leeren da nicht mehr benötigt
    ['E_nok','D_nok','Z_ist'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    var res85 = document.getElementById('uberschuss85-result'); if(res85) res85.classList.add('hidden');
    // E2/D2 intern speichern für calcStep2 (NICHT in UI-Felder kopieren — GMP)
    var E2 = parseVal('E2');
    var D2 = parseVal('D2');
    if (!isNaN(E2) && !isNaN(D2)) {
      D._enok_for_calc = E2;
      D._dnok_for_calc = D2;
    }
    showEl('b-rpak85-weiter');
    goTo('b-rpak85-weiter');
  } else {
    hideEl('b-rpak85-weiter');
    // E/D leeren beim Wechsel zu n.i.O.
    ['E','D'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    var kaEl = document.getElementById('ka-val'); if(kaEl) kaEl.textContent='---';
    showEl('pak85-2-nok');
  }
}

function calcStep2() {
  var O = parseVal('O');
  var P = parseVal('P');
  // n.i.O.-Weg: intern gespeicherte Werte verwenden (nie aus UI-Feldern)
  // i.O.-Weg: aus UI-Feldern lesen
  var E, Dv;
  if (D._enok_for_calc !== undefined && !isNaN(D._enok_for_calc)) {
    E = D._enok_for_calc;
    Dv = D._dnok_for_calc;
  } else {
    E = parseVal('E');
    Dv = parseVal('D');
  }
  if (isNaN(O) || isNaN(P) || isNaN(E) || isNaN(Dv)) { showInfo('Bitte alle Felder ausfüllen.'); return; }
  var KA = (1 + 2 * E / 100) / (1 + 2 * Dv / 100);
  var MR3 = (O / P) * KA;
  // Zugabe aus PAK85 n.i.O. von entsprechender Restmenge abziehen (gleiches Gebinde)
  // A = UF Anti-Sense, G = UF Sense, O = Ist Anti-Sense 85%, P = Ist Sense 85%
  // Q = A − O − 1,0 = Anti-Sense Rest | R = G − P − 1,0 = Sense Rest
  // SENSE Überschuss → Zugabe ANTI-SENSE → aus Gebinde A → Q reduzieren
  // ANTI-SENSE Überschuss → Zugabe SENSE → aus Gebinde G → R reduzieren
  var zKorr = (D.Z_ist !== undefined && !isNaN(D.Z_ist)) ? parseFloat(D.Z_ist) : 0;
  var Q, R;
  if (D.pak85_uberschuss === 'sense') {
    Q = D.A - O - 1.0 - zKorr;
    R = D.G - P - 1.0;
  } else if (D.pak85_uberschuss === 'anti') {
    Q = D.A - O - 1.0;
    R = D.G - P - 1.0 - zKorr;
  } else {
    Q = D.A - O - 1.0;
    R = D.G - P - 1.0;
  }
  var MR4 = Q / R;
  var isSense2 = MR3 < MR4, S = isSense2 ? R * MR3 : null, T = !isSense2 ? Q / MR3 : null;
  D.O = O; D.P = P; D.E = E; D.Dv = Dv; D.KA = KA; D.MR3 = MR3;
  D.Q = Q; D.R = R; D.MR4 = MR4; D.isSense2 = isSense2; D.S = S; D.T = T;
  // Hilfswerte aufräumen
  delete D._enok_for_calc; delete D._dnok_for_calc;
  document.getElementById('ac-inp').innerHTML = '<div class="rg">'
    + makeRI('A (Anti-Sense)', fmtN(D.A), ' kg') + makeRI('G (Sense)', fmtN(D.G), ' kg')
    + makeRI('O', fmtN(O), ' kg') + makeRI('P', fmtN(P), ' kg')
    + makeRI('E', fmtN(E), ' %') + makeRI('D', fmtN(Dv), ' %')
    + '</div>';
  document.getElementById('ac-kz15').innerHTML = '<div class="rg">'
    + makeRI('MR2', fmtN(D.MR2, 4)) + makeRI('KA', fmtN(KA, 4))
    + makeRI('MR3', fmtN(MR3, 4)) + makeRI('MR4', fmtN(MR4, 4))
    + '</div>';
  var badge2 = isSense2
    ? '<span class="badge bs">● Limitierender Strang: SENSE</span>'
    : '<span class="badge ba">● Limitierender Strang: ANTI-SENSE</span>';
  var r15 = '<div>' + badge2 + '</div><div class="rg">';
  if (isSense2) {
    r15 += makeRI('S — Zugabe Anti-Sense', fmtN(S), ' kg', 'hl') + makeRI('R — Restmenge Sense', fmtN(R), ' kg', 'hlg');
  } else {
    r15 += makeRI('Q — Zugabe Anti-Sense', fmtN(Q), ' kg', 'hl') + makeRI('T — Zugabe Sense', fmtN(T), ' kg', 'hlg');
  }
  document.getElementById('r-calc15').innerHTML = r15 + '</div>';
  showEl('b-calc15'); showEl('b-ein15');
  if (!document.getElementById('si2').classList.contains('done')) stepDone(2);
  goTo('b-calc15');
}

function confirmSR() {
  var S = parseVal('S_ist');
  var R = parseVal('R_ist');
  if (isNaN(S) || isNaN(R)) { showInfo('Bitte Werte eingeben.'); return; }
  var diff15AS = S - (D.isSense2 ? D.S : D.Q);
  var diff15S  = R - (D.isSense2 ? D.R : D.T);
  var TOLERANZ = 0.1;
  var verletzt = Math.abs(diff15AS) > TOLERANZ || Math.abs(diff15S) > TOLERANZ;
  if (verletzt) {
    var msg = '';
    if (Math.abs(diff15AS) > TOLERANZ) msg += 'Anti-Sense (S_ist): ' + (diff15AS >= 0 ? '+' : '') + fmtN(diff15AS) + ' kg\n';
    if (Math.abs(diff15S)  > TOLERANZ) msg += 'Sense (R_ist): '      + (diff15S  >= 0 ? '+' : '') + fmtN(diff15S)  + ' kg\n';
    showTolDialog(msg, function() { confirmSRexec(S, R, diff15AS, diff15S); }, 'Einwaage 15%');
    return;
  }
  confirmSRexec(S, R, diff15AS, diff15S);
}

function confirmSRexec(S, R, diff15AS, diff15S) {
  D.S_ist = S; D.R_ist = R;
  var TOLERANZ = 0.1;
  var diffC15AS = Math.abs(diff15AS) <= TOLERANZ ? 'var(--accent3)' : 'var(--anti)';
  var diffC15S  = Math.abs(diff15S)  <= TOLERANZ ? 'var(--accent3)' : 'var(--anti)';
  var tolBadge15AS = Math.abs(diff15AS) <= TOLERANZ
    ? '<span style="font-size:0.6rem;color:var(--accent3);margin-left:4px;">✓ i.T.</span>'
    : '<span style="font-size:0.6rem;color:var(--anti);margin-left:4px;">✗ Toleranz überschritten</span>';
  var tolBadge15S  = Math.abs(diff15S)  <= TOLERANZ
    ? '<span style="font-size:0.6rem;color:var(--accent3);margin-left:4px;">✓ i.T.</span>'
    : '<span style="font-size:0.6rem;color:var(--anti);margin-left:4px;">✗ Toleranz überschritten</span>';
  document.getElementById('ac-kz15').innerHTML = '<div class="rg">'
    + makeRI('MR2', fmtN(D.MR2, 4)) + makeRI('MR3', fmtN(D.MR3, 4))
    + makeRI('Q', fmtN(D.Q), ' kg') + makeRI('R', fmtN(D.R), ' kg')
    + makeRI('MR4', fmtN(D.MR4, 4))
    + '<div class="ri' + (Math.abs(diff15AS) > TOLERANZ ? ' ri-warn' : '') + '"><div class="rl">Differenz Soll/Ist Anti-Sense 15%</div><div class="rv" style="color:' + diffC15AS + '">' + (diff15AS >= 0 ? '+' : '') + fmtN(diff15AS) + '<span class="u"> kg</span>' + tolBadge15AS + '</div></div>'
    + '<div class="ri' + (Math.abs(diff15S)  > TOLERANZ ? ' ri-warn' : '') + '"><div class="rl">Differenz Soll/Ist Sense 15%</div><div class="rv" style="color:' + diffC15S + '">' + (diff15S >= 0 ? '+' : '') + fmtN(diff15S) + '<span class="u"> kg</span>' + tolBadge15S + '</div></div>'
    + '</div>';
  showEl('b-pak15');
  var p3btn = document.getElementById('b-ein15-print');
  if (p3btn) p3btn.classList.remove('hidden');
  goTo('b-pak15');
}

function pak15(ok, btn) {
  D.pak15 = ok ? 'i.O.' : 'n.i.O.';
  // Alle nachgelagerten Blöcke immer schliessen
  ['b-pak15nok','b-rpak15-2','b-rpak15','b-done'].forEach(hideEl);
  if (ok) {
    hideEl('pak15-nok');
    // n.i.O. Felder leeren
    ['U_nok','V_nok','W15_ist','U2','V2'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    var badge = document.getElementById('uberschuss15-badge'); if(badge) badge.style.display='none';
    var res15 = document.getElementById('uberschuss15-result'); if(res15) res15.classList.add('hidden');
    if (btn) { btn.classList.add('pak-pulse'); setTimeout(function(){ btn.classList.remove('pak-pulse'); }, 1500); }
    showEl('b-rpak15');
    goTo('b-rpak15');
  } else {
    hideEl('b-rpak15');
    // i.O. Felder leeren
    ['U_io','V_io'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    var res15 = document.getElementById('uberschuss15-result'); if(res15) res15.classList.add('hidden');
    if (btn) { btn.classList.add('pak-pulse-red'); setTimeout(function(){ btn.classList.remove('pak-pulse-red'); }, 1500); }
    showEl('pak15-nok');
  }
}

function pak15nok(uberschuss) {
  D.pak15_uberschuss = uberschuss;

  var U = parseVal('U_nok');      // Sense [%]
  var V = parseVal('V_nok');      // Anti-Sense [%]
  var S_ist = parseVal('S_ist');  // Anti-Sense [kg]
  var R_ist = parseVal('R_ist');  // Sense [kg]

  if (isNaN(U) || isNaN(V)) {
    showInfo('Bitte U und V eingeben.');
    return;
  }

  if (isNaN(S_ist) || isNaN(R_ist)) {
    showInfo('Bitte zuerst S_ist und R_ist eingeben.');
    return;
  }

  D.pak15_U = U;
  D.pak15_V = V;

  var diffWert, zugabeWert, zugabeLabel, diffLabel, basisLabel, basisMenge;

  if (uberschuss === 'anti') {
    diffWert = V - U;
    if (diffWert < 0) diffWert = 0;

    basisMenge = R_ist;
    zugabeWert = 2 * diffWert * basisMenge / 100;

    diffLabel = 'Wert AF – Differenz ANTI-SENSE minus SENSE';
    zugabeLabel = 'Wert W – Zugabe SENSE';
    basisLabel = 'Menge aus AS508 (SENSE)';

    D.pak15nok_label = 'Wert W (Zugabe SENSE)';
  } else {
    diffWert = U - V;
    if (diffWert < 0) diffWert = 0;

    basisMenge = S_ist;
    zugabeWert = 2 * diffWert * basisMenge / 100;

    diffLabel = 'Wert AG – Differenz SENSE minus ANTI-SENSE';
    zugabeLabel = 'Wert AH – Zugabe ANTI-SENSE';
    basisLabel = 'Menge aus AS503 (ANTI-SENSE)';

    D.pak15nok_label = 'Wert AH (Zugabe ANTI-SENSE)';
  }

  D.pak15nok_diff = diffWert;
  D.pak15nok_basis = basisMenge;
  D.pak15nok_basis_label = basisLabel;
  D.pak15nok_wert = zugabeWert;

  var zugabeColor15 = uberschuss === 'anti'
  ? 'hlg pulse-green'
  : 'hl pulse-red';

  var html = '<div style="margin-bottom:0.8rem;">'
    + '<span class="badge ' + (uberschuss === 'anti' ? 'ba' : 'bs') + '">● '
    + (uberschuss === 'anti' ? 'ANTI-SENSE Überschuss' : 'SENSE Überschuss')
    + '</span></div>'
    + '<div class="rg">'
    + makeRI(diffLabel, fmtN(diffWert, 3), ' %', 'ri')
    + makeRI(basisLabel, fmtN(basisMenge, 3), ' kg', 'ri')
    + makeRI(zugabeLabel, fmtN(zugabeWert, 3), ' kg', zugabeColor15)
    + '</div>';

  document.getElementById('r-pak15nok').innerHTML = html;
document.getElementById('lbl-w15ist').textContent =
    uberschuss === 'anti'
      ? 'Ist-Menge Zugabe SENSE [kg]'
      : 'Ist-Menge Zugabe ANTI-SENSE [kg]';

  var wField = document.getElementById('W15_ist');
wField.className = uberschuss === 'anti' ? 'input-sense' : 'input-anti';
wField.classList.remove('pulse-red', 'pulse-green');

  showEl('b-pak15nok');
  goTo('b-pak15nok');
}

function confirmZugabe15() {
  var Wist = parseVal('W15_ist');
  if (isNaN(Wist)) { showInfo('Bitte Ist-Menge Zugabe eingeben.'); return; }
  var soll = D.pak15nok_wert || 0;
  var diff = Wist - soll;
  var TOLERANZ = 0.1;
  if (Math.abs(diff) > TOLERANZ) {
    var msg = 'Zugabe ' + (D.pak15nok_label || 'W') + ':\n'
      + 'Soll: ' + fmtN(soll) + ' kg\n'
      + 'Ist: ' + fmtN(Wist) + ' kg\n'
      + 'Differenz: ' + (diff >= 0 ? '+' : '') + fmtN(diff) + ' kg';
    showTolDialog(msg, function() { confirmZugabe15Exec(Wist); }, 'Korrektur PAK15 n.i.O.');
    return;
  }
  confirmZugabe15Exec(Wist);
}
function confirmZugabe15Exec(Wist) {
  D.W15_ist = Wist;
  showEl('b-rpak15-2');
  goTo('b-rpak15-2');
}

function confirmPak15Resultat() {
  var U = parseVal('U_io');
  var V = parseVal('V_io');
  if (isNaN(U) || isNaN(V)) { showInfo('Bitte U und V eingeben.'); return; }
  D.pak15_U_io = U;
  D.pak15_V_io = V;
  D.ts_end = new Date();
  D.ts_pak15 = new Date();
  D.user_t4 = currentUser ? { id: currentUser.id, name: currentUser.name } : null;
  showEl('b-done');
  if (!document.getElementById('si3').classList.contains('done')) stepDone(3);
  if (!document.getElementById('si4').classList.contains('done')) stepDone(4);
  goTo('b-done');
renderDynamicPrintButtons();
}

function pak15v2(ok) {
  D.pak15_2 = ok ? 'i.O.' : 'n.i.O.';
  D.pak15_U2 = parseVal('U2') || null;
  D.pak15_V2 = parseVal('V2') || null;
  // Nachgelagerte Blöcke immer schliessen
  hideEl('b-done');
  if (ok) {
    hideEl('pak15-2-nok');
    hideEl('b-rpak15');
    // PAK15-2 i.O. = Annealing abgeschlossen — direkt zum Abschluss
    D.ts_end = new Date();
    D.ts_pak15 = new Date();
    D.user_t4 = currentUser ? { id: currentUser.id, name: currentUser.name } : null;
    // U/V aus U2/V2 übernehmen für den Bericht
    D.pak15_U_io = D.pak15_U2;
    D.pak15_V_io = D.pak15_V2;
    showEl('b-done');
    if (!document.getElementById('si3').classList.contains('done')) stepDone(3);
    if (!document.getElementById('si4').classList.contains('done')) stepDone(4);
    renderDynamicPrintButtons();
    goTo('b-done');
  } else {
    hideEl('b-rpak15');
    showEl('pak15-2-nok');
  }
}

function fmtTS(ts) {
  return ts ? new Date(ts).toLocaleString('de-DE') : '---';
}

function fmtUser(u) {
  return u ? u.id : '---';
}
function safeTxt(v) {
  if (v === null || v === undefined) return '---';
  return String(v);
}

function sigBlock(label, user) {
  var u = user || {};
  return '<table><tr><th>Funktion</th><th>User ID</th><th>Zeitstempel</th><th>Visum / Unterschrift</th></tr>'
    + '<tr><td>' + label + '</td><td>' + (u.id || '&nbsp;') + '</td>'
    + '<td style="min-width:90px">&nbsp;</td><td><div class="sig-line"></div></td></tr>'
    + '<tr><td>Prüfer</td><td>&nbsp;</td><td>&nbsp;</td><td><div class="sig-line"></div></td></tr>'
    + '</table>';
}

function pageHeader(seite, titel) {
  var d = D;
  return '<div class="rh">'
    + '<div><div class="rt">Oligo Annealing Calculator</div>'
    + '<div class="rs" style="font-size:11pt;font-weight:bold;">' + titel + '</div></div>'
    + '<div class="rm">'
    + '<div><b>Batch Produkt:</b> ' + (d.batch_produkt || '___') + '</div>'
    + '<div><b>UF Sense:</b> ' + (d.batch_sense || '___') + '</div>'
    + '<div><b>UF Anti-Sense:</b> ' + (d.batch_antisense || '___') + '</div>'
    + '</div></div>';
}

function buildReport1() {
  var d = D;
  return pageHeader('', 'Eduktvorbereitung')
    + '<h2>1. Batch-Nummern</h2>'
    + '<table><tr><th>Parameter</th><th>Wert</th></tr>'
    + '<tr><td>Batch-Nr. Produkt (zu produzierender Batch)</td><td class="pval">' + (d.batch_produkt || '---') + '</td></tr>'
    + '<tr><td>Batch-Nr. UF Sense</td><td class="pval">' + (d.batch_sense || '---') + '</td></tr>'
    + '<tr><td>Batch-Nr. UF Anti-Sense</td><td class="pval">' + (d.batch_antisense || '---') + '</td></tr>'
    + '</table>'
    + '<h2>2. Einwaagen & Molar Ratio</h2>'
    + '<table><tr><th>Parameter</th><th>Wert</th></tr>'
    + '<tr><td>A — UF Anti-Sense [kg]</td><td class="pval">' + fmtN(d.A) + ' kg</td></tr>'
    + '<tr><td>G — UF Sense [kg]</td><td class="pval">' + fmtN(d.G) + ' kg</td></tr>'
    + '<tr><td>MR1 — Molar Ratio Soll (vom Labor nach UF)</td><td class="pval">' + fmtN(d.MR1, 4) + '</td></tr>'
    + '<tr><td>MR2 — Molar Ratio Ist (A / G)</td><td class="pval">' + fmtN(d.MR2, 4) + '</td></tr>'
    + '</table>'
    + '<h2>3. Visum Eduktevorbereitung</h2>'
    + '<div class="rs">Zeitstempel: <b>' + fmtTS(d.ts_start) + '</b> &nbsp;|&nbsp; User ID: <b>' + fmtUser(d.user_t1) + '</b></div>'
    + sigBlock('Operator Eduktevorbereitung', d.user_t1)
    + '<div class="pformula"><div class="pformula-title">Angewendete Formeln — Seite 1</div>'
    + '<code>MR2 = A / G</code> (A=Anti-Sense, G=Sense) &nbsp;|&nbsp; '
    + '<code>F = A × 0,85</code> (Anti-Sense Sollmenge) &nbsp;|&nbsp; '
    + '<code>B = G × 0,85</code> (Sense Sollmenge) &nbsp;|&nbsp; '
    + 'Wenn Sense limitierend: <code>C = B × MR1</code> (Anti-Sense Zielmenge) &nbsp;|&nbsp; '
    + 'Wenn Anti-Sense limitierend: <code>H = B / MR1</code> (Sense Zielmenge)'
    + '</div>'
        + '<div class="pfooter"><span>Eduktvorbereitung</span><span>v3.1 | by A.Di Chiara</span></div>';
}

function buildReport2() {
  var d = D;
  var l85 = d.isSense ? '<span class="rpb sense">SENSE</span>' : '<span class="rpb anti">ANTI-SENSE</span>';
  var soll_as = d.isSense ? fmtN(d.C) : fmtN(d.F);
  var soll_s  = d.isSense ? fmtN(d.B) : fmtN(d.H);
  var lbl_as  = d.isSense ? 'C — Soll Anti-Sense (Zielmenge)' : 'F — Soll Anti-Sense (Zielmenge)';
  var lbl_s   = d.isSense ? 'B — Soll Sense (Zielmenge)' : 'H — Soll Sense (Zielmenge)';
  var diffAS = d.O - (d.isSense ? d.C : d.F);
  var diffS  = d.P - (d.isSense ? d.B : d.H);
  var fmtD = function(v) { return (v >= 0 ? '+' : '') + fmtN(v); };
  var tolAS = Math.abs(diffAS) <= 0.1 ? '<span style="color:green">✓ i.T.</span>' : '<span style="color:red">✗ Toleranz überschritten</span>';
  var tolS  = Math.abs(diffS)  <= 0.1 ? '<span style="color:green">✓ i.T.</span>' : '<span style="color:red">✗ Toleranz überschritten</span>';
  return pageHeader('', 'Einwaage Annealing 85%')
    + '<h2>1. Limitierender Strang</h2>'
    + '<table><tr><th>Parameter</th><th>Wert</th></tr>'
    + '<tr><td>Limitierender Strang</td><td>' + l85 + '</td></tr>'
    + '<tr><td>MR1 — Soll</td><td class="pval">' + fmtN(d.MR1, 4) + '</td></tr>'
    + '<tr><td>MR2 — Ist (A/G)</td><td class="pval">' + fmtN(d.MR2, 4) + '</td></tr>'
    + '</table>'
    + '<h2>2. Sollmengen 85%</h2>'
    + '<table><tr><th>Parameter</th><th>Soll [kg]</th></tr>'
    + '<tr><td>' + lbl_as + '</td><td class="pval">' + soll_as + ' kg</td></tr>'
    + '<tr><td>' + lbl_s  + '</td><td class="pval">' + soll_s  + ' kg</td></tr>'
    + '</table>'
    + '<h2>3. Soll / Ist Einwaage 85%</h2>'
    + '<table><tr><th>Parameter</th><th>Soll [kg]</th><th>Ist [kg]</th><th>Differenz</th><th>Toleranz</th></tr>'
    + '<tr><td>Anti-Sense (O)</td><td>' + soll_as + '</td><td class="pval">' + fmtN(d.O) + '</td><td>' + fmtD(diffAS) + ' kg</td><td>' + tolAS + '</td></tr>'
    + '<tr><td>Sense (P)</td><td>' + soll_s + '</td><td class="pval">' + fmtN(d.P) + '</td><td>' + fmtD(diffS) + ' kg</td><td>' + tolS + '</td></tr>'
    + '</table>'
    + '<h2>4. Visum Einwaage 85%</h2>'
    + '<div class="rs">Zeitstempel: <b>' + fmtTS(d.ts_ein85) + '</b> &nbsp;|&nbsp; User ID: <b>' + fmtUser(d.user_t2) + '</b></div>'
    + sigBlock('Operator Einwaage 85%', d.user_t2)
    + abweichungBlock()
    + '<div class="pformula"><div class="pformula-title">Angewendete Formeln — Seite 2</div>'
    + 'Limitierender Strang: <code>isSense = MR1 &lt; MR2</code> &nbsp;|&nbsp; '
    + 'Zielmenge Sense: <code>B = G × 0,85</code> &nbsp;|&nbsp; '
    + 'Zielmenge Anti-Sense: <code>F = A × 0,85</code> &nbsp;|&nbsp; '
    + 'Wenn Sense lim.: <code>C = B × MR1</code> &nbsp;|&nbsp; '
    + 'Wenn AS lim.: <code>H = B / MR1</code> &nbsp;|&nbsp; '
    + 'Differenz: <code>Δ = Ist − Soll</code> &nbsp;|&nbsp; '
    + 'Toleranz: <code>|Δ| ≤ 0,1 kg</code>'
    + '</div>'
        + '<div class="pfooter"><span>Einwaage 85%</span><span>v3.1 | by A.Di Chiara</span></div>';
}

function buildReport3() {
  var d = D;
  var p85 = d.pak85 === 'i.O.' ? '<span class="rpb ok">i.O.</span>' : '<span class="rpb nok">n.i.O.</span>';
  var l15 = d.isSense2 ? '<span class="rpb sense">SENSE</span>' : '<span class="rpb anti">ANTI-SENSE</span>';
  var soll_as15 = d.isSense2 ? fmtN(d.S) : fmtN(d.Q);
  var soll_s15  = d.isSense2 ? fmtN(d.R) : fmtN(d.T);
  var lbl_as15  = d.isSense2 ? 'S — Zugabe Anti-Sense 15%' : 'Q — Zugabe Anti-Sense 15%';
  var lbl_s15   = d.isSense2 ? 'R — Restmenge Sense 15%' : 'T — Zugabe Sense 15%';
  var diff15AS = d.S_ist - (d.isSense2 ? d.S : d.Q);
  var diff15S  = d.R_ist - (d.isSense2 ? d.R : d.T);
  var fmtD = function(v) { return (v >= 0 ? '+' : '') + fmtN(v); };
  var tol15AS = Math.abs(diff15AS) <= 0.1 ? '<span style="color:green">✓ i.T.</span>' : '<span style="color:red">✗ Toleranz überschritten</span>';
  var tol15S  = Math.abs(diff15S)  <= 0.1 ? '<span style="color:green">✓ i.T.</span>' : '<span style="color:red">✗ Toleranz überschritten</span>';
  var pak85nok_rows = d.pak85 === 'n.i.O.'
    ? '<tr><td>Überschuss Strang</td><td>' + (d.pak85_uberschuss === 'anti' ? 'ANTI-SENSE' : 'SENSE') + '</td></tr>'
      + '<tr><td>' + (d.pak85nok_label || 'Wert Z/K') + '</td><td>' + fmtN(d.pak85nok_wert) + ' kg</td></tr>'
      + '<tr><td>Ist-Menge Zugabe</td><td>' + fmtN(d.Z_ist) + ' kg</td></tr>'
      + '<tr><td>PAK85-2</td><td>' + (d.pak85_2 === 'i.O.' ? '<span class="rpb ok">i.O.</span>' : '<span class="rpb nok">n.i.O.</span>') + '</td></tr>'
    : '';
  return pageHeader('', 'Ergebnis PAK85 & Einwaage 15%')
    + '<h2>1. PAK85 Resultat</h2>'
    + '<table><tr><th>Parameter</th><th>Wert</th></tr>'
    + '<tr><td>PAK85 Ergebnis</td><td>' + p85 + '</td></tr>'
    + pak85nok_rows
    + '<tr><td>E — PAK85 Sense [%]</td><td class="pval">' + fmtN(d.E, 4) + ' %</td></tr>'
    + '<tr><td>D — PAK85 Anti-Sense [%]</td><td class="pval">' + fmtN(d.Dv, 4) + ' %</td></tr>'
    + '<tr><td>KA — Korrekturfaktor</td><td class="pval">' + fmtN(d.KA, 4) + '</td></tr>'
    + '<tr><td>MR3 — Korrigierter MR</td><td class="pval">' + fmtN(d.MR3, 4) + '</td></tr>'
    + '</table>'
    + '<h2>2. Limitierender Strang & Sollmengen 15%</h2>'
    + '<table><tr><th>Parameter</th><th>Wert</th></tr>'
    + '<tr><td>Limitierender Strang 15%</td><td>' + l15 + '</td></tr>'
    + '<tr><td>MR4 — Ist MR Reste</td><td class="pval">' + fmtN(d.MR4, 4) + '</td></tr>'
    + '<tr><td>' + lbl_as15 + '</td><td class="pval">' + soll_as15 + ' kg</td></tr>'
    + '<tr><td>' + lbl_s15  + '</td><td class="pval">' + soll_s15  + ' kg</td></tr>'
    + '</table>'
    + '<h2>3. Soll / Ist Einwaage 15%</h2>'
    + '<table><tr><th>Parameter</th><th>Soll [kg]</th><th>Ist [kg]</th><th>Differenz</th><th>Toleranz</th></tr>'
    + '<tr><td>Anti-Sense (S_ist)</td><td>' + soll_as15 + '</td><td class="pval">' + fmtN(d.S_ist) + '</td><td>' + fmtD(diff15AS) + ' kg</td><td>' + tol15AS + '</td></tr>'
    + '<tr><td>Sense (R_ist)</td><td>' + soll_s15 + '</td><td class="pval">' + fmtN(d.R_ist) + '</td><td>' + fmtD(diff15S) + ' kg</td><td>' + tol15S + '</td></tr>'
    + '</table>'
    + '<h2>4. Visum PAK85 & Einwaage 15%</h2>'
    + '<div class="rs">Zeitstempel: <b>' + fmtTS(d.ts_pak85) + '</b> &nbsp;|&nbsp; User ID: <b>' + fmtUser(d.user_t3) + '</b></div>'
    + sigBlock('Operator PAK85 / Einwaage 15%', d.user_t3)
    + '<div class="pformula"><div class="pformula-title">Angewendete Formeln — Seite 3</div>'
    + '<code>KA = (1 + 2×E%) / (1 + 2×D%)</code> &nbsp;|&nbsp; '
    + '<code>MR3 = (O / P) × KA</code> &nbsp;|&nbsp; '
    + '<code>Q = A − O − 1,0</code> (bei n.i.O. SENSE-Überschuss: <code>Q = A − O − 1,0 − Z_ist</code>) &nbsp;|&nbsp; '
    + '<code>R = G − P − 1,0</code> (bei n.i.O. ANTI-SENSE-Überschuss: <code>R = G − P − 1,0 − Z_ist</code>) &nbsp;|&nbsp; '
    + '<code>MR4 = Q / R</code> &nbsp;|&nbsp; '
    + 'Wenn Sense lim.: <code>S = R × MR3</code> &nbsp;|&nbsp; '
    + 'Wenn AS lim.: <code>T = Q / MR3</code> &nbsp;|&nbsp; '
    + 'PAK85 n.i.O. AS-Überschuss: <code>Z = 2×D%×O / 100</code> &nbsp;|&nbsp; '
    + 'PAK85 n.i.O. S-Überschuss: <code>K = 2×E%×O / 100</code>'
    + '</div>'
        + '<div class="pfooter"><span>Ergebnis PAK85 & Einwaage 15%</span><span>v3.1 | by A.Di Chiara</span></div>';
}

function buildReport4() {
  var d = D;
  var p15 = d.pak15 === 'i.O.' ? '<span class="rpb ok">i.O.</span>' : '<span class="rpb nok">n.i.O.</span>';
  var pak15nok_rows = d.pak15 === 'n.i.O.'
    ? '<tr><td>Überschuss Strang</td><td>' + (d.pak15_uberschuss === 'anti' ? 'ANTI-SENSE' : 'SENSE') + '</td></tr>'
      + '<tr><td>' + (d.pak15nok_label || 'Wert W') + '</td><td>' + fmtN(d.pak15nok_wert) + ' kg</td></tr>'
      + '<tr><td>Ist-Menge Zugabe</td><td>' + fmtN(d.W15_ist) + ' kg</td></tr>'
      + '<tr><td>PAK15-2</td><td>' + (d.pak15_2 === 'i.O.' ? '<span class="rpb ok">i.O.</span>' : '<span class="rpb nok">n.i.O.</span>') + '</td></tr>'
    : '';
  return pageHeader('', 'Ergebnis PAK15 & Abschluss')
    + '<h2>1. PAK15 Resultat</h2>'
    + '<table><tr><th>Parameter</th><th>Wert</th></tr>'
    + '<tr><td>PAK15 Ergebnis</td><td>' + p15 + '</td></tr>'
    + pak15nok_rows
    + '<tr><td>U — PAK15 Sense [%]</td><td class="pval">' + fmtN(d.pak15_U_io, 4) + ' %</td></tr>'
    + '<tr><td>V — PAK15 Anti-Sense [%]</td><td class="pval">' + fmtN(d.pak15_V_io, 4) + ' %</td></tr>'
    + '</table>'
    + '<h2>2. Prozessübersicht — Zeitstempel & User</h2>'
    + '<table><tr><th>Schritt</th><th>User ID</th><th>Zeitstempel</th></tr>'
    + '<tr><td>Eduktevorbereitung</td><td>' + (d.user_t1 ? d.user_t1.id : '---') + '</td><td>' + fmtTS(d.ts_start) + '</td></tr>'
    + '<tr><td>Einwaage 85%</td><td>' + (d.user_t2 ? d.user_t2.id : '---') + '</td><td>' + fmtTS(d.ts_ein85) + '</td></tr>'
    + '<tr><td>PAK85 & Einwaage 15%</td><td>' + (d.user_t3 ? d.user_t3.id : '---') + '</td><td>' + fmtTS(d.ts_pak85) + '</td></tr>'
    + '<tr><td>PAK15 & Abschluss</td><td>' + (d.user_t4 ? d.user_t4.id : '---') + '</td><td>' + fmtTS(d.ts_end) + '</td></tr>'
    + '</table>'
    + '<h2>3. Visum PAK15 & Freigabe</h2>'
    + '<div class="rs">Zeitstempel Abschluss: <b>' + fmtTS(d.ts_end) + '</b> &nbsp;|&nbsp; User ID: <b>' + (d.user_t4 ? d.user_t4.id : '---') + '</b></div>'
    + abweichungBlock()
    + '<table><tr><th>Funktion</th><th>User ID</th><th>Zeitstempel</th><th>Visum / Unterschrift</th></tr>'
    + '<tr><td>Operator PAK15</td><td>' + (d.user_t4 ? d.user_t4.id : '&nbsp;') + '</td><td>' + fmtTS(d.ts_end) + '</td><td><div class="sig-line"></div></td></tr>'
    + '<tr><td>Prüfer</td><td>&nbsp;</td><td>&nbsp;</td><td><div class="sig-line"></div></td></tr>'
    + '<tr><td>Freigabe QA</td><td>&nbsp;</td><td>&nbsp;</td><td><div class="sig-line"></div></td></tr>'
    + '</table>'
    + '<div class="pformula"><div class="pformula-title">Angewendete Formeln — Seite 4</div>'
    + 'PAK15 n.i.O. AS-Überschuss: <code>W = 2×V%×S_ist / 100</code> &nbsp;|&nbsp; '
    + 'PAK15 n.i.O. S-Überschuss: <code>W = 2×U%×S_ist / 100</code> &nbsp;|&nbsp; '
    + 'Differenz Einwaage 15%: <code>Δ = Ist − Soll</code> &nbsp;|&nbsp; '
    + 'Toleranz: <code>|Δ| ≤ 0,1 kg</code>'
    + '</div>'
        + '<div class="pfooter"><span>Ergebnis PAK15 & Abschluss</span><span>v3.1 | by A.Di Chiara</span></div>';
}

function abweichungBlock() {
  var d = D;
  if (!d.toleranz_abweichungen || d.toleranz_abweichungen.length === 0) return '';
  var rows = d.toleranz_abweichungen.map(function(a) {
    return '<tr><td>' + a.kontext + '</td><td>' + a.ts + '</td><td>' + a.user + '</td><td style="color:#c0392b;font-weight:bold;">' + a.kommentar + '</td></tr>';
  }).join('');
  return '<h2 style="color:#c0392b;">⚠ Toleranzabweichungen — Begründungen</h2>'
    + '<table style="border:2px solid #c0392b;"><tr><th>Schritt</th><th>Zeitstempel</th><th>User ID</th><th>Begründung</th></tr>'
    + rows + '</table>';
}

function buildReportPak85NOK() {
  var d = D;
  var status = '<span class="rpb nok">n.i.O.</span>';
  var strand = d.pak85_uberschuss === 'anti'
    ? '<span class="rpb anti">ANTI-SENSE</span>'
    : '<span class="rpb sense">SENSE</span>';

  return pageHeader('', 'Zusatzblatt PAK85 n.i.O.')
    + '<h2>1. PAK85 n.i.O. Resultat</h2>'
    + '<table><tr><th>Parameter</th><th>Wert</th></tr>'
    + '<tr><td>PAK85 Ergebnis</td><td>' + status + '</td></tr>'
    + '<tr><td>Limitierender Strang</td><td>' + strand + '</td></tr>'
    + '<tr><td>Korrekturfaktor</td><td class="pval">' + fmtN(d.KA || 0, 4) + '</td></tr>'
    + '<tr><td>Korrigierter MR</td><td class="pval">' + fmtN(d.MR3 || 0, 4) + '</td></tr>'
    + '</table>'

    + '<h2>2. Durchführung / Visum</h2>'
    + '<table><tr><th>Funktion</th><th>User ID</th><th>Zeitstempel</th><th>Visum / Unterschrift</th></tr>'
+ '<tr><td>Operator Korrektur PAK85</td><td>' + safeTxt(d.user || d.userId || '_') + '</td><td>' + safeTxt(d.ts_pak85 ? fmtTS(d.ts_pak85) : '—') + '</td><td>__________</td></tr>'
    + '<tr><td>Prüfer</td><td></td><td></td><td>__________</td></tr>'
    + '</table>'

        + '<div class="pfooter"><span>Zusatzblatt PAK85 n.i.O.</span><span>v3.1 | by A.Di Chiara</span></div>';
}
function buildReportPak85_2_NOK() {
  var d = D;
  var status = '<span class="rpb nok">n.i.O.</span>';

  return pageHeader('', 'Zusatzblatt PAK85-2 n.i.O.')
    + '<h2>1. PAK85-2 n.i.O. Resultat</h2>'
    + '<table><tr><th>Parameter</th><th>Wert</th></tr>'
    + '<tr><td>PAK85-2 Ergebnis</td><td>' + status + '</td></tr>'
    + '<tr><td>Korrektur erforderlich</td><td class="pval">Ja</td></tr>'
    + '</table>'

    + '<h2>2. Durchführung / Visum</h2>'
    + '<table><tr><th>Funktion</th><th>User ID</th><th>Zeitstempel</th><th>Visum / Unterschrift</th></tr>'
    + '<tr><td>Operator Korrektur PAK85-2</td><td>' + safeTxt(d.user || d.userId || '_') + '</td><td>' + safeTxt(d.ts_pak85_2 ? fmtTS(d.ts_pak85_2) : '_') + '</td><td>__________</td></tr>'
    + '<tr><td>Prüfer</td><td></td><td></td><td>__________</td></tr>'
    + '</table>'

        + '<div class="pfooter"><span>Zusatzblatt PAK85-2 n.i.O.</span><span>v3.1 | by A.Di Chiara</span></div>';
}
function buildReportPak15NOK() {
  var d = D;
  var status = '<span class="rpb nok">n.i.O.</span>';
  var strand = d.pak15_uberschuss === 'anti'
    ? '<span class="rpb anti">ANTI-SENSE</span>'
    : '<span class="rpb sense">SENSE</span>';
var inputClass = d.pak15_uberschuss === 'anti' ? 'pulse-green' : 'pulse-red';

  return pageHeader('', 'Zusatzblatt PAK15 n.i.O.')
    + '<h2>1. PAK15 n.i.O. Resultat</h2>'
    + '<table><tr><th>Parameter</th><th>Wert</th></tr>'
    + '<tr><td>PAK15 Ergebnis</td><td>' + status + '</td></tr>'
    + '<tr><td>Überschuss Strang</td><td>' + strand + '</td></tr>'
    + '<tr><td>' + (d.pak15nok_label || 'Korrekturwert') + '</td><td class="pval">' + fmtN(d.pak15nok_wert) + ' kg</td></tr>'
    + '<tr><td>Ist-Menge Zugabe</td><td class="pval">' + fmtN(d.W15_ist) + ' kg</td></tr>'
    + '</table>'

    + '<h2>2. Durchführung / Visum</h2>'
    + '<table><tr><th>Funktion</th><th>User ID</th><th>Zeitstempel</th><th>Visum / Unterschrift</th></tr>'
    + '<tr><td>Operator Korrektur PAK15</td><td>' + safeTxt(d.user || d.userId || '_') + '</td><td>' + safeTxt(d.ts_end ? fmtTS(d.ts_end) : '_') + '</td><td>__________</td></tr>'
    + '<tr><td>Prüfer</td><td></td><td></td><td>__________</td></tr>'
    + '</table>'

        + '<div class="pfooter"><span>Zusatzblatt PAK15 n.i.O.</span><span>v3.1 | by A.Di Chiara</span></div>';
}
function buildReportPak15_2_NOK() {
  var d = D;
  var status = '<span class="rpb nok">n.i.O.</span>';

  return pageHeader('', 'Zusatzblatt PAK15-2 n.i.O.')
    + '<h2>1. PAK15-2 n.i.O. Resultat</h2>'
    + '<table><tr><th>Parameter</th><th>Wert</th></tr>'
    + '<tr><td>PAK15-2 Ergebnis</td><td>' + status + '</td></tr>'
    + '<tr><td>Korrektur erforderlich</td><td class="pval">Ja</td></tr>'
    + '</table>'

    + '<h2>2. Durchführung / Visum</h2>'
    + '<table><tr><th>Funktion</th><th>User ID</th><th>Zeitstempel</th><th>Visum / Unterschrift</th></tr>'
    + '<tr><td>Operator Korrektur PAK15-2</td><td>' + safeTxt(d.user || d.userId || '—') + '</td><td>' + safeTxt(d.ts_end || '—') + '</td><td>__________</td></tr>'
    + '<tr><td>Prüfer</td><td></td><td></td><td>__________</td></tr>'
    + '</table>'

        + '<div class="pfooter"><span>Zusatzblatt PAK15-2 n.i.O.</span><span>v3.1 | by A.Di Chiara</span></div>';
}
function buildReportHTML() { return buildReport4(); }

function showReport(teil) {
  if (!D || !D.ts_start) {
    showInfo('Keine Daten vorhanden. Bitte zuerst Schritt 1 ausfüllen.');
    return;
  }

  var pages = [teil];
  var html = '';

  pages.forEach(function(pageNo) {
    var pageHtml = '';

    if (pageNo === 1) pageHtml = buildReport1();
    else if (pageNo === 2) pageHtml = buildReport2();
    else if (pageNo === 3) pageHtml = buildReport3();
    else if (pageNo === 4) pageHtml = buildReport4();
    else if (pageNo === 5) pageHtml = buildReportPak85NOK();
    else if (pageNo === 6) pageHtml = buildReportPak85_2_NOK();
    else if (pageNo === 7) pageHtml = buildReportPak15NOK();
    else if (pageNo === 8) pageHtml = buildReportPak15_2_NOK();

    if (!pageHtml) return;

    html += '<div class="print-sheet">' + pageHtml + '</div>';
  });

  document.getElementById('print-content').innerHTML = html;
  document.getElementById('print-overlay').classList.add('show');
  document.getElementById('bprint-btn').classList.add('bprint-hidden');
  document.getElementById('print-overlay').scrollTop = 0;
}

function showBestReport() {
  var teil = 1;
  if (D.ts_end)   teil = 4;
  else if (D.ts_pak85) teil = 3;
  else if (D.ts_ein85) teil = 2;
  else if (D.ts_start) teil = 1;
  showReport(teil);
}

function hideReport() {
  document.getElementById('print-overlay').classList.remove('show');
  document.getElementById('bprint-btn').classList.remove('bprint-hidden');
}

function showInfo(msg) {
  document.getElementById('info-dialog-msg').textContent = msg;
  document.getElementById('info-dialog').style.display = 'flex';
}

function closeInfoDialog() {
  document.getElementById('info-dialog').style.display = 'none';
}

function confirmReset() {
  var hasData = document.getElementById('A').value || document.getElementById('G').value || document.getElementById('MR1').value
    || document.getElementById('batch_produkt').value || document.getElementById('batch_sense').value || document.getElementById('batch_antisense').value;
  if (!hasData) return;
  var dialog = document.getElementById('reset-dialog');
  dialog.style.display = 'flex';
}

function closeResetDialog() {
  document.getElementById('reset-dialog').style.display = 'none';
}

function doReset() {
  closeResetDialog();
  resetAll();
}

function resetAll() {
  var ids = ['A','G','MR1','O','P','E','D','E_nok','D_nok','E2','D2','Z_ist','S_ist','R_ist','U_nok','V_nok','U2','V2','W15_ist','U_io','V_io','batch_sense','batch_antisense','batch_produkt'];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) { el.value = ''; el.style.borderColor = ''; }
  }
  var blocks = ['b-group85','b-calc85-inner','b-ein85-inner','b-pak85','b-pak85nok','b-rpak85-2','b-rpak85','b-rpak85-weiter','b-group15','b-calc15-inner','b-ein15-inner','b-pak15','b-pak15nok','b-rpak15-2','b-rpak15','b-done','b-pak85-seite2-print','b-ein15-print'];
  for (var j = 0; j < blocks.length; j++) { hideEl(blocks[j]); }
  hideEl('pak85-nok'); hideEl('pak85-2-nok'); hideEl('pak15-nok'); hideEl('pak15-2-nok');
  hideEl('uberschuss85-result'); hideEl('uberschuss15-result');
  var steps = ['si1','si2','si3','si4'];
  for (var k = 0; k < steps.length; k++) {
    document.getElementById(steps[k]).classList.remove('active','done');
  }
  document.getElementById('si1').classList.add('active');
  var bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = '0%';
  var kaEl = document.getElementById('ka-val');
  if (kaEl) kaEl.textContent = '---';
  var ka2El = document.getElementById('ka2-val');
  if (ka2El) ka2El.textContent = '---';
  D = {};
  hideReport();
  document.querySelectorAll('.section-wrap-active').forEach(function(w) { w.classList.remove('section-wrap-active'); });
  var step1 = document.getElementById('b-step1');
  if (step1) step1.classList.add('section-wrap-active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForLogout() {
  resetAll();
  // App verstecken — nur beim Logout, nicht beim normalen Reset
  var wrap = document.querySelector('.wrap');
  if (wrap) { wrap.classList.remove('visible'); wrap.classList.remove('appearing'); }
}

// ══════════════════════════════════════════════════════════════════
// VISUELLE FEATURES
// ══════════════════════════════════════════════════════════════════

document.addEventListener('touchstart', function(e) {
  var card = e.target.closest('.card');
  if (card) {
    card.classList.remove('tapped');
    void card.offsetWidth;
    card.classList.add('tapped');
    setTimeout(function() { card.classList.remove('tapped'); }, 500);
  }
}, { passive: true });

(function() {
  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var particles = [];
  var N = 55;

  function resize() {
    canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (var i = 0; i < N; i++) {
    particles.push({
      x:  Math.random() * window.innerWidth,
      y:  Math.random() * window.innerHeight,
      r:  Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a:  Math.random() * 0.5 + 0.1,
      c:  Math.random() > 0.5 ? '0,212,255' : '0,255,157',
    });
  }

  var isScrolling = false;
  var scrollTimer = null;
  function pauseCanvas() {
    isScrolling = true;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function() { isScrolling = false; }, 300);
  }
  window.addEventListener('scroll', pauseCanvas, { passive: true });
  window.addEventListener('touchstart', pauseCanvas, { passive: true });
  window.addEventListener('touchmove', pauseCanvas, { passive: true });
  window.addEventListener('touchend', pauseCanvas, { passive: true });

  function draw() {
    if (!isScrolling) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function(p) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')';
        ctx.fill();
      });
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(0,212,255,' + (0.06 * (1 - dist/80)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

(function() {
  var canvas = document.getElementById('helix-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var angle = 0;

  function resizeHelix() {
    canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resizeHelix();
  window.addEventListener('resize', resizeHelix);

  function drawHelix() {
    var W = canvas.offsetWidth;
    var H = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    var cx  = H / 2;
    var amp = H * 0.28;
    var freq = 2;
    var steps = 60;

    for (var i = 0; i <= steps; i++) {
      var t   = (i / steps) * Math.PI * freq * 2 + angle;
      var x   = (i / steps) * W;
      var y1  = cx + Math.sin(t) * amp;
      var y2  = cx + Math.sin(t + Math.PI) * amp;
      var z1  = Math.cos(t);
      var z2  = Math.cos(t + Math.PI);
      var a1  = 0.4 + 0.55 * ((z1 + 1) / 2);
      var a2  = 0.4 + 0.55 * ((z2 + 1) / 2);
      var r1  = 2 + 1.5 * ((z1 + 1) / 2);
      var r2  = 2 + 1.5 * ((z2 + 1) / 2);

      ctx.beginPath();
      ctx.arc(x, y1, r1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,' + a1.toFixed(2) + ')';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y2, r2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,157,' + a2.toFixed(2) + ')';
      ctx.fill();

      if (i % 6 === 0) {
        var midZ = (z1 + z2) / 2;
        var bondA = 0.15 + 0.5 * ((midZ + 1) / 2);
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.strokeStyle = 'rgba(255,214,0,' + bondA.toFixed(2) + ')';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }
    angle -= 0.03;
    requestAnimationFrame(drawHelix);
  }
  drawHelix();
})();

(function() {
  var canvas = document.getElementById('helix-main-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var angle = 0;

  function resizeMain() {
    canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  resizeMain();
  window.addEventListener('resize', resizeMain);

  function drawHelixMain() {
    var W = canvas.offsetWidth;
    var H = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    var cy   = H / 2;
    var amp  = H * 0.35;
    var freq = 2.5;
    var steps = 80;

    for (var i = 0; i <= steps; i++) {
      var t  = (i / steps) * Math.PI * freq * 2 + angle;
      var x  = (i / steps) * W;
      var y1 = cy + Math.sin(t) * amp;
      var y2 = cy + Math.sin(t + Math.PI) * amp;
      var z1 = Math.cos(t);
      var z2 = Math.cos(t + Math.PI);
      var a1 = 0.35 + 0.6 * ((z1 + 1) / 2);
      var a2 = 0.35 + 0.6 * ((z2 + 1) / 2);
      var r1 = 2.5 + 2 * ((z1 + 1) / 2);
      var r2 = 2.5 + 2 * ((z2 + 1) / 2);

      ctx.beginPath();
      ctx.arc(x, y1, r1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,212,255,' + a1.toFixed(2) + ')';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y2, r2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,157,' + a2.toFixed(2) + ')';
      ctx.fill();

      if (i % 5 === 0) {
        var midZ  = (z1 + z2) / 2;
        var bondA = 0.1 + 0.55 * ((midZ + 1) / 2);
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.strokeStyle = 'rgba(255,214,0,' + bondA.toFixed(2) + ')';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    angle -= 0.025;
    requestAnimationFrame(drawHelixMain);
  }
  drawHelixMain();
})();

function openSheet(id) {
  var sheet = document.getElementById(id);
  if (sheet) sheet.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSheet(id) {
  var sheet = document.getElementById(id);
  if (sheet) sheet.classList.remove('open');
  document.body.style.overflow = '';
}

var badgeTimer = null;
function expandBadge() {
  var badge = document.getElementById('user-badge');
  if (!badge) return;
  badge.classList.add('expanded');
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(function() {
    badge.classList.remove('expanded');
  }, 2000);
}

function collapseBadge() {
  var badge = document.getElementById('user-badge');
  if (!badge) return;
  clearTimeout(badgeTimer);
  badge.classList.remove('expanded');
}

function initBadgeEvents() {
  var badge = document.getElementById('user-badge');
  if (!badge) return;
  // Alte Listeners entfernen durch Klonen
  var newBadge = badge.cloneNode(true);
  badge.parentNode.replaceChild(newBadge, badge);
  newBadge.addEventListener('touchstart', function(e) {
    expandBadge();
    e.stopPropagation();
  }, { passive: true });
  newBadge.addEventListener('mouseenter', function() { expandBadge(); });
  newBadge.addEventListener('mouseleave', function() {
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(function() {
      newBadge.classList.remove('expanded');
    }, 500);
  });
}

var tolDialogCallback = null;
var tolDialogContext = '';

function checkTolComment() {
  var txt = document.getElementById('tol-comment').value.trim();
  var btn = document.getElementById('tol-continue-btn');
  var hint = document.getElementById('tol-comment-hint');
  var ok = txt.length >= 10;
  if (ok) {
    btn.disabled = false;
    btn.style.cssText = 'flex:1;font-size:0.78rem;padding:0.5rem 0.6rem;min-height:44px;white-space:nowrap;background:linear-gradient(135deg,#003d1a,#006630);color:#00ff9d;border:1px solid #00ff9d;box-shadow:0 0 12px rgba(0,255,157,0.3);cursor:pointer;';
    hint.style.color = 'rgba(0,255,157,0.7)';
    hint.textContent = '✓ Begründung erfasst';
  } else {
    btn.disabled = true;
    btn.style.cssText = 'flex:1;font-size:0.78rem;padding:0.5rem 0.6rem;min-height:44px;white-space:nowrap;background:linear-gradient(135deg,#0a3d25,#0d5232);color:rgba(0,255,157,0.3);border:1px solid rgba(0,255,157,0.2);cursor:not-allowed;';
    hint.style.color = 'rgba(255,107,107,0.7)';
    hint.textContent = 'Mindestens 10 Zeichen erforderlich (' + txt.length + '/10)';
  }
}

function showTolDialog(msg, callback, context) {
  tolDialogCallback = callback;
  tolDialogContext = context || '';
  var msgEl = document.getElementById('tol-dialog-msg');
  if (msgEl) msgEl.innerHTML = msg.replace(/\n/g, '<br>');
  var comment = document.getElementById('tol-comment');
  if (comment) comment.value = '';
  checkTolComment();
  var d = document.getElementById('tol-dialog');
  if (d) d.style.display = 'flex';
}

function tolDialogContinue() {
  var comment = document.getElementById('tol-comment').value.trim();
  if (comment.length < 10) return;
  if (!D.toleranz_abweichungen) D.toleranz_abweichungen = [];
  D.toleranz_abweichungen.push({
    ts: new Date().toLocaleString('de-DE'),
    user: currentUser ? currentUser.id : '---',
    kontext: tolDialogContext,
    kommentar: comment
  });
  var d = document.getElementById('tol-dialog');
  if (d) d.style.display = 'none';
  if (tolDialogCallback) { tolDialogCallback(); tolDialogCallback = null; }
}

function tolDialogAbort() {
  var d = document.getElementById('tol-dialog');
  if (d) d.style.display = 'none';
  tolDialogCallback = null;
}
function jumpToStep(step) {
  var map = {
    1: 'b-step1',
    2: 'b-group85',
    3: 'b-group15',
    4: 'b-done'
  };

  var targetId = map[step];
  var stepEl = document.getElementById('si' + step);
  var targetEl = document.getElementById(targetId);

  if (!stepEl || !targetEl) return;

  var allowed =
    stepEl.classList.contains('active') ||
    stepEl.classList.contains('done') ||
    !targetEl.classList.contains('hidden');

  if (!allowed) return;

  goTo(targetId);
}
function toggleAcc(id, btn) {
  var body = document.getElementById(id);
  var isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  btn.classList.toggle('open', !isOpen);
}
function renderDynamicPrintButtons() {
  var el = document.getElementById('dynamic-print-buttons');
  if (!el) return;

  var html = ''
    + '<div style="font-family:\'Space Mono\',monospace;font-size:0.65rem;color:rgba(0,212,255,0.7);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.2rem;">📄 Alle Seiten zum Drucken:</div>'
    + '<button class="btn bp" onclick="showReport(1)" style="font-size:0.78rem;padding:0.5rem 1.2rem;">🖨️ Eduktevorbereitung</button>'
    + '<button class="btn bp" onclick="showReport(2)" style="font-size:0.78rem;padding:0.5rem 1.2rem;">🖨️ Einwaage 85%</button>'
    + '<button class="btn bp" onclick="showReport(3)" style="font-size:0.78rem;padding:0.5rem 1.2rem;">🖨️ Ergebnis PAK85 & Einwaage 15%</button>'
    + '<button class="btn bp" onclick="showReport(4)" style="font-size:0.78rem;padding:0.5rem 1.2rem;">🖨️ Ergebnis PAK15 & Abschluss</button>';

  if (D.pak85 === 'n.i.O.') {
    html += '<button class="btn bnok" onclick="showReport(5)" style="font-size:0.78rem;padding:0.5rem 1.2rem;">🖨️ PAK85 n.i.O.</button>';
  }
  if (D.pak85_2 === 'n.i.O.') {
    html += '<button class="btn bnok" onclick="showReport(6)" style="font-size:0.78rem;padding:0.5rem 1.2rem;">🖨️ PAK85-2 n.i.O.</button>';
  }
  if (D.pak15 === 'n.i.O.') {
    html += '<button class="btn bnok" onclick="showReport(7)" style="font-size:0.78rem;padding:0.5rem 1.2rem;">🖨️ PAK15 n.i.O.</button>';
  }
  if (D.pak15_2 === 'n.i.O.') {
    html += '<button class="btn bnok" onclick="showReport(8)" style="font-size:0.78rem;padding:0.5rem 1.2rem;">🖨️ PAK15-2 n.i.O.</button>';
  }

  html += '<button class="btn bp" onclick="printAvailablePages()" style="font-size:0.78rem;padding:0.5rem 1.2rem;font-weight:800;">📄 Komplettes PDF öffnen</button>';

  el.innerHTML = html;
}
function printAvailablePages() {
  var pages = [];

  if (!D || !D.ts_start) {
    showInfo('Keine Daten vorhanden. Bitte zuerst Schritt 1 ausfüllen.');
    return;
  }

  if (D.ts_start) pages.push(1);
if (D.ts_ein85) pages.push(2);
if (D.ts_pak85) pages.push(3);
if (D.ts_end)   pages.push(4);

if (D.pak85 === 'n.i.O.') pages.push(5);
if (D.pak85_2 === 'n.i.O.') pages.push(6);
if (D.pak15 === 'n.i.O.') pages.push(7);
if (D.pak15_2 === 'n.i.O.') pages.push(8);

  if (!pages.length) {
    showInfo('Keine druckbaren Seiten verfügbar.');
    return;
  }

  showReportPages(pages);
}
function showReportPages(pages) {
  var html = '';

pages.forEach(function(pageNo, idx) {
  var pageHtml = '';

  if (pageNo === 1) pageHtml = buildReport1();
  if (pageNo === 2) pageHtml = buildReport2();
  if (pageNo === 3) pageHtml = buildReport3();
  if (pageNo === 4) pageHtml = buildReport4();
  if (pageNo === 5) pageHtml = buildReportPak85NOK();
  if (pageNo === 6) pageHtml = buildReportPak85_2_NOK();
  if (pageNo === 7) pageHtml = buildReportPak15NOK();
  if (pageNo === 8) pageHtml = buildReportPak15_2_NOK();

  if (!pageHtml) return;

  var extraStyle = idx < pages.length - 1
  ? 'margin-bottom:28px;'
  : '';

  html += '<div class="print-sheet" style="background:#fff;max-width:980px;margin:0 auto;border:1px solid #d9e1ea;box-shadow:0 6px 22px rgba(0,0,0,0.08);padding:8mm;' + extraStyle + '">' +
          pageHtml +
        '</div>';
});

if (!html) {
  showInfo('Keine Report-Seiten gefunden.');
  return;
}

document.getElementById('print-content').innerHTML = html;

document.getElementById('print-overlay').classList.add('show');
document.getElementById('bprint-btn').classList.add('bprint-hidden');
document.getElementById('print-overlay').scrollTop = 0;

}