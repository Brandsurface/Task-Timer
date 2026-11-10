tr('black', 1);
// Storyboard: intro → 01 core → 02 features → 03 Chrome extension → outro
const pad = n => String(n).padStart(2, '0');
const range = (prefix, a, b) => Array.from({ length: b - a + 1 }, (_, i) => `${prefix}_${pad(a + i)}`);
const U = (a, b, p = 0) => { const x = Math.min(a.x, b.x) - p, y = Math.min(a.y, b.y) - p; return { x, y, w: Math.max(a.x + a.w, b.x + b.w) + p - x, h: Math.max(a.y + a.h, b.y + b.h) + p - y }; };
const PT = (x, y) => [x * K, y * K + 80];      // app CSS px → window coords
const rawRect = (img, key) => M[img].rects[key];

function chapterCard(num, title, sub) {
  scene(4.8, s => {
    s.tr('uiA', 0, 0, 0.6); s.tr('winA', 0, 0, 0.7); s.cursor(0, 0, 0.3);
    s.chapter(0.55, 4.8, num, title, sub);
  });
}
function enter(s, y = 44) {
  s.tr('winY', 0, y, 0.001); s.tr('winY', 0.05, 0, 1.4, 'out');
  s.tr('winA', 0.05, 1, 1.0); s.tr('uiA', 0.05, 1, 0.9);
}

// ── INTRO ──
scene(9, s => { s.tr('black', 0, 0, 1.4, 'sine'); });

// ════════ 01 KERNEFUNKTIONER ════════
chapterCard('01', 'Kernefunktioner', 'Log ind  ·  Opret job  ·  Timer  ·  End day  ·  Uge  ·  Eksport');

scene(11, s => {
  enter(s);
  s.shot(0, 'login_00'); s.cam(0, 1, null, 0.01);
  s.cam(1.0, 1.45, R('login_00', 'card'), 1.8);
  s.jump(0, [470, 780]); s.cursor(1.0, 1, 0.5);
  s.move(1.3, R('login_00', 'email'), 1.0); s.click(2.4);
  s.seq(2.6, range('login_e', 1, 18), 0.075);
  s.move(4.1, R('login_00', 'pwd'), 0.7); s.click(4.9);
  s.seq(5.05, range('login_p', 1, 8), 0.09);
  const rr = R('login_00', 'remember'); s.move(6.0, [rr.x + 16, rr.y + rr.h / 2], 0.8); s.click(6.9); s.shot(6.95, 'login_r', 0.15);
  s.move(7.3, R('login_00', 'signin'), 0.8); s.click(8.2);
  s.shot(8.4, 'main_00', 0.7); s.cam(8.4, 1, null, 1.6);
  s.move(8.6, [460, 640], 1.2);
  s.text(0, { chapter: 0, tag: 'Kernefunktioner', count: '1 / 9', title: 'Log ind',
    body: 'Åbn TaskTimer i Chrome eller Edge og log ind med din e-mail. Den første bruger, der opretter en konto på serveren, bliver automatisk administrator.',
    tips: ['<kbd>Remember me</kbd> logget ind i 30 dage'] });
});

scene(9.5, s => {
  s.cursor(0, 0, 0.6);
  s.cam(0.2, 1.06, R('main_00', 'list'), 3.0, 'sine');
  s.hl(0.7, 3.6, R('main_00', 'list', 2), 'Ét kort pr. job', 'right');
  s.cam(3.4, 1.12, R('main_00', 'total'), 2.6, 'sine');
  s.hl(3.5, 6.3, R('main_00', 'total', 3), 'Dagens samlede tid', 'right');
  s.hl(5.9, 8.9, R('main_00', 'stats', 3), 'Fremdrift mod dine mål', 'right');
  s.cam(7.0, 1.0, null, 2.2, 'sine');
  s.text(0, { chapter: 0, tag: 'Kernefunktioner', count: '2 / 9', title: 'Overblikket',
    body: 'Hvert job har sit eget kort med timer, arbejdsområde og genvejsknapper. Nederst ser du dagens samlede tid og hvor langt du er mod dine dag- og ugemål.' });
});

