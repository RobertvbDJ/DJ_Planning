import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Columns, 
  Wrench, 
  Users, 
  Send, 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Copy,
  Info,
  Sliders,
  CheckSquare,
  Square,
  Cloud,
  HardDrive
} from 'lucide-react';

// ==========================================
// DUAL-MODE DATABASE CONFIGURATION
// ==========================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const IS_CLOUD_MODE = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

const API_BASE = '/api';

// Headers helper for Supabase
const getSupabaseHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation'
});

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('planning');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  
  // Data States
  const [apparatuur, setApparatuur] = useState([]);
  const [taken, setTaken] = useState([]);
  const [servicepartners, setServicepartners] = useState([]);
  const [globalCustomFields, setGlobalCustomFields] = useState([]);
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartner, setFilterPartner] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Modals & Selections
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newServicePartnerName, setNewServicePartnerName] = useState('');
  
  // Tab 4 Selection State
  const [selectedBulkTasks, setSelectedBulkTasks] = useState({});

  // Calendar Date State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Drag over column helper
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ==========================================
  // FETCH DATA (DUAL-MODE)
  // ==========================================
  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (IS_CLOUD_MODE) {
        // --- CLOUD MODE: FETCH FROM SUPABASE DIRECTLY ---
        const headers = getSupabaseHeaders();
        
        // 1. Fetch Apparatuur
        const appRes = await fetch(`${SUPABASE_URL}/rest/v1/apparatuur?select=*`, { headers });
        const appData = await appRes.json();
        
        // 2. Fetch Taken
        const taskRes = await fetch(`${SUPABASE_URL}/rest/v1/taken?select=*`, { headers });
        const taskData = await taskRes.json();
        
        // 3. Fetch Settings / Configuration
        const settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=*&limit=1`, { headers });
        const settingsData = await settingsRes.json();
        
        setApparatuur(appData || []);
        setTaken(taskData || []);
        
        if (settingsData && settingsData.length > 0) {
          setServicepartners(settingsData[0].servicepartners || []);
          setGlobalCustomFields(settingsData[0].global_custom_fields || []);
        } else {
          // If no settings exist yet, seed some defaults
          const defaultSettings = {
            id: 1,
            servicepartners: ["WeegTechniek NL", "MilieuService Partners", "TechFix Industrie"],
            global_custom_fields: ["Contactpersoon TD", "Toegangscode hek", "Specifieke instructie technicus", "Certificaatnummer"]
          };
          
          await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
            method: 'POST',
            headers,
            body: JSON.stringify(defaultSettings)
          });
          setServicepartners(defaultSettings.servicepartners);
          setGlobalCustomFields(defaultSettings.global_custom_fields);
        }
      } else {
        // --- LOCAL MODE: FETCH FROM EXPRESS SERVER ---
        const res = await fetch(`${API_BASE}/data`);
        const data = await res.json();
        setApparatuur(data.apparatuur || []);
        setTaken(data.taken || []);
        setServicepartners(data.servicepartners || []);
        setGlobalCustomFields(data.configuratie?.global_custom_fields || []);
      }
    } catch (err) {
      console.error("Fout bij laden van data:", err);
      showToast("Fout bij laden van gegevens. Is de database verbonden?");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SAVE TASK (DUAL-MODE)
  // ==========================================
  const saveTask = async (taskData) => {
    try {
      const isNew = !taskData.id;
      let saved;
      
      if (IS_CLOUD_MODE) {
        const headers = getSupabaseHeaders();
        if (isNew) {
          // Create task in Supabase
          const res = await fetch(`${SUPABASE_URL}/rest/v1/taken`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...taskData, id: 'task-' + Date.now() })
          });
          const list = await res.json();
          saved = list[0];
          setTaken(prev => [...prev, saved]);
        } else {
          // Update task in Supabase
          const res = await fetch(`${SUPABASE_URL}/rest/v1/taken?id=eq.${taskData.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(taskData)
          });
          const list = await res.json();
          saved = list[0] || taskData;
          setTaken(prev => prev.map(t => t.id === saved.id ? saved : t));
        }
      } else {
        // Local Server mode
        const url = isNew ? `${API_BASE}/taken` : `${API_BASE}/taken/${taskData.id}`;
        const method = isNew ? 'POST' : 'PUT';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        });
        saved = await res.json();
        if (isNew) {
          setTaken(prev => [...prev, saved]);
        } else {
          setTaken(prev => prev.map(t => t.id === saved.id ? saved : t));
        }
      }
      
      showToast(isNew ? "Nieuwe taak succesvol aangemaakt!" : "Taak succesvol bijgewerkt!");
      if (selectedTask && selectedTask.id === saved.id) {
        setSelectedTask(saved);
      }
      return saved;
    } catch (err) {
      console.error("Fout bij opslaan taak:", err);
      showToast("Fout opgetreden bij het opslaan van de taak.");
    }
  };

  // ==========================================
  // DELETE TASK (DUAL-MODE)
  // ==========================================
  const deleteTask = async (taskId) => {
    if (!window.confirm("Weet je zeker dat je deze planningstaak wilt verwijderen?")) return;
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/taken?id=eq.${taskId}`, {
          method: 'DELETE',
          headers: getSupabaseHeaders()
        });
      } else {
        await fetch(`${API_BASE}/taken/${taskId}`, { method: 'DELETE' });
      }
      setTaken(prev => prev.filter(t => t.id !== taskId));
      setSelectedTask(null);
      showToast("Taak succesvol verwijderd.");
    } catch (err) {
      console.error("Fout bij verwijderen taak:", err);
      showToast("Kon de taak niet verwijderen.");
    }
  };

  // ==========================================
  // SAVE EQUIPMENT (DUAL-MODE)
  // ==========================================
  const saveEquipment = async (eqData) => {
    try {
      const isNew = !eqData.id;
      let saved;
      
      if (IS_CLOUD_MODE) {
        const headers = getSupabaseHeaders();
        if (isNew) {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/apparatuur`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...eqData, id: 'eq-' + Date.now(), custom_fields: eqData.custom_fields || {} })
          });
          const list = await res.json();
          saved = list[0];
          setApparatuur(prev => [...prev, saved]);
        } else {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/apparatuur?id=eq.${eqData.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(eqData)
          });
          const list = await res.json();
          saved = list[0] || eqData;
          setApparatuur(prev => prev.map(e => e.id === saved.id ? saved : e));
        }
      } else {
        const url = isNew ? `${API_BASE}/apparatuur` : `${API_BASE}/apparatuur/${eqData.id}`;
        const method = isNew ? 'POST' : 'PUT';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eqData)
        });
        saved = await res.json();
        if (isNew) {
          setApparatuur(prev => [...prev, saved]);
        } else {
          setApparatuur(prev => prev.map(e => e.id === saved.id ? saved : e));
        }
      }
      
      showToast(isNew ? "Nieuw apparaat succesvol toegevoegd!" : "Apparaat succesvol bijgewerkt!");
      return saved;
    } catch (err) {
      console.error("Fout bij opslaan apparaat:", err);
      showToast("Fout opgetreden bij het opslaan van het apparaat.");
    }
  };

  // ==========================================
  // DELETE EQUIPMENT (DUAL-MODE)
  // ==========================================
  const deleteEquipment = async (eqId) => {
    if (!window.confirm("Weet je zeker dat je dit apparaat en alle gekoppelde taken wilt verwijderen?")) return;
    try {
      if (IS_CLOUD_MODE) {
        const headers = getSupabaseHeaders();
        // Delete equipment
        await fetch(`${SUPABASE_URL}/rest/v1/apparatuur?id=eq.${eqId}`, { method: 'DELETE', headers });
        // Delete associated tasks
        await fetch(`${SUPABASE_URL}/rest/v1/taken?equipment_id=eq.${eqId}`, { method: 'DELETE', headers });
      } else {
        await fetch(`${API_BASE}/apparatuur/${eqId}`, { method: 'DELETE' });
      }
      
      setApparatuur(prev => prev.filter(e => e.id !== eqId));
      setTaken(prev => prev.filter(t => t.equipment_id !== eqId));
      showToast("Apparaat en bijbehorende taken succesvol verwijderd.");
    } catch (err) {
      console.error("Fout bij verwijderen apparaat:", err);
      showToast("Kon het apparaat niet verwijderen.");
    }
  };

  // ==========================================
  // MANAGE GLOBAL CUSTOM FIELDS (DUAL-MODE)
  // ==========================================
  const addGlobalCustomField = async (fieldName) => {
    const trimmed = fieldName.trim();
    if (!trimmed) return;
    if (globalCustomFields.includes(trimmed)) {
      showToast("Dit custom field bestaat al.");
      return;
    }
    
    const updatedFields = [...globalCustomFields, trimmed];
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ global_custom_fields: updatedFields })
        });
      } else {
        await fetch(`${API_BASE}/configuratie`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configuratie: { global_custom_fields: updatedFields } })
        });
      }
      setGlobalCustomFields(updatedFields);
      setNewFieldName('');
      showToast(`Globaal veld "${trimmed}" toegevoegd!`);
    } catch (err) {
      console.error("Fout bij toevoegen custom field:", err);
      showToast("Kon het veld niet opslaan.");
    }
  };

  const deleteGlobalCustomField = async (fieldName) => {
    if (!window.confirm(`Weet je zeker dat je het veld "${fieldName}" systeembreed wilt verwijderen?`)) return;
    const updatedFields = globalCustomFields.filter(f => f !== fieldName);
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ global_custom_fields: updatedFields })
        });
      } else {
        await fetch(`${API_BASE}/configuratie`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configuratie: { global_custom_fields: updatedFields } })
        });
      }
      setGlobalCustomFields(updatedFields);
      showToast(`Globaal veld "${fieldName}" verwijderd.`);
    } catch (err) {
      console.error("Fout bij verwijderen custom field:", err);
    }
  };

  // ==========================================
  // MANAGE SERVICE PARTNERS (DUAL-MODE)
  // ==========================================
  const addServicePartner = async (partnerName) => {
    const trimmed = partnerName.trim();
    if (!trimmed) return;
    if (servicepartners.includes(trimmed)) {
      showToast("Deze servicepartner bestaat al.");
      return;
    }
    
    const updatedPartners = [...servicepartners, trimmed];
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ servicepartners: updatedPartners })
        });
      } else {
        await fetch(`${API_BASE}/configuratie`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configuratie: { servicepartners: updatedPartners } })
        });
      }
      setServicepartners(updatedPartners);
      setNewServicePartnerName('');
      showToast(`Servicepartner "${trimmed}" toegevoegd!`);
    } catch (err) {
      console.error("Fout bij toevoegen servicepartner:", err);
      showToast("Kon de servicepartner niet opslaan.");
    }
  };

  const deleteServicePartner = async (partnerName) => {
    if (!window.confirm(`Weet je zeker dat je servicepartner "${partnerName}" wilt verwijderen?`)) return;
    const updatedPartners = servicepartners.filter(p => p !== partnerName);
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(),
          body: JSON.stringify({ servicepartners: updatedPartners })
        });
      } else {
        await fetch(`${API_BASE}/configuratie`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configuratie: { servicepartners: updatedPartners } })
        });
      }
      setServicepartners(updatedPartners);
      showToast(`Servicepartner "${partnerName}" verwijderd.`);
    } catch (err) {
      console.error("Fout bij verwijderen servicepartner:", err);
    }
  };

  // ==========================================
  // RECURRENCE ENGINE LOGIC
  // ==========================================
  const handleTaskCompletion = async (task, finalStatus) => {
    const updatedTask = { ...task, status: finalStatus };
    await saveTask(updatedTask);

    const eq = apparatuur.find(e => e.id === task.equipment_id);
    if (!eq) return;

    if (task.type === 'storing') {
      showToast("Storing succesvol afgerond.");
      return;
    }

    const baseDate = new Date();
    const intervalMonths = eq.interval_maanden || 12;
    const nextPlannedDate = new Date(baseDate.setMonth(baseDate.getMonth() + intervalMonths));
    const nextPlannedDateStr = nextPlannedDate.toISOString().split('T')[0];
    
    const updatedEq = {
      ...eq,
      laatste_datum: new Date().toISOString().split('T')[0],
      volgende_datum: nextPlannedDateStr
    };
    await saveEquipment(updatedEq);

    const formattedMonth = nextPlannedDate.toLocaleString('nl-NL', { month: 'long', year: 'numeric' });
    const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);
    
    const newTask = {
      equipment_id: eq.id,
      titel: `${task.type === 'kalibratie' ? 'Kalibratie' : 'Periodiek Onderhoud'} ${eq.naam}`,
      type: task.type,
      status: 'te_benaderen',
      prioriteit: task.prioriteit || 'medium',
      geplande_datum: nextPlannedDateStr,
      bezoekdatum: '',
      servicepartner: task.servicepartner || servicepartners[0],
      omschrijving: `Automatisch ingepland voor de volgende cyclus (${capitalizedMonth}).`
    };
    
    await saveTask(newTask);
    showToast(`Voltooide cyclus geregistreerd. Volgende ronde automatisch klaargezet voor ${capitalizedMonth}!`);
  };

  // ==========================================
  // DRAG & DROP HANDLERS
  // ==========================================
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e, columnStatus) => {
    e.preventDefault();
    setDraggedOverColumn(columnStatus);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain");
    const task = taken.find(t => t.id === taskId);
    
    if (task && task.status !== targetStatus) {
      if (targetStatus === 'afgerond' || targetStatus === 'klant_wil_niet') {
        await handleTaskCompletion(task, targetStatus);
      } else {
        await saveTask({ ...task, status: targetStatus });
      }
    }
  };

  // ==========================================
  // BULK DISPATCH LOGIC (TAB 4)
  // ==========================================
  const handleToggleBulkSelect = (taskId) => {
    setSelectedBulkTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleSelectAllForPartner = (partner, partnerTasks) => {
    const allSelected = partnerTasks.every(t => selectedBulkTasks[t.id]);
    const nextSelections = { ...selectedBulkTasks };
    partnerTasks.forEach(t => {
      nextSelections[t.id] = !allSelected;
    });
    setSelectedBulkTasks(nextSelections);
  };

  const copyPartnerListToClipboard = (partner, partnerTasks) => {
    const selected = partnerTasks.filter(t => selectedBulkTasks[t.id]);
    const listToUse = selected.length > 0 ? selected : partnerTasks;

    if (listToUse.length === 0) {
      showToast("Geen opdrachten beschikbaar om te kopiëren.");
      return;
    }

    let text = `Beste team van ${partner},\n\nHierbij de nieuwe planning-opdrachten voor onderhoud/kalibratie:\n\n`;

    listToUse.forEach((task, idx) => {
      const eq = apparatuur.find(e => e.id === task.equipment_id) || {};
      text += `${idx + 1}. OPDRACHT: ${task.titel}\n`;
      text += `   - Locatie: ${eq.locatie || 'Onbekend'}\n`;
      text += `   - Apparaat: ${eq.naam} (${eq.model || 'Geen model'} - S/N: ${eq.serienummer || 'Geen S/N'})\n`;
      if (eq.type === 'weegschaal') {
        text += `   - Specificaties: Weegbereik ${eq.weegbereik || 'N.v.t.'} / Nauwkeurigheid ${eq.nauwkeurigheid || 'N.v.t.'}\n`;
      }
      text += `   - Contactpersoon: ${eq.contactpersoon || 'Geen contactpersoon'}\n`;
      text += `   - Contactgegevens: Tel: ${eq.contact_telefoon || 'N.v.t.'} | E-mail: ${eq.contact_email || 'N.v.t.'}\n`;
      text += `   - Geplande periode: ${new Date(task.geplande_datum).toLocaleString('nl-NL', { month: 'long', year: 'numeric' })}\n`;
      text += `   - Contractklant: ${eq.contract ? 'Ja' : 'Nee'}\n`;
      if (task.omschrijving) {
        text += `   - Bijzonderheden: ${task.omschrijving}\n`;
      }
      
      const customFieldValues = [];
      globalCustomFields.forEach(field => {
        if (eq.custom_fields && eq.custom_fields[field]) {
          customFieldValues.push(`   - ${field}: ${eq.custom_fields[field]}`);
        }
      });
      if (customFieldValues.length > 0) {
        text += `   - Extra Info:\n${customFieldValues.join('\n')}\n`;
      }

      text += `\n`;
    });

    text += `Graag ontvangen we een datumvoorstel voor bovenstaande werkzaamheden.\n\nMet vriendelijke groet,\nPlanning & Kalibratie`;

    navigator.clipboard.writeText(text)
      .then(() => {
        showToast(`📋 Lijst voor ${partner} (${listToUse.length} opdrachten) gekopieerd naar klembord!`);
      })
      .catch(err => {
        console.error("Klembord fout:", err);
        showToast("Fout bij het kopiëren.");
      });
  };

  const dispatchPartnerTasksBulk = async (partner, partnerTasks) => {
    const selected = partnerTasks.filter(t => selectedBulkTasks[t.id]);
    const listToUse = selected.length > 0 ? selected : partnerTasks;

    if (listToUse.length === 0) return;
    if (!window.confirm(`Weet je zeker dat je deze ${listToUse.length} opdrachten wilt doorgeven aan ${partner}?`)) return;

    try {
      if (IS_CLOUD_MODE) {
        const headers = getSupabaseHeaders();
        for (const task of listToUse) {
          await fetch(`${SUPABASE_URL}/rest/v1/taken?id=eq.${task.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'wacht_op_reactie_td' })
          });
        }
      } else {
        for (const task of listToUse) {
          await fetch(`${API_BASE}/taken/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...task, status: 'wacht_op_reactie_td' })
          });
        }
      }
      
      const nextSelections = { ...selectedBulkTasks };
      listToUse.forEach(t => {
        delete nextSelections[t.id];
      });
      setSelectedBulkTasks(nextSelections);
      
      await fetchData();
      showToast(`Status van ${listToUse.length} opdrachten bijgewerkt naar "Wacht op reactie TD".`);
    } catch (err) {
      console.error("Fout bij bulk dispatch:", err);
      showToast("Fout opgetreden bij bulk overdracht.");
    }
  };

  // ==========================================
  // CALENDAR VIEWER ALGORITHM
  // ==========================================
  const getCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const totalPrevDays = new Date(year, month, 0).getDate();

    const days = [];
    for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, totalPrevDays - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const changeCalendarMonth = (offset) => {
    const next = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + offset, 1);
    setCurrentCalendarDate(next);
  };

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const getFilteredTasks = (typeFilter = null) => {
    return taken.filter(t => {
      if (typeFilter === 'periodic' && t.type === 'storing') return false;
      if (typeFilter === 'storing' && t.type !== 'storing') return false;

      const eq = apparatuur.find(e => e.id === t.equipment_id) || {};
      const matchesSearch = 
        t.titel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.omschrijving || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.naam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.locatie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.technicus || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPartner = filterPartner ? t.servicepartner === filterPartner : true;
      const matchesType = filterType ? t.type === filterType : true;

      return matchesSearch && matchesPartner && matchesType;
    });
  };

  const isTaskOverdue = (task) => {
    if (!task.geplande_datum || task.status === 'afgerond' || task.status === 'klant_wil_niet') return false;
    const taskDate = new Date(task.geplande_datum);
    const today = new Date();
    today.setHours(0,0,0,0);
    return taskDate < today;
  };

  const isTaskUpcoming = (task) => {
    if (!task.geplande_datum || task.status === 'afgerond' || task.status === 'klant_wil_niet') return false;
    const taskDate = new Date(task.geplande_datum);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const getColumnsTasks = (columnStatus) => {
    const tasks = getFilteredTasks('periodic');
    return tasks.filter(t => t.status === columnStatus);
  };

  const getStoringTasks = (columnStatus) => {
    const tasks = getFilteredTasks('storing');
    return tasks.filter(t => t.status === columnStatus);
  };

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div className="toast">
          <Check size={20} className="toast-success-icon" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="logo-section">
          <div className="logo-icon">📅</div>
          <div className="logo-text">
            <h1>Kalibratie & Onderhoud Planner</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {IS_CLOUD_MODE ? (
                <span style={{ color: 'var(--color-green)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>
                  <Cloud size={12} /> Cloud Mode (Vercel + Supabase)
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '500' }}>
                  <HardDrive size={12} /> Lokaal Netwerk Modus
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowEquipmentForm(true)}>
            <Plus size={16} /> Apparaat Toevoegen
          </button>
          <button className="btn-primary" onClick={() => setShowTaskForm(true)}>
            <Plus size={16} /> Storing / Taak Melden
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="nav-tabs">
        <button 
          className={`nav-tab-btn ${activeTab === 'planning' ? 'active' : ''}`}
          onClick={() => setActiveTab('planning')}
        >
          <Columns size={18} /> Periodieke Planning
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'storingen' ? 'active' : ''}`}
          onClick={() => setActiveTab('storingen')}
        >
          <Wrench size={18} /> Storingen & Reparaties
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'kalender' ? 'active' : ''}`}
          onClick={() => setActiveTab('kalender')}
        >
          <Calendar size={18} /> Kalenderweergave
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          <Send size={18} /> Servicepartner Bulk-Verzending
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          <Users size={18} /> Klanten & Apparaten Register
        </button>
      </nav>

      {/* Main Workspace Area */}
      <main className="main-content">
        {loading ? (
          <div className="empty-state">
            <Clock size={48} className="animate-spin" />
            <p>Gegevens laden uit de {IS_CLOUD_MODE ? 'cloud database' : 'lokale database'}...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: PERIODIC KANBAN BOARD */}
            {activeTab === 'planning' && (
              <div>
                <div className="board-filters">
                  <div className="filter-group">
                    <input 
                      type="text" 
                      placeholder="Zoek klant, locatie..."
                      className="search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select 
                      className="filter-select"
                      value={filterPartner}
                      onChange={(e) => setFilterPartner(e.target.value)}
                    >
                      <option value="">Alle Servicepartners</option>
                      {servicepartners.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select 
                      className="filter-select"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="">Alle Typen</option>
                      <option value="kalibratie">Kalibratie (Weegschalen)</option>
                      <option value="onderhoud">Onderhoud & Keuring (Machines)</option>
                    </select>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    * Slepen verplaatst de kaarten tussen fasen.
                  </div>
                </div>

                <div className="board-container">
                  {[
                    { id: 'te_benaderen', title: 'Te Benaderen (1m vooraf)' },
                    { id: 'wacht_op_klant', title: 'Wacht op Klant' },
                    { id: 'reminder_gestuurd', title: 'Reminder Gestuurd' },
                    { id: 'opdracht_ontvangen', title: 'Opdracht Ontvangen' },
                    { id: 'wacht_op_reactie_td', title: 'Wacht op Reactie TD' },
                    { id: 'ingepland', title: 'Ingepland' },
                    { id: 'rapportage', title: 'Rapportage / Afronding' }
                  ].map(column => {
                    const colTasks = getColumnsTasks(column.id);
                    return (
                      <div 
                        key={column.id} 
                        className={`board-column ${draggedOverColumn === column.id ? 'dragging-over-column' : ''}`}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.id)}
                      >
                        <div className="column-header">
                          <div className="column-title-container">
                            <span className="column-title">{column.title}</span>
                          </div>
                          <span className="column-count">{colTasks.length}</span>
                        </div>
                        <div className="cards-container">
                          {colTasks.length === 0 ? (
                            <div className="text-center text-muted" style={{ padding: '2rem 0', fontSize: '0.75rem', border: '1px dashed #2b354a', borderRadius: '8px' }}>
                              Geen taken
                            </div>
                          ) : (
                            colTasks.map(task => (
                              <TaskCard 
                                key={task.id} 
                                task={task} 
                                apparatuur={apparatuur}
                                onDragStart={handleDragStart}
                                onClick={() => setSelectedTask(task)}
                                overdue={isTaskOverdue(task)}
                                upcoming={isTaskUpcoming(task)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: STORINGEN & REPARATIES */}
            {activeTab === 'storingen' && (
              <div>
                <div className="board-filters">
                  <div className="filter-group">
                    <input 
                      type="text" 
                      placeholder="Zoek storing..."
                      className="search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select 
                      className="filter-select"
                      value={filterPartner}
                      onChange={(e) => setFilterPartner(e.target.value)}
                    >
                      <option value="">Alle Servicepartners</option>
                      {servicepartners.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="board-container" style={{ justifyContent: 'space-between' }}>
                  {[
                    { id: 'te_plannen', title: 'Nieuwe Storing' },
                    { id: 'wacht_op_reactie_td', title: 'Wacht op TD' },
                    { id: 'ingepland', title: 'Ingepland op Locatie' },
                    { id: 'in_uitvoering', title: 'In Uitvoering' }
                  ].map(column => {
                    const colTasks = getStoringTasks(column.id);
                    return (
                      <div 
                        key={column.id} 
                        className={`board-column ${draggedOverColumn === column.id ? 'dragging-over-column' : ''}`}
                        style={{ flex: '1', maxWidth: '350px' }}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.id)}
                      >
                        <div className="column-header" style={{ borderBottom: `2px solid var(--color-red-border)` }}>
                          <div className="column-title-container">
                            <span className="column-title" style={{ color: 'var(--color-red)' }}>{column.title}</span>
                          </div>
                          <span className="column-count" style={{ background: 'var(--color-red-bg)', color: 'var(--color-red)' }}>{colTasks.length}</span>
                        </div>
                        <div className="cards-container">
                          {colTasks.length === 0 ? (
                            <div className="text-center text-muted" style={{ padding: '2rem 0', fontSize: '0.75rem', border: '1px dashed #2b354a', borderRadius: '8px' }}>
                              Geen actieve storingen
                            </div>
                          ) : (
                            colTasks.map(task => (
                              <TaskCard 
                                key={task.id} 
                                task={task} 
                                apparatuur={apparatuur}
                                onDragStart={handleDragStart}
                                onClick={() => setSelectedTask(task)}
                                overdue={isTaskOverdue(task)}
                                upcoming={isTaskUpcoming(task)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: CALENDAR VIEW */}
            {activeTab === 'kalender' && (
              <div className="calendar-wrapper">
                <div className="calendar-header">
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Ingeplande Bezoeken & Storingen</h2>
                  <div className="calendar-nav">
                    <button className="calendar-nav-btn" onClick={() => changeCalendarMonth(-1)}>
                      <ChevronLeft size={18} />
                    </button>
                    <span className="calendar-month-year">
                      {currentCalendarDate.toLocaleString('nl-NL', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </span>
                    <button className="calendar-nav-btn" onClick={() => changeCalendarMonth(1)}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="calendar-grid">
                  {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(d => (
                    <div key={d} className="calendar-day-label">{d}</div>
                  ))}

                  {getCalendarDays().map((day, idx) => {
                    const dateStr = day.date.toISOString().split('T')[0];
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    
                    const dayEvents = taken.filter(t => {
                      if (t.status !== 'ingepland' && t.status !== 'in_uitvoering') return false;
                      const taskDate = t.bezoekdatum || t.geplande_datum;
                      return taskDate === dateStr;
                    });

                    return (
                      <div 
                        key={idx} 
                        className={`calendar-day-cell ${day.isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}
                      >
                        <span className="calendar-day-number">{day.date.getDate()}</span>
                        <div className="calendar-events">
                          {dayEvents.map(event => (
                            <div 
                              key={event.id}
                              className={`calendar-event event-${event.type}`}
                              onClick={() => setSelectedTask(event)}
                              title={`${event.titel} - ${event.servicepartner}`}
                            >
                              {event.type === 'storing' ? '⚠️ ' : ''}{event.titel}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: BULK SERVICE PARTNER DISPATCH */}
            {activeTab === 'bulk' && (
              <div className="dispatch-container">
                <div style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>Servicepartner Bulk-Verzendlijst</h2>
                  <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
                    Hier zie je per servicepartner alle opdrachten die door de klant zijn goedgekeurd (status "Opdracht Ontvangen"). 
                    Selecteer de gewenste opdrachten, kopieer ze naar je klembord om ze in één e-mail te plakken, en markeer ze vervolgens als doorgegeven.
                  </p>
                </div>

                {servicepartners.map(partner => {
                  const partnerTasks = taken.filter(t => t.servicepartner === partner && t.status === 'opdracht_ontvangen');
                  const selectedCount = partnerTasks.filter(t => selectedBulkTasks[t.id]).length;

                  return (
                    <div key={partner} className="partner-section">
                      <div className="partner-header">
                        <div className="partner-title">
                          <span>🤝 {partner}</span>
                          <span className="column-count" style={{ background: 'var(--color-blue-bg)', color: 'var(--color-blue)' }}>
                            {partnerTasks.length} openstaande opdrachten
                          </span>
                        </div>
                        {partnerTasks.length > 0 && (
                          <div className="partner-actions">
                            <button 
                              className="btn-secondary"
                              onClick={() => copyPartnerListToClipboard(partner, partnerTasks)}
                            >
                              <Copy size={16} /> Kopieer lijst voor E-mail
                            </button>
                            <button 
                              className="btn-primary"
                              onClick={() => dispatchPartnerTasksBulk(partner, partnerTasks)}
                            >
                              <Send size={16} /> Markeer als doorgegeven ({selectedCount > 0 ? selectedCount : 'alle'})
                            </button>
                          </div>
                        )}
                      </div>

                      {partnerTasks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                          Geen nieuwe goedgekeurde opdrachten voor deze servicepartner.
                        </div>
                      ) : (
                        <div className="dispatch-table-container">
                          <table className="dispatch-table">
                            <thead>
                              <tr>
                                <th style={{ width: '40px' }}>
                                  <input 
                                    type="checkbox"
                                    className="checkbox-custom"
                                    checked={partnerTasks.every(t => selectedBulkTasks[t.id])}
                                    onChange={() => handleSelectAllForPartner(partner, partnerTasks)}
                                  />
                                </th>
                                <th>Klant & Locatie</th>
                                <th>Taak / Machine</th>
                                <th>Geplande datum</th>
                                <th>Contract</th>
                                <th>Extra Info / Bijzonderheden</th>
                              </tr>
                            </thead>
                            <tbody>
                              {partnerTasks.map(task => {
                                const eq = apparatuur.find(e => e.id === task.equipment_id) || {};
                                return (
                                  <tr key={task.id} onClick={() => handleToggleBulkSelect(task.id)} style={{ cursor: 'pointer' }}>
                                    <td onClick={(e) => e.stopPropagation()}>
                                      <input 
                                        type="checkbox"
                                        className="checkbox-custom"
                                        checked={!!selectedBulkTasks[task.id]}
                                        onChange={() => handleToggleBulkSelect(task.id)}
                                      />
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: '600' }}>{eq.naam || 'Onbekend'}</div>
                                      <div className="text-secondary" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <MapPin size={12} /> {eq.locatie}
                                      </div>
                                    </td>
                                    <td>
                                      <span className={`badge badge-${task.type}`}>{task.type}</span>
                                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{task.titel}</div>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                                      {new Date(task.geplande_datum).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </td>
                                    <td>
                                      {eq.contract ? (
                                        <span className="badge badge-contract">Contract</span>
                                      ) : (
                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Nee</span>
                                      )}
                                    </td>
                                    <td className="text-secondary" style={{ fontSize: '0.75rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {task.omschrijving || 'Geen extra opmerkingen'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 5: REGISTER & CONFIGURATION */}
            {activeTab === 'register' && (
              <div className="register-layout">
                <div className="register-main">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Klanten & Apparaten Register ({apparatuur.length})</h2>
                    <input 
                      type="text" 
                      placeholder="Zoek in register..."
                      className="search-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="dispatch-table-container">
                    <table className="dispatch-table">
                      <thead>
                        <tr>
                          <th>Naam & Locatie</th>
                          <th>Type</th>
                          <th>Model & S/N</th>
                          <th>Interval</th>
                          <th>Status / Cyclus</th>
                          <th>Contract</th>
                          <th style={{ width: '80px' }}>Acties</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apparatuur
                          .filter(e => e.naam.toLowerCase().includes(searchTerm.toLowerCase()) || e.locatie.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map(eq => {
                            const activeTask = taken.find(t => t.equipment_id === eq.id && t.status !== 'afgerond' && t.status !== 'klant_wil_niet');
                            return (
                              <tr key={eq.id}>
                                <td>
                                  <div style={{ fontWeight: '600' }}>{eq.naam}</div>
                                  <div className="text-secondary" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin size={12} /> {eq.locatie}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge badge-${eq.type === 'weegschaal' ? 'kalibratie' : 'onderhoud'}`}>
                                    {eq.type === 'weegschaal' ? 'Weegschaal' : 'Afvalmachine'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>
                                  <div>Model: {eq.model || 'N.v.t.'}</div>
                                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>S/N: {eq.serienummer || 'N.v.t.'}</div>
                                </td>
                                <td style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                                  {eq.interval_maanden === 6 ? '2x per jaar (6m)' : '1x per jaar (12m)'}
                                </td>
                                <td>
                                  {activeTask ? (
                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#242c3f', border: '1px solid #3b4866', borderRadius: '4px', display: 'inline-block' }}>
                                      Actief: {activeTask.status.replace(/_/g, ' ')}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--color-green)', fontSize: '0.75rem', fontWeight: '600' }}>🟢 Gereed voor cyclus</span>
                                  )}
                                </td>
                                <td>
                                  {eq.contract ? (
                                    <span className="badge badge-contract">Contract</span>
                                  ) : (
                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>Nee</span>
                                  )}
                                </td>
                                <td>
                                  <div className="flex gap-1">
                                    <button 
                                      className="btn-icon-delete"
                                      onClick={() => deleteEquipment(eq.id)}
                                      title="Verwijder apparaat"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="register-sidebar">
                  <div className="sidebar-title">
                    <Sliders size={18} /> Globale Custom Fields
                  </div>
                  <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    Wanneer je hier een veld toevoegt, verschijnt dit veld automatisch (als invoerveld) op alle klantkaarten.
                  </p>
                  
                  <div className="field-list">
                    {globalCustomFields.map(field => (
                      <div key={field} className="field-item">
                        <span>{field}</span>
                        <button className="btn-icon-delete" onClick={() => deleteGlobalCustomField(field)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="form-inline">
                    <input 
                      type="text" 
                      placeholder="Nieuwe veldnaam..." 
                      className="search-input" 
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addGlobalCustomField(newFieldName)}
                    />
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.4rem 0.75rem' }}
                      onClick={() => addGlobalCustomField(newFieldName)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: CUSTOMER CARD DETAIL / EDITOR */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          apparatuur={apparatuur}
          servicepartners={servicepartners}
          globalCustomFields={globalCustomFields}
          onClose={() => { setSelectedTask(null); fetchData(); }}
          onSave={saveTask}
          onDelete={deleteTask}
          onSaveEquipment={saveEquipment}
        />
      )}

      {/* MODAL: NEW TASK / BREAKDOWN FORM */}
      {showTaskForm && (
        <NewTaskModal 
          apparatuur={apparatuur}
          servicepartners={servicepartners}
          onClose={() => setShowTaskForm(false)}
          onSave={async (task) => {
            await saveTask(task);
            setShowTaskForm(false);
            fetchData();
          }}
        />
      )}

      {/* MODAL: NEW EQUIPMENT / CLIENT FORM */}
      {showEquipmentForm && (
        <NewEquipmentModal 
          onClose={() => setShowEquipmentForm(false)}
          onSave={async (eq) => {
            const savedEq = await saveEquipment(eq);
            
            const baseDate = new Date();
            const task = {
              equipment_id: savedEq.id,
              titel: `${savedEq.type === 'weegschaal' ? 'Kalibratie' : 'Periodiek Onderhoud'} ${savedEq.naam}`,
              type: savedEq.type === 'weegschaal' ? 'kalibratie' : 'onderhoud',
              status: 'te_benaderen',
              prioriteit: 'medium',
              geplande_datum: baseDate.toISOString().split('T')[0],
              bezoekdatum: '',
              servicepartner: servicepartners[0],
              omschrijving: 'Eerste periodieke taak na toevoegen apparaat.'
            };
            await saveTask(task);
            
            setShowEquipmentForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: KANBAN TASK CARD
// =============================================================================
function TaskCard({ task, apparatuur, onDragStart, onClick, overdue, upcoming }) {
  const eq = apparatuur.find(e => e.id === task.equipment_id) || {};
  
  return (
    <div 
      className="card"
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-tags">
          <span className={`badge badge-${task.type}`}>
            {task.type}
          </span>
          {eq.contract && <span className="badge badge-contract">★ Contract</span>}
        </div>
        <div className={`priority-indicator priority-${task.prioriteit || 'medium'}`} title={`Prioriteit: ${task.prioriteit || 'medium'}`}></div>
      </div>
      
      <div className="card-title">{eq.naam || 'Onbekend apparaat'}</div>
      
      <div className="card-details">
        <div className="card-detail-item">
          <MapPin size={12} />
          <span>{eq.locatie || 'Geen locatie'}</span>
        </div>
        {task.bezoekdatum ? (
          <div className="card-detail-item" style={{ color: 'var(--color-green)', fontWeight: '600' }}>
            <Calendar size={12} />
            <span>Bezoek: {new Date(task.bezoekdatum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
          </div>
        ) : (
          <div className="card-detail-item">
            <Clock size={12} />
            <span>Gepland: {new Date(task.geplande_datum).toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <span className={`card-date ${overdue ? 'overdue' : upcoming ? 'upcoming' : ''}`}>
          {overdue ? '⚠️ Overdue' : upcoming ? '⏳ Binnenkort' : '📅 Planning'}
        </span>
        <span className="card-partner">
          {task.servicepartner || 'Geen TD'}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: TASK DETAIL & CUSTOMER MODAL
// =============================================================================
function TaskDetailModal({ task, apparatuur, servicepartners, globalCustomFields, onClose, onSave, onDelete, onSaveEquipment }) {
  const eq = apparatuur.find(e => e.id === task.equipment_id) || {};
  
  const [status, setStatus] = useState(task.status);
  const [prioriteit, setPrioriteit] = useState(task.prioriteit);
  const [geplandeDatum, setGeplandeDatum] = useState(task.geplande_datum);
  const [bezoekdatum, setBezoekdatum] = useState(task.bezoekdatum || '');
  const [servicepartner, setServicepartner] = useState(task.servicepartner);
  const [omschrijving, setOmschrijving] = useState(task.omschrijving || '');
  const [technicus, setTechnicus] = useState(task.technicus || '');

  const [naam, setNaam] = useState(eq.naam || '');
  const [locatie, setLocatie] = useState(eq.locatie || '');
  const [model, setModel] = useState(eq.model || '');
  const [serienummer, setSerienummer] = useState(eq.serienummer || '');
  const [weegbereik, setWeegbereik] = useState(eq.weegbereik || '');
  const [nauwkeurigheid, setNauwkeurigheid] = useState(eq.nauwkeurigheid || '');
  const [intervalMaanden, setIntervalMaanden] = useState(eq.interval_maanden || 12);
  const [contract, setContract] = useState(eq.contract || false);
  const [contactpersoon, setContactpersoon] = useState(eq.contactpersoon || '');
  const [contactEmail, setContactEmail] = useState(eq.contact_email || '');
  const [contactTelefoon, setContactTelefoon] = useState(eq.contact_telefoon || '');
  const [bijzonderheden, setBijzonderheden] = useState(eq.bijzonderheden || '');
  
  const [customFields, setCustomFields] = useState(eq.custom_fields || {});

  const handleCustomFieldChange = (field, val) => {
    setCustomFields(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleSaveAll = async () => {
    const updatedEq = {
      ...eq,
      naam,
      locatie,
      model,
      serienummer,
      weegbereik,
      nauwkeurigheid,
      interval_maanden: parseInt(intervalMaanden, 10),
      contract,
      contactpersoon,
      contact_email: contactEmail,
      contact_telefoon: contactTelefoon,
      bijzonderheden,
      custom_fields: customFields
    };
    await onSaveEquipment(updatedEq);

    const updatedTask = {
      ...task,
      status,
      prioriteit,
      geplande_datum: geplandeDatum,
      bezoekdatum,
      servicepartner,
      omschrijving,
      technicus
    };
    await onSave(updatedTask);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">
            <span className={`badge badge-${task.type}`}>{task.type}</span>
            <span>Klantkaart & Planning Details</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="section-title-in-modal">🏢 Klant & Locatie</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Klantnaam / Naam Apparaat</label>
              <input type="text" className="form-control" value={naam} onChange={e => setNaam(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Locatie op vestiging</label>
              <input type="text" className="form-control" value={locatie} onChange={e => setLocatie(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Contactpersoon</label>
              <input type="text" className="form-control" value={contactpersoon} onChange={e => setContactpersoon(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Telefoonnummer</label>
              <input type="text" className="form-control" value={contactTelefoon} onChange={e => setContactTelefoon(e.target.value)} />
            </div>
            <div className="form-group form-grid-full">
              <label>E-mailadres contactpersoon</label>
              <input type="email" className="form-control" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </div>
          </div>

          <div className="section-title-in-modal">⚙️ Machine of Weegschaal Specificaties</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Modelnaam / Type</label>
              <input type="text" className="form-control" value={model} onChange={e => setModel(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Serienummer</label>
              <input type="text" className="form-control" value={serienummer} onChange={e => setSerienummer(e.target.value)} />
            </div>
            
            {task.type === 'kalibratie' && (
              <>
                <div className="form-group">
                  <label>Weegbereik</label>
                  <input type="text" className="form-control" value={weegbereik} onChange={e => setWeegbereik(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Nauwkeurigheid</label>
                  <input type="text" className="form-control" value={nauwkeurigheid} onChange={e => setNauwkeurigheid(e.target.value)} />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Plannings-Interval</label>
              <select className="form-control" value={intervalMaanden} onChange={e => setIntervalMaanden(e.target.value)}>
                <option value="12">1x per jaar (elke 12 maanden)</option>
                <option value="6">2x per jaar (elke 6 maanden)</option>
              </select>
            </div>
            
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input 
                type="checkbox" 
                id="contract" 
                className="checkbox-custom" 
                checked={contract} 
                onChange={e => setContract(e.target.checked)} 
              />
              <label htmlFor="contract" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>★ Deze klant heeft een Contract</label>
            </div>

            <div className="form-group form-grid-full">
              <label>Bijzonderheden & Instructies</label>
              <textarea className="form-control" value={bijzonderheden} onChange={e => setBijzonderheden(e.target.value)}></textarea>
            </div>
          </div>

          {globalCustomFields.length > 0 && (
            <>
              <div className="section-title-in-modal">➕ Custom Fields (Systeembreed)</div>
              <div className="custom-fields-grid">
                {globalCustomFields.map(field => (
                  <div key={field} className="form-group">
                    <label>{field}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={customFields[field] || ''} 
                      onChange={e => handleCustomFieldChange(field, e.target.value)} 
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="section-title-in-modal">📅 Huidige Planningsstatus</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Kanban Status</label>
              <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                {task.type === 'storing' ? (
                  <>
                    <option value="te_plannen">Nieuwe Storing</option>
                    <option value="wacht_op_reactie_td">Wacht op TD</option>
                    <option value="ingepland">Ingepland</option>
                    <option value="in_uitvoering">In Uitvoering</option>
                    <option value="afgerond">Afgerond (Archiveren)</option>
                  </>
                ) : (
                  <>
                    <option value="te_benaderen">Te Benaderen (1m vooraf)</option>
                    <option value="wacht_op_klant">Wacht op Klant</option>
                    <option value="reminder_gestuurd">Reminder Gestuurd</option>
                    <option value="opdracht_ontvangen">Opdracht Ontvangen</option>
                    <option value="wacht_op_reactie_td">Wacht op Reactie TD</option>
                    <option value="ingepland">Ingepland</option>
                    <option value="rapportage">Rapportage / Afronding</option>
                    <option value="afgerond">Afgerond (Start volgende cyclus)</option>
                    <option value="klant_wil_niet">Klant wil dit jaar niet</option>
                  </>
                )}
              </select>
            </div>
            
            <div className="form-group">
              <label>Prioriteit</label>
              <select className="form-control" value={prioriteit} onChange={e => setPrioriteit(e.target.value)}>
                <option value="low">Laag (Groen)</option>
                <option value="medium">Medium (Oranje)</option>
                <option value="high">Hoog (Rood)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Servicepartner (Uitvoerder)</label>
              <select className="form-control" value={servicepartner} onChange={e => setServicepartner(e.target.value)}>
                {servicepartners.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Technicus (Locatie)</label>
              <input type="text" className="form-control" placeholder="Naam uitvoerder..." value={technicus} onChange={e => setTechnicus(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Geplande Datum / Maand</label>
              <input type="date" className="form-control" value={geplandeDatum} onChange={e => setGeplandeDatum(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Definitieve Bezoekdatum (Locatie)</label>
              <input type="date" className="form-control" value={bezoekdatum} onChange={e => setBezoekdatum(e.target.value)} />
            </div>

            <div className="form-group form-grid-full">
              <label>Planning Toelichting / Werkinstructie TD</label>
              <textarea className="form-control" placeholder="Opmerkingen omtrent de afspraak..." value={omschrijving} onChange={e => setOmschrijving(e.target.value)}></textarea>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" style={{ color: 'var(--color-red)' }} onClick={() => onDelete(task.id)}>
            <Trash2 size={16} /> Verwijder Taak
          </button>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>Annuleren</button>
            <button className="btn-primary" onClick={handleSaveAll}>Opslaan & Sluiten</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: MODAL NEW TASK / BREAKDOWN
// =============================================================================
function NewTaskModal({ apparatuur, servicepartners, onClose, onSave }) {
  const [type, setType] = useState('storing');
  const [equipmentId, setEquipmentId] = useState(apparatuur[0]?.id || '');
  const [titel, setTitel] = useState('');
  const [prioriteit, setPrioriteit] = useState('high');
  const [geplandeDatum, setGeplandeDatum] = useState(new Date().toISOString().split('T')[0]);
  const [servicepartner, setServicepartner] = useState(servicepartners[0] || '');
  const [omschrijving, setOmschrijving] = useState('');

  const handleSave = () => {
    if (!titel.trim()) {
      alert("Voer a.u.b. een titel in.");
      return;
    }
    
    onSave({
      equipment_id: equipmentId,
      titel,
      type,
      status: type === 'storing' ? 'te_plannen' : 'te_benaderen',
      prioriteit,
      geplande_datum: geplandeDatum,
      bezoekdatum: '',
      servicepartner,
      omschrijving
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div className="modal-title">➕ Nieuwe Melding / Storing Invoeren</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label>Type Melding</label>
              <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                <option value="storing">⚠️ Storing & Reparatie (Ad-hoc op locatie)</option>
                <option value="kalibratie">🟢 Kalibratie Cyclus (Weegschaal)</option>
                <option value="onderhoud">🔵 Periodiek Onderhoud & Keuring (Machine)</option>
              </select>
            </div>

            <div className="form-group form-grid-full">
              <label>Koppel aan Apparaat / Klant</label>
              <select className="form-control" value={equipmentId} onChange={e => setEquipmentId(e.target.value)}>
                {apparatuur.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.naam} - {e.locatie} ({e.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group form-grid-full">
              <label>Korte Titel omschrijving</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Bijv: Hydrauliek lek of Jaarlijkse inspectie..." 
                value={titel} 
                onChange={e => setTitel(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label>Prioriteit</label>
              <select className="form-control" value={prioriteit} onChange={e => setPrioriteit(e.target.value)}>
                <option value="low">Laag (Groen)</option>
                <option value="medium">Medium (Oranje)</option>
                <option value="high">Hoog (Rood)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Gewenste / Geplande Datum</label>
              <input type="date" className="form-control" value={geplandeDatum} onChange={e => setGeplandeDatum(e.target.value)} />
            </div>

            <div className="form-group form-grid-full">
              <label>Servicepartner (TD)</label>
              <select className="form-control" value={servicepartner} onChange={e => setServicepartner(e.target.value)}>
                {servicepartners.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="form-group form-grid-full">
              <label>Omschrijving probleem / Extra opmerkingen</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Vul hier alle relevante storingsinformatie in voor de technicus..."
                value={omschrijving} 
                onChange={e => setOmschrijving(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuleren</button>
          <button className="btn-primary" onClick={handleSave}>Melding Opslaan</button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: MODAL NEW EQUIPMENT / CLIENT
// =============================================================================
function NewEquipmentModal({ onClose, onSave }) {
  const [type, setType] = useState('weegschaal');
  const [naam, setNaam] = useState('');
  const [locatie, setLocatie] = useState('');
  const [model, setModel] = useState('');
  const [serienummer, setSerienummer] = useState('');
  const [weegbereik, setWeegbereik] = useState('');
  const [nauwkeurigheid, setNauwkeurigheid] = useState('');
  const [intervalMaanden, setIntervalMaanden] = useState(12);
  const [contract, setContract] = useState(false);
  const [contactpersoon, setContactpersoon] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactTelefoon, setContactTelefoon] = useState('');
  const [bijzonderheden, setBijzonderheden] = useState('');

  const handleSave = () => {
    if (!naam.trim() || !locatie.trim()) {
      alert("Naam en Locatie zijn verplichte velden.");
      return;
    }

    onSave({
      type,
      naam,
      locatie,
      model,
      serienummer,
      weegbereik: type === 'weegschaal' ? weegbereik : 'N.v.t.',
      nauwkeurigheid: type === 'weegschaal' ? nauwkeurigheid : 'N.v.t.',
      interval_maanden: parseInt(intervalMaanden, 10),
      contract,
      contactpersoon,
      contact_email: contactEmail,
      contact_telefoon: contactTelefoon,
      bijzonderheden,
      custom_fields: {}
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">➕ Nieuwe Klant / Apparaat Registreren</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="section-title-in-modal">🏷️ Apparaat Categorie & Basis</div>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label>Type Apparaat</label>
              <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                <option value="weegschaal">🟢 Weegschaal (Kalibratie workflow)</option>
                <option value="afvalmachine">🔵 Afvalbewerkingsmachine (Onderhoud & Keuring workflow)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Naam Klant / Apparaat *</label>
              <input type="text" className="form-control" placeholder="Bijv. Mettler Scale Hal A..." value={naam} onChange={e => setNaam(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Locatie *</label>
              <input type="text" className="form-control" placeholder="Bijv. Expeditie laadperron..." value={locatie} onChange={e => setLocatie(e.target.value)} />
            </div>
          </div>

          <div className="section-title-in-modal">📞 Contactgegevens</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Contactpersoon</label>
              <input type="text" className="form-control" value={contactpersoon} onChange={e => setContactpersoon(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Telefoonnummer</label>
              <input type="text" className="form-control" value={contactTelefoon} onChange={e => setContactTelefoon(e.target.value)} />
            </div>
            <div className="form-group form-grid-full">
              <label>E-mailadres</label>
              <input type="email" className="form-control" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </div>
          </div>

          <div className="section-title-in-modal">🔧 Specificaties & Interval</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Model / Type</label>
              <input type="text" className="form-control" value={model} onChange={e => setModel(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Serienummer</label>
              <input type="text" className="form-control" value={serienummer} onChange={e => setSerienummer(e.target.value)} />
            </div>

            {type === 'weegschaal' && (
              <>
                <div className="form-group">
                  <label>Weegbereik</label>
                  <input type="text" className="form-control" placeholder="Bijv: 0 - 60 kg" value={weegbereik} onChange={e => setWeegbereik(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Nauwkeurigheid</label>
                  <input type="text" className="form-control" placeholder="Bijv: 5 g" value={nauwkeurigheid} onChange={e => setNauwkeurigheid(e.target.value)} />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Terugkerend Interval</label>
              <select className="form-control" value={intervalMaanden} onChange={e => setIntervalMaanden(e.target.value)}>
                <option value="12">1x per jaar (elke 12 maanden)</option>
                <option value="6">2x per jaar (elke 6 maanden)</option>
              </select>
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input 
                type="checkbox" 
                id="new-contract" 
                className="checkbox-custom" 
                checked={contract} 
                onChange={e => setContract(e.target.checked)} 
              />
              <label htmlFor="new-contract" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>★ Deze klant heeft een Contract</label>
            </div>

            <div className="form-group form-grid-full">
              <label>Algemene Opmerkingen / Bijzonderheden</label>
              <textarea className="form-control" placeholder="Specifieke klantsituatie..." value={bijzonderheden} onChange={e => setBijzonderheden(e.target.value)}></textarea>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuleren</button>
          <button className="btn-primary" onClick={handleSave}>Registreer & Plan Eerste Beurt</button>
        </div>
      </div>
    </div>
  );
}
