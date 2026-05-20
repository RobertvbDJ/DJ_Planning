# Servicepartnerbeheer & Klantbewerkingsplan

> **Status:** In uitvoering

**Goal:** Servicepartners beheren (toevoegen/verwijderen) in de app UI, en klanten bewerken vanuit het Register-tabblad.

**Bestand:** `client/src/App.jsx` (single-file React app)

---

## ✅ Klaar

### Taak 1: Servicepartnerbeheer functies

State `newServicePartnerName` toegevoegd (naast `newFieldName` op ~regel 66).

Functies toegevoegd na `deleteGlobalCustomField` (~regel 366-427):

- `addServicePartner(partnerName)` — voegt partner toe aan `servicepartners[]` in de `settings` tabel (PATCH)
- `deleteServicePartner(partnerName)` — verwijdert partner uit de array (PATCH)

Beide werken in cloud-modus (Supabase REST) en lokaal (Express API), exact hetzelfde patroon als de custom fields functies.

### Taak 2: UI-sectie in Tab 5 zijbalk

**Nog niet gedaan.** De servicepartner UI moet onder de custom fields sectie komen in de register-sidebar (~regel 1176, na `</div>` van de field-list/form-inline).

Ontwerp:
```
<div class="sidebar-title">🤝 Servicepartners Beheren</div>
<p class="text-secondary">...</p>
<div class="field-list">
  {servicepartners.map(p => (
    <div class="field-item">
      <span>{p}</span>
      <button onClick={deleteServicePartner(p)}><Trash2/></button>
    </div>
  ))}
</div>
<div class="form-inline">
  <input value={newServicePartnerName} onChange=... onKeyDown=Enter />
  <button onClick={addServicePartner(newServicePartnerName)}><Plus/></button>
</div>
```

---

## 🔄 Nog te doen

### Taak 3: Bewerkknop in Register-tabel (Tab 5)

- Nieuwe state: `editingEquipment` (null of equipment object)
- In de `Acties` kolom van de equipment-tabel (~regel 1120-1130) een edit-knop toevoegen naast de prullenbak
- Wanneer geklikt → `setEditingEquipment(eq)` → modal tonen

### Taak 4: NewEquipmentModal aanpassen voor edit-modus

- `initialData` prop (optioneel) — als gezet worden velden vooringevuld
- Knoptekst verandert van "Registreer & Plan Eerste Beurt" naar "Opslaan & Sluiten"
- `onSave` gedrag: bij bewerken alleen equipment opslaan, geen nieuwe taak aanmaken

### Taak 5: Testen & Deploy

- Push naar GitHub (automatische Vercel deploy)
- Controleren of servicepartner CRUD werkt in de app
- Controleren of klantbewerken werkt in Register-tab
