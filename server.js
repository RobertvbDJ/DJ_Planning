const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json());

// Helper function to read DB
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Create empty DB template if not exists
      const template = {
        configuratie: { global_custom_fields: ["Contactpersoon TD", "Toegangscode hek", "Specifieke instructie technicus"] },
        servicepartners: ["WeegTechniek NL", "MilieuService Partners", "TechFix Industrie"],
        apparatuur: [],
        taken: []
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(template, null, 2), 'utf8');
      return template;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Fout bij het lezen van database.json:", err);
    return { configuratie: { global_custom_fields: [] }, servicepartners: [], apparatuur: [], taken: [] };
  }
}

// Helper function to write DB
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Fout bij het schrijven naar database.json:", err);
    return false;
  }
}

// Get all data
app.get('/api/data', (req, res) => {
  res.json(readDB());
});

// Update entire data (for simple syncing if needed)
app.post('/api/save-all', (req, res) => {
  const db = req.body;
  if (writeDB(db)) {
    res.json({ success: true, data: db });
  } else {
    res.status(500).json({ error: "Kon data niet opslaan." });
  }
});

// Create task
app.post('/api/taken', (req, res) => {
  const db = readDB();
  const newTask = {
    id: 'task-' + Date.now(),
    ...req.body
  };
  db.taken.push(newTask);
  if (writeDB(db)) {
    res.status(201).json(newTask);
  } else {
    res.status(500).json({ error: "Fout bij opslaan taak" });
  }
});

// Update task
app.put('/api/taken/:id', (req, res) => {
  const db = readDB();
  const index = db.taken.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Taak niet gevonden" });

  db.taken[index] = { ...db.taken[index], ...req.body };
  if (writeDB(db)) {
    res.json(db.taken[index]);
  } else {
    res.status(500).json({ error: "Fout bij updaten taak" });
  }
});

// Delete task
app.delete('/api/taken/:id', (req, res) => {
  const db = readDB();
  const index = db.taken.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Taak niet gevonden" });

  db.taken.splice(index, 1);
  if (writeDB(db)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Fout bij verwijderen taak" });
  }
});

// Create equipment
app.post('/api/apparatuur', (req, res) => {
  const db = readDB();
  const newEquipment = {
    id: 'eq-' + Date.now(),
    custom_fields: {},
    ...req.body
  };
  db.apparatuur.push(newEquipment);
  if (writeDB(db)) {
    res.status(201).json(newEquipment);
  } else {
    res.status(500).json({ error: "Fout bij opslaan apparaat" });
  }
});

// Update equipment
app.put('/api/apparatuur/:id', (req, res) => {
  const db = readDB();
  const index = db.apparatuur.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Apparaat niet gevonden" });

  db.apparatuur[index] = { ...db.apparatuur[index], ...req.body };
  if (writeDB(db)) {
    res.json(db.apparatuur[index]);
  } else {
    res.status(500).json({ error: "Fout bij updaten apparaat" });
  }
});

// Delete equipment
app.delete('/api/apparatuur/:id', (req, res) => {
  const db = readDB();
  const index = db.apparatuur.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Apparaat niet gevonden" });

  db.apparatuur.splice(index, 1);
  // Also delete associated tasks
  db.taken = db.taken.filter(t => t.equipment_id !== req.params.id);
  
  if (writeDB(db)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Fout bij verwijderen apparaat" });
  }
});

// Update configuration (global custom fields, servicepartners)
app.post('/api/configuratie', (req, res) => {
  const db = readDB();
  db.configuratie = { ...db.configuratie, ...req.body.configuratie };
  if (req.body.servicepartners) {
    db.servicepartners = req.body.servicepartners;
  }
  if (writeDB(db)) {
    res.json(db);
  } else {
    res.status(500).json({ error: "Fout bij opslaan configuratie" });
  }
});

// Serve frontend in production (if built)
const clientDistPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log("Serving built production frontend from client/dist.");
} else {
  console.log("Production frontend build (client/dist) not found. Running in API-only mode.");
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 Planning Server draait op http://localhost:${PORT}`);
  console.log(`👥 Toegankelijk in het netwerk via IP-adres van deze PC`);
  console.log(`==================================================`);
});
