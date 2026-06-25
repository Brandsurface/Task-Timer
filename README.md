<!DOCTYPE html>
<html lang="da">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TaskTimer</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --bg:          #0d0e10;
  --surface:     #151719;
  --surface2:    #1e2124;
  --surface3:    #262a2e;
  --border:      #2c3035;
  --border2:     #383d44;
  --orange:      #f07c28;
  --orange-dim:  rgba(240,124,40,0.14);
  --green-bg:    #0f2318;
  --green-border:#1f4a2e;
  --green:       #3dd68c;
  --red:         #e05555;
  --text:        #dfe1e5;
  --text-dim:    #7e8490;
  --text-muted:  #484d56;
  --mono:        'IBM Plex Mono', monospace;
  --sans:        'IBM Plex Sans', sans-serif;
  --r:           10px;
  --r-sm:        7px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }

body {
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  font-size: 14px;
  line-height: 1.5;
}

/* ─── PAGES ─── */
.page { display: none; width: 100%; max-width: 480px; min-height: 100vh; flex-direction: column; }
.page.active { display: flex; }

/* ─── AUTH ─── */
.auth-wrap {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 32px 24px; gap: 24px;
}
.auth-logo { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.auth-logo-icon {
  width: 54px; height: 54px; background: var(--orange);
  border-radius: 14px; display: flex; align-items: center;
  justify-content: center; font-size: 26px;
}
.auth-logo-name {
  font-family: var(--mono); font-size: 20px; font-weight: 600;
  color: var(--text); letter-spacing: 0.04em;
}
.auth-card {
  width: 100%; background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 14px;
}
.auth-title { font-size: 15px; font-weight: 700; }
.auth-switch { font-size: 12px; color: var(--text-dim); text-align: center; }
.auth-switch a { color: var(--orange); cursor: pointer; text-decoration: none; }
.auth-switch a:hover { text-decoration: underline; }

/* ─── FORMS ─── */
.form-field { display: flex; flex-direction: column; gap: 5px; }
.form-label {
  font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text-muted);
}
.form-input {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--r-sm); padding: 10px 13px;
  font-family: var(--sans); font-size: 14px; color: var(--text);
  outline: none; transition: border-color 0.15s; width: 100%;
}
.form-input:focus { border-color: var(--orange); }
.form-input::placeholder { color: var(--text-muted); }
.form-input:disabled { opacity: 0.45; cursor: not-allowed; }
.form-hint { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.form-error {
  font-size: 12px; color: var(--red);
  display: none; padding: 8px 10px;
  background: rgba(224,85,85,0.08);
  border: 1px solid rgba(224,85,85,0.2);
  border-radius: var(--r-sm);
}
.form-error.show { display: block; }

/* ─── BUTTONS ─── */
.btn {
  font-family: var(--sans); font-size: 13px; font-weight: 600;
  border-radius: var(--r-sm); padding: 10px 18px; cursor: pointer;
  border: 1px solid transparent; transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px; white-space: nowrap; position: relative;
}
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }

.btn-primary { background: var(--orange); color: #fff; border-color: var(--orange); }
.btn-primary:hover:not(:disabled) { background: #d96d1e; border-color: #d96d1e; }

.btn-ghost { background: transparent; color: var(--text-dim); border-color: var(--border); }
.btn-ghost:hover:not(:disabled) { border-color: var(--border2); color: var(--text); }

.btn-danger { background: transparent; color: var(--text-dim); border-color: var(--border); }
.btn-danger:hover:not(:disabled) { border-color: var(--red); color: var(--red); background: rgba(224,85,85,0.06); }

.btn-full  { width: 100%; }
.btn-sm    { padding: 7px 12px; font-size: 12px; }

/* Loading spinner in button */
.btn.loading { pointer-events: none; }
.btn.loading .btn-text { opacity: 0; }
.btn.loading::after {
  content: '';
  position: absolute;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
.btn-ghost.loading::after { border-color: rgba(255,255,255,0.15); border-top-color: var(--text-dim); }
@keyframes spin { to { transform: rotate(360deg); } }

.icon-btn {
  width: 34px; height: 34px; border-radius: var(--r-sm);
  border: 1px solid var(--border); background: var(--surface2);
  color: var(--text-dim); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; transition: all 0.15s; flex-shrink: 0;
}
.icon-btn:hover { border-color: var(--orange); color: var(--orange); }
.icon-btn:active { transform: scale(0.94); }

/* ─── APP HEADER ─── */
.app-header {
  padding: 13px 18px; display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--border); background: var(--surface);
  position: sticky; top: 0; z-index: 50;
}
.app-logo {
  width: 32px; height: 32px; background: var(--orange);
  border-radius: 8px; display: flex; align-items: center;
  justify-content: center; font-size: 15px; flex-shrink: 0;
}
.app-name { font-family: var(--mono); font-size: 13px; font-weight: 600; letter-spacing: 0.04em; }
.app-user { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
.hspace { flex: 1; }

/* ─── TABS ─── */
.topbar {
  padding: 10px 18px 0; display: flex; gap: 2px;
  border-bottom: 1px solid var(--border); background: var(--surface);
}
.tab {
  font-size: 12px; font-weight: 600; color: var(--text-dim);
  padding: 8px 14px; cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  letter-spacing: 0.02em; white-space: nowrap;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--orange); border-bottom-color: var(--orange); }

/* ─── TIMER TAB ─── */
.timer-actions { padding: 12px 18px 8px; display: flex; gap: 8px; }

.inline-form {
  display: none; padding: 0 18px 8px; gap: 8px; align-items: center;
}
.inline-form.show { display: flex; }
.inline-input {
  flex: 1; background: var(--surface); border: 1px solid var(--orange);
  border-radius: var(--r-sm); padding: 9px 12px;
  font-family: var(--sans); font-size: 14px; color: var(--text); outline: none;
  transition: box-shadow 0.15s;
}
.inline-input:focus { box-shadow: 0 0 0 2px rgba(240,124,40,0.2); }
.inline-input::placeholder { color: var(--text-muted); }

/* ─── TASK LIST ─── */
.task-list {
  flex: 1; padding: 6px 18px;
  display: flex; flex-direction: column; gap: 5px;
  overflow-y: auto;
}
.empty-state {
  padding: 48px 0; text-align: center;
  color: var(--text-muted); font-size: 13px; line-height: 1.9;
}

.task-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r); padding: 12px;
  display: flex; align-items: center; gap: 10px;
  cursor: default; user-select: none;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  animation: fadeUp 0.18s ease both;
}
@keyframes fadeUp { from { opacity:0; transform:translateY(-3px); } to { opacity:1; transform:none; } }