scene(12.5, s => {
  s.cursor(0.2, 1, 0.5);
  s.move(0.4, R('main_00', 'newTask'), 1.1); s.click(1.6);
  s.shot(1.75, 'new_00', 0.25);
  const f = ctr(R('new_00', 'input')); f[1] += 50; f[0] += 10;
  s.cam(1.8, 1.55, f, 1.7);
  s.move(2.2, R('new_00', 'input'), 0.6, 0.05);
  s.seq(2.95, ['new_t1', 'new_t2', 'new_t3', 'new_t4'], 0.32);
  s.hl(4.2, 6.2, R('new_t4', 'sug0', 2), 'Tidligere job foreslås', 'below');
  s.move(4.6, R('new_hover', 'sug0'), 0.9); s.shot(5.45, 'new_hover', 0.15);
  s.click(6.2); s.shot(6.35, 'new_picked', 0.15);
  s.move(6.7, R('new_picked', 'add'), 0.8); s.click(7.6);
  s.shot(7.75, 'new_added', 0.45);
  s.cam(8.0, 1.4, R('new_added', 'newCard'), 1.7);
  const nc = R('new_added', 'newCard');
  s.move(8.2, [nc.x + nc.w - 40, nc.y + nc.h + 70], 1.1);
  s.hl(8.5, 12.0, R('new_added', 'newCard', 3), 'Timeren kører allerede', 'below');
  s.text(0, { chapter: 0, tag: 'Kernefunktioner', count: '3 / 9', title: 'Opret et job',
    body: 'Klik + New task og skriv jobnummer eller navn. TaskTimer foreslår dine tidligere job — også slettede — så du ikke skal taste dem igen.',
    tips: ['<kbd>↑</kbd> <kbd>↓</kbd> vælg forslag', '<kbd>Enter</kbd> tilføj', '<kbd>Esc</kbd> luk'] });
  s.text(7.9, { chapter: 0, tag: 'Kernefunktioner', count: '3 / 9', title: 'Timeren starter med det samme',
    body: 'Det nye job lægges øverst på listen, og tiden registreres fra første sekund.' });
});

scene(10, s => {
  const nt = R('new_added', 'newType');
  s.cam(0, 1.9, nt, 1.6);
  s.move(0.5, nt, 1.0); s.click(1.6);
  const r = rawRect('new_added', 'newType');
  const opts = M._typeOptions;
  const optPt = i => PT(r.x + 26, r.y + r.h + 3 + 5 + 20 * i + 10);
  s.sel(1.7, 4.15, r, opts, [[1.7, 0], [2.55, 1], [2.85, 2], [3.1, 3]]);
  s.move(2.3, optPt(3), 0.9, 0.04); s.click(3.85);
  s.shot(4.05, 'area_print', 0.15);
  s.move(4.3, [nt.x + nt.w / 2 - 6, nt.y + nt.h + 34], 0.6);
  s.hl(4.4, 6.2, R('area_print', 'newType', 3), 'Print', 'below');
  s.move(6.2, nt, 0.6); s.click(6.9);
  s.sel(7.0, 8.9, r, opts, [[7.0, 3], [7.75, 2], [8.05, 1]]);
  s.move(7.4, optPt(1), 0.8, 0.04); s.click(8.6);
  s.shot(8.85, 'area_design', 0.15);
  s.move(9.0, [nt.x + nt.w / 2, nt.y + nt.h + 60], 0.8);
  s.text(0, { chapter: 0, tag: 'Kernefunktioner', count: '4 / 9', title: 'Vælg arbejdsområde',
    body: 'Den lille dropdown på kortet angiver, hvilket område tiden hører til — fx Design, 3D render eller Print. Listen styrer du selv under Settings → Work areas.' });
});

