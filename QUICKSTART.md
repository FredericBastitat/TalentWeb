# Rychlý start

## 1. Nastavení Supabase (5 minut)

1. Vytvořte účet na [supabase.com](https://supabase.com)
2. Vytvořte nový projekt
3. V SQL Editoru spusťte obsah souboru `supabase/migrations/001_initial_schema.sql`
4. V Settings > API zkopírujte:
   - Project URL
   - `anon` `public` key

## 2. Konfigurace aplikace (2 minuty)

Vytvořte soubor `config.js`:

```javascript
export const SUPABASE_CONFIG = {
    url: 'https://vas-projekt.supabase.co',
    anonKey: 'vase-anon-key'
};
```

Nebo upravte přímo v `main.js` řádky 5-6.

## 3. Vytvoření prvního uživatele (1 minuta)

1. V Supabase Dashboard: Authentication > Users
2. Klikněte "Invite user"
3. Zadejte email učitele
4. Učitel si nastaví heslo přes odkaz v emailu

## 4. Spuštění aplikace

```bash
npm install
npm run dev
```

Otevřete `http://localhost:3000` a přihlaste se.

## 5. První použití

1. Vyberte školní rok (např. 2024/25)
2. Klikněte "Přidat uchazeče"
3. Zadejte kód (např. F001)
4. Vyplňte hodnocení
5. Uložte

## Nasazení na GitHub Pages

1. Pushněte kód do GitHub repozitáře
2. V Settings > Pages nastavte:
   - Source: GitHub Actions (nebo gh-pages branch)
3. GitHub Actions automaticky nasadí aplikaci při pushi do main branchu

**Důležité**: Po nasazení nezapomeňte nastavit Supabase credentials v produkčním prostředí!

## Nastavení cron-job.org

1. Jděte na [cron-job.org](https://cron-job.org)
2. Vytvořte nový job:
   - URL: `https://vas-projekt.supabase.co/rest/v1/`
   - Interval: Každých 14 dní
   - Method: GET

Tím se Supabase neuspí (free tier má limit nečinnosti).
