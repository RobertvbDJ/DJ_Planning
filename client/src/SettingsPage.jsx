import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Shield, ShieldOff, X, Sliders,
  Mail, UserPlus, FileText, Wrench, Scale, Users, HardDrive
} from 'lucide-react';

const NAV_SECTIONS = [
  { id: 'users', label: 'Gebruikers', icon: '👤', adminOnly: true },
  { id: 'fields', label: 'Custom Velden', icon: '📋' },
  { id: 'partners', label: 'Servicepartners', icon: '🤝' },
  { id: 'weegschaal', label: 'Weegschaal Types', icon: '⚖️' },
  { id: 'machine', label: 'Machine Types', icon: '🔩' },
];

export default function SettingsPage({
  profile,
  user,
  showToast,
  globalCustomFields,
  addGlobalCustomField,
  deleteGlobalCustomField,
  servicepartners,
  addServicePartner,
  deleteServicePartner,
  updateServicePartner,
  setEditingServicePartner,
  editingServicePartner,
  soortWeegschaalOpties,
  setSoortWeegschaalOpties,
  soortMachineOpties,
  setSoortMachineOpties,
}) {
  const [activeSection, setActiveSection] = useState('users');
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [addingUser, setAddingUser] = useState(false);

  const [newFieldName, setNewFieldName] = useState('');
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newWeegschaalType, setNewWeegschaalType] = useState('');
  const [newMachineType, setNewMachineType] = useState('');

  useEffect(() => {
    if (activeSection === 'users' && profile?.role === 'admin') {
      fetchUsers();
    }
  }, [activeSection, profile]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setUsersList(data || []);
    } catch (err) {
      console.error('Fetch users error:', err);
      showToast('Kon gebruikers niet laden: ' + err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) return;
    setAddingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Aanmaken mislukt');
      showToast(`Gebruiker ${newEmail} aangemaakt`);
      setShowAddUser(false);
      setNewEmail('');
      setNewPassword('');
      setNewRole('staff');
      fetchUsers();
    } catch (err) {
      showToast('Fout: ' + err.message);
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Weet je zeker dat je ${userEmail} wilt verwijderen?`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      if (!res.ok) throw new Error('Verwijderen mislukt');
      showToast(`${userEmail} verwijderd`);
      fetchUsers();
    } catch (err) {
      showToast('Fout bij verwijderen: ' + err.message);
    }
  };

  const handleChangeRole = async (userId, userEmail, newRole) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      if (!res.ok) throw new Error('Rol wijzigen mislukt');
      showToast(`Rol van ${userEmail} gewijzigd naar ${newRole}`);
      fetchUsers();
    } catch (err) {
      showToast('Fout: ' + err.message);
    }
  };

  const isAdmin = profile?.role === 'admin';
  const visibleSections = NAV_SECTIONS.filter(s => !s.adminOnly || isAdmin);

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div className="settings-icon"><Sliders size={18} /></div>
        <h2>Instellingen</h2>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          {visibleSections.map(section => (
            <button
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              {section.label}
            </button>
          ))}
          {isAdmin && (
            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.4rem 0.85rem' }}>
                <Mail size={11} style={{ marginRight: '0.3rem', display: 'inline' }} />
                {user?.email}
              </div>
            </div>
          )}
        </nav>

        <div className="settings-content">

          {/* ========== USERS ========== */}
          {activeSection === 'users' && isAdmin && (
            <div className="settings-section">
              <div className="settings-section-title">👤 Gebruikersbeheer</div>
              <div className="settings-section-desc">
                Beheer medewerkers die toegang hebben tot het planningsysteem.
              </div>
              <div className="user-mgmt-toolbar">
                <div className="user-count-badge">
                  {loadingUsers ? '...' : usersList.length} medewerker{usersList.length !== 1 ? 's' : ''}
                </div>
                <button className="btn-primary" onClick={() => setShowAddUser(true)}>
                  <UserPlus size={16} /> Nieuwe Gebruiker
                </button>
              </div>

              {loadingUsers ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <HardDrive size={24} className="animate-spin" />
                  <p>Gebruikers laden...</p>
                </div>
              ) : usersList.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <Users size={24} />
                  <p>Nog geen gebruikers</p>
                </div>
              ) : (
                <div className="user-list">
                  {usersList.map(u => (
                    <div key={u.id} className="user-card">
                      <div className="user-avatar">
                        {u.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="user-info">
                        <div className="user-email">{u.email}</div>
                        <div className="user-meta">
                          <span className={`role-badge ${u.role}`}>{u.role}</span>
                          {u.last_sign_in_at && (
                            <span className="user-date">
                              Laatste login: {new Date(u.last_sign_in_at).toLocaleDateString('nl-NL')}
                            </span>
                          )}
                          {u.created_at && (
                            <span className="user-date">
                              Aangemaakt: {new Date(u.created_at).toLocaleDateString('nl-NL')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="user-actions">
                        {u.role !== 'admin' ? (
                          <button className="btn-promote" title="Promoveer naar Admin"
                            onClick={() => handleChangeRole(u.id, u.email, 'admin')}>
                            <Shield size={14} />
                          </button>
                        ) : u.id !== user?.id ? (
                          <button className="btn-demote" title="Zet terug naar Staff"
                            onClick={() => handleChangeRole(u.id, u.email, 'staff')}>
                            <ShieldOff size={14} />
                          </button>
                        ) : null}
                        {u.id !== user?.id && (
                          <button className="btn-delete" title="Verwijder gebruiker"
                            onClick={() => handleDeleteUser(u.id, u.email)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== CUSTOM FIELDS ========== */}
          {activeSection === 'fields' && (
            <div className="settings-section">
              <div className="settings-section-title">📋 Custom Velden</div>
              <div className="settings-section-desc">
                Velden die verschijnen op alle klant- en machinekaarten.
              </div>
              <div className="settings-field-list">
                {globalCustomFields.map(field => (
                  <div key={field} className="settings-field-tag">
                    <FileText size={11} />
                    <span>{field}</span>
                    <button onClick={() => deleteGlobalCustomField(field)} title="Verwijder">
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {globalCustomFields.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nog geen custom velden...</div>
                )}
              </div>
              <div className="form-inline" style={{ marginTop: '0.5rem' }}>
                <input type="text" placeholder="Nieuw veldnaam..." className="search-input"
                  value={newFieldName}
                  onChange={e => setNewFieldName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newFieldName.trim()) {
                      addGlobalCustomField(newFieldName.trim());
                      setNewFieldName('');
                    }
                  }} />
                <button className="btn-primary" onClick={() => {
                  if (newFieldName.trim()) { addGlobalCustomField(newFieldName.trim()); setNewFieldName(''); }
                }}><Plus size={14} /></button>
              </div>
            </div>
          )}

          {/* ========== SERVICE PARTNERS ========== */}
          {activeSection === 'partners' && (
            <div className="settings-section">
              <div className="settings-section-title">🤝 Servicepartners</div>
              <div className="settings-section-desc">Klik op een partner om contactgegevens te bewerken.</div>
              <div style={{ marginBottom: '0.75rem' }}>
                {(servicepartners || []).filter(p => p && (typeof p === 'string' || p.name)).map(partner => {
                  const pName = partner.name || partner;
                  return (
                    <div key={partner.id || partner} className="settings-partner-card"
                      onClick={() => setEditingServicePartner(partner)}>
                      <div className="partner-name">{pName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                        {partner.phone && <span>📞 {partner.phone}</span>}
                        {partner.email && <span>✉ {partner.email}</span>}
                      </div>
                      <button className="partner-delete" onClick={(e) => {
                        e.stopPropagation();
                        deleteServicePartner(partner.id || partner);
                      }} title="Verwijder"><Trash2 size={12} /></button>
                    </div>
                  );
                })}
              </div>
              <div className="form-inline">
                <input type="text" placeholder="Naam servicepartner..." className="search-input"
                  value={newPartnerName}
                  onChange={e => setNewPartnerName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newPartnerName.trim()) { addServicePartner(newPartnerName.trim()); setNewPartnerName(''); } }} />
                <button className="btn-primary" onClick={() => {
                  if (newPartnerName.trim()) { addServicePartner(newPartnerName.trim()); setNewPartnerName(''); }
                }}><Plus size={14} /></button>
              </div>
            </div>
          )}

          {/* ========== SCALE TYPES ========== */}
          {activeSection === 'weegschaal' && (
            <div className="settings-section">
              <div className="settings-section-title">⚖️ Weegschaal Types</div>
              <div className="settings-section-desc">Types beschikbaar bij het toevoegen van een weegschaal.</div>
              <div className="settings-type-chips">
                {soortWeegschaalOpties.map(type => (
                  <div key={type} className="settings-type-chip">
                    <Scale size={11} />
                    <span>{type}</span>
                    <button onClick={() => setSoortWeegschaalOpties(prev => prev.filter(t => t !== type))} title="Verwijder">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="form-inline">
                <input type="text" placeholder="Nieuw weegschaal type..." className="search-input"
                  value={newWeegschaalType}
                  onChange={e => setNewWeegschaalType(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newWeegschaalType.trim()) { setSoortWeegschaalOpties(prev => [...prev.filter(t => t !== newWeegschaalType.trim()), newWeegschaalType.trim()]); setNewWeegschaalType(''); } }} />
                <button className="btn-primary" onClick={() => {
                  if (newWeegschaalType.trim()) { setSoortWeegschaalOpties(prev => [...prev.filter(t => t !== newWeegschaalType.trim()), newWeegschaalType.trim()]); setNewWeegschaalType(''); }
                }}><Plus size={14} /></button>
              </div>
            </div>
          )}

          {/* ========== MACHINE TYPES ========== */}
          {activeSection === 'machine' && (
            <div className="settings-section">
              <div className="settings-section-title">🔩 Machine Types</div>
              <div className="settings-section-desc">Types beschikbaar bij het toevoegen van een afvalmachine.</div>
              <div className="settings-type-chips">
                {soortMachineOpties.map(type => (
                  <div key={type} className="settings-type-chip">
                    <Wrench size={11} />
                    <span>{type}</span>
                    <button onClick={() => setSoortMachineOpties(prev => prev.filter(t => t !== type))} title="Verwijder">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="form-inline">
                <input type="text" placeholder="Nieuw machine type..." className="search-input"
                  value={newMachineType}
                  onChange={e => setNewMachineType(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newMachineType.trim()) { setSoortMachineOpties(prev => [...prev.filter(t => t !== newMachineType.trim()), newMachineType.trim()]); setNewMachineType(''); } }} />
                <button className="btn-primary" onClick={() => {
                  if (newMachineType.trim()) { setSoortMachineOpties(prev => [...prev.filter(t => t !== newMachineType.trim()), newMachineType.trim()]); setNewMachineType(''); }
                }}><Plus size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddUser && (
        <div className="add-user-overlay" onClick={() => setShowAddUser(false)}>
          <div className="add-user-modal" onClick={e => e.stopPropagation()}>
            <h3><UserPlus size={20} /> Nieuwe Gebruiker</h3>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>E-mailadres</label>
                <input type="email" className="form-control" placeholder="naam@bedrijf.nl"
                  value={newEmail} onChange={e => setNewEmail(e.target.value)} autoFocus required />
              </div>
              <div className="form-group">
                <label>Wachtwoord</label>
                <input type="password" className="form-control" placeholder="••••••••"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <div className="role-select">
                  <div className={`role-option ${newRole === 'staff' ? 'selected' : ''}`}
                    onClick={() => setNewRole('staff')}>👤 Staff</div>
                  <div className={`role-option ${newRole === 'admin' ? 'selected admin' : ''}`}
                    onClick={() => setNewRole('admin')}>👑 Admin</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddUser(false)}>Annuleren</button>
                <button type="submit" className="btn-primary" disabled={addingUser}>
                  {addingUser ? 'Bezig...' : 'Gebruiker Aanmaken'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingServicePartner && (
        <ServicePartnerFormModal
          partner={editingServicePartner}
          onClose={() => setEditingServicePartner(null)}
          onSave={async (id, updates) => {
            await updateServicePartner(id, updates);
            setEditingServicePartner(null);
          }}
        />
      )}
    </div>
  );
}

function ServicePartnerFormModal({ partner, onClose, onSave }) {
  const pid = partner.id || partner;
  const [name, setName] = useState(partner.name || partner);
  const [phone, setPhone] = useState(partner.phone || '');
  const [email, setEmail] = useState(partner.email || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(pid, { name: name.trim(), phone, email });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">✏️ Servicepartner Bewerken</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="section-title-in-modal">🤝 Contactgegevens</div>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label>Bedrijfsnaam</label>
              <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Telefoonnummer</label>
              <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>E-mailadres</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuleren</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Bezig...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