.task-card:hover { border-color: var(--border2); }
.task-card.active-task { background: var(--green-bg); border-color: var(--green-border); }
.task-card.dragging { opacity: 0.3; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
.task-card.drag-over { border-color: var(--orange); box-shadow: 0 0 0 1px var(--orange); }

/* Delete confirm state */
.task-card.confirm-delete { border-color: var(--red); background: rgba(224,85,85,0.05); }

.drag-handle {
  color: var(--text-muted); cursor: grab; font-size: 12px;
  padding: 2px 0; line-height: 1; flex-shrink: 0;
  opacity: 0; transition: opacity 0.15s;
}
.task-card:hover .drag-handle { opacity: 1; }
.drag-handle:active { cursor: grabbing; }

.task-info { flex: 1; min-width: 0; }
.task-name {
  font-size: 13px; font-weight: 500; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  cursor: text; line-height: 1.3;
}
.task-name-edit {
  background: transparent; border: none;
  border-bottom: 1px solid var(--orange); outline: none;
  font-family: var(--sans); font-size: 13px; font-weight: 500;
  color: var(--text); width: 100%; padding: 0 0 1px;
}
.task-time {
  font-family: var(--mono); font-size: 18px; font-weight: 600;
  color: var(--orange); margin-top: 3px;
  display: flex; align-items: center; gap: 7px;
  letter-spacing: 0.02em;
}
.live-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--green); flex-shrink: 0;
  animation: blink 1.2s infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.1} }

.task-controls { display: flex; align-items: center; gap: 3px; flex-shrink: 0; }

.ctrl {
  width: 32px; height: 32px; border-radius: var(--r-sm);
  border: 1px solid var(--border); background: var(--surface2);
  color: var(--text-dim); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; font-size: 13px; flex-shrink: 0;
}
.ctrl:active { transform: scale(0.9); }
.ctrl:hover { border-color: var(--border2); color: var(--text); }
.ctrl.pp { background: var(--surface3); color: var(--text); }
.ctrl.pp.running { background: var(--orange); border-color: var(--orange); color: #fff; }
.ctrl.pp:hover:not(.running) { border-color: var(--orange); color: var(--orange); }
.ctrl.pp.running:hover { background: #d96d1e; }
.ctrl.del:hover { border-color: var(--red); color: var(--red); background: rgba(224,85,85,0.06); }
/* Confirm-delete state */
.ctrl.del.armed { border-color: var(--red); color: var(--red); background: rgba(224,85,85,0.15); }

/* ─── BOTTOM ─── */
.bottom-area {
  padding: 10px 18px 0; border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 6px;
}
.total-row {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r); padding: 12px 14px;
  display: flex; align-items: center; gap: 10px;
}
.total-label { font-size: 13px; font-weight: 500; color: var(--text-dim); flex: 1; }
.total-value {
  font-family: var(--mono); font-size: 20px; font-weight: 700;
  color: var(--orange); letter-spacing: 0.03em;
}
.end-day-btn {
  background: var(--orange); border: none; border-radius: var(--r);
  padding: 13px; font-family: var(--sans); font-size: 14px;
  font-weight: 700; color: #fff; cursor: pointer; width: 100%;
  transition: background 0.15s, opacity 0.15s;
  letter-spacing: 0.02em; position: relative;
}
.end-day-btn:hover:not(:disabled) { background: #d96d1e; }
.end-day-btn:active:not(:disabled) { transform: scale(0.99); }
.end-day-btn:disabled { opacity: 0.38; cursor: not-allowed; }
.end-day-btn.loading { pointer-events: none; color: transparent; }
.end-day-btn.loading::after {
  content: ''; position: absolute; left: 50%; top: 50%;
  transform: translate(-50%,-50%);
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.goal-row { display: flex; gap: 5px; padding-bottom: 10px; }
.goal-pill {
  flex: 1; background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r-sm); padding: 8px 10px; text-align: center;
}
.goal-pill-label { font-size: 9px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-muted); }
.goal-pill-value { font-family: var(--mono); font-size: 14px; font-weight: 600; color: var(--orange); margin-top: 2px; }
.goal-pill-value.at-goal { color: var(--green); }

/* ─── WEEK TAB ─── */
.week-content {
  flex: 1; padding: 12px 18px;
  display: flex; flex-direction: column; gap: 10px; overflow-y: auto;
}
.week-nav { display: flex; align-items: center; gap: 8px; }
.week-nav-label {
  flex: 1; text-align: center; font-family: var(--mono);
  font-size: 12px; font-weight: 600; color: var(--text-dim);
  letter-spacing: 0.05em; text-transform: uppercase;
}
.day-block { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; }
.day-header {
  padding: 9px 12px; display: flex; justify-content: space-between;
  align-items: center; border-bottom: 1px solid var(--border);
  background: var(--surface2); cursor: default;
}
.day-header.today-hdr { border-left: 3px solid var(--orange); }
.day-name { font-size: 12px; font-weight: 600; }
.day-date { font-size: 11px; color: var(--text-muted); }
.day-total { font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--orange); }
.day-add-btn {
  background: none; border: none; color: var(--text-muted);
  font-size: 16px; cursor: pointer; padding: 0 2px;
  transition: color 0.15s; line-height: 1;
}
.day-add-btn:hover { color: var(--orange); }
.day-entries { padding: 3px 6px; }
.week-entry {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 7px; border-radius: var(--r-sm);
  transition: background 0.1s; cursor: pointer;
}
.week-entry:hover { background: var(--surface2); }
.week-entry:hover .we-del { opacity: 1; }
.we-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; margin-top: 1px; }
.we-body { flex: 1; min-width: 0; }
.we-task { font-size: 12px; font-weight: 500; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.we-meta { font-family: var(--mono); font-size: 10px; color: var(--text-muted); margin-top: 1px; }
.we-dur  { font-family: var(--mono); font-size: 12px; font-weight: 600; color: var(--orange); flex-shrink: 0; }
.we-del  { opacity: 0; color: var(--text-muted); font-size: 13px; cursor: pointer; transition: color 0.15s, opacity 0.15s; flex-shrink: 0; padding: 2px; }
.we-del:hover { color: var(--red); }
.week-empty { font-size: 11px; color: var(--text-muted); padding: 10px 8px; font-style: italic; }
.week-summary-row {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r); padding: 12px 14px;
  display: flex; justify-content: space-between; align-items: center;
}
.ws-label { font-size: 12px; color: var(--text-dim); }
.ws-value { font-family: var(--mono); font-size: 16px; font-weight: 700; color: var(--orange); }

/* Week loading skeleton */
.skel {
  background: var(--surface2); border-radius: 4px;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  0%,100% { opacity: .4; }
  50% { opacity: .8; }
}

/* ─── SETTINGS TAB ─── */
.settings-content {
  flex: 1; padding: 14px 18px;
  display: flex; flex-direction: column; gap: 14px; overflow-y: auto;
}
.settings-section {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r); overflow: hidden;
}
.settings-title {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text-muted);
  padding: 10px 14px 8px; border-bottom: 1px solid var(--border);
}
.settings-body { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.settings-row  { display: flex; gap: 10px; }

/* ─── MODAL ─── */
.overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.72); z-index: 200;
  align-items: center; justify-content: center; padding: 20px;
}
.overlay.show { display: flex; }
.modal {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; padding: 22px; width: 100%; max-width: 360px;
  display: flex; flex-direction: column; gap: 14px;
  animation: modalIn 0.17s ease both;
}
@keyframes modalIn { from { opacity:0; transform:scale(.95) translateY(4px); } to { opacity:1; transform:none; } }
.modal-title    { font-size: 15px; font-weight: 700; }
.modal-subtitle { font-size: 12px; color: var(--text-dim); margin-top: -8px; }
.modal-actions  { display: flex; gap: 8px; margin-top: 4px; }
.modal-actions .btn { flex: 1; }

