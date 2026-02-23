# Návod pro správu uživatelů a rolí (TalentWeb)

Tento návod slouží pro administrátory (učitele), kteří potřebují přidávat nové hodnotitele nebo měnit jejich oprávnění v systému Supabase.

---

## 1. Přihlášení do systému
1. Přejděte na stránku [Supabase.com](https://supabase.com/).
2. Klikněte na **Sign In** a přihlaste se údaji, které jste obdrželi při založení projektu.
3. V seznamu projektů klikněte na váš projekt (např. **TalentWeb**).

---

## 2. Správa uživatelů (Authentication)
Všechny uživatele (hodnotitele a ředitele) najdete v sekci **Authentication**.

1. V levém menu klikněte na ikonu postavy (**Authentication**).
2. Zobrazí se seznam všech registrovaných e-mailů.

### Jak přidat nového uživatele:
1. Klikněte na modré tlačítko **Add User** -> **Create new user**.
2. Zadejte **Email** a **Password** (heslo).
3. Vypněte volbu "Confirm User" (pokud nechcete, aby uživatel musel potvrzovat e-mail).
4. Klikněte na **Save**.

---

## 3. Nastavení RO LÍ (Klíčový krok)
Aby systém poznal, kdo je ředitel a kdo hodnotitel 1, 2 nebo 3, musíte jim ručně připsat tzv. **Role**. Pokud to neuděláte, uživatel se sice přihlásí, ale uvidí chybu "Role nebyla přiřazena".

### Jak nastavit roli:
1. V seznamu uživatelů klikněte na e-mail konkrétního člověka.
2. Sjeďte dolů k sekci s názvem **User Raw JSON** (někdy označené jako *App Metadata*).
3. Klikněte na tlačítko **Edit** (ikonka tužky) u položky **App Metadata**.
4. Do textového pole vložte nebo upravte následující kód (všimněte si uvozovek a dvojteček):

   **Pro ředitele:**
   ```json
   {
     "role": "director"
   }
   ```

   **Pro prvního hodnotitele:**
   ```json
   {
     "role": "evaluator-1"
   }
   ```

   **Pro druhého hodnotitele:**
   ```json
   {
     "role": "evaluator-2"
   }
   ```

   **Pro třetího hodnotitele:**
   ```json
   {
     "role": "evaluator-3"
   }
   ```

5. Klikněte na **Save** (uložit).

---

## 4. Povolené názvy rolí
Systém je "chytrý" a rozumí několika variantám zápisu. Do pole `role` můžete napsat:

*   **Pro ředitele:** `director`, `reditel` nebo `ředitel`
*   **Pro hodnotitele:** `h1`, `h2`, `h3` nebo `hodnotitel-1`, `evaluator-1` atd.

*Doporučení: Používejte vždy anglické názvy (např. `evaluator-1`), předejdete tím problémům s diakritikou.*

---

## 5. Časté dotazy
*   **Uživatel se přihlásil, ale nevidí tlačítka pro ukládání:** Má nastavenou roli `director`. Tato role je pouze pro čtení a exportování dat.
*   **Uživatel vidí nápis "Role nebyla přiřazena":** Zkontrolujte v Supabase, zda má v **App Metadata** správně napsané `"role": "něco"`. Často chybí uvozovky nebo složené závorky `{}`.
*   **Zapomenuté heslo:** V seznamu uživatelů u konkrétního e-mailu klikněte na šipku u tlačítka "Send reset password" nebo mu heslo změňte ručně přes "Update password".
