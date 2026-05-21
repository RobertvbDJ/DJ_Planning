import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await login(email, password);
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
           <img src="/assets/logo.svg" alt="Logo" style={{ height: '4rem', marginBottom: '2rem' }} />
        </div>
        <h1>Inloggen Planningsysteem</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><Mail size={16} /> E-mailadres</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="naam@voorbeeld.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label><Lock size={16} /> Wachtwoord</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Bezig met inloggen...' : 'Inloggen'}
          </button>
        </form>
        <p className="login-footer">
          Toegang alleen voor geautoriseerde medewerkers van De Jong systemen.
        </p>
      </div>
    </div>
  );
}