scene(12, s => {
  s.cursor(0, 0, 0.5);
  s.cam(0, 1.75, R('run_01', 'newTime'), 1.5);
  s.seq(0.4, range('run', 1, 6), 1.0);
  s.hl(0.9, 3.9, R('run_01', 'newTime', 5), 'Live — på sekundet', 'below');
  s.cam(3.6, 1.65, [82 + 206, 24], 1.9);
  s.hl(4.6, 6.8, { x: 84, y: 8, w: 410, h: 31 }, 'Tiden vises også i fanen', 'below');
  s.cam(6.7, 1.0, null, 1.6);
  s.chip(6.9, 9.0, '24 minutter senere');
  s.shot(7.6, 'run_ff', 0.9);
  s.seq(8.6, range('runff', 1, 3), 1.0);
  s.text(0, { chapter: 0, tag: 'Kernefunktioner', count: '5 / 9', title: 'Timeren kører',
    body: 'Tiden registreres præcist på sekundet og afrundes aldrig. Den kørende tid står også i browserfanens titel.',
    tips: ['Klik under 10 sek. ignoreres'] });
});

scene(13, s => {
  s.cursor(0.2, 1, 0.5); s.jump(0, [470, 520]);
  s.move(0.3, R('runff_03', 'fjPlay'), 1.2); s.click(1.6);
  s.seq(1.7, ['switch_m0', 'switch_m1', 'switch_m2', 'switch_m3', 'switch_m4', 'switch_m5'], 0.12);
  s.shot(2.5, 'switch_00', 0.25);
  s.seq(3.2, range('switch', 1, 4), 1.0);
  s.cam(1.5, 1.3, U(R('switch_00', 'c1'), R('switch_00', 'c2')), 1.8);
  s.move(2.3, [470, 560], 1.2);
  s.hl(2.8, 6.0, R('switch_00', 'c1', 3), 'Aktivt job glider øverst', 'above');
  s.hl(3.6, 6.4, R('switch_00', 'c2', 3), 'Forrige job stoppet — 24 min gemt', 'below');
  s.cam(6.6, 1.0, null, 1.6);
  s.chip(7.0, 9.0, '1 time og 11 minutter senere');
  s.shot(7.6, 'switch_ff', 0.8);
  s.move(8.6, R('switch_ff', 'fjPlay'), 1.1); s.click(9.9);
  s.shot(10.05, 'stopped', 0.55);
  s.move(10.4, [470, 640], 1.0);
  s.hl(10.7, 12.7, R('stopped', 'fjCard', 3), 'Tilbage på sin plads', 'below');
  s.text(0, { chapter: 0, tag: 'Kernefunktioner', count: '6 / 9', title: 'Skift mellem job',
    body: 'Start et andet job, så stopper det forrige automatisk — der kører kun én timer ad gangen. Det aktive kort glider op øverst og tilbage på plads, når du stopper det.' });
});

scene(11, s => {
  s.move(0.2, R('stopped', 'endDay'), 1.2); s.click(1.5);
  s.shot(1.65, 'endday_00', 0.45);
  s.cam(1.9, 1.45, R('endday_00', 'modal'), 1.7);
  s.hl(2.6, 5.4, R('endday_00', 'modal', 3), 'Gennemse dagens poster', 'above');
  s.move(5.2, R('endday_00', 'confirm'), 1.0); s.click(6.4);
  s.shot(6.55, 'endday_done', 0.5);
  s.cam(6.7, 1.0, null, 1.6);
  s.move(6.9, [470, 600], 1.0);
  s.hl(7.4, 10.4, R('endday_done', 'toast', 4), 'Gemt permanent', 'above');
  s.text(0, { chapter: 0, tag: 'Kernefunktioner', count: '7 / 9', title: 'Afslut dagen',
    body: 'Klik End day for at gemme dagens tid permanent. Du ser alle registreringer, før du bekræfter.',
    tips: ['Timere stopper selv kl. 17:00 (kan ændres)'] });
});

scene(11.5, s => {
  s.shot(0, 'endday_after', 0.6);
  const st = R('endday_after', 'stats'); const pill = [st.x + st.w / 2, st.y + st.h / 2];
  s.move(0.5, pill, 1.1); s.click(1.8);
  s.shot(1.95, 'week_00', 0.6);
  s.cam(2.5, 1.22, R('week_00', 'mon'), 1.9);
  s.move(2.6, [470, 360], 1.0);
  s.hl(3.2, 5.4, R('week_00', 'group', 3), 'Samme job samlet i én række', 'above');
  s.move(4.4, R('week_00', 'group'), 1.0); s.click(5.6);
  s.shot(5.75, 'week_open', 0.35);
  s.move(6.0, [470, 520], 1.0);
  const ch = R('week_open', 'child', 3);
  s.hl(6.3, 10.0, { x: ch.x, y: ch.y, w: ch.w, h: ch.h * 2 + 2 }, 'Ret eller slet enkelte poster', 'below');
  s.text(0, { chapter: 0, tag: 'Kernefunktioner', count: '8 / 9', title: 'Ugeoversigten',
    body: 'Klik på Week nederst — eller vælg Week i menuen — for at se ugen dag for dag. Samme job samles i én række, der kan foldes ud.' });
});

