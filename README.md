# TaskTimer — Installations- og opsætningsvejledning

**Aktuel version: 1.2.0** — se ændringer under [Versionshistorik](#versionshistorik)
nederst, eller i appen under **Settings → What's new**.

## Indhold
```
tasktimer/
├── backend/
│   ├── server.js          API + auth + alle ruter
│   ├── db.js              SQLite database og schema
│   └── package.json
├── frontend/
│   └── dist/
│       └── index.html     Komplet frontend (én fil)
├── data/                  Oprettes automatisk — her ligger databasen
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Lokal test (PC/Mac — uden Docker)

### Krav
- Node.js 18+ (`node --version`)

### Start
```bash
cd tasktimer/backend
npm install
node server.js
```

Åbn http://localhost:3001 i Chrome/Edge.

Den første bruger der registrerer sig bliver automatisk **admin**.

---

## Synology NAS — Docker deployment

### Forberedelse på din computer
1. Sørg for Docker Desktop er installeret
2. Test lokalt først (se ovenfor)

### Upload til NAS

**Via SSH (anbefalet):**
```bash
# Kopiér hele mappen til NAS
scp -r tasktimer/ admin@NAS_IP:/volume1/docker/tasktimer
```

**Via File Station:**
Zip mappen og upload til `/volume1/docker/tasktimer/`

### Start på NAS via SSH
```bash
ssh admin@NAS_IP
cd /volume1/docker/tasktimer

# VIGTIGT: Skift JWT_SECRET i docker-compose.yml til noget unikt
# Åbn filen og ret JWT_SECRET linjen:
# JWT_SECRET=MinHemmeligeNøgle1234567890AbcDef

docker compose up -d --build
```

### Verificer at den kører
```bash
docker compose ps
docker compose logs -f
```

### Tilgang fra kontoret
Alle på netværket kan nu tilgå appen via:
```
http://NAS_IP:3001
```

Eksempel: `http://192.168.1.50:3001`

---

## Synology via Container Manager (GUI)

Alternativt kan du bruge Synology's Container Manager app:

1. Åbn **Container Manager** i DSM
2. Gå til **Project** → **Create**
3. Upload `docker-compose.yml` og de øvrige filer
4. Klik **Build** og **Start**

---

## Backup

Appen tager automatisk en konsistent backup af databasen hver nat kl. 03 til:
```
tasktimer/data/backups/tasktimer-ÅÅÅÅ-MM-DD-TTMM.db
```

Som standard gemmes kun den nyeste backup (gårsdagens overskrives). Antallet
kan ændres i admin-panelet under **Dashboard → Backup**, hvor du også kan se
hvornår sidste backup kørte og tage en manuel backup med det samme.

Lad Synology Hyper Backup inkludere `/volume1/docker/tasktimer/data/` — så
kommer både databasen og de natlige backups med.

**Vigtigt:** Kopiér ikke `tasktimer.db` direkte mens serveren kører — databasen
bruger WAL-mode, så en live-kopi kan mangle de nyeste registreringer. Brug
filerne i `backups/`-mappen i stedet; de er altid konsistente.

---

## Opdatering af appen

```bash
cd /volume1/docker/tasktimer
git pull   # hvis du bruger git, ellers upload ny index.html manuelt

docker compose down
docker compose up -d --build
```

---

## JWT_SECRET — vigtigt

**Skift altid** `JWT_SECRET` i `docker-compose.yml` til en unik streng.
Hvis den ikke skiftes kan tokens fra en anden installation valideres på din server.

Generer en sikker nøgle:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Første bruger = Admin

Den første person der opretter en konto på serveren får automatisk admin-rolle.
Admin kan i fremtiden nulstille andres adgangskoder via `/api/admin/users`.

---

## Port konflikter på NAS

Hvis port 3001 er optaget, skift i `docker-compose.yml`:
```yaml
ports:
  - "8080:3001"   # Appen tilgås nu på port 8080
```

---

## Funktioner

- **Login / opret konto** — individuelle konti per bruger
- **Opgaver** — opret, omdøb (dobbeltklik), slet, sorter med drag & drop.
  To kort må have samme navn, når de har hvert sit arbejdsområde; samme navn og samme
  område blokeres med en advarsel (store/små bogstaver, også æ/ø/å, tæller som ens)
- **Knapper på kortet** — ★ stjernemarkerer kortet (beholdes af "Ren start", beskyttet mod
  masse-sletning). ⊞ kopierer kortet: samme job, eget timer og eget arbejdsområde — kopien
  lægges lige under originalen og får et ledigt område. Kopi-ikonet ved siden af kopierer
  jobnummeret til udklipsholderen
- **Forslag ved nyt job** — mens du skriver et jobnavn i "New task", foreslår appen
  tidligere gemte jobs (også slettede) som matcher det du har skrevet, fx kundenummer
  eller dele af navnet. Vælg med mus, eller pil op/ned + Enter; Esc lukker listen
- **Arbejdsområder** — vælg et område (fx 10, 20 … 100 eller Design, 3D render) i den smalle
  dropdown på hvert opgavekort; den er kun så bred som det længste navn kræver. Listen
  styrer du selv under Settings → Work areas (tilføj, omdøb, slet); dropdownen vises først,
  når der er oprettet mindst ét område. Området står efter navnet i Week, End day og PDF
  ("Job (20)") og i CSV-kolonnen "Område"
- **Timer** — start/stop per opgave, kun én kører ad gangen. Den kørende tid
  vises live i browserfanens titel. Tiden registreres på sekundet og afrundes aldrig
  (hverken op eller ned) — hverken når timeren stoppes, ved redigering, i listerne eller
  i eksporten. Registreringer under 10 sekunder ignoreres dog (utilsigtede klik)
- **Idle Time** — valgfrit under Settings → Idle Time. Når du selv stopper et job, starter
  appen et "Idle Time"-kort, så tiden indtil næste job også registreres. Næste job afslutter
  det, og det kører aldrig forbi auto-stop-tidspunktet (heller ikke natten over). Idle Time
  tæller ikke med i dag-/ugemål eller i PDF/CSV-eksport, men vises i Week. Pause selve
  Idle Time-kortet for at stoppe registreringen
- **Aktivt kort øverst** — kortet med den kørende timer glider op øverst på listen, og de
  andre kort gør plads. Din egen rækkefølge ændres ikke: når timeren stoppes, glider kortet
  tilbage til sin plads. Det kørende kort kan ikke trækkes rundt. Respekterer
  "reducer bevægelse" i styresystemet
- **Auto-stop** — timere stopper automatisk på konfigureret tidspunkt (standard 17:00)
- **Ren start på dagen** — valgfrit under Settings → Start of day. Første gang du åbner
  appen på en ny dag fjernes de opgavekort, der ikke er stjernemarkeret (★ på kortet).
  Stjernemarkerede kort bliver, og det samme gør opgaver oprettet eller brugt i dag og
  kørende timere. Fjernede opgaver er arkiveret, så historikken står i Week og navnene
  kan findes igen via forslagene ved nyt job. Slået til midt på dagen starter det først i morgen
- **Glemt timer** — har du været væk (fanen skjult, laptop lukket, browser genstartet)
  med en kørende timer, tilbyder appen at fratrække fraværet. Tærskel indstilles
  under Settings (standard 30 min, 0 = fra)
- **End Day** — gem dagens tid permanent med bekræftelse
- **Ugeoversigt** — naviger uger frem/tilbage; samme job vises som én samlet række
  pr. dag, som kan foldes ud så de enkelte registreringer kan redigeres/slettes
- **Eksport** — PDF-rapport og CSV (semikolon + dansk decimal-komma, klar til Excel),
  begge med valgfrit kundenummer-filter. Tider vises med sekunder; CSV har kolonnen "Område",
  tid som t:mm:ss og decimaltimer med 4 decimaler
- **Backup** — automatisk konsistent databasebackup hver nat kl. 03; styres fra
  admin-panelet (antal der gemmes, manuel backup, status)
- **Mål** — dag- og ugemål i procent
- **Enter = bekræft** overalt i appen
- **Indstillinger** — navn, dagsmål, ugemål, auto-stop, fraværs-advarsel, skrifttype,
  ren dagsstart, Idle Time, arbejdsområder, adgangskode, API-nøgle til Chrome-extension samt "What's new"-versionslog
- **Sprog** — hele appens brugerflade er på engelsk (PDF/CSV-indhold er dansk,
  da de er dokumenter til kunder/bogholderi)

---

## Versionshistorik

### 1.2.0 — 21. oktober 2026
- Idle Time (valgfrit): tiden mellem to jobs registreres automatisk på et "Idle Time"-kort
- Det kørende kort glider op øverst på listen
- Tid registreres på sekundet og afrundes aldrig; End day, Week og PDF viser sekunder,
  og CSV har tid som t:mm:ss og decimaltimer med 4 decimaler
- Opgavetyper: vælg en type (fx Design, 3D render) på hvert kort; listen styres i Settings
- Forslag til jobnavne når der oprettes et nyt job, baseret på tidligere gemte jobs
- Ren start på dagen (valgfrit): kort der ikke er stjernemarkeret ryddes hver ny dag
- Mindre knapper på opgavekortene og nyt TASK TIMER-logo på login-skærmen
- Rettelse: Esc lukker nu "New task"-formularen
- Opgradering: databasen udvides automatisk ved opstart (nye tabeller/kolonner), og
  `Dockerfile`/`docker-compose.yml` er uændrede

### 1.1.0 — 11. juli 2026
- Kørende timer vises live i browserfanens titel (tid + jobnavn)
- Week: grupperede rækker kan foldes ud, og enkelte registreringer redigeres/slettes
- Automatisk natlig databasebackup (`VACUUM INTO`) + Backup-sektion i admin-panelet
- Glemt timer-advarsel: tilbyder at fratrække fravær når man vender tilbage
- CSV-eksport ved siden af PDF-rapporten
- Dublet-jobnavne blokeres med advarsels-popup (også fra Chrome-extensionen,
  som i stedet genbruger det eksisterende job)
- Sikkerhed: password-reset-koder udleveres kun til admin; serveren advarer ved
  standard `JWT_SECRET`; email-enumeration lukket
- Hele brugerfladen oversat til engelsk; versionsnummer og "What's new" i Settings

### 1.0.0 — 25. juni 2026
- Første version: opgave-timere, ugeoversigt, noter (Box), PDF-rapport,
  baggrunde, Chrome-extension og admin-panel

---

*© larssohl.dk — Built with Claude Sonnet*
