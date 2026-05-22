import React, { useState, useEffect } from 'react';
import { useAuth, supabase } from './AuthContext';
import LoginPage from './LoginPage';
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
const getSupabaseHeaders = (token) => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation'
});

export default function App() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('planning');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  
  // Data States
  const [klanten, setKlanten] = useState([]);
  const [apparatuur, setApparatuur] = useState([]);
  const [taken, setTaken] = useState([]);
  const [servicepartners, setServicepartners] = useState([]);
  const [globalCustomFields, setGlobalCustomFields] = useState([]);
  const [soortWeegschaalOpties, setSoortWeegschaalOpties] = useState([]);
  const [soortMachineOpties, setSoortMachineOpties] = useState([]);
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartner, setFilterPartner] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Modals & Selections
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [newServicePartnerName, setNewServicePartnerName] = useState('');
  const [editingServicePartner, setEditingServicePartner] = useState(null);
  const [newWeegschaalType, setNewWeegschaalType] = useState('');
  const [newMachineType, setNewMachineType] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showMachineFormForCustomer, setShowMachineFormForCustomer] = useState(null); // klant_id or null
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSection, setSidebarSection] = useState(''); // 'fields', 'partners', 'weegschaal', 'machine'
  
  // Tab 4 Selection State
  const [selectedBulkTasks, setSelectedBulkTasks] = useState({});

  // Calendar Date State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const [draggedOverColumn, setDraggedOverColumn] = useState(null);

  // Fetch initial data when user logs in
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers = getSupabaseHeaders(token);
        
        // 1. Fetch Klanten
        const klantRes = await fetch(`${SUPABASE_URL}/rest/v1/klanten?select=*`, { headers });
        const klantData = await klantRes.json();
        
        // 2. Fetch Apparatuur
        const appRes = await fetch(`${SUPABASE_URL}/rest/v1/apparatuur?select=*`, { headers });
        const appData = await appRes.json();
        
        // 3. Fetch Taken
        const taskRes = await fetch(`${SUPABASE_URL}/rest/v1/taken?select=*`, { headers });
        const taskData = await taskRes.json();
        
        // 4. Fetch Settings / Configuration
        const settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=*&limit=1`, { headers });
        const settingsData = await settingsRes.json();
        
        setKlanten(klantData || []);
        setApparatuur(appData || []);
        setTaken(taskData || []);
        
        if (settingsData && settingsData.length > 0) {
          setServicepartners(settingsData[0].servicepartners || []);
          setGlobalCustomFields(settingsData[0].global_custom_fields || []);
          setSoortWeegschaalOpties(settingsData[0].soort_weegschaal_opties || ["Vloerweegschaal","Palletweegschaal","Tafelweegschaal","Precisiebalans","Analytische balans","Kraanweegschaal","Weegbrug","Anders"]);
          setSoortMachineOpties(settingsData[0].soort_machine_opties || ["Balenpers","Shredder","Containerpers","Kantelaar","Lintbanderol","Hydraulische pers","Anders"]);
        } else {
          // If no settings exist yet, seed some defaults
          const defaultSettings = {
            id: 1,
            servicepartners: [{id:"sp-1",name:"WeegTechniek NL",phone:"",email:""},{id:"sp-2",name:"MilieuService Partners",phone:"",email:""},{id:"sp-3",name:"TechFix Industrie",phone:"",email:""}],
            global_custom_fields: ["Contactpersoon TD", "Toegangscode hek", "Specifieke instructie technicus", "Certificaatnummer"],
            soort_weegschaal_opties: ["Vloerweegschaal","Palletweegschaal","Tafelweegschaal","Precisiebalans","Analytische balans","Kraanweegschaal","Weegbrug","Anders"],
            soort_machine_opties: ["Balenpers","Shredder","Containerpers","Kantelaar","Lintbanderol","Hydraulische pers","Anders"]
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
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers = getSupabaseHeaders(token);
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
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        await fetch(`${SUPABASE_URL}/rest/v1/taken?id=eq.${taskId}`, {
          method: 'DELETE',
          headers: getSupabaseHeaders(token)
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
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers = getSupabaseHeaders(token);
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
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers = getSupabaseHeaders(token);
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
  // SAVE CUSTOMER (DUAL-MODE)
  // ==========================================
  const saveCustomer = async (klantData) => {
    try {
      const isNew = !klantData.id;
      let saved;
      
      if (IS_CLOUD_MODE) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers = getSupabaseHeaders(token);
        if (isNew) {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/klanten`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...klantData, id: 'klant-' + Date.now() })
          });
          const list = await res.json();
          saved = list[0];
          setKlanten(prev => [...prev, saved]);
        } else {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/klanten?id=eq.${klantData.id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(klantData)
          });
          const list = await res.json();
          saved = list[0] || klantData;
          setKlanten(prev => prev.map(k => k.id === saved.id ? saved : k));
        }
      } else {
        // Local mode - placeholder
        saved = klantData;
        if (isNew) {
          setKlanten(prev => [...prev, saved]);
        } else {
          setKlanten(prev => prev.map(k => k.id === saved.id ? saved : k));
        }
      }
      
      showToast(isNew ? "Nieuwe klant succesvol aangemaakt!" : "Klant succesvol bijgewerkt!");
      return saved;
    } catch (err) {
      console.error("Fout bij opslaan klant:", err);
      showToast("Fout opgetreden bij het opslaan van de klant.");
    }
  };

  const deleteCustomer = async (klantId) => {
    if (!window.confirm("Weet je zeker dat je deze klant en alle bijbehorende apparatuur en taken wilt verwijderen?")) return;
    try {
      if (IS_CLOUD_MODE) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers = getSupabaseHeaders(token);
        // Delete all equipment for this customer (cascade deletes tasks)
        const eqs = apparatuur.filter(e => e.klant_id === klantId);
        for (const eq of eqs) {
          await fetch(`${SUPABASE_URL}/rest/v1/taken?equipment_id=eq.${eq.id}`, { method: 'DELETE', headers });
          await fetch(`${SUPABASE_URL}/rest/v1/apparatuur?id=eq.${eq.id}`, { method: 'DELETE', headers });
        }
        // Delete the customer
        await fetch(`${SUPABASE_URL}/rest/v1/klanten?id=eq.${klantId}`, { method: 'DELETE', headers });
      } else {
        // Local mode placeholder
      }
      
      setKlanten(prev => prev.filter(k => k.id !== klantId));
      const eqIds = apparatuur.filter(e => e.klant_id === klantId).map(e => e.id);
      setApparatuur(prev => prev.filter(e => !eqIds.includes(e.id)));
      setTaken(prev => prev.filter(t => !eqIds.includes(t.equipment_id)));
      setSelectedCustomer(null);
      showToast("Klant en bijbehorende apparatuur verwijderd.");
    } catch (err) {
      console.error("Fout bij verwijderen klant:", err);
      showToast("Kon de klant niet verwijderen.");
    }
  };

  // ==========================================
  // MANAGE GLOBAL CUSTOM FIELDS (DUAL-MODE)
  // ==========================================
  const addGlobalCustomField = async (fieldName) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
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
          headers: getSupabaseHeaders(token),
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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!window.confirm(`Weet je zeker dat je het veld "${fieldName}" systeembreed wilt verwijderen?`)) return;
    const updatedFields = globalCustomFields.filter(f => f !== fieldName);
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(token),
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
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const trimmed = partnerName.trim();
    if (!trimmed) return;
    if (servicepartners.some(p => p.name === trimmed)) {
      showToast("Deze servicepartner bestaat al.");
      return;
    }
    
    const newPartner = {
      id: 'sp-' + Date.now(),
      name: trimmed,
      phone: '',
      email: '',
      notes: ''
    };
    const updatedPartners = [...servicepartners, newPartner];
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(token),
          body: JSON.stringify({ servicepartners: updatedPartners })
        });
      }
      setServicepartners(updatedPartners);
      setNewServicePartnerName('');
      showToast(`Servicepartner "${trimmed}" toegevoegd!`);
    } catch (err) {
      console.error("Fout bij toevoegen servicepartner:", err);
    }
  };

  const updateServicePartner = async (partnerId, updates) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const updatedPartners = servicepartners.map(p =>
      p.id === partnerId ? { ...p, ...updates } : p
    );
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(token),
          body: JSON.stringify({ servicepartners: updatedPartners })
        });
      }
      setServicepartners(updatedPartners);
      setEditingServicePartner(null);
      showToast(`Servicepartner bijgewerkt!`);
    } catch (err) {
      console.error("Fout bij bijwerken servicepartner:", err);
    }
  };

  const deleteServicePartner = async (partnerId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const partner = servicepartners.find(p => p.id === partnerId);
    if (!partner) return;
    if (!window.confirm(`Weet je zeker dat je "${partner.name}" wilt verwijderen?`)) return;
    const updatedPartners = servicepartners.filter(p => p !== partner);
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(token),
          body: JSON.stringify({ servicepartners: updatedPartners })
        });
      }
      setServicepartners(updatedPartners);
      showToast(`Servicepartner "${partner.name}" verwijderd.`);
    } catch (err) {
      console.error("Fout bij verwijderen servicepartner:", err);
    }
  };

  // ==========================================
  // MANAGE SOORT WEEGSCHAAL OPTIES (DUAL-MODE)
  // ==========================================
  const addWeegschaalType = async (typeName) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const trimmed = typeName.trim();
    if (!trimmed) return;
    const updatedOpties = [...soortWeegschaalOpties, trimmed];
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(token),
          body: JSON.stringify({ soort_weegschaal_opties: updatedOpties })
        });
      }
      setSoortWeegschaalOpties(updatedOpties);
      setNewWeegschaalType('');
      showToast(`Weegschaaltype "${trimmed}" toegevoegd!`);
    } catch (err) {
      console.error("Fout bij toevoegen weegschaaltype:", err);
    }
  };

  const deleteWeegschaalType = async (typeName) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const updatedOpties = soortWeegschaalOpties.filter(o => o !== typeName);
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(token),
          body: JSON.stringify({ soort_weegschaal_opties: updatedOpties })
        });
      }
      setSoortWeegschaalOpties(updatedOpties);
      showToast(`Weegschaaltype "${typeName}" verwijderd.`);
    } catch (err) {
      console.error("Fout bij verwijderen weegschaaltype:", err);
    }
  };

  // ==========================================
  // MANAGE SOORT MACHINE OPTIES (DUAL-MODE)
  // ==========================================
  const addMachineType = async (typeName) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const trimmed = typeName.trim();
    if (!trimmed) return;
    const updatedOpties = [...soortMachineOpties, trimmed];
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(token),
          body: JSON.stringify({ soort_machine_opties: updatedOpties })
        });
      }
      setSoortMachineOpties(updatedOpties);
      setNewMachineType('');
      showToast(`Machinetype "${trimmed}" toegevoegd!`);
    } catch (err) {
      console.error("Fout bij toevoegen machinetype:", err);
    }
  };

  const deleteMachineType = async (typeName) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const updatedOpties = soortMachineOpties.filter(o => o !== typeName);
    try {
      if (IS_CLOUD_MODE) {
        await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
          method: 'PATCH',
          headers: getSupabaseHeaders(token),
          body: JSON.stringify({ soort_machine_opties: updatedOpties })
        });
      }
      setSoortMachineOpties(updatedOpties);
      showToast(`Machinetype "${typeName}" verwijderd.`);
    } catch (err) {
      console.error("Fout bij verwijderen machinetype:", err);
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
      servicepartner: task.servicepartner || servicepartners[0]?.name || servicepartners[0],
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
    <>
      {authLoading ? (
        <div className="login-container">
          <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Clock size={48} className="animate-spin" />
            <p>Sessie controleren...</p>
          </div>
        </div>
      ) : !user ? (
        <LoginPage />
      ) : (
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
          <div className="logo-icon">
            <img src="/assets/logo.svg" alt="Logo" />
          </div>
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
          {user && (
            <button className="btn-secondary" onClick={logout} title="Uitloggen">
              Log uit ({user.email.split('@')[0]})
            </button>
          )}
          <button 
            className={`btn-icon-settings ${sidebarOpen ? 'active' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Instellingen"
          >
            <Sliders size={18} />
          </button>
          <button className="btn-secondary" onClick={() => { setActiveTab('register'); setShowCustomerForm(true); }}>
            <Plus size={16} /> Nieuwe Klant
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
                      {servicepartners
  .map(p => { try { return typeof p === 'string' && (p.startsWith('{') || p.startsWith('[')) ? JSON.parse(p) : p; } catch(e) { return p; } })
  .filter(p => p && (typeof p === 'string' || p.name))
  .map(p => <option key={p.id || p} value={p.name || p}>{p.name || p}</option>)}
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
                      {servicepartners
  .map(p => { try { return typeof p === 'string' && (p.startsWith('{') || p.startsWith('[')) ? JSON.parse(p) : p; } catch(e) { return p; } })
  .filter(p => p && (typeof p === 'string' || p.name))
  .map(p => <option key={p.id || p} value={p.name || p}>{p.name || p}</option>)}
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

                {servicepartners.filter(p => p && (typeof p === 'string' || p.name)).map(partner => {
                  const partnerName = partner.name || partner;
                  const partnerTasks = taken.filter(t => t.servicepartner === partnerName && t.status === 'opdracht_ontvangen');
                  const selectedCount = partnerTasks.filter(t => selectedBulkTasks[t.id]).length;

                  return (
                    <div key={partner.id || partner} className="partner-section">
                      <div className="partner-header">
                        <div className="partner-title">
                          <span>🤝 {partnerName}</span>
                          <span className="column-count" style={{ background: 'var(--color-blue-bg)', color: 'var(--color-blue)' }}>
                            {partnerTasks.length} openstaande opdrachten
                          </span>
                        </div>
                        {partnerTasks.length > 0 && (
                          <div className="partner-actions">
                            <button 
                              className="btn-secondary"
                              onClick={() => copyPartnerListToClipboard(partnerName, partnerTasks)}
                            >
                              <Copy size={16} /> Kopieer lijst voor E-mail
                            </button>
                            <button 
                              className="btn-primary"
                              onClick={() => dispatchPartnerTasksBulk(partnerName, partnerTasks)}
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
                  {/* ---- LEFT: CUSTOMER LIST ---- */}
                  <div className="customer-list-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Klanten ({klanten.length})</h2>
                      <button className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setShowCustomerForm(true)}>
                        <Plus size={14} /> Nieuwe Klant
                      </button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Zoek klant..." 
                      className="search-input"
                      style={{ marginBottom: '0.75rem' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="customer-cards">
                      {klanten
                        .filter(k => k.bedrijfsnaam?.toLowerCase().includes(searchTerm.toLowerCase()) || k.locatie?.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(klant => {
                          const machineCount = apparatuur.filter(e => e.klant_id === klant.id).length;
                          const isSelected = selectedCustomer?.id === klant.id;
                          return (
                            <div 
                              key={klant.id} 
                              className={`customer-card ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedCustomer(klant)}
                            >
                              <div className="customer-card-header">
                                <div className="customer-card-name">{klant.bedrijfsnaam || 'Onbekende klant'}</div>
                                {klant.contract && <span className="badge badge-contract" style={{ fontSize: '0.65rem' }}>★ Contract</span>}
                              </div>
                              {klant.locatie && (
                                <div className="customer-card-locatie">
                                  <MapPin size={12} /> {klant.locatie}
                                </div>
                              )}
                              <div className="customer-card-meta">
                                <span className="customer-card-count">{machineCount} machine{machineCount !== 1 ? 's' : ''}</span>
                                {klant.contactpersoon && <span className="text-muted">{klant.contactpersoon}</span>}
                              </div>
                            </div>
                          );
                        })}
                      {klanten.length === 0 && (
                        <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                          <p className="text-muted">Nog geen klanten. Maak je eerste klant aan!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ---- RIGHT: SELECTED CUSTOMER DETAIL ---- */}
                  <div className="customer-detail-panel">
                    {selectedCustomer ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem' }}>{selectedCustomer.bedrijfsnaam}</h2>
                            {selectedCustomer.locatie && (
                              <div className="text-secondary" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={14} /> {selectedCustomer.locatie}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setEditingCustomer(selectedCustomer)}>
                              <FileText size={14} /> Bewerk
                            </button>
                            <button className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: 'var(--color-red)' }} onClick={() => deleteCustomer(selectedCustomer.id)}>
                              <Trash2 size={14} /> Verwijder
                            </button>
                          </div>
                        </div>

                        {selectedCustomer.contactpersoon && (
                          <div className="customer-contact-info">
                            <div><User size={14} /> {selectedCustomer.contactpersoon}</div>
                            {selectedCustomer.contact_telefoon && <div><Phone size={14} /> {selectedCustomer.contact_telefoon}</div>}
                            {selectedCustomer.contact_email && <div><Mail size={14} /> {selectedCustomer.contact_email}</div>}
                          </div>
                        )}

                        {selectedCustomer.bijzonderheden && (
                          <div className="customer-notes">
                            <Info size={14} /> {selectedCustomer.bijzonderheden}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>
                            Machines & Apparatuur ({apparatuur.filter(e => e.klant_id === selectedCustomer.id).length})
                          </h3>
                          <button className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setShowMachineFormForCustomer(selectedCustomer.id)}>
                            <Plus size={14} /> Machine Toevoegen
                          </button>
                        </div>

                        <div className="dispatch-table-container">
                          <table className="dispatch-table">
                            <thead>
                              <tr>
                                <th>Machine</th>
                                <th>Merk / Type</th>
                                <th>S/N</th>
                                <th>Specificaties</th>
                                <th>Interval</th>
                                <th>Locatie</th>
                                <th style={{ width: '70px' }}>Acties</th>
                              </tr>
                            </thead>
                            <tbody>
                              {apparatuur
                                .filter(e => e.klant_id === selectedCustomer.id)
                                .map(eq => (
                                  <tr key={eq.id}>
                                    <td>
                                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                                        {eq.naam || eq.merk || 'Onbekend'}
                                      </div>
                                      <span className={`badge badge-${eq.type === 'weegschaal' ? 'kalibratie' : 'onderhoud'}`} style={{ fontSize: '0.65rem' }}>
                                        {eq.type === 'weegschaal' ? (eq.soort_weegschaal || 'Weegschaal') : (eq.soort_machine || 'Afvalmachine')}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem' }}>
                                      <div>Merk: {eq.merk || eq.model?.split(' ')[0] || 'N.v.t.'}</div>
                                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>Type: {eq.type_nummer || eq.model || 'N.v.t.'}</div>
                                    </td>
                                    <td style={{ fontSize: '0.8rem' }}>{eq.serienummer || 'N.v.t.'}</td>
                                    <td style={{ fontSize: '0.75rem' }}>
                                      {eq.type === 'weegschaal' ? (
                                        <>
                                          {eq.capaciteit && <div>Cap: {eq.capaciteit}</div>}
                                          {eq.indeling_d && <div>d: {eq.indeling_d}</div>}
                                        </>
                                      ) : (
                                        eq.soort_machine || '-'
                                      )}
                                    </td>
                                    <td style={{ fontSize: '0.8rem' }}>
                                      {eq.interval_maanden === 6 ? '2x/jaar' : '1x/jaar'}
                                    </td>
                                    <td style={{ fontSize: '0.75rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <MapPin size={10} /> {eq.locatie || 'N.v.t.'}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="flex gap-1">
                                        <button className="btn-icon-edit" onClick={() => setEditingEquipment(eq)} title="Bewerk">
                                          <FileText size={14} />
                                        </button>
                                        <button className="btn-icon-delete" onClick={() => deleteEquipment(eq.id)} title="Verwijder">
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              {apparatuur.filter(e => e.klant_id === selectedCustomer.id).length === 0 && (
                                <tr>
                                  <td colSpan="7" className="text-center text-muted" style={{ padding: '2rem' }}>
                                    Nog geen machines voor deze klant. Klik op "Machine Toevoegen".
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Show active tasks for this customer */}
                        {(() => {
                          const eqIds = apparatuur.filter(e => e.klant_id === selectedCustomer.id).map(e => e.id);
                          const actieveTaken = taken.filter(t => eqIds.includes(t.equipment_id) && t.status !== 'afgerond' && t.status !== 'klant_wil_niet');
                          if (actieveTaken.length === 0) return null;
                          return (
                            <div style={{ marginTop: '1.5rem' }}>
                              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Actieve Planningen & Storingen ({actieveTaken.length})</h3>
                              <div className="dispatch-table-container">
                                <table className="dispatch-table">
                                  <thead>
                                    <tr>
                                      <th>Taak</th>
                                      <th>Type</th>
                                      <th>Status</th>
                                      <th>Datum</th>
                                      <th>Partner</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {actieveTaken.map(task => {
                                      const eq = apparatuur.find(e => e.id === task.equipment_id);
                                      return (
                                        <tr key={task.id} onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer' }}>
                                          <td style={{ fontWeight: '500' }}>{task.titel}</td>
                                          <td><span className={`badge badge-${task.type}`}>{task.type}</span></td>
                                          <td style={{ fontSize: '0.8rem' }}>{task.status.replace(/_/g, ' ')}</td>
                                          <td style={{ fontSize: '0.8rem' }}>{new Date(task.geplande_datum).toLocaleDateString('nl-NL')}</td>
                                          <td style={{ fontSize: '0.8rem' }}>{task.servicepartner}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                        <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Selecteer een klant</h3>
                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Kies links een klant om de machines en planningen te bekijken, of maak een nieuwe klant aan.</p>
                      </div>
                    )}
                </div>
              </div>
            </div>
            )}
          </>
        )}
      </main>

      {/* COLLAPSIBLE SETTINGS SIDEBAR */}
      <div className={`settings-sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`settings-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="settings-sidebar-header">
          <Sliders size={16} /> Instellingen
          <button className="modal-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        
        <div className="settings-sidebar-tabs">
          {[
            { id: 'fields', label: 'Custom Veld', icon: '📋' },
            { id: 'partners', label: 'Servicepartners', icon: '🤝' },
            { id: 'weegschaal', label: 'Weegschaal Types', icon: '⚖️' },
            { id: 'machine', label: 'Machine Types', icon: '🔩' },
            { id: 'users', label: 'Gebruikers', icon: '👤', adminOnly: true },
          ].filter(tab => !tab.adminOnly || profile?.role === 'admin').map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${sidebarSection === tab.id ? 'active' : ''}`}
              onClick={() => setSidebarSection(sidebarSection === tab.id ? '' : tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-sidebar-content">
          {/* Gebruikersbeheer */}
          {sidebarSection === 'users' && profile?.role === 'admin' && (
            <div className="settings-panel">
              <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                Huidige medewerkers. Nieuwe gebruikers kunnen momenteel alleen via het dashboard worden toegevoegd.
              </p>
              <div className="sp-card-list">
                 {/* Users will be fetched here in a future task if needed, for now just show account info */}
                 <div className="sp-card">
                    <div className="sp-card-name">Jouw Account</div>
                    <div className="sp-card-details">
                       <span className="sp-badge-email">{user.email}</span>
                       <span className="badge badge-contract">{profile?.role}</span>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {sidebarSection === 'fields' && (
            <div className="settings-panel">
              <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                Velden die verschijnen op alle klant- en machinekaarten.
              </p>
              <div className="field-list" style={{ marginBottom: '0.75rem' }}>
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
                <input type="text" placeholder="Veldnaam..." className="search-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  value={newFieldName} onChange={e => setNewFieldName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGlobalCustomField(newFieldName)} />
                <button className="btn-primary" style={{ padding: '0.4rem 0.75rem' }} onClick={() => addGlobalCustomField(newFieldName)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Service Partners */}
          {sidebarSection === 'partners' && (
            <div className="settings-panel">
              <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                Klik op een partner om contactgegevens te bewerken.
              </p>
              <div className="sp-card-list" style={{ marginBottom: '0.75rem' }}>
                {servicepartners.filter(p => p && (typeof p === 'string' || p.name)).map(partner => {
                  const pName = partner.name || partner;
                  return (
                    <div key={partner.id || partner} className="sp-card" onClick={() => setEditingServicePartner(partner)}>
                      <div className="sp-card-top">
                        <span className="sp-card-name">{pName}</span>
                        <button className="btn-icon-delete" onClick={(e) => { e.stopPropagation(); deleteServicePartner(partner.id || partner); }} title="Verwijder">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="sp-card-details">
                        {partner.phone && <span className="sp-badge-phone">📞 {partner.phone}</span>}
                        {partner.email && <span className="sp-badge-email">✉ {partner.email}</span>}
                        {!partner.phone && !partner.email && <span className="text-muted" style={{ fontSize: '0.7rem' }}>Klik om in te vullen</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="form-inline">
                <input type="text" placeholder="Partner toevoegen..." className="search-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  value={newServicePartnerName} onChange={e => setNewServicePartnerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addServicePartner(newServicePartnerName)} />
                <button className="btn-primary" style={{ padding: '0.4rem 0.75rem' }} onClick={() => addServicePartner(newServicePartnerName)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Weegschaal Types */}
          {sidebarSection === 'weegschaal' && (
            <div className="settings-panel">
              <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                Types voor de "Soort Weegschaal" dropdown.
              </p>
              <div className="tag-list" style={{ marginBottom: '0.75rem' }}>
                {soortWeegschaalOpties.map(opt => (
                  <div key={opt} className="tag-item">
                    <span>{opt}</span>
                    <button className="tag-remove" onClick={() => deleteWeegschaalType(opt)}>✕</button>
                  </div>
                ))}
              </div>
              <div className="form-inline">
                <input type="text" placeholder="Nieuw type..." className="search-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  value={newWeegschaalType} onChange={e => setNewWeegschaalType(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addWeegschaalType(newWeegschaalType)} />
                <button className="btn-primary" style={{ padding: '0.4rem 0.75rem' }} onClick={() => addWeegschaalType(newWeegschaalType)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Machine Types */}
          {sidebarSection === 'machine' && (
            <div className="settings-panel">
              <p className="text-secondary" style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                Types voor de "Soort Machine" dropdown.
              </p>
              <div className="tag-list" style={{ marginBottom: '0.75rem' }}>
                {soortMachineOpties.map(opt => (
                  <div key={opt} className="tag-item">
                    <span>{opt}</span>
                    <button className="tag-remove" onClick={() => deleteMachineType(opt)}>✕</button>
                  </div>
                ))}
              </div>
              <div className="form-inline">
                <input type="text" placeholder="Nieuw type..." className="search-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                  value={newMachineType} onChange={e => setNewMachineType(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addMachineType(newMachineType)} />
                <button className="btn-primary" style={{ padding: '0.4rem 0.75rem' }} onClick={() => addMachineType(newMachineType)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

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
          soortWeegschaalOpties={soortWeegschaalOpties}
          soortMachineOpties={soortMachineOpties}
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
              servicepartner: servicepartners[0]?.name || servicepartners[0],
              omschrijving: 'Eerste periodieke taak na toevoegen apparaat.'
            };
            await saveTask(task);
            
            setShowEquipmentForm(false);
            fetchData();
          }}
        />
      )}

      {/* MODAL: EDIT EQUIPMENT / CLIENT */}
      {editingEquipment && (
        <NewEquipmentModal 
          key={editingEquipment.id}
          initialData={editingEquipment}
          soortWeegschaalOpties={soortWeegschaalOpties}
          soortMachineOpties={soortMachineOpties}
          onClose={() => { setEditingEquipment(null); fetchData(); }}
          onSave={async (eq) => {
            await saveEquipment(eq);
            setEditingEquipment(null);
            fetchData();
          }}
        />
      )}

      {/* MODAL: CUSTOMER FORM */}
      {(showCustomerForm || editingCustomer) && (
        <CustomerFormModal
          key={editingCustomer?.id || 'new'}
          initialData={editingCustomer}
          onClose={() => { setShowCustomerForm(false); setEditingCustomer(null); fetchData(); }}
          onSave={async (data) => {
            await saveCustomer(data);
            setShowCustomerForm(false);
            setEditingCustomer(null);
            fetchData();
          }}
        />
      )}

      {/* MODAL: NEW MACHINE FOR CUSTOMER */}
      {showMachineFormForCustomer && (
        <NewEquipmentModal 
          key={'machine-' + showMachineFormForCustomer}
          klantId={showMachineFormForCustomer}
          soortWeegschaalOpties={soortWeegschaalOpties}
          soortMachineOpties={soortMachineOpties}
          onClose={() => { setShowMachineFormForCustomer(null); fetchData(); }}
          onSave={async (eq) => {
            const savedEq = await saveEquipment(eq);
            const baseDate = new Date();
            const task = {
              equipment_id: savedEq.id,
              titel: `${savedEq.type === 'weegschaal' ? 'Kalibratie' : 'Periodiek Onderhoud'} ${savedEq.naam || eq.merk}`,
              type: savedEq.type === 'weegschaal' ? 'kalibratie' : 'onderhoud',
              status: 'te_benaderen',
              prioriteit: 'medium',
              geplande_datum: baseDate.toISOString().split('T')[0],
              bezoekdatum: '',
              servicepartner: servicepartners[0]?.name || servicepartners[0],
              omschrijving: 'Eerste periodieke taak na toevoegen apparaat.'
            };
            await saveTask(task);
            setShowMachineFormForCustomer(null);
            fetchData();
          }}
        />
      )}

      {/* MODAL: EDIT SERVICE PARTNER */}
      {editingServicePartner && (
        <ServicePartnerFormModal
          key={editingServicePartner.id || editingServicePartner}
          partner={editingServicePartner}
          onClose={() => setEditingServicePartner(null)}
          onSave={async (id, updates) => {
            await updateServicePartner(id, updates);
            setEditingServicePartner(null);
          }}
        />
      )}
    </div>
      )}
    </>
  );
}

// =============================================================================
// SUB-COMPONENT: KANBAN TASK CARD
// =============================================================================
function TaskCard({ task, apparatuur, onDragStart, onClick, overdue, upcoming }) {
  const eq = apparatuur.find(e => e.id === task.equipment_id) || {};
  const eqList = task.apparatuur_lijst || [];
  const eersteApparaat = eqList.length > 0 ? eqList[0] : null;
  
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
      
      <div className="card-title">{eq.naam || (eersteApparaat?.merk || '') + ' ' + (eersteApparaat?.type_nummer || '') || 'Onbekend apparaat'}</div>
      
      <div className="card-details">
        <div className="card-detail-item">
          <MapPin size={12} />
          <span>{eq.locatie || eersteApparaat?.locatie || 'Geen locatie'}</span>
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
          {eqList.length > 1 && <span style={{ fontWeight: '600', marginRight: '0.35rem' }}>{eqList.length}x </span>}
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

          {/* Show apparatuur_lijst from task */}
          {task.apparatuur_lijst && task.apparatuur_lijst.length > 0 && (
            <>
              <div className="section-title-in-modal">🔧 Apparaten op deze Taak ({task.apparatuur_lijst.length})</div>
              <div style={{ marginBottom: '1rem' }}>
                {task.apparatuur_lijst.map((app, idx) => (
                  <div key={idx} className="apparaat-row" style={{ fontSize: '0.8rem' }}>
                    <div className="apparaat-row-header">
                      <span className="apparaat-row-nr">{idx + 1}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                      <div><span className="text-muted">Merk:</span> {app.merk || '-'}</div>
                      <div><span className="text-muted">Type:</span> {app.type_nummer || '-'}</div>
                      <div><span className="text-muted">Serienummer:</span> {app.serienummer || '-'}</div>
                      <div><span className="text-muted">Locatie:</span> {app.locatie || '-'}</div>
                    </div>
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
                {servicepartners
  .map(p => { try { return typeof p === 'string' && (p.startsWith('{') || p.startsWith('[')) ? JSON.parse(p) : p; } catch(e) { return p; } })
  .filter(p => p && (typeof p === 'string' || p.name))
  .map(p => <option key={p.id || p} value={p.name || p}>{p.name || p}</option>)}
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
  const [titel, setTitel] = useState('');
  const [prioriteit, setPrioriteit] = useState('high');
  const [geplandeDatum, setGeplandeDatum] = useState(new Date().toISOString().split('T')[0]);
  const [servicepartner, setServicepartner] = useState(servicepartners[0]?.name || servicepartners[0] || '');
  const [omschrijving, setOmschrijving] = useState('');
  const [apparaten, setApparaten] = useState([{ key: Date.now(), merk: '', type_nummer: '', serienummer: '', locatie: '' }]);

  const addApparaat = () => {
    setApparaten(prev => [...prev, { key: Date.now(), merk: '', type_nummer: '', serienummer: '', locatie: '' }]);
  };

  const removeApparaat = (key) => {
    setApparaten(prev => prev.filter(a => a.key !== key));
  };

  const updateApparaat = (key, field, value) => {
    setApparaten(prev => prev.map(a => a.key === key ? { ...a, [field]: value } : a));
  };

  const handleSave = () => {
    if (!titel.trim()) {
      alert("Voer a.u.b. een titel in.");
      return;
    }
    
    const apparatuurLijst = apparaten
      .filter(a => a.merk.trim() || a.type_nummer.trim() || a.serienummer.trim())
      .map(a => ({
        merk: a.merk.trim(),
        type_nummer: a.type_nummer.trim(),
        serienummer: a.serienummer.trim(),
        locatie: a.locatie.trim()
      }));

    onSave({
      titel,
      type,
      status: type === 'storing' ? 'te_plannen' : 'te_benaderen',
      prioriteit,
      geplande_datum: geplandeDatum,
      bezoekdatum: '',
      servicepartner,
      omschrijving,
      apparatuur_lijst: apparatuurLijst.length > 0 ? apparatuurLijst : null
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '700px' }}>
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
                {servicepartners
  .map(p => { try { return typeof p === 'string' && (p.startsWith('{') || p.startsWith('[')) ? JSON.parse(p) : p; } catch(e) { return p; } })
  .filter(p => p && (typeof p === 'string' || p.name))
  .map(p => <option key={p.id || p} value={p.name || p}>{p.name || p}</option>)}
              </select>
            </div>
          </div>

          <div className="section-title-in-modal" style={{ marginTop: '1rem' }}>🔧 Apparaten / Weegschalen</div>
          <p className="text-secondary" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
            Voeg hier de apparaten in waar deze taak voor geldt. Je kunt meerdere apparaten toevoegen.
          </p>

          {apparaten.map((apparaat, idx) => (
            <div key={apparaat.key} className="apparaat-row">
              <div className="apparaat-row-header">
                <span className="apparaat-row-nr">Apparaat {idx + 1}</span>
                {apparaten.length > 1 && (
                  <button className="btn-icon-delete" onClick={() => removeApparaat(apparaat.key)} title="Verwijder">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Merk</label>
                  <input type="text" className="form-control" placeholder="Bijv. Mettler Toledo" value={apparaat.merk} onChange={e => updateApparaat(apparaat.key, 'merk', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Type / Model</label>
                  <input type="text" className="form-control" placeholder="Bijv. ICS465" value={apparaat.type_nummer} onChange={e => updateApparaat(apparaat.key, 'type_nummer', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Serienummer</label>
                  <input type="text" className="form-control" placeholder="Bijv. MT-988371-B" value={apparaat.serienummer} onChange={e => updateApparaat(apparaat.key, 'serienummer', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Locatie bij klant</label>
                  <input type="text" className="form-control" placeholder="Bijv. Hal A" value={apparaat.locatie} onChange={e => updateApparaat(apparaat.key, 'locatie', e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          <button className="btn-secondary" style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem' }} onClick={addApparaat}>
            <Plus size={14} /> Nog een apparaat toevoegen
          </button>

          <div className="form-group form-grid-full" style={{ marginTop: '1rem' }}>
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
function NewEquipmentModal({ onClose, onSave, initialData, klantId, soortWeegschaalOpties, soortMachineOpties }) {
  const isEditing = !!initialData;
  const [type, setType] = useState(initialData?.type || 'weegschaal');
  const [naam, setNaam] = useState(initialData?.naam || '');
  const [locatie, setLocatie] = useState(initialData?.locatie || '');
  const [merk, setMerk] = useState(initialData?.merk || initialData?.model?.split(' ')[0] || '');
  const [typeNummer, setTypeNummer] = useState(initialData?.type_nummer || initialData?.model || '');
  const [serienummer, setSerienummer] = useState(initialData?.serienummer || '');
  const [capaciteit, setCapaciteit] = useState(initialData?.capaciteit || initialData?.weegbereik || '');
  const [indelingD, setIndelingD] = useState(initialData?.indeling_d || initialData?.nauwkeurigheid || '');
  const [soortWeegschaal, setSoortWeegschaal] = useState(initialData?.soort_weegschaal || '');
  const [soortMachine, setSoortMachine] = useState(initialData?.soort_machine || '');
  const [intervalMaanden, setIntervalMaanden] = useState(initialData?.interval_maanden || 12);

  const handleSave = () => {
    if (!naam.trim() || !locatie.trim()) {
      alert("Naam en Locatie zijn verplichte velden.");
      return;
    }

    const payload = {
      type,
      naam,
      locatie,
      merk,
      type_nummer: typeNummer,
      serienummer,
      capaciteit: type === 'weegschaal' ? capaciteit : 'N.v.t.',
      indeling_d: type === 'weegschaal' ? indelingD : 'N.v.t.',
      soort_weegschaal: type === 'weegschaal' ? soortWeegschaal : null,
      soort_machine: type === 'afvalmachine' ? soortMachine : null,
      interval_maanden: parseInt(intervalMaanden, 10),
      custom_fields: initialData?.custom_fields || {}
    };

    if (klantId) {
      payload.klant_id = klantId;
    }

    if (isEditing) {
      payload.id = initialData.id;
    }

    onSave(payload);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">{isEditing ? '✏️ Machine Bewerken' : klantId ? '➕ Nieuwe Machine Toevoegen' : '➕ Nieuwe Machine Registreren'}</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="section-title-in-modal">🏷️ Machine Basis</div>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label>Type Machine</label>
              <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                <option value="weegschaal">🟢 Weegschaal (Kalibratie)</option>
                <option value="afvalmachine">🔵 Afvalbewerkingsmachine (Onderhoud & Keuring)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Naam / Omschrijving *</label>
              <input type="text" className="form-control" placeholder="Bijv. Mettler Toledo Bench Scale..." value={naam} onChange={e => setNaam(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Locatie bij klant *</label>
              <input type="text" className="form-control" placeholder="Bijv. Hal A - Inpak..." value={locatie} onChange={e => setLocatie(e.target.value)} />
            </div>
          </div>

          <div className="section-title-in-modal">🔧 Merk & Identificatie</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Merk</label>
              <input type="text" className="form-control" placeholder="Bijv. Mettler Toledo" value={merk} onChange={e => setMerk(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Typenummer</label>
              <input type="text" className="form-control" placeholder="Bijv. ICS465" value={typeNummer} onChange={e => setTypeNummer(e.target.value)} />
            </div>
            <div className="form-group form-grid-full">
              <label>Serienummer</label>
              <input type="text" className="form-control" placeholder="Bijv. MT-988371-B" value={serienummer} onChange={e => setSerienummer(e.target.value)} />
            </div>
          </div>

          {type === 'weegschaal' && (
            <>
              <div className="section-title-in-modal">⚖️ Weegschaal Specificaties</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Capaciteit (weegbereik)</label>
                  <input type="text" className="form-control" placeholder="Bijv: 0 - 60 kg" value={capaciteit} onChange={e => setCapaciteit(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Indeling (d)</label>
                  <input type="text" className="form-control" placeholder="Bijv: 5 g" value={indelingD} onChange={e => setIndelingD(e.target.value)} />
                </div>
                <div className="form-group form-grid-full">
                  <label>Soort Weegschaal</label>
                  <select className="form-control" value={soortWeegschaal} onChange={e => setSoortWeegschaal(e.target.value)}>
                    <option value="">-- Selecteer --</option>
                    {(soortWeegschaalOpties || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {type === 'afvalmachine' && (
            <>
              <div className="section-title-in-modal">🔩 Machine Specificaties</div>
              <div className="form-grid">
                <div className="form-group form-grid-full">
                  <label>Soort Machine</label>
                  <select className="form-control" value={soortMachine} onChange={e => setSoortMachine(e.target.value)}>
                    <option value="">-- Selecteer --</option>
                    {(soortMachineOpties || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="section-title-in-modal">📅 Planning & Interval</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Terugkerend Interval</label>
              <select className="form-control" value={intervalMaanden} onChange={e => setIntervalMaanden(e.target.value)}>
                <option value="12">1x per jaar (elke 12 maanden)</option>
                <option value="6">2x per jaar (elke 6 maanden)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuleren</button>
          <button className="btn-primary" onClick={handleSave}>{isEditing ? 'Wijzigingen Opslaan' : 'Machine Toevoegen & Plan Eerste Beurt'}</button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: CUSTOMER FORM MODAL
// =============================================================================
function CustomerFormModal({ onClose, onSave, initialData }) {
  const isEditing = !!initialData;
  const [bedrijfsnaam, setBedrijfsnaam] = useState(initialData?.bedrijfsnaam || '');
  const [locatie, setLocatie] = useState(initialData?.locatie || '');
  const [contactpersoon, setContactpersoon] = useState(initialData?.contactpersoon || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contact_email || '');
  const [contactTelefoon, setContactTelefoon] = useState(initialData?.contact_telefoon || '');
  const [contract, setContract] = useState(initialData?.contract || false);
  const [bijzonderheden, setBijzonderheden] = useState(initialData?.bijzonderheden || '');

  const handleSave = () => {
    if (!bedrijfsnaam.trim()) {
      alert("Bedrijfsnaam is verplicht.");
      return;
    }

    const payload = {
      bedrijfsnaam,
      locatie,
      contactpersoon,
      contact_email: contactEmail,
      contact_telefoon: contactTelefoon,
      contract,
      bijzonderheden,
      custom_fields: initialData?.custom_fields || {}
    };

    if (isEditing) {
      payload.id = initialData.id;
    }

    onSave(payload);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-title">{isEditing ? '✏️ Klant Bewerken' : '➕ Nieuwe Klant Aanmaken'}</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="section-title-in-modal">🏢 Klantgegevens</div>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label>Bedrijfsnaam *</label>
              <input type="text" className="form-control" placeholder="Bijv. Afvalverwerking Voorbeeld BV" value={bedrijfsnaam} onChange={e => setBedrijfsnaam(e.target.value)} />
            </div>

            <div className="form-group form-grid-full">
              <label>Vestigingslocatie / Adres</label>
              <input type="text" className="form-control" placeholder="Bijv. Industrieweg 15, Amsterdam" value={locatie} onChange={e => setLocatie(e.target.value)} />
            </div>
          </div>

          <div className="section-title-in-modal">📞 Contactgegevens</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Contactpersoon</label>
              <input type="text" className="form-control" placeholder="Bijv. Marc de Vries" value={contactpersoon} onChange={e => setContactpersoon(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Telefoonnummer</label>
              <input type="text" className="form-control" placeholder="Bijv. 06-12345678" value={contactTelefoon} onChange={e => setContactTelefoon(e.target.value)} />
            </div>
            <div className="form-group form-grid-full">
              <label>E-mailadres</label>
              <input type="email" className="form-control" placeholder="contact@voorbeeld.nl" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </div>
          </div>

          <div className="section-title-in-modal">📋 Contract & Notities</div>
          <div className="form-grid">
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="cust-contract" 
                className="checkbox-custom" 
                checked={contract} 
                onChange={e => setContract(e.target.checked)} 
              />
              <label htmlFor="cust-contract" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>★ Deze klant heeft een Servicecontract</label>
            </div>

            <div className="form-group form-grid-full">
              <label>Algemene Notities / Bijzonderheden</label>
              <textarea className="form-control" placeholder="Specifieke klantinformatie..." value={bijzonderheden} onChange={e => setBijzonderheden(e.target.value)}></textarea>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuleren</button>
          <button className="btn-primary" onClick={handleSave}>{isEditing ? 'Wijzigingen Opslaan' : 'Klant Aanmaken'}</button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: SERVICE PARTNER FORM MODAL
// =============================================================================
function ServicePartnerFormModal({ partner, onClose, onSave }) {
  const partnerData = partner.name ? partner : { name: partner, phone: '', email: '', notes: '' };
  const [name, setName] = useState(partnerData.name || '');
  const [phone, setPhone] = useState(partnerData.phone || '');
  const [email, setEmail] = useState(partnerData.email || '');

  const handleSave = () => {
    if (!name.trim()) {
      alert("Naam is verplicht.");
      return;
    }
    onSave(partner.id || partner, { name: name.trim(), phone, email });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div className="modal-title">✏️ Servicepartner Bewerken</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="section-title-in-modal">🤝 Contactgegevens</div>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label>Bedrijfsnaam *</label>
              <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Telefoonnummer</label>
              <input type="text" className="form-control" placeholder="Bijv. 06-12345678" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>E-mailadres</label>
              <input type="email" className="form-control" placeholder="partner@bedrijf.nl" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuleren</button>
          <button className="btn-primary" onClick={handleSave}>Opslaan</button>
        </div>
      </div>
    </div>
  );
}
