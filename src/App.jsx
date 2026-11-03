import { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);

  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthError(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    setResources([]);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setLink('');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = isRegistering ? '/auth/register' : '/auth/login';
    const payload = isRegistering 
      ? { username, email, password }
      : { username, password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Authentication failed (${res.status})`);
      }

      const userData = await res.json();
      handleLoginSuccess(userData);
    } catch (err) {
      setAuthError(err.message);
    }
  };

const loadResources = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/resources/user/${currentUser.id}`);
      if (!res.ok) throw new Error('Could not fetch resources');
      const data = await res.json();
      setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    let ignore = false;

    async function fetchOnMount() {
      try {
        const res = await fetch(`${API_BASE}/resources/user/${currentUser.id}`);
        if (!res.ok) throw new Error('Could not fetch resources');
        const data = await res.json();
        if (!ignore) {
          setResources(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
        }
      }
    }

    if (currentUser) {
      fetchOnMount();
    }

    return () => {
      ignore = true;
    };
  }, [currentUser]);

  const handleSaveResource = async (e) => {
    e.preventDefault();
    if (!title.trim() || !link.trim()) return;

    const payload = {
      title: title.trim(),
      link: link.trim(),
      userId: currentUser.id,
    };

    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/resources/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update resource');
      } else {
        const res = await fetch(`${API_BASE}/resources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create resource');
      }

      resetForm();
      await loadResources();
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditing = (resItem) => {
    setEditingId(resItem.id);
    setTitle(resItem.title);
    setLink(resItem.link || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      const res = await fetch(`${API_BASE}/resources/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete resource');
      
      if (editingId === id) resetForm();
      await loadResources();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredResources = resources.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.link && item.link.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 1. Unauthenticated View
  if (!currentUser) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div className="brand-logo-icon">R</div>
            <span className="brand-name">ResourceHub</span>
          </div>

          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>
            {isRegistering ? 'Create Account' : 'Sign In'}
          </h2>
          
          {authError && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            <div className="field-group" style={{ marginBottom: '14px' }}>
              <label className="field-label">Username</label>
              <input
                type="text"
                className="text-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {isRegistering && (
              <div className="field-group" style={{ marginBottom: '14px' }}>
                <label className="field-label">Email Address</label>
                <input
                  type="email"
                  className="text-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="field-group" style={{ marginBottom: '20px' }}>
              <label className="field-label">Password</label>
              <input
                type="password"
                className="text-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              {isRegistering ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '20px' }}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
            >
              {isRegistering ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // 2. Authenticated Dashboard View
  return (
    <>
      {/* Top Application Navbar */}
      <header className="top-header">
        <div className="top-header-inner">
          <div className="brand">
            <div className="brand-logo-icon">R</div>
            <span className="brand-name">ResourceHub</span>
          </div>
          <div className="user-profile">
            <div className="user-meta">
              <div className="user-username">{currentUser.username}</div>
              <div className="user-email">{currentUser.email}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-container">
        {/* Form Panel */}
        <section className="panel">
          <h2 className="panel-title">
            {editingId ? 'Edit Resource' : 'Add New Learning Resource'}
          </h2>
          <form onSubmit={handleSaveResource}>
            <div className="form-grid">
              <div className="field-group">
                <label className="field-label">Resource Title</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. Kubernetes Cluster Architecture"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <label className="field-label">Resource URL</label>
                <input
                  type="url"
                  className="text-input"
                  placeholder="https://kubernetes.io/docs/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Resource' : 'Save Resource'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Search & Counter Row */}
        <div className="explorer-header">
          <h2 className="explorer-title">
            My Resources ({filteredResources.length})
          </h2>
          <input
            type="text"
            className="search-input"
            placeholder="Search resources by title or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading resources...</p>}

        {!loading && filteredResources.length === 0 && (
          <div className="panel" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '48px 20px' }}>
            {searchQuery ? 'No resources matched your search query.' : 'No resources saved yet. Add your first resource above!'}
          </div>
        )}

        {/* Resources Grid */}
        <div className="resource-grid">
          {filteredResources.map((resItem) => (
            <article key={resItem.id} className="resource-card">
              <div>
                <h3>{resItem.title}</h3>
                {resItem.link ? (
                  <a href={resItem.link} target="_blank" rel="noreferrer" className="resource-link">
                    {resItem.link}
                  </a>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No link provided</span>
                )}
              </div>

              <div className="card-footer">
                <span className="card-date">
                  {resItem.createdAt ? new Date(resItem.createdAt).toLocaleDateString() : 'Recent'}
                </span>
                <div className="card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => startEditing(resItem)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(resItem.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export default App;