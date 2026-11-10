# TaskTimer — guidevideo

`tasktimer-guide.mp4` er en rolig motion graphic-video uden lyd (1920×1080, 60 fps,
ca. 4:50 min.), der viser, hvordan TaskTimer bruges. Teksterne i videoen er på dansk.

| Kapitel | Indhold |
|---|---|
| Intro | Logo og titel |
| 01 · Kernefunktioner | Log ind, overblik, opret job med forslag, arbejdsområde, timeren, skift mellem job, End day, ugeoversigt, eksport (PDF/CSV) |
| 02 · Features | Stjerne/kopi/jobnummer, tidsbudget, indstillinger (Idle Time, ren start, mål og auto-stop), Idle Time i praksis, glemt timer, Box, tema og baggrunde, tastaturgenveje |
| 03 · Chrome-extension | API-nøgle, installation via `chrome://extensions` (Developer mode → Load unpacked), fastgør ikonet, forbind til serveren, test — jobbet starter i TaskTimer |
| Outro | Opsummering |

## Sådan er den lavet

Alle skærmbilleder af appen er ægte: `build.sh` starter en midlertidig kopi af appen med en
tom database, lægger demodata ind og klikker sig igennem appen med Playwright. Hvert
skærmbillede gemmes sammen med positionen af de knapper, som cursoren og fremhævningerne
peger på. Selve testen i kapitel 03 er også ægte: der oprettes et job via
`/api/extension/task` med den genererede API-nøgle, og appen henter det inden for 5 sekunder.

Bemærk: Extensionens egen kildekode ligger ikke i dette repo. Chrome-skærmene
(`chrome://extensions`, mappevælgeren og extensionens popup) er derfor tegnet som en
neutral illustration og ikke optaget fra den rigtige extension.

Kompositionen (`composition/`) er en HTML-side, hvor alt på skærmen — kamera, cursor,
fremhævninger, tekster — beregnes ud fra tiden `t`. Den renderes billede for billede og
samles med ffmpeg, så bevægelserne er helt jævne.

```
video/
├── build.sh            Hele forløbet: app → demodata → optagelse → rendering → MP4
├── seed.mjs            Demodata (job, arbejdsområder, registreringer, noter)
├── capture.cjs         Klikker gennem appen og gemmer skærmbilleder + positioner
├── render.cjs          Renderer kompositionen billede for billede
└── composition/
    ├── index.html      Layout og styling
    ├── engine.js       Kamera, cursor, fremhævninger, Chrome-illustration
    └── timeline.js     Storyboard: scener, tider og danske tekster
```

## Lav videoen igen

Kræver Node 18+, Playwright med Chromium og ffmpeg. Port 3001 skal være ledig.

```bash
video/build.sh          # 60 fps, 4 parallelle processer
video/build.sh 30 2     # 30 fps, 2 processer (hurtigere)
```

Mellemfiler lægges i `video/.build/` (ignoreres af git). Tekster og timing rettes i
`composition/timeline.js`. Kør helst i dagtimerne: demoens ur sættes til kl. 10:05 i dag.