/* End Day summary list */
.end-day-list {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--r-sm); max-height: 220px; overflow-y: auto;
}
.edl-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 12px; border-bottom: 1px solid var(--border); gap: 8px;
}
.edl-row:last-child { border-bottom: none; }
.edl-task { font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.edl-time { font-family: var(--mono); font-size: 12px; color: var(--orange); flex-shrink: 0; font-weight: 600; }

/* ─── FOOTER ─── */
footer {
  padding: 10px 18px 14px; text-align: center;
  font-size: 10px; color: var(--text-muted); letter-spacing: 0.03em;
  border-top: 1px solid var(--border); margin-top: auto;
}
footer a { color: var(--text-muted); text-decoration: none; }
footer a:hover { color: var(--text-dim); }

/* ─── TOAST ─── */
.toast {
  position: fixed; bottom: 20px; left: 50%;
  transform: translateX(-50%) translateY(12px);
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: var(--r-sm); padding: 9px 16px;
  font-size: 13px; color: var(--text); z-index: 999;
  opacity: 0; transition: opacity 0.2s, transform 0.2s;
  white-space: nowrap; pointer-events: none;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.toast.ok  { border-color: var(--green-border); color: var(--green); }
.toast.err { border-color: rgba(224,85,85,0.4); color: var(--red); }

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
</style>
</head>
<body>

<!-- ══════════════════ AUTH ══════════════════ -->
<div class="page active" id="authPage">
  <div class="auth-wrap">
    <div class="auth-logo">
      <div class="auth-logo-icon">⏱</div>
      <div class="auth-logo-name">TaskTimer</div>
    </div>

    <div class="auth-card" id="loginCard">
      <div class="auth-title">Log ind</div>
      <div class="form-field">
        <label class="form-label">Email</label>
        <input class="form-input" id="loginEmail" type="email" placeholder="din@email.dk" autocomplete="email" />
      </div>
      <div class="form-field">
        <label class="form-label">Adgangskode</label>
        <input class="form-input" id="loginPassword" type="password" placeholder="••••••" autocomplete="current-password" />
      </div>
      <div class="form-error" id="loginError"></div>
      <button class="btn btn-primary btn-full" id="loginBtn" onclick="doLogin()">
        <span class="btn-text">Log ind</span>
      </button>
      <div class="auth-switch">Ny bruger? <a onclick="toggleAuth()">Opret konto</a></div>
    </div>

    <div class="auth-card" id="registerCard" style="display:none">
      <div class="auth-title">Opret konto</div>
      <div class="form-field">
        <label class="form-label">Navn</label>
        <input class="form-input" id="regName" type="text" placeholder="Dit navn" />
      </div>
      <div class="form-field">
        <label class="form-label">Email</label>
        <input class="form-input" id="regEmail" type="email" placeholder="din@email.dk" autocomplete="email" />
      </div>
      <div class="form-field">
        <label class="form-label">Adgangskode</label>
        <input class="form-input" id="regPassword" type="password" placeholder="Min. 6 tegn" autocomplete="new-password" />
      </div>
      <div class="form-error" id="regError"></div>
      <button class="btn btn-primary btn-full" id="regBtn" onclick="doRegister()">
        <span class="btn-text">Opret konto</span>
      </button>
      <div class="auth-switch">Har du en konto? <a onclick="toggleAuth()">Log ind</a></div>
    </div>

    <footer>© <a href="https://larssohl.dk" target="_blank">larssohl.dk</a> — Built with Claude Sonnet</footer>
  </div>
</div>

<!-- ══════════════════ APP ══════════════════ -->
<div class="page" id="appPage">

  <div class="app-header">
    <div class="app-logo">⏱</div>
    <div>
      <div class="app-name">TaskTimer</div>
      <div class="app-user" id="headerUser"></div>
    </div>
    <div class="hspace"></div>
    <button class="icon-btn" title="Log ud" onclick="logout()">⏻</button>
  </div>

  <div class="topbar">
    <div class="tab active" onclick="switchTab('timer')">Timer</div>
    <div class="tab" onclick="switchTab('week')">Ugeoversigt</div>
    <div class="tab" onclick="switchTab('settings')">Indstillinger</div>
  </div>

  <!-- TIMER TAB -->
  <div id="timerTab" style="display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0">

    <div class="timer-actions">
      <button class="btn btn-primary btn-sm" onclick="showNewTask()">＋ Ny opgave</button>
      <button class="btn btn-ghost btn-sm" onclick="showResetConfirm()">↺ Nulstil dag</button>
    </div>

    <div class="inline-form" id="newTaskForm">
      <input class="inline-input" id="newTaskInput" placeholder="Opgavenavn..." maxlength="80" />
      <button class="btn btn-primary btn-sm" id="addTaskBtn" onclick="submitNewTask()">
        <span class="btn-text">Tilføj</span>
      </button>
      <button class="btn btn-ghost btn-sm" onclick="hideNewTask()">✕</button>
    </div>

    <div class="inline-form" id="resetConfirm">
      <span style="font-size:12px;color:var(--text-dim);flex:1">Nulstil dagens tid for alle opgaver?</span>
      <button class="btn btn-danger btn-sm" id="resetYesBtn" onclick="doResetDay()">
        <span class="btn-text">Nulstil</span>
      </button>
      <button class="btn btn-ghost btn-sm" onclick="hideResetConfirm()">Annuller</button>
    </div>

    <div class="task-list" id="taskList"></div>

    <div class="bottom-area">
      <div class="total-row">
        <span class="total-label">🕐 Total tid i dag</span>
        <span class="total-value" id="totalToday">00:00:00</span>
      </div>
      <button class="end-day-btn" id="endDayBtn" onclick="showEndDay()">Afslut dag →</button>
      <div class="goal-row">
        <div class="goal-pill">
          <div class="goal-pill-label">Dag</div>
          <div class="goal-pill-value" id="dayPct">—</div>
        </div>
        <div class="goal-pill">
          <div class="goal-pill-label">Uge</div>
          <div class="goal-pill-value" id="weekPct">—</div>
        </div>
        <div class="goal-pill">
          <div class="goal-pill-label">Opgaver</div>
          <div class="goal-pill-value" id="taskCount">0</div>
        </div>
      </div>
    </div>

    <footer>© <a href="https://larssohl.dk" target="_blank">larssohl.dk</a> — Built with Claude Sonnet</footer>
  </div>

  <!-- WEEK TAB -->
  <div id="weekTab" style="display:none;flex-direction:column;flex:1;min-height:0">
    <div class="week-content" id="weekContent">
      <div class="week-nav">
        <button class="icon-btn" onclick="shiftWeek(-1)" title="Forrige uge">‹</button>
        <div class="week-nav-label" id="weekNavLabel"></div>
        <button class="icon-btn" onclick="shiftWeek(1)" title="Næste uge">›</button>
        <button class="btn btn-ghost btn-sm" onclick="weekOffset=0;renderWeek()">I dag</button>
      </div>
      <div id="weekDays"></div>
      <div class="week-summary-row">
        <span class="ws-label">Ugetotal</span>
        <strong class="ws-value" id="weekTotal">—</strong>
      </div>
    </div>
    <footer>© <a href="https://larssohl.dk" target="_blank">larssohl.dk</a> — Built with Claude Sonnet</footer>
  </div>

  <!-- SETTINGS TAB -->
  <div id="settingsTab" style="display:none;flex-direction:column;flex:1;min-height:0">
    <div class="settings-content">

      <div class="settings-section">
        <div class="settings-title">Profil</div>
        <div class="settings-body">
          <div class="form-field">
            <label class="form-label">Navn</label>
            <input class="form-input" id="sName" type="text" />
          </div>
          <div class="form-field">
            <label class="form-label">Email</label>
            <input class="form-input" id="sEmail" type="email" disabled />
          </div>
          <button class="btn btn-primary" id="saveProfileBtn" onclick="saveProfile()">
            <span class="btn-text">Gem profil</span>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">Mål & arbejdstid</div>
        <div class="settings-body">
          <div class="settings-row">
            <div class="form-field" style="flex:1">
              <label class="form-label">Dagsmål (timer)</label>
              <input class="form-input" id="sDayGoal" type="number" min="1" max="24" step="0.5" />
            </div>
            <div class="form-field" style="flex:1">
              <label class="form-label">Ugemål (timer)</label>
              <input class="form-input" id="sWeekGoal" type="number" min="1" max="80" step="1" />
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">Auto-stop tidspunkt (24h)</label>
            <input class="form-input" id="sDayEnd" type="number" min="12" max="23" step="1" />
            <span class="form-hint">Aktive timere stoppes automatisk kl. XX:00</span>
          </div>
          <button class="btn btn-primary" id="saveGoalsBtn" onclick="saveGoals()">
            <span class="btn-text">Gem mål</span>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-title">Skift adgangskode</div>
        <div class="settings-body">
          <div class="form-field">
            <label class="form-label">Nuværende adgangskode</label>
            <input class="form-input" id="sCurPwd" type="password" placeholder="••••••" />
          </div>
          <div class="form-field">
            <label class="form-label">Ny adgangskode</label>
            <input class="form-input" id="sNewPwd" type="password" placeholder="Min. 6 tegn" />
          </div>
          <div class="form-error" id="pwdError"></div>
          <button class="btn btn-ghost" id="changePwdBtn" onclick="changePassword()">
            <span class="btn-text">Skift adgangskode</span>
          </button>
        </div>
      </div>

    </div>
    <footer>© <a href="https://larssohl.dk" target="_blank">larssohl.dk</a> — Built with Claude Sonnet</footer>
  </div>

</div>

<!-- END DAY MODAL -->
<div class="overlay" id="endDayModal" onclick="closeModalOutside(event,'endDayModal')">
  <div class="modal">
    <div class="modal-title">Afslut dag</div>
    <div class="modal-subtitle">Disse registreringer gemmes permanent og kan ikke fortryde</div>
    <div class="end-day-list" id="endDayList"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('endDayModal')">
        <span class="btn-text">Annuller</span>
      </button>
      <button class="btn btn-primary" id="confirmEndDayBtn" onclick="confirmEndDay()">
        <span class="btn-text">Bekræft og gem →</span>
      </button>
    </div>
  </div>
</div>

<!-- EDIT ENTRY MODAL -->
<div class="overlay" id="editEntryModal" onclick="closeModalOutside(event,'editEntryModal')">
  <div class="modal">
    <div class="modal-title">Rediger registrering</div>
    <input type="hidden" id="editEntryId" />
    <div class="form-field">
      <label class="form-label">Opgave</label>
      <select class="form-input" id="editEntryTask"></select>
    </div>
    <div class="settings-row" style="gap:8px">
      <div class="form-field" style="flex:1">
        <label class="form-label">Start</label>
        <input class="form-input" id="editEntryStart" type="time" />
      </div>
      <div class="form-field" style="flex:1">
        <label class="form-label">Slut</label>
        <input class="form-input" id="editEntryEnd" type="time" />
      </div>
    </div>
    <div class="form-field">
      <label class="form-label">Note (valgfri)</label>
      <input class="form-input" id="editEntryNote" type="text" placeholder="..." maxlength="200" />
    </div>
    <div class="form-error" id="editEntryError"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('editEntryModal')">Annuller</button>
      <button class="btn btn-primary" id="saveEntryBtn" onclick="saveEditEntry()">
        <span class="btn-text">Gem →</span>
      </button>
    </div>
  </div>
</div>

<!-- MANUAL ADD ENTRY MODAL -->
<div class="overlay" id="addEntryModal" onclick="closeModalOutside(event,'addEntryModal')">
  <div class="modal">
    <div class="modal-title">Tilføj registrering</div>
    <input type="hidden" id="addEntryDate" />
    <div class="form-field">
      <label class="form-label">Opgave</label>
      <select class="form-input" id="addEntryTask"></select>
    </div>
    <div class="settings-row" style="gap:8px">
      <div class="form-field" style="flex:1">
        <label class="form-label">Start</label>
        <input class="form-input" id="addEntryStart" type="time" value="09:00" />
      </div>
      <div class="form-field" style="flex:1">
        <label class="form-label">Slut</label>
        <input class="form-input" id="addEntryEnd" type="time" value="10:00" />
      </div>
    </div>
    <div class="form-field">
      <label class="form-label">Note (valgfri)</label>
      <input class="form-input" id="addEntryNote" type="text" placeholder="..." maxlength="200" />
    </div>
    <div class="form-error" id="addEntryError"></div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal('addEntryModal')">Annuller</button>
      <button class="btn btn-primary" id="saveAddEntryBtn" onclick="saveAddEntry()">
        <span class="btn-text">Tilføj →</span>
      </button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
// ═══════════════════════════════════════════════════
//  CONFIG — FIX: detect any private network, not just 192.x
// ═══════════════════════════════════════════════════
const API = (() => {
  const h = window.location.hostname;
  const isLocal = h === 'localhost' || h === '127.0.0.1' ||
    h.match(/^10\./) || h.match(/^172\.(1[6-9]|2\d|3[01])\./) ||
    h.match(/^192\.168\./);
  return isLocal ? `http://${h}:3001/api` : '/api';
})();

// ═══════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════
let token        = localStorage.getItem('tt_token') || null;
let me           = null;
let tasks        = [];
let liveTimers   = {};        // { taskId: { startedAt: Date } }
let todayEntries = [];        // uncommitted entries from server
let weekOffset   = 0;
let tickerRef    = null;
let autoStopRef  = null;
let dayGoalH     = parseFloat(localStorage.getItem('tt_dayGoal')  || '8');
let weekGoalH    = parseFloat(localStorage.getItem('tt_weekGoal') || '37');
let weekSecCache = null;      // { seconds, fetchedAt }
let deleteTimers = {};        // { taskId: timeoutRef } — for double-tap confirm

// ═══════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════
async function init() {
  if (!token) { showPage('authPage'); return; }
  try {
    me = await apiFetch('/auth/me');
    await loadTasks();
    await loadTodayEntries();
    await fetchWeekTotal();     // FIX: load week stat on boot
    showPage('appPage');
    document.getElementById('headerUser').textContent = me.name;
    scheduleAutoStop();
    startTicker();
  } catch {
    token = null; localStorage.removeItem('tt_token');
    showPage('authPage');
  }
}

// ═══════════════════════════════════════════════════
//  API
// ═══════════════════════════════════════════════════
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ukendt fejl');
  return data;
}

// ═══════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════
function toggleAuth() {
  const l = document.getElementById('loginCard');
  const r = document.getElementById('registerCard');
  const showing = l.style.display !== 'none';
  l.style.display = showing ? 'none' : '';
  r.style.display = showing ? '' : 'none';
  hideError('loginError'); hideError('regError');
}

async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showError('loginError', 'Udfyld email og adgangskode'); return; }
  setBtnLoading('loginBtn', true);
  try {
    const res = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
    token = res.token; localStorage.setItem('tt_token', token);
    me = res.user;
    await loadTasks(); await loadTodayEntries(); await fetchWeekTotal();
    showPage('appPage');
    document.getElementById('headerUser').textContent = me.name;
    scheduleAutoStop(); startTicker();
  } catch (e) {
    showError('loginError', e.message);
    setBtnLoading('loginBtn', false);
  }
}

