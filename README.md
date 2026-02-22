# TalentWeb - Aplikace pro hodnotitele talentových zkoušek

Webová aplikace pro přepisování hodnocení talentových zkoušek z papírů do digitální podoby. Aplikace běží jako statický web na GitHub Pages s backendem na Supabase (PostgreSQL).

## Funkce

- ✅ Autentifikace přes Supabase Auth (email + heslo)
- ✅ Správa školních roků (2024/25, 2025/26, atd.)
- ✅ Hodnocení uchazečů ve 3 kategoriích:
  - **PORTRÉT** (5 podkritérií)
  - **SOUBOR** (5 podkritérií)
  - **ZÁTIŠÍ** (2 podkritéria)
- ✅ Automatické součty bodů za každou kategorii
- ✅ Automatické zamčení kategorie při 0 bodech za "Formální pravidla"
- ✅ Důvody srážky (checkboxy) pro každé podkritérium
- ✅ Navigace mezi uchazeči (zpět/vpřed)
- ✅ Přehledová stránka s filtrováním a řazením
- ✅ Editace již zadaných hodnocení

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Build tool**: Vite
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Hosting**: GitHub Pages
- **Ping**: cron-job.org (pro udržení Supabase aktivní)

## Instalace a nastavení

### 1. Klonování repozitáře

```bash
git clone <your-repo-url>
cd TalentWeb
```

### 2. Instalace závislostí

```bash
npm install
```

### 3. Nastavení Supabase

1. Vytvořte nový projekt na [supabase.com](https://supabase.com)
2. V projektu přejděte do **SQL Editor**
3. Spusťte SQL migraci ze souboru `supabase/migrations/001_initial_schema.sql`
4. V **Settings > API** zkopírujte:
   - Project URL
   - `anon` `public` key

### 4. Konfigurace aplikace

Vytvořte soubor `config.js` na základě `config.example.js`:

```javascript
export const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here'
};
```

**Poznámka**: Pro produkci na GitHub Pages můžete také nastavit tyto hodnoty přímo v `main.js` nebo použít environment variables.

### 5. Vytvoření uživatelských účtů

1. V Supabase Dashboard přejděte do **Authentication > Users**
2. Klikněte na **Invite user** a zadejte email učitele
3. Učitel obdrží email s odkazem pro nastavení hesla

### 6. Lokální vývoj

```bash
npm run dev
```

Aplikace poběží na `http://localhost:3000`

### 7. Build pro produkci

```bash
npm run build
```

Vytvoří se složka `dist/` s připravenými soubory pro nasazení.

## Nasazení na GitHub Pages

### Automatické nasazení (GitHub Actions)

1. Vytvořte soubor `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. V nastavení repozitáře na GitHubu:
   - Settings > Pages > Source: `gh-pages` branch
   - Nebo použijte GitHub Actions workflow výše

### Ruční nasazení

```bash
npm run build
# Commit a push složku dist/ do gh-pages branch
```

## Nastavení cron-job.org pro ping

Aby se Supabase neuspala (free tier), nastavte cron job:

1. Jděte na [cron-job.org](https://cron-job.org)
2. Vytvořte nový cron job:
   - **URL**: `https://your-project.supabase.co/rest/v1/` (nebo jakýkoli endpoint)
   - **Interval**: Každých 14 dní (nebo podle potřeby)
   - **Method**: GET

## Struktura dat

### Tabulka `candidates`

- `id` (UUID) - primární klíč
- `code` (TEXT) - kód uchazeče (např. F001)
- `school_year` (TEXT) - školní rok (např. "2024/25")
- `evaluation` (JSONB) - struktura hodnocení:
  ```json
  {
    "portrait": {
      "formal": 0-2,
      "genre": 0-2,
      "creativity": 0-2,
      "composition": 0-2,
      "technical": 0-2,
      "penalties": {
        "formal": ["wrong-count", "wrong-mounting"],
        ...
      }
    },
    "file": { ... },
    "still-life": { ... }
  }
  ```
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `created_by` (UUID) - reference na auth.users

## Bezpečnost

- Row Level Security (RLS) je aktivní na tabulce `candidates`
- Pouze přihlášení uživatelé mohou přistupovat k datům
- Žádný veřejný přístup - nepřihlášení uživatelé nevidí nic

## UX pravidla

- ✅ Vše na jedné obrazovce, scrollovatelné
- ✅ Automatický součet bodů živě při zadávání
- ✅ Automatické zamčení kategorie při 0 bodech za "Formální pravidla"
- ✅ Navigace mezi uchazeči (zpět/vpřed)
- ✅ Možnost vrátit se k libovolnému uchazeči a editovat hodnocení
- ✅ Přehledová stránka s filtrováním a řazením

## Podpora

Pro problémy nebo dotazy vytvořte issue v repozitáři.

## Licence

MIT