scene(12, s => {
  s.cam(0, 1, null, 1.4);
  s.move(0.3, R('main_00', 'burger'), 1.2); s.click(1.6);
  s.shot(1.75, 'drawer_00', 0.5);
  s.cam(2.1, 1.3, R('drawer_00', 'export'), 1.6);
  s.move(2.5, R('drawer_00', 'export'), 1.0); s.click(3.7);
  s.shot(3.85, 'export_00', 0.45);
  s.cam(4.0, 1.5, R('export_00', 'modal'), 1.7);
  s.move(4.5, R('export_00', 'cust'), 0.9); s.click(5.5);
  s.seq(5.7, range('export_t', 1, 5), 0.15);
  s.move(6.8, [R('export_00', 'csv').x + 160, R('export_00', 'csv').y + 60], 1.0);
  s.hl(7.0, 11.4, U(R('export_t_05', 'pdf'), R('export_t_05', 'csv'), 4), 'PDF-rapport eller CSV til Excel', 'below');
  s.text(0, { chapter: 0, tag: 'Kernefunktioner', count: '9 / 9', title: 'Eksportér rapport',
    body: 'Åbn menuen → Export report. Vælg periode og evt. et kundenummer, og hent en PDF-rapport eller en CSV-fil, der er klar til Excel.' });
});

// ════════ 02 FEATURES ════════
chapterCard('02', 'Features', 'Stjerne & kopi  ·  Budget  ·  Idle Time  ·  Glemt timer  ·  Box  ·  Tema');

scene(12.5, s => {
  enter(s);
  s.shot(0, 'feat_00'); s.cam(0, 1.55, R('feat_00', 'hv'), 0.01);
  s.jump(0, [420, 330]); s.cursor(0.6, 1, 0.5);
  s.move(0.8, R('feat_00', 'star'), 1.0); s.click(2.0);
  s.shot(2.15, 'feat_star', 0.2);
  s.hl(2.4, 4.4, R('feat_star', 'star', 6), 'Stjernemarkeret', 'above');
  s.move(4.2, R('feat_star', 'dup'), 1.0); s.click(5.4);
  s.shot(5.55, 'feat_dup', 0.5);
  s.cam(5.7, 1.4, U(R('feat_dup', 'hv'), R('feat_dup', 'dupCard')), 1.5);
  s.hl(6.1, 8.4, R('feat_dup', 'dupCard', 3), 'Kopi til et andet arbejdsområde', 'below');
  s.cam(8.3, 1.55, R('feat_copyjob', 'hv'), 1.4);
  s.move(8.4, R('feat_copyjob', 'copy'), 1.0); s.click(9.6);
  s.shot(9.75, 'feat_copyjob', 0.2);
  s.hl(10.0, 12.2, R('feat_copyjob', 'copy', 6), 'Jobnummer kopieret', 'above');
  s.text(0, { chapter: 1, tag: 'Features', count: '1 / 7', title: 'Stjerne, kopi og jobnummer',
    body: '★ beskytter kortet mod oprydning og masse-sletning. ⊞ kopierer kortet, så samme job kan føres i et andet arbejdsområde, og kopi-ikonet lægger jobnummeret i udklipsholderen.' });
});

