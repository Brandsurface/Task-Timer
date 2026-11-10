// Drives the real TaskTimer app and records every UI state the video needs:
// a 2x screenshot, the tab title and the boxes of the elements we point at.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const URL = 'http://localhost:3001/';
const VW = 560, VH = 900;
fs.mkdirSync(OUT, { recursive: true });
const manifest = {};

let p;
const wait = ms => p.waitForTimeout(ms);
const card = name => p.locator('.task-card', { has: p.locator('.task-name', { hasText: name }) }).first();

async function box(target) {
  const loc = typeof target === 'string' ? p.locator(target).first() : target;
  try {
    const b = await loc.boundingBox({ timeout: 1500 });
    return b ? { x: b.x, y: b.y, w: b.width, h: b.height } : null;
  } catch { return null; }
}

async function snap(name, rects = {}) {
  const r = {};
  for (const [k, t] of Object.entries(rects)) r[k] = await box(t);
  await p.screenshot({ path: path.join(OUT, name + '.png') });
  manifest[name] = { title: await p.title(), rects: r };
  console.log('snap', name, manifest[name].title);
}

async function typeSnaps(sel, text, prefix, rects = {}, every = 1, settle = 60) {
  const el = p.locator(sel).first();
  for (let i = 0; i < text.length; i++) {
    await el.press(text[i] === ' ' ? 'Space' : text[i]).catch(async () => { await el.type(text[i]); });
    if ((i + 1) % every === 0 || i === text.length - 1) {
      await wait(settle);
      await snap(`${prefix}_${String(i + 1).padStart(2, '0')}`, rects);
    }
  }
}

async function ticks(prefix, n, rects = {}) {
  for (let i = 1; i <= n; i++) { await p.clock.runFor(1000); await wait(120); await snap(`${prefix}_${String(i).padStart(2, '0')}`, rects); }
}

async function openTab(tab) {
  await p.click('#burgerBtn'); await wait(450);
  await p.click(`.drawer-item[data-tab="${tab}"]`); await wait(900);
}