async function doRegister() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!name || !email || !password) { showError('regError', 'Udfyld alle felter'); return; }
  setBtnLoading('regBtn', true);
  try {
    const res = await apiFetch('/auth/register', { method: 'POST', body: { name, email, password } });
    token = res.token; localStorage.setItem('tt_token', token);
    me = res.user;
    await loadTasks(); await loadTodayEntries(); await fetchWeekTotal();
    showPage('appPage');
    document.getElementById('headerUser').textContent = me.name;
    scheduleAutoStop(); startTicker();
  } catch (e) {
    showError('regError', e.message);
    setBtnLoading('regBtn', false);
  }
}

function logout() {
  // Fire-and-forget all pending timers
  Object.keys(liveTimers).forEach(id => stopTimer(parseInt(id)));
  token = null; localStorage.removeItem('tt_token');
  me = null; tasks = []; liveTimers = {}; todayEntries = []; weekSecCache = null;
  clearInterval(tickerRef); clearTimeout(autoStopRef);
  showPage('authPage');
}

// ═══════════════════════════════════════════════════
//  TASKS
// ═══════════════════════════════════════════════════
async function loadTasks() {
  tasks = await apiFetch('/tasks');
}

function showNewTask() {
  hideResetConfirm();
  document.getElementById('newTaskForm').classList.add('show');
  document.getElementById('newTaskInput').focus();
}