scene(10, s => {
  s.cam(0, 1.3, R('feat_copyjob', 'nl'), 1.5);
  s.move(0.3, R('feat_copyjob', 'nlBudget'), 1.1); s.click(1.6);
  s.shot(1.75, 'budget_00', 0.4);
  s.cam(1.9, 1.55, R('budget_00', 'modal'), 1.5);
  s.move(2.3, R('budget_00', 'hours'), 0.8); s.click(3.2);
  s.seq(3.4, ['budget_t_01', 'budget_t_02'], 0.22);
  s.move(4.1, R('budget_t_02', 'save'), 0.9); s.click(5.1);
  s.shot(5.25, 'budget_done', 0.45);
  s.cam(5.5, 1.6, R('budget_done', 'nl'), 1.7);
  s.move(5.7, [470, 360], 1.0);
  s.hl(6.2, 9.6, R('budget_done', 'nl', 3), 'Budget: 12 timer', 'below');
  s.text(0, { chapter: 1, tag: 'Features', count: '2 / 7', title: 'Tidsbudget',
    body: 'Giv et job et timebudget med ◎. En farvet bjælke på kortet viser, hvor meget af budgettet der er brugt.' });
});

scene(17, s => {
  s.cam(0, 1, null, 1.3);
  s.move(0.2, R('budget_done', 'burger'), 1.0); s.click(1.3);
  s.shot(1.45, 'drawer_00', 0.4);
  s.move(1.8, R('drawer_00', 'settings'), 0.9); s.click(2.9);
  s.shot(3.05, 'set_idle_00', 0.5);
  s.cam(3.3, 1.35, R('set_idle_00', 'idleSec'), 1.7);
  s.move(4.0, R('set_idle_00', 'idleToggle'), 1.0); s.click(5.2);
  s.shot(5.35, 'set_idle_on', 0.2);
  s.hl(5.6, 8.0, R('set_idle_on', 'idleSec', 3), 'Idle Time slået til', 'below');
  s.cam(7.8, 1.35, R('set_idle_on', 'cleanSec'), 1.5);
  s.move(8.2, R('set_idle_on', 'cleanToggle'), 1.0); s.click(9.3);
  s.shot(9.45, 'set_clean_on', 0.2);
  s.hl(9.7, 12.0, R('set_clean_on', 'cleanSec', 3), 'Ren start slået til', 'above');
  s.shot(12.2, 'set_goals', 0.7);
  s.cam(12.2, 1.3, R('set_goals', 'goals'), 1.7);
  s.move(12.4, [470, 520], 1.0);
  s.hl(13.0, 16.6, U(R('set_goals', 'dayGoal'), R('set_goals', 'weekGoal'), 4), 'Dag- og ugemål', 'above');
  s.hl(13.8, 16.6, R('set_goals', 'autostop', 4), 'Auto-stop', 'below');
  s.text(0, { chapter: 1, tag: 'Features', count: '3 / 7', title: 'Indstillinger',
    body: 'Åbn menuen → Settings. Her tilpasser du TaskTimer til din arbejdsdag.' });
  s.text(5.1, { chapter: 1, tag: 'Features', count: '3 / 7', title: 'Idle Time',
    body: 'Når du stopper et job, registreres tiden frem til næste job automatisk på et Idle Time-kort. Det tæller ikke med i mål eller eksport.' });
  s.text(9.1, { chapter: 1, tag: 'Features', count: '3 / 7', title: 'Ren start på dagen',
    body: 'Hver ny dag ryddes kort, der ikke er stjernemarkeret. Historikken bevares i Week, og jobbene kan findes igen via forslagene.' });
  s.text(12.2, { chapter: 1, tag: 'Features', count: '3 / 7', title: 'Mål og arbejdstid',
    body: 'Sæt dag- og ugemål, hvornår timere stopper automatisk, og hvor længe du må være væk, før TaskTimer spørger ind til fravær.' });
});