async function settingsTo(title) {
  await p.evaluate(t => {
    const s = [...document.querySelectorAll('#settingsTab .settings-title')].find(e => e.textContent.trim() === t);
    s.closest('.settings-section').scrollIntoView({ block: 'start' });
    s.closest('.settings-content').scrollTop -= 8;
  }, title);
  await wait(300);
}
const section = t => p.locator('#settingsTab .settings-section', { has: p.locator('.settings-title', { hasText: t }) }).first();

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, timezoneId: 'Europe/Copenhagen', locale: 'da-DK' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://localhost:3001' });
  p = await ctx.newPage();
  // Fake clock pinned to 10:05:14 Copenhagen time today, paused, so every second is under our control
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Copenhagen' });
  const off = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen', timeZoneName: 'shortOffset' }).match(/GMT([+-]\d+)/)[1];
  const start = new Date(`${today}T10:05:14${off.startsWith('-') ? '-' : '+'}${String(Math.abs(+off)).padStart(2, '0')}:00`);
  await p.clock.install({ time: start });
  await p.clock.pauseAt(new Date(start.getTime() + 1000));

  const tick = async ms => { await p.clock.runFor(ms); };
  // keep the app's own timers flowing while we wait for network
  const settle = async ms => { await p.clock.runFor(ms); await wait(ms); };

  // ── LOGIN ──
  await p.goto(URL); await settle(1200);
  await p.evaluate(() => document.fonts.ready);
  const loginRects = { email: '#loginEmail', pwd: '#loginPassword', remember: '.remember-row', signin: '#loginBtn', card: '.auth-card' };
  await snap('login_00', loginRects);
  await p.click('#loginEmail');
  await typeSnaps('#loginEmail', 'mia@studio-demo.dk', 'login_e', loginRects, 1, 30);
  await p.click('#loginPassword');
  await typeSnaps('#loginPassword', 'demo1234', 'login_p', loginRects, 1, 30);
  await p.locator('.remember-row').first().click(); await settle(300);
  await snap('login_r', loginRects);
  await p.click('#loginBtn'); await settle(1800);

  const mainRects = {
    newTask: '#newTaskBtn', resetDay: '#resetDayBtn', select: '#selectModeBtn', list: '#taskList',
    total: '.total-bar, .total-row, #totalToday', endDay: '#endDayBtn', stats: '.goal-pills, .goal-row',
    burger: '#burgerBtn', theme: '#themeToggleBtn',
    c1: '.task-card >> nth=0', c2: '.task-card >> nth=1', c3: '.task-card >> nth=2', c4: '.task-card >> nth=3', c5: '.task-card >> nth=4', c6: '.task-card >> nth=5', c7: '.task-card >> nth=6',
  };
  await snap('main_00', mainRects);

  // ── NEW TASK + SUGGESTIONS ──
  await p.click('#newTaskBtn'); await settle(400);
  const ntRects = { ...mainRects, input: '#newTaskInput', add: '#addTaskBtn', sug0: '#taskSuggest .suggest-item >> nth=0', sugList: '#taskSuggest' };
  await snap('new_00', ntRects);
  for (const [i, ch] of [...'Bølg'].entries()) {
    await p.locator('#newTaskInput').type(ch); await settle(450);
    await snap(`new_t${i + 1}`, ntRects);
  }
  await p.hover('#taskSuggest .suggest-item >> nth=0'); await settle(200);
  await snap('new_hover', ntRects);
  await p.click('#taskSuggest .suggest-item >> nth=0'); await settle(500);
  await snap('new_picked', ntRects);
  if (await p.locator('#newTaskInput').isVisible()) { await p.click('#addTaskBtn'); await settle(900); }
  await snap('new_added', { ...mainRects, newCard: card('Bølgen'), newType: card('Bølgen').locator('.task-type-select'), newPlay: card('Bølgen').locator('.ctrl.pp') });

  // ── WORK AREA ──
  const b = card('Bølgen');
  const typeOpts = await b.locator('.task-type-select option').allTextContents();
  manifest._typeOptions = typeOpts;
  await b.locator('.task-type-select').selectOption({ label: 'Print' }); await settle(700);
  await snap('area_print', { ...mainRects, newCard: b, newType: b.locator('.task-type-select'), newPlay: b.locator('.ctrl.pp') });
  await b.locator('.task-type-select').selectOption({ label: 'Design' }); await settle(700);
  await snap('area_design', { ...mainRects, newCard: b, newType: b.locator('.task-type-select'), newPlay: b.locator('.ctrl.pp') });

  // ── START TIMER ──
  // a new job starts its timer automatically — no extra click
  const runRects = () => ({ ...mainRects, newCard: card('Bølgen'), newPlay: card('Bølgen').locator('.ctrl.pp'), newTime: card('Bølgen').locator('.task-time'),
    fjCard: card('Fjordbryg'), fjPlay: card('Fjordbryg').locator('.ctrl.pp'), fjTime: card('Fjordbryg').locator('.task-time') });
  await snap('run_00', runRects());
  await ticks('run', 6, runRects());
  await tick(24 * 60 * 1000); await wait(150);
  await snap('run_ff', runRects());
  await ticks('runff', 3, runRects());

  // ── SWITCH: start another job lower in the list (slides to top) ──
  await card('Fjordbryg').locator('.ctrl.pp').click();
  for (let i = 0; i < 6; i++) { await wait(110); await p.screenshot({ path: path.join(OUT, `switch_m${i}.png`) }); manifest[`switch_m${i}`] = { title: await p.title(), rects: {} }; }
  await settle(900);
  await snap('switch_00', runRects());
  await ticks('switch', 4, runRects());
  await tick(71 * 60 * 1000); await wait(150);
  await snap('switch_ff', runRects());
  await card('Fjordbryg').locator('.ctrl.pp').click(); await settle(1200);
  await snap('stopped', runRects());

  // ── END DAY ──
  await p.click('#endDayBtn'); await settle(700);
  await snap('endday_00', { modal: '#endDayModal .modal', confirm: '#confirmEndDayBtn', cancel: '#cancelEndDayBtn', list: '#endDayModal .modal' });
  await p.click('#confirmEndDayBtn'); await settle(1400);
  await snap('endday_done', { ...mainRects, toast: '#toast' });
  await settle(3200);
  await snap('endday_after', mainRects);

  // ── WEEK ──
  await p.click('#weekPillBtn'); await settle(1100);
  const weekRects = { nav: '.week-nav', prev: '#prevWeekBtn', next: '#nextWeekBtn', mon: '.day-block >> nth=0', tue: '.today-hdr', g0: '.today-hdr ~ * .we-group >> nth=0', group: '.we-group >> nth=0', summary: '.week-summary-row' };
  await snap('week_00', weekRects);
  const grp = p.locator('.we-group').first();
  manifest._weekGroupCount = await p.locator('.we-group').count();
  if (await grp.count()) { await grp.click(); await settle(500); }
  await snap('week_open', { ...weekRects, child: '.we-child >> nth=0' });

  // ── DRAWER + EXPORT ──
  await openTab('timer');
  await p.click('#burgerBtn'); await settle(500);
  await snap('drawer_00', { drawer: '.drawer', timer: '.drawer-item[data-tab="timer"]', week: '.drawer-item[data-tab="week"]', box: '.drawer-item[data-tab="box"]', settings: '.drawer-item[data-tab="settings"]', shortcuts: '#shortcutsDrawerBtn', export: '#exportDrawerBtn', bg: '.drawer-item[data-tab="gradient"]', theme: '#drawerThemeBtn' });
  await p.click('#exportDrawerBtn'); await settle(700);
  const exRects = { modal: '#exportModal .modal', from: '#exportFrom', to: '#exportTo', cust: '#exportCustomer', pdf: '#exportGenerateBtn', csv: '#exportCsvBtn' };
  await snap('export_00', exRects);
  await p.click('#exportCustomer');
  await typeSnaps('#exportCustomer', '24117', 'export_t', exRects, 1, 40);
  await p.click('#exportCancelBtn'); await settle(500);

  // ── FEATURES: star, copy card, copy job number, budget ──
  const hv = card('Havnehuset');
  const hvRects = () => ({ ...mainRects, hv: card('Havnehuset'), star: card('Havnehuset').locator('.star-btn'), copy: card('Havnehuset').locator('.copy-btn'), dup: card('Havnehuset').locator('.dup-btn'), budget: card('Havnehuset').locator('.budget-btn'), toast: '#toast',
    nlBudget: card('Nordlys').locator('.budget-btn'), nl: card('Nordlys') });
  await snap('feat_00', hvRects());
  await hv.locator('.star-btn').click(); await settle(600);
  await snap('feat_star', hvRects());
  await hv.locator('.dup-btn').click(); await settle(900);
  await snap('feat_dup', { ...hvRects(), dupCard: '.task-card >> nth=1', dupType: p.locator('.task-card').nth(1).locator('.task-type-select') });
  await settle(3200);
  await hv.locator('.copy-btn').click(); await settle(400);
  await snap('feat_copyjob', hvRects());
  await settle(3200);

  await card('Nordlys').locator('.budget-btn').click(); await settle(600);
  await p.fill('#budgetModalHours', '');
  const bdRects = { modal: '#budgetModal .modal', hours: '#budgetModalHours', save: '#saveBudgetModalBtn' };
  await snap('budget_00', bdRects);
  await typeSnaps('#budgetModalHours', '12', 'budget_t', bdRects, 1, 40);
  await p.click('#saveBudgetModalBtn'); await settle(900);
  await snap('budget_done', { ...hvRects(), nlTime: card('Nordlys').locator('.task-time') });
  await settle(3200);

  // ── IDLE TIME ──
  await openTab('settings');
  await settingsTo('Start of day');
  const idleRects = () => ({ idleSec: section('Idle Time'), idleToggle: section('Idle Time').locator('.remember-track'), cleanSec: section('Start of day'), cleanToggle: section('Start of day').locator('.remember-track') });
  await snap('set_idle_00', idleRects());
  await section('Idle Time').locator('.remember-row').click(); await settle(900);
  await snap('set_idle_on', idleRects());
  await section('Start of day').locator('.remember-row').click(); await settle(900);
  await snap('set_clean_on', idleRects());
  await settle(3200);
  await settingsTo('Goals & working hours');
  await snap('set_goals', { goals: section('Goals & working hours'), dayGoal: '#sDayGoal', weekGoal: '#sWeekGoal', autostop: '#sDayEnd', away: '#sIdleMin' });
  await settingsTo('Work areas');
  await snap('set_areas', { areas: section('Work areas') });

  await openTab('timer'); await settle(400);
  const idleCard = () => p.locator('.task-card').last();
  const slRects = () => ({ ...mainRects, sl: card('Saltværk'), slPlay: card('Saltværk').locator('.ctrl.pp'), idle: idleCard(), idleTime: idleCard().locator('.task-time') });
  await snap('idle_00', slRects());
  await card('Saltværk').locator('.ctrl.pp').click(); await settle(1300);
  await snap('idle_run', slRects());
  await tick(38 * 60 * 1000); await wait(150);
  await card('Saltværk').locator('.ctrl.pp').click(); await settle(1300);
  await snap('idle_stop', slRects());
  await ticks('idle', 4, slRects());

  // ── FORGOTTEN TIMER ──
  await card('Kronborg').locator('.ctrl.pp').click(); await settle(1300);
  await tick(65 * 60 * 1000); await wait(150);
  await p.evaluate(() => maybeOfferIdleSubtract(47 * 60 * 1000));
  await settle(600);
  await snap('away_00', { dialog: '#idleDialog .confirm-box', keep: '#idleKeepBtn', sub: '#idleSubtractBtn' });
  await p.click('#idleSubtractBtn'); await settle(1300);
  await snap('away_done', { ...mainRects, kr: card('Kronborg') });
  await settle(3200);

  // ── GOALS (pills) ──
  await snap('goals_main', mainRects);

  // ── BOX ──
  await openTab('box'); await settle(500);
  await snap('box_00', { search: '#boxSearch', newNote: '#newNoteBtn', n0: '.note-card >> nth=0', n1: '.note-card >> nth=1', n2: '.note-card >> nth=2' });

  // ── THEME ──
  await openTab('timer');
  await p.click('#themeToggleBtn'); await settle(700);
  await snap('theme_light', mainRects);
  await p.click('#themeToggleBtn'); await settle(700);
  await snap('theme_dark', mainRects);

  // ── SHORTCUTS ──
  await p.click('#burgerBtn'); await settle(500);
  await p.click('#shortcutsDrawerBtn'); await settle(700);
  await snap('shortcuts_00', { modal: '#shortcutsModal .modal' });
  await p.click('#closeShortcutsBtn'); await settle(500);

  // ── BACKGROUND ──
  await openTab('gradient'); await settle(600);
  await snap('bg_00', {});

  // ── CHROME EXTENSION: API key ──
  await openTab('settings');
  await settingsTo('Chrome Extension — API key');
  const keyRects = { sec: section('Chrome Extension — API key'), gen: '#generateApiKeyBtn', key: '#apiKeyValue', copy: '#copyApiKeyBtn', status: '#apiKeyStatus' };
  await snap('key_00', keyRects);
  await p.click('#generateApiKeyBtn'); await settle(1000);
  await snap('key_gen', { ...keyRects, toast: '#toast' });
  const apiKey = await p.inputValue('#apiKeyValue');
  manifest._apiKeyPreview = apiKey.slice(0, 6) + '…';
  await settle(3200);
  await p.click('#copyApiKeyBtn'); await settle(400);
  await snap('key_copied', { ...keyRects, toast: '#toast' });
  await settle(3200);

  // ── EXTENSION TEST: a real call with the API key ──
  await openTab('timer'); await settle(500);
  await snap('ext_before', mainRects);
  const res = await fetch(URL + 'api/extension/task', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'ApiKey ' + apiKey },
    body: JSON.stringify({ name: '24152 Fjordbryg – Messestand', start_timer: true }),
  });
  manifest._extResponse = res.status;
  // the app polls every 5 s
  let seen = false;
  for (let i = 0; i < 40 && !seen; i++) {
    await settle(250);
    seen = await p.locator('#toast.show').isVisible() && (await p.textContent('#toast')).includes('extension');
  }
  await settle(900);
  await snap('ext_started', { ...mainRects, toast: '#toast', extCard: card('Messestand'), extTime: card('Messestand').locator('.task-time') });
  await ticks('ext', 4, { ...mainRects, toast: '#toast', extCard: card('Messestand'), extTime: card('Messestand').locator('.task-time') });

  manifest._viewport = { w: VW, h: VH, dpr: 2 };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  await browser.close();
})().catch(e => { console.error(e); fs.writeFileSync(path.join(OUT, 'manifest.partial.json'), JSON.stringify(manifest, null, 1)); process.exit(1); });