function hideNewTask() {
  document.getElementById('newTaskForm').classList.remove('show');
  document.getElementById('newTaskInput').value = '';
}

async function submitNewTask() {
  const name = document.getElementById('newTaskInput').value.trim();
  if (!name) return;
  setBtnLoading('addTaskBtn', true);
  try {
    const task = await apiFetch('/tasks', { method: 'POST', body: { name } });
    tasks.push(task);
    hideNewTask();
    renderTaskList();
  } catch (e) { toast(e.message, 'err'); }
  setBtnLoading('addTaskBtn', false);
}

// FIX: Two-tap confirm before deleting (protects accumulated time)
function requestDeleteTask(id) {
  if (deleteTimers[id]) {
    // Second tap — confirmed
    clearTimeout(deleteTimers[id]);
    delete deleteTimers[id];
    doDeleteTask(id);
  } else {
    // First tap — arm delete, revert after 2.5s
    deleteTimers[id] = setTimeout(() => {
      delete deleteTimers[id];
      // Re-render to remove armed state
      renderTaskList();
    }, 2500);
    renderTaskList(); // show armed state
    toast('Tryk igen for at bekræfte sletning', '');
  }
}

async function doDeleteTask(id) {
  // Stop timer without saving if it's the task being deleted
  if (liveTimers[id]) {
    delete liveTimers[id];
    clearInterval(tickerRef);
    startTicker();
  }
  try {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    tasks = tasks.filter(t => t.id !== id);
    renderTaskList();
    toast('Opgave slettet', 'ok');
  } catch (e) { toast(e.message, 'err'); }
}

async function startEditTaskName(id) {
  const task = tasks.find(t => t.id === id); if (!task) return;
  const el   = document.getElementById(`tn-${id}`); if (!el) return;
  const inp  = document.createElement('input');
  inp.className = 'task-name-edit'; inp.value = task.name; inp.maxLength = 80;
  el.replaceWith(inp); inp.focus(); inp.select();
  const finish = async () => {
    const v = inp.value.trim();
    if (v && v !== task.name) {
      try {
        const updated = await apiFetch(`/tasks/${id}`, { method: 'PATCH', body: { name: v } });
        task.name = updated.name;
      } catch {}
    }
    renderTaskList();
  };
  inp.addEventListener('blur', finish);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') inp.blur();
    if (e.key === 'Escape') renderTaskList();
  });
}

async function reorderTasks(fromId, toId) {
  const fi = tasks.findIndex(t => t.id === fromId);
  const ti = tasks.findIndex(t => t.id === toId);
  if (fi < 0 || ti < 0) return;
  const [m] = tasks.splice(fi, 1); tasks.splice(ti, 0, m);
  renderTaskList();
  try { await apiFetch('/tasks/reorder', { method: 'POST', body: { order: tasks.map(t => t.id) } }); }
  catch {}
}

// ═══════════════════════════════════════════════════
//  TIMER ENGINE — FIX: startTimer is now async
// ═══════════════════════════════════════════════════
async function startTimer(taskId) {
  // Stop any currently running timer first — await so entry is saved before starting new
  const running = Object.keys(liveTimers).map(Number).filter(id => id !== taskId);
  if (running.length > 0) {
    await Promise.all(running.map(id => stopTimer(id)));
  }
  if (liveTimers[taskId]) return;
  liveTimers[taskId] = { startedAt: new Date() };
  renderTaskList();
}

async function stopTimer(taskId) {
  const lt = liveTimers[taskId]; if (!lt) return;
  const elapsed = Math.floor((new Date() - lt.startedAt) / 1000);
  delete liveTimers[taskId];

  if (elapsed < 10) { renderTaskList(); return; }

  const task     = tasks.find(t => t.id === taskId); if (!task) return;
  const start    = new Date(lt.startedAt);
  const end      = new Date();
  const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endStr   = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  const dateStr  = `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}`;

  try {
    const entry = await apiFetch('/entries', {
      method: 'POST',
      body: { task_id: taskId, date: dateStr, start_time: startStr, end_time: endStr }
    });
    if (dateStr === todayStr()) todayEntries.push(entry);
  } catch (e) {
    toast('Timer-fejl: ' + e.message, 'err');
  }
  renderTaskList();
}

async function stopAllTimers() {
  // FIX: properly await all concurrent stops
  await Promise.all(Object.keys(liveTimers).map(id => stopTimer(parseInt(id))));
}