scene(12.5, s => {
  s.shot(0, 'idle_00', 0.8); s.cam(0, 1.0, null, 1.4);
  s.move(0.3, [470, 700], 1.0);
  s.hl(0.9, 3.4, R('idle_00', 'idle', 3), 'Idle Time ligger altid nederst', 'above');
  s.move(2.6, R('idle_00', 'slPlay'), 1.0); s.click(3.7);
  s.shot(3.85, 'idle_run', 0.35);
  s.move(4.1, [470, 300], 0.9);
  s.chip(4.6, 6.4, '38 minutter senere');
  s.move(5.4, R('idle_run', 'slPlay'), 0.9); s.click(6.5);
  s.shot(6.65, 'idle_stop', 0.5);
  s.move(6.9, [470, 520], 1.0);
  s.cam(7.0, 1.45, R('idle_stop', 'idle'), 1.7);
  s.seq(7.8, range('idle', 2, 4), 1.0);
  s.hl(7.8, 12.0, R('idle_stop', 'idle', 3), 'Idle Time tæller nu', 'above');
  s.text(0, { chapter: 1, tag: 'Features', count: '4 / 7', title: 'Idle Time i praksis',
    body: 'Stop et job, og Idle Time-kortet begynder at tælle. Næste job afslutter det automatisk — og det kører aldrig forbi auto-stop.' });
});

scene(10, s => {
  s.shot(0, 'away_00', 0.8);
  s.cam(0.3, 1.5, R('away_00', 'dialog'), 1.7);
  s.move(0.4, [470, 640], 1.0);
  s.move(3.0, R('away_00', 'sub'), 1.1); s.click(4.3);
  s.shot(4.45, 'away_done', 0.5);
  s.cam(4.7, 1.0, null, 1.7);
  s.move(4.9, [470, 520], 1.0);
  s.hl(5.4, 9.4, R('away_done', 'kr', 3), '47 min fravær trukket fra', 'below');
  s.text(0, { chapter: 1, tag: 'Features', count: '5 / 7', title: 'Glemt at stoppe timeren?',
    body: 'Har du været væk med en kørende timer — lukket låg, skjult fane eller genstartet browser — tilbyder TaskTimer at trække fraværet fra.' });
});

scene(8.5, s => {
  s.move(0.2, R('away_done', 'burger'), 1.0); s.click(1.3);
  s.shot(1.45, 'drawer_00', 0.4);
  s.move(1.8, R('drawer_00', 'box'), 0.8); s.click(2.7);
  s.shot(2.85, 'box_00', 0.5);
  s.cam(3.1, 1.3, R('box_00', 'n1'), 1.7);
  s.move(3.3, [470, 560], 1.0);
  s.hl(3.8, 8.0, R('box_00', 'n0', 3), 'Fastgjort note', 'above');
  s.text(0, { chapter: 1, tag: 'Features', count: '6 / 7', title: 'Box — noter',
    body: 'Saml noter til dine job i Box. Giv dem farver, fastgør de vigtigste, og søg på tværs af det hele.' });
});

scene(9.5, s => {
  s.shot(0, 'theme_dark', 0.8); s.cam(0, 1, null, 1.5);
  s.move(0.6, R('theme_dark', 'theme'), 1.0); s.click(1.7);
  s.shot(1.85, 'theme_light', 0.9);
  s.move(2.2, [380, 300], 1.0);
  s.hl(2.6, 4.6, R('theme_light', 'theme', 5), 'Lyst tema', 'below');
  s.shot(5.0, 'bg_00', 0.9);
  s.cursor(4.8, 0, 0.4);
  s.text(0, { chapter: 1, tag: 'Features', count: '7 / 7', title: 'Lyst eller mørkt tema',
    body: 'Skift mellem lyst og mørkt tema med ét klik i toppen af appen.' });
  s.text(4.9, { chapter: 1, tag: 'Features', count: '7 / 7', title: 'Baggrunde og skrifttype',
    body: 'Under Background vælger du egne billeder, slideshow og farveforløb — og under Settings din foretrukne skrifttype.' });
});

scene(7.5, s => {
  s.shot(0, 'shortcuts_00', 0.8);
  s.cam(0.3, 1.55, R('shortcuts_00', 'modal'), 1.8);
  s.text(0, { chapter: 1, tag: 'Features', count: 'Bonus', title: 'Tastaturgenveje',
    body: 'Arbejd uden mus: vælg et kort, og styr det fra tastaturet.',
    tips: ['<kbd>Space</kbd> start / stop', '<kbd>N</kbd> nyt job', '<kbd>Enter</kbd> bekræft', '<kbd>Esc</kbd> luk'] });
});

// ════════ 03 CHROME EXTENSION ════════
chapterCard('03', 'Chrome-extension', 'API-nøgle  ·  Installation  ·  Fastgør  ·  Forbind  ·  Test');

