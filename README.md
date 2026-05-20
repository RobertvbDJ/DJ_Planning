# 📅 Kalibratie, Onderhoud & Storingsplanner

Dit is jullie op maat gemaakte, lichtgewicht **Kalibratie, Onderhoud & Storingsplanner**. Speciaal ontworpen om Notion te vervangen, draait deze app volledig lokaal en kosteloos op jullie gedeelde netwerkschijf of een lokale PC, en is direct te gebruiken door twee collega's tegelijk.

---

## 🚀 Snelle Start (Zonder Adminrechten!)

De applicatie is voorzien van een slim opstartbestand (`start.bat`) dat speciaal is aangepast voor werkomgevingen waar je **geen administratorrechten** hebt.

### Hoe te starten:
1. Kopieer deze hele map (`planning/`) naar de gewenste locatie (bijvoorbeeld je Desktop, Documenten, of direct op de **gedeelde netwerkschijf**).
2. Dubbelklik op het bestand **`start.bat`** in de hoofdmap.
3. **Geen Node.js geïnstalleerd?** Geen probleem! 
   * De applicatie ziet dat Node.js ontbreekt en vraagt of je de **draagbare (portable) versie** automatisch wilt downloaden.
   * Typ **`J`** (ja) en druk op Enter.
   * De app downloadt en pakt met behulp van PowerShell automatisch een lokale, gecertificeerde versie van Node.js uit in de map `node-portable/`. 
   * **Hier zijn GEEN adminrechten of installaties voor nodig!**
4. De app installeert vervolgens automatisch de benodigde onderdelen en start de server.
5. Je browser opent direct op: **`http://localhost:5000`**.


---

## 👥 Delen in het Netwerk (Voor 2 Collega's)

De planner is zo ontworpen dat jullie er probleemloos met twee personen tegelijk in kunnen werken.

1. **Host-PC:** De computer waarop `start.bat` actief is en het zwarte venster openstaat, fungeert als de server.
2. **IP-adres opvragen:** Zoek het lokale IP-adres op van de Host-PC (bijvoorbeeld `192.168.1.50` of de computernaam, bijv. `BEHEER-PC`).
3. **Collega verbinden:** De tweede collega kan direct verbinding maken door in zijn/haar eigen browser het volgende adres in te voeren:
   * **`http://[IP-ADRES-HOST]:5000`** (bijvoorbeeld `http://192.168.1.50:5000`)
4. **Real-time Synchronisatie:** Wijzigingen die de één maakt (zoals het verslepen van een kaart of toevoegen van een storing), worden direct weggeschreven in het gedeelde bestand `database.json`.

---

## 📋 De workflows in de App

### 1. Periodieke Planning (Tab 1)
* **Statusflow:** *Te Benaderen (1m vooraf)* -> *Wacht op Reactie Klant* -> *Reminder Gestuurd* -> *Opdracht Ontvangen* -> *Wacht op Reactie TD* -> *Ingepland (met Bezoekdatum)* -> *Rapportage / Afronding*.
* **Notion-Killer (Automatische Cyclus):** Zodra je een kalibratie of onderhoudstaak naar de kolom **Afgerond** of **Klant wil dit jaar niet** sleept, berekent de app automatisch de volgende planningsdatum (over 6 of 12 maanden op basis van het interval) en zet direct een nieuwe taak klaar in de kolom **Te Benaderen** wanneer de tijd daar is!

### 2. Storingen & Reparaties (Tab 2)
* Een korter, actiegericht Kanban-bord speciaal voor ad-hoc storingen op locatie (aangegeven met een opvallende rode badge). Deze omzeilen de reguliere klantcontact-fases en kunnen direct worden ingepland en opgelost.

### 3. Kalenderweergave (Tab 3)
* Een interactieve maand- en dagkalender. Alle taken met een ingevulde `Bezoekdatum` verschijnen hier direct als klikbaar event. Storingen vallen direct op door hun rode kleur.

### 4. Servicepartner Bulk-Verzending (Tab 4)
* **Tijdwinst:** Alle opdrachten met de status "Opdracht Ontvangen" verschijnen hier netjes gegroepeerd per servicepartner.
* **📋 Kopieer voor E-mail:** Klik op de kopieerknop om direct een prachtig opgemaakte e-mailtekst met alle klantinformatie, adresgegevens, contactgegevens en eventuele custom fields naar je klembord te kopiëren. Plak dit in Outlook en je bent klaar!
* **Verzenden:** Klik op "Markeer als doorgegeven" om alle geselecteerde opdrachten in één klik door te schuiven naar "Wacht op reactie TD".

### 5. Klanten Register & Globale Custom Fields (Tab 5)
* Beheer al je machines, weegschalen en contracten.
* **Globale Custom Fields:** Voeg hier custom velden toe (zoals *"Toegangscode hek"* of *"Contactpersoon TD"*). Zodra je hier een veld aanmaakt, verschijnt het direct als invulbaar veld op **álle klantkaarten** in het detailscherm!

---

## 💾 Back-ups & Veiligheid

Alle gegevens worden opgeslagen in een simpel tekstbestand genaamd **`database.json`** in de hoofdmap.
* **Back-up maken:** Kopieer simpelweg het bestand `database.json` naar een andere map. Dit is jullie complete database!
* **Crashbestendig:** Mocht er ooit iets misgaan met een computer, dan is jullie data veilig opgeslagen in dit bestand op de netwerkschijf.
## 🌐 Cloud Deployment (Vercel & Supabase)

Om de app in de cloud te draaien, maak een `.env` bestand in de project‑root met:

```
SUPABASE_URL=https://yeaysglgpdjozcgmflxc.supabase.co
SUPABASE_ANON_KEY=sb_secret_S-SVx6xV5YdTg39JAT0sCQ_Nvv0r201
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

Zorg ervoor dat je deze variabelen toevoegt in Vercel (Environment Variables) en push de repository naar GitHub:

```
GITHUB_REPO_URL=https://github.com/RobertvbDJ/DJ_Planning
GITHUB_PAT=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
```

* **Stap 1:** Maak een repo op GitHub (of gebruik de bestaande URL).
* **Stap 2:** Voeg een `Vercel` project toe, selecteer de GitHub‑repo en configureer de omgeving‑variabelen (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
* **Stap 3:** Vercel bouwt en publiceert automatisch `client` (Root Directory = `client`). De app is nu bereikbaar via de Vercel‑URL.

> **Tip:** Na de eerste deploy kun je de `.env` lokaal bewaren voor development (`npm run dev`) zodat dezelfde variabelen gebruikt worden.