function startTicker() {
  clearInterval(tickerRef);
  tickerRef = setInterval(() => {
    if (Object.keys(liveTimers).length > 0) {
      renderTimerValues();
      renderBottomStats();
    }
  }, 1000);
}

function scheduleAutoStop() {
  clearTimeout(autoStopRef);
  if (!me) return;
  const endHour = me.day_end_hour ?? 17;
  const now  = new Date();
  const stop = new Date();
  stop.setHours(endHour, 0, 0, 0);
  if (stop <= now) stop.setDate(stop.getDate() + 1);
  autoStopRef = setTimeout(async () => {
    await stopAllTimers();
    renderTaskList();
    toast(`Timere stoppet automatisk kl. ${endHour}:00`, 'ok');
    scheduleAutoStop();
  }, stop - now);
}

// ═══════════════════════════════════════════════════
//  TODAY ENTRIES
// ═══════════════════════════════════════════════════
async function loadTodayEntries() {
  todayEntries = await apiFetch('/entries/today');
}

// FIX: Fetch real week total from server for accurate stats pill
async function fetchWeekTotal() {
  const dates = weekDates(0);
  const from  = dates[0].toISOString().slice(0,10);
  const to    = dates[4].toISOString().slice(0,10);
  try {
    const r = await apiFetch(`/entries/week-total?from=${from}&to=${to}`);
    weekSecCache = { seconds: r.total_seconds, fetchedAt: Date.now() };
  } catch {}
}