const FAKE_KEY = (M._apiKeyPreview || '2f9c41').replace('…', '').slice(0, 6) + '8be3a90c47d1f5e2b6a7c9d04e18f3a2b5c6d7e8f90a1b2c3d4e5f6a7b8c9d0';
scene(11, s => {
  enter(s);
  s.shot(0, 'key_00'); s.cam(0, 1.35, R('key_00', 'sec'), 0.01);
  s.jump(0, [440, 640]); s.cursor(0.5, 1, 0.5);
  s.move(0.8, R('key_00', 'gen'), 1.1); s.click(2.1);
  s.shot(2.25, 'key_gen', 0.4);
  s.move(2.5, [440, 640], 1.0);
  s.hl(2.8, 6.0, R('key_gen', 'key', 3), 'Vises kun én gang', 'above');
  s.move(5.4, R('key_gen', 'copy'), 1.0); s.click(6.6);
  s.shot(6.75, 'key_copied', 0.2);
  s.hl(7.0, 10.0, R('key_copied', 'copy', 5), 'Kopieret', 'below');
  s.text(0, { chapter: 2, tag: 'Chrome-extension', count: '1 / 5', title: 'Opret en API-nøgle',
    body: 'Gå til Settings → Chrome Extension og klik Generate key. Nøglen vises kun én gang — kopiér den med det samme.' });
});

scene(18, s => {
  s.cam(0, 1, null, 1.0); s.cursor(0, 0, 0.4);
  s.step('tabExt', 0, true); s.step('tab1t', 0, 'New Tab');
  s.tr('morph', 0.5, 1, 1.5);
  s.step('addrMode', 1.6, 'type'); s.step('addrCaret', 1.9, true);
  s.type('addr', 2.3, 'chrome://extensions', 14);
  s.step('addrCaret', 3.9, false);
  s.tr('extPageA', 3.9, 1, 0.6); s.step('tab1t', 3.95, 'Extensions');
  s.jump(1.8, [520, 360]); s.cursor(2.2, 1, 0.5);
  s.camWide(4.5, 1.3, [930, 110], 1.7);
  s.move(4.7, [930, 110], 1.1); s.click(6.0);
  s.tr('devOn', 6.05, 1, 0.45);
  s.hl(6.4, 8.2, W(796, 12, 170, 36), 'Developer mode', 'below');
  s.camWide(7.6, 1.3, [200, 164], 1.7);
  s.move(7.9, [89, 164], 1.2); s.click(9.2);
  s.tr('dlgA', 9.35, 1, 0.45);
  s.camWide(9.4, 1.15, [500, 365], 1.6);
  s.move(10.0, [580, 321], 1.0); s.click(11.1); s.step('rowSel', 11.15, true);
  s.move(11.5, [718, 518], 0.9); s.click(12.5);
  s.tr('dlgA', 12.6, 0, 0.35);
  s.tr('cardA', 12.9, 1, 0.8);
  s.camWide(13.0, 1.3, [229, 298], 1.7);
  s.move(13.3, [560, 340], 1.0);
  s.hl(13.6, 17.4, W(20, 128, 418, 180), 'TaskTimer er installeret', 'below');
  s.text(0, { chapter: 2, tag: 'Chrome-extension', count: '2 / 5', title: 'Installér extensionen',
    body: 'Pak extension-mappen ud. Skriv chrome://extensions i adressefeltet, og slå Developer mode til øverst til højre.' });
  s.text(7.4, { chapter: 2, tag: 'Chrome-extension', count: '2 / 5', title: 'Load unpacked',
    body: 'Klik Load unpacked, og vælg mappen med extensionen. TaskTimer dukker straks op på listen.' });
});

scene(8.5, s => {
  s.camWide(0, 1.3, [820, 120], 1.7);
  s.move(0.4, [926, 60], 1.1); s.click(1.7);
  s.tr('puzA', 1.8, 1, 0.35);
  s.move(2.4, [920, 147], 1.0); s.click(3.6);
  s.step('pinOn', 3.62, true); s.tr('pinA', 3.8, 1, 0.5);
  s.tr('puzA', 4.4, 0, 0.35);
  s.move(4.6, [860, 160], 0.9);
  s.hl(4.8, 7.8, { x: 892, y: 45, w: 30, h: 30 }, 'Altid ét klik væk', 'below');
  s.text(0, { chapter: 2, tag: 'Chrome-extension', count: '3 / 5', title: 'Fastgør ikonet',
    body: 'Klik på puslespilsbrikken i værktøjslinjen, og fastgør TaskTimer, så extensionen altid er ét klik væk.' });
});

