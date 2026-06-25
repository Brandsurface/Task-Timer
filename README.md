# TaskTimer — Installations- og opsætningsvejledning

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

Databasen er én fil:
```
tasktimer/data/tasktimer.db
```

Kopiér denne fil for at tage backup. Synology Hyper Backup kan inkludere `/volume1/docker/tasktimer/data/` automatisk.

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
- **Opgaver** — opret, omdøb (dobbeltklik), slet, sorter med drag & drop
- **Timer** — start/stop per opgave, kun én kører ad gangen
- **Auto-stop** — timere stopper automatisk på konfigureret tidspunkt (standard 17:00)
- **End Day** — gem dagens tid permanent med bekræftelse
- **Ugeoversigt** — naviger uger frem/tilbage, rediger og slet historiske registreringer
- **Mål** — dag- og ugemål i procent
- **Enter = bekræft** overalt i appen
- **Indstillinger** — navn, dagsmål, ugemål, auto-stop tidspunkt, skift adgangskode

---

*© larssohl.dk — Built with Claude Sonnet*