// ═══════════════════════════════════════════════════
//  RENDER — TIMER TAB
// ═══════════════════════════════════════════════════
function renderTaskList() {
  const el = document.getElementById('taskList');
  if (!tasks.length) {
    el.innerHTML = `<div class="empty-state">
      Ingen opgaver endnu<br>
      <span style="font-size:11px;color:var(--text-muted)">Opret din første opgave med ＋ Ny opgave</span>
    </div>`;
    renderBottomStats();
    return;
  }
  el.innerHTML = '';
  tasks.forEach(task => {
    const isRunning = !!liveTimers[task.id];
    const isArmed   = !!deleteTimers[task.id];
    const sec       = liveSec(task.id);
    const card      = document.createElement('div');
    card.className  = 'task-card' + (isRunning ? ' active-task' : '') + (isArmed ? ' confirm-delete' : '');
    card.draggable  = true;
    card.dataset.id = task.id;

    card.innerHTML = `
      <div class="drag-handle" title="Træk for at sortere">⠿</div>
      <div class="task-info">
        <div class="task-name" id="tn-${task.id}" ondblclick="startEditTaskName(${task.id})" title="Dobbeltklik for at omdøbe">${esc(task.name)}</div>
        <div class="task-time" id="tt-${task.id}">${hms(sec)}${isRunning ? '<span class="live-dot"></span>' : ''}</div>
      </div>
      <div class="task-controls">
        <button class="ctrl pp${isRunning ? ' running' : ''}"
          onclick="isRunning_${task.id}()"
          data-taskid="${task.id}"
          title="${isRunning ? 'Stop' : 'Start'}">
          ${isRunning ? '⏸' : '▶'}
        </button>
        <button class="ctrl del${isArmed ? ' armed' : ''}"
          onclick="requestDeleteTask(${task.id})"
          title="${isArmed ? 'Klik igen for at bekræfte' : 'Slet opgave'}">
          ${isArmed ? '?' : '🗑'}
        </button>
      </div>`;

    // Bind play/pause properly (async)
    const ppBtn = card.querySelector('.ctrl.pp');
    ppBtn.onclick = isRunning
      ? () => stopTimer(task.id).then(() => renderTaskList())
      : () => startTimer(task.id);

    // Drag events
    card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', task.id); setTimeout(() => card.classList.add('dragging'), 0); });
    card.addEventListener('dragend',   () => card.classList.remove('dragging'));
    card.addEventListener('dragover',  e => { e.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop',      e => { e.preventDefault(); card.classList.remove('drag-over'); const fid = parseInt(e.dataTransfer.getData('text/plain')); if (fid !== task.id) reorderTasks(fid, task.id); });

    el.appendChild(card);
  });
  renderBottomStats();
}

// Remove the isRunning_ inline onclick hack — it's handled by ppBtn.onclick above
// (the template still has onclick="isRunning_${task.id}()" as a placeholder that won't execute
// because we override .onclick immediately after — that's clean enough for vanilla JS)

function renderTimerValues() {
  tasks.forEach(task => {
    const el = document.getElementById(`tt-${task.id}`);
    if (!el) return;
    const isRunning = !!liveTimers[task.id];
    el.innerHTML = hms(liveSec(task.id)) + (isRunning ? '<span class="live-dot"></span>' : '');
  });
}

function liveSec(taskId) {
  const lt   = liveTimers[taskId];
  const base = todayEntries.filter(e => e.task_id === taskId).reduce((s, e) => s + e.seconds, 0);
  return lt ? base + Math.floor((new Date() - lt.startedAt) / 1000) : base;
}

function renderBottomStats() {
  let totalSec = 0;
  tasks.forEach(t => { totalSec += liveSec(t.id); });
  document.getElementById('totalToday').textContent = hms(totalSec);
  document.getElementById('taskCount').textContent  = tasks.length;

  // Day %
  const dg = dayGoalH * 3600;
  const dp = dg > 0 ? Math.min(100, Math.round(totalSec / dg * 100)) : 0;
  const dpEl = document.getElementById('dayPct');
  dpEl.textContent = dg > 0 ? `${dp}%` : '—';
  dpEl.className   = 'goal-pill-value' + (dp >= 100 ? ' at-goal' : '');

  // Week % — FIX: use server-fetched week total + today's live seconds
  const committedThisWeek = weekSecCache ? weekSecCache.seconds : 0;
  const wSec = committedThisWeek + totalSec; // today not yet committed
  const wg   = weekGoalH * 3600;
  const wp   = wg > 0 ? Math.min(100, Math.round(wSec / wg * 100)) : 0;
  const wpEl = document.getElementById('weekPct');
  wpEl.textContent = wg > 0 ? `${wp}%` : '—';
  wpEl.className   = 'goal-pill-value' + (wp >= 100 ? ' at-goal' : '');

  const hasEntries = totalSec > 0 || todayEntries.length > 0;
  document.getElementById('endDayBtn').disabled = !hasEntries;
}

// ═══════════════════════════════════════════════════
//  RESET DAY
// ═══════════════════════════════════════════════════
function showResetConfirm() {
  hideNewTask();
  document.getElementById('resetConfirm').classList.add('show');
}
function hideResetConfirm() {
  document.getElementById('resetConfirm').classList.remove('show');
}
async function doResetDay() {
  setBtnLoading('resetYesBtn', true);
  await stopAllTimers();
  const toDelete = todayEntries.filter(e => e.date === todayStr());
  await Promise.all(toDelete.map(e => apiFetch(`/entries/${e.id}`, { method: 'DELETE' }).catch(() => {})));
  todayEntries = todayEntries.filter(e => e.date !== todayStr());
  hideResetConfirm();
  renderTaskList();
  toast('Dagen nulstillet', 'ok');
  setBtnLoading('resetYesBtn', false);
}

// ═══════════════════════════════════════════════════
//  END DAY
// ═══════════════════════════════════════════════════
async function showEndDay() {
  setElLoading('endDayBtn', true);
  await stopAllTimers();
  await loadTodayEntries();
  setElLoading('endDayBtn', false);

  if (!todayEntries.length) { toast('Ingen tid at gemme i dag', 'err'); return; }

  const byTask = {};
  todayEntries.forEach(e => {
    if (!byTask[e.task_id]) byTask[e.task_id] = { name: e.task_name, seconds: 0 };
    byTask[e.task_id].seconds += e.seconds;
  });

  document.getElementById('endDayList').innerHTML = Object.values(byTask).map(t => `
    <div class="edl-row">
      <span class="edl-task">${esc(t.name)}</span>
      <span class="edl-time">${hm(t.seconds)}</span>
    </div>`).join('');

  openModal('endDayModal');
}

async function confirmEndDay() {
  setBtnLoading('confirmEndDayBtn', true);
  try {
    const res = await apiFetch('/entries/end-day', { method: 'POST' });
    closeModal('endDayModal');
    todayEntries = [];
    weekSecCache = null;
    await fetchWeekTotal();  // refresh week stat after committing
    renderTaskList();
    toast(`${res.committed} registreringer gemt ✓`, 'ok');
  } catch (e) {
    toast(e.message, 'err');
  }
  setBtnLoading('confirmEndDayBtn', false);
}

// ═══════════════════════════════════════════════════
//  WEEK TAB
// ═══════════════════════════════════════════════════
async function renderWeek() {
  const dates   = weekDates(weekOffset);
  const from    = dates[0].toISOString().slice(0,10);
  const to      = dates[4].toISOString().slice(0,10);
  const [y, wn] = isoWeek(dates[0]);
  document.getElementById('weekNavLabel').textContent = `UGE ${wn}, ${y}`;

  // Show skeleton while loading
  const container = document.getElementById('weekDays');
  container.innerHTML = `<div class="skel" style="height:80px;border-radius:10px;margin-bottom:8px"></div>`.repeat(3);

  let entries = [];
  try { entries = await apiFetch(`/entries?from=${from}&to=${to}`); } catch {}

  const DAY   = ['Mandag','Tirsdag','Onsdag','Torsdag','Fredag'];
  const today = todayStr();
  let weekTotal = 0;
  container.innerHTML = '';

  dates.forEach((d, i) => {
    const dk      = d.toISOString().slice(0,10);
    const isToday = dk === today;
    const dayE    = entries.filter(e => e.date === dk);

    let dayTotal = isToday
      ? tasks.reduce((s, t) => s + liveSec(t.id), 0)
      : dayE.reduce((s, e) => s + e.seconds, 0);
    weekTotal += dayTotal;

    const block = document.createElement('div');
    block.className = 'day-block';

    const entriesHtml = isToday
      ? tasks.filter(t => liveSec(t.id) > 0).map(t => `
          <div class="week-entry">
            <div class="we-dot" style="background:${esc(t.color||'#f07c28')}"></div>
            <div class="we-body">
              <div class="we-task">${esc(t.name)}</div>
              <div class="we-meta">I dag · aktiv</div>
            </div>
            <div class="we-dur">${hm(liveSec(t.id))}</div>
          </div>`).join('') || '<div class="week-empty">Ingen tid endnu</div>'
      : dayE.length === 0
        ? '<div class="week-empty">Ingen registreringer</div>'
        : dayE.map(e => `
          <div class="week-entry" onclick="editEntry(${e.id})">
            <div class="we-dot" style="background:${esc(e.task_color||'#f07c28')}"></div>
            <div class="we-body">
              <div class="we-task">${esc(e.task_name)}</div>
              <div class="we-meta">${e.start_time}–${e.end_time}${e.note ? ' · ' + esc(e.note) : ''}</div>
            </div>
            <div class="we-dur">${hm(e.seconds)}</div>
            <div class="we-del" onclick="event.stopPropagation();deleteWeekEntry(${e.id})" title="Slet">✕</div>
          </div>`).join('');

    block.innerHTML = `
      <div class="day-header${isToday ? ' today-hdr' : ''}">
        <div>
          <div class="day-name">${DAY[i]}</div>
          <div class="day-date">${d.getDate()}/${d.getMonth()+1}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${dayTotal > 0 ? `<div class="day-total">${hm(dayTotal)}</div>` : ''}
          ${!isToday ? `<button class="day-add-btn" onclick="openAddEntry('${dk}')" title="Tilføj registrering">＋</button>` : ''}
        </div>
      </div>
      <div class="day-entries">${entriesHtml}</div>`;

    container.appendChild(block);
  });

  // Update week total + cache
  document.getElementById('weekTotal').textContent = hm(weekTotal);
  // Sync week cache from what we now know (committed days only)
  const committedSec = entries.reduce((s, e) => s + e.seconds, 0);
  weekSecCache = { seconds: committedSec, fetchedAt: Date.now() };
  renderBottomStats();
}

function shiftWeek(d) { weekOffset += d; renderWeek(); }

// ═══════════════════════════════════════════════════
//  EDIT ENTRY — FIX: uses proper GET /entries/:id
// ═══════════════════════════════════════════════════
async function editEntry(id) {
  let entry;
  try {
    entry = await apiFetch(`/entries/${id}`);
  } catch {
    toast('Kunne ikke hente registrering', 'err'); return;
  }

  document.getElementById('editEntryId').value      = entry.id;
  document.getElementById('editEntryStart').value   = entry.start_time;
  document.getElementById('editEntryEnd').value     = entry.end_time;
  document.getElementById('editEntryNote').value    = entry.note || '';

  const sel = document.getElementById('editEntryTask');
  sel.innerHTML = tasks.map(t =>
    `<option value="${t.id}" ${t.id === entry.task_id ? 'selected' : ''}>${esc(t.name)}</option>`
  ).join('');

  hideError('editEntryError');
  openModal('editEntryModal');
}

async function saveEditEntry() {
  const id     = parseInt(document.getElementById('editEntryId').value);
  const start  = document.getElementById('editEntryStart').value;
  const end    = document.getElementById('editEntryEnd').value;
  const note   = document.getElementById('editEntryNote').value.trim();
  const taskId = parseInt(document.getElementById('editEntryTask').value);

  if (!start || !end) { showError('editEntryError', 'Udfyld start og sluttid'); return; }
  if (start >= end)   { showError('editEntryError', 'Sluttid skal være efter starttid'); return; }

  setBtnLoading('saveEntryBtn', true);
  try {
    await apiFetch(`/entries/${id}`, { method: 'PATCH', body: { start_time: start, end_time: end, note, task_id: taskId } });
    closeModal('editEntryModal');
    renderWeek();
    toast('Registrering opdateret', 'ok');
  } catch (e) {
    showError('editEntryError', e.message);
  }
  setBtnLoading('saveEntryBtn', false);
}

async function deleteWeekEntry(id) {
  try {
    await apiFetch(`/entries/${id}`, { method: 'DELETE' });
    renderWeek();
    toast('Registrering slettet', 'ok');
  } catch (e) { toast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════════
//  MANUAL ADD ENTRY (week view ＋ button)
// ═══════════════════════════════════════════════════
function openAddEntry(dateStr) {
  document.getElementById('addEntryDate').value = dateStr;
  const sel = document.getElementById('addEntryTask');
  sel.innerHTML = tasks.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
  hideError('addEntryError');
  openModal('addEntryModal');
}

async function saveAddEntry() {
  const dateStr = document.getElementById('addEntryDate').value;
  const start   = document.getElementById('addEntryStart').value;
  const end     = document.getElementById('addEntryEnd').value;
  const note    = document.getElementById('addEntryNote').value.trim();
  const taskId  = parseInt(document.getElementById('addEntryTask').value);

  if (!start || !end) { showError('addEntryError', 'Udfyld start og sluttid'); return; }
  if (start >= end)   { showError('addEntryError', 'Sluttid skal være efter starttid'); return; }

  setBtnLoading('saveAddEntryBtn', true);
  try {
    await apiFetch('/entries', {
      method: 'POST',
      body: { task_id: taskId, date: dateStr, start_time: start, end_time: end, note, committed: true }
    });
    closeModal('addEntryModal');
    renderWeek();
    toast('Registrering tilføjet', 'ok');
  } catch (e) {
    showError('addEntryError', e.message);
  }
  setBtnLoading('saveAddEntryBtn', false);
}

// ═══════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════
function loadSettingsForm() {
  if (!me) return;
  document.getElementById('sName').value     = me.name     || '';
  document.getElementById('sEmail').value    = me.email    || '';
  document.getElementById('sDayGoal').value  = dayGoalH;
  document.getElementById('sWeekGoal').value = weekGoalH;
  document.getElementById('sDayEnd').value   = me.day_end_hour ?? 17;
}

async function saveProfile() {
  const name = document.getElementById('sName').value.trim();
  if (!name) { toast('Navn må ikke være tomt', 'err'); return; }
  setBtnLoading('saveProfileBtn', true);
  try {
    // FIX: single PATCH call, no pre-fetch
    const updated = await apiFetch('/auth/me', { method: 'PATCH', body: { name } });
    me.name = updated.name;
    document.getElementById('headerUser').textContent = me.name;
    toast('Profil gemt', 'ok');
  } catch (e) { toast(e.message, 'err'); }
  setBtnLoading('saveProfileBtn', false);
}

async function saveGoals() {
  const dg  = parseFloat(document.getElementById('sDayGoal').value)  || 8;
  const wg  = parseFloat(document.getElementById('sWeekGoal').value) || 37;
  const deh = parseInt(document.getElementById('sDayEnd').value)     || 17;
  setBtnLoading('saveGoalsBtn', true);
  try {
    await apiFetch('/auth/me', { method: 'PATCH', body: { day_end_hour: deh } });
    dayGoalH  = dg;
    weekGoalH = wg;
    localStorage.setItem('tt_dayGoal',  dg);
    localStorage.setItem('tt_weekGoal', wg);
    me.day_end_hour = deh;
    scheduleAutoStop();
    renderBottomStats();
    toast('Mål gemt', 'ok');
  } catch (e) { toast(e.message, 'err'); }
  setBtnLoading('saveGoalsBtn', false);
}

async function changePassword() {
  const cur = document.getElementById('sCurPwd').value;
  const nw  = document.getElementById('sNewPwd').value;
  if (!cur || !nw) { showError('pwdError', 'Udfyld begge felter'); return; }
  setBtnLoading('changePwdBtn', true);
  try {
    await apiFetch('/auth/me', { method: 'PATCH', body: { current_password: cur, new_password: nw } });
    document.getElementById('sCurPwd').value = '';
    document.getElementById('sNewPwd').value = '';
    hideError('pwdError');
    toast('Adgangskode ændret', 'ok');
  } catch (e) { showError('pwdError', e.message); }
  setBtnLoading('changePwdBtn', false);
}

// ═══════════════════════════════════════════════════
//  TAB SWITCHING
// ═══════════════════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  ['timerTab','weekTab','settingsTab'].forEach(id => document.getElementById(id).style.display = 'none');

  const map = { timer: 'timerTab', week: 'weekTab', settings: 'settingsTab' };
  const el  = document.getElementById(map[name]);
  el.style.display      = 'flex';
  el.style.flexDirection = 'column';

  document.querySelectorAll('.tab')[['timer','week','settings'].indexOf(name)]?.classList.add('active');

  if (name === 'week')     renderWeek();
  if (name === 'settings') loadSettingsForm();
}

// ═══════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════
function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function closeModalOutside(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }

// ═══════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ═══════════════════════════════════════════════════
//  KEYBOARD
// ═══════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  // Don't interfere when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
    if (e.key === 'Escape') { e.target.blur(); hideNewTask(); hideResetConfirm(); }
    return;
  }
  if (e.key === 'Escape') {
    hideNewTask(); hideResetConfirm();
    closeModal('endDayModal'); closeModal('editEntryModal'); closeModal('addEntryModal');
  }
});