scene(11, s => {
  s.move(0.3, [907, 60], 1.0); s.click(1.4);
  s.tr('popA', 1.5, 1, 0.35);
  s.camWide(1.6, 1.3, [760, 250], 1.7);
  s.move(2.3, [748, 190], 0.8); s.click(3.2); s.step('focus', 3.25, 'pSrv');
  s.type('srv', 3.4, 'http://192.168.1.50:3001', 16);
  s.move(5.1, [748, 260], 0.7); s.click(5.9); s.step('focus', 5.95, 'pKey');
  s.type('key', 6.2, FAKE_KEY, 400);
  s.move(6.8, [748, 320], 0.7); s.click(7.6); s.step('focus', 7.65, '');
  s.tr('ok1', 7.8, 1, 0.5);
  s.move(8.0, [870, 420], 0.9);
  s.hl(8.2, 10.6, { x: 590, y: 350, w: 316, h: 28 }, 'Forbundet', 'below');
  s.text(0, { chapter: 2, tag: 'Chrome-extension', count: '4 / 5', title: 'Forbind til serveren',
    body: 'Åbn extensionen, indtast adressen på din TaskTimer-server, og indsæt API-nøglen. Gem — så er forbindelsen klar.' });
});

scene(19.5, s => {
  s.tr('jobView', 0.2, 1, 0.5);
  s.move(0.6, [748, 190], 0.8); s.click(1.5); s.step('focus', 1.55, 'pJob');
  s.type('job', 1.7, '24152 Fjordbryg – Messestand', 15);
  s.move(3.9, [605, 237], 0.7); s.click(4.7); s.step('chk', 4.72, true);
  s.move(5.1, [748, 288], 0.7); s.click(5.9); s.step('focus', 5.92, '');
  s.tr('ok2', 6.1, 1, 0.5);
  s.hl(6.3, 8.3, { x: 590, y: 318, w: 316, h: 28 }, 'Sendt!', 'below');
  s.tr('popA', 8.4, 0, 0.3);
  s.camWide(8.2, 1, null, 1.3);
  s.move(8.6, [431, 20], 1.0); s.click(9.7); s.step('tabExt', 9.75, false);
  s.shot(9.0, 'ext_before');
  s.cursor(9.9, 0, 0.3);
  s.tr('morph', 9.9, 0, 1.5);
  s.cam(11.4, 1, null, 0.01);
  s.shot(12.6, 'ext_started', 0.5);
  s.seq(13.6, range('ext', 2, 4), 1.0);
  s.hl(13.0, 18.6, R('ext_started', 'extCard', 3), 'Oprettet og startet', 'below');
  s.hl(13.4, 15.4, R('ext_started', 'toast', 4), 'Bekræftelse fra extensionen', 'above');
  s.cam(15.4, 1.5, R('ext_started', 'extCard'), 1.9);
  s.text(0, { chapter: 2, tag: 'Chrome-extension', count: '5 / 5', title: 'Test forbindelsen',
    body: 'Skriv et testjob i extensionen, sæt flueben i Start timer now, og klik Create task.' });
  s.text(11.0, { chapter: 2, tag: 'Chrome-extension', count: '5 / 5', title: '✓ Det virker',
    body: 'Få sekunder efter dukker jobbet op øverst i TaskTimer, og timeren kører. Findes jobbet allerede, genbruges det i stedet for at blive oprettet igen.' });
});

// ── OUTRO ──
scene(9, s => {
  s.tr('uiA', 0, 0, 0.8); s.tr('winA', 0, 0, 1.0); s.cursor(0, 0, 0.3);
  TL.outroAt = s.t0 + 0.7;
  s.tr('black', 7.4, 1, 1.5, 'sine');
});

boot();