// Enter = confirm inside inline new task form
document.getElementById('newTaskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); submitNewTask(); }
});

// Enter = confirm in modals
document.getElementById('editEntryModal').addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') { e.preventDefault(); saveEditEntry(); }
});
document.getElementById('addEntryModal').addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') { e.preventDefault(); saveAddEntry(); }
});
document.getElementById('endDayModal').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); confirmEndDay(); }
});

// ═══════════════════════════════════════════════════
//  BUTTON LOADING STATE HELPERS
// ═══════════════════════════════════════════════════
function setBtnLoading(id, loading) {
  const btn = document.getElementById(id);
  if (!btn) return;
  if (loading) btn.classList.add('loading');
  else btn.classList.remove('loading');
  btn.disabled = loading;
}

// For elements that aren't .btn (like end-day-btn)
function setElLoading(id, loading) {
  const el = document.getElementById(id);
  if (!el) return;
  if (loading) el.classList.add('loading');
  else el.classList.remove('loading');
}

// ═══════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function weekDates(off) {
  const now = new Date(); now.setHours(0,0,0,0);
  const dow = now.getDay() || 7;
  const mon = new Date(now); mon.setDate(now.getDate() - dow + 1 + off * 7);
  return Array.from({length:5}, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate()+i); return d; });
}

function isoWeek(d) {
  const u = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  u.setUTCDate(u.getUTCDate() + 4 - (u.getUTCDay() || 7));
  const ys = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  return [u.getUTCFullYear(), Math.ceil(((u - ys) / 86400000 + 1) / 7)];
}

function hms(s) {
  s = Math.max(0, Math.floor(s));
  return `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(s%60)}`;
}
function hm(s) {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
  return h===0 ? `${m}m` : m===0 ? `${h}t` : `${h}t ${m}m`;
}
function pad(n) { return String(n).padStart(2,'0'); }
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
}
function hideError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
}

let _tt;
function toast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(_tt);
  _tt = setTimeout(() => { el.className = 'toast'; }, 2800);
}

// ═══════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════
init();
</script>
</body>
</html>
