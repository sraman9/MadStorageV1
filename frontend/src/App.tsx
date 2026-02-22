import React, { useState, useEffect } from 'react';
import StorageRequestCard from './components/StorageRequestCard';
import StorageSpaceCard from './components/StorageSpaceCard';
import logo from './assets/logo.png';


interface StorageRequest {
  name: string;
  profileImage: string;
  neighborhood: string;
  items: string[];
  budget: string;
  timeframe: string;
  description: string;
}

interface StorageSpace {
  name: string;
  profileImage: string;
  neighborhood: string;
  spaceImage: string;
  spaceType: string;
  capacity: string[];
  timeframe: string;
  description: string;
  price?: number | null;
  marketAvg?: number;
  savings?: number | null;
}
const FONT = "'DM Sans', system-ui, sans-serif";

// ─── Auth Card ────────────────────────────────────────────────────────────────
function AuthCard({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    fontSize: '14px',
    fontFamily: FONT,
    color: '#111827',
    outline: 'none',
    marginBottom: '12px',
    boxSizing: 'border-box',
  };

  const handleSubmit = () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !name) { setError('Please enter your name.'); return; }
    if (mode === 'signup' && !email.endsWith('@wisc.edu')) {
      setError('Please use your @wisc.edu email address.');
      return;
    }
    setError('');
    onSuccess();
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      padding: '32px',
      width: '100%',
      maxWidth: '400px',
    }}>
      {/* Tab toggle */}
      <div style={{
        display: 'flex',
        background: '#f3f4f6',
        borderRadius: '100px',
        padding: '4px',
        marginBottom: '24px',
        gap: '2px',
      }}>
        {(['signin', 'signup'] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '100px',
              border: 'none',
              background: mode === m ? '#C5050C' : 'transparent',
              color: mode === m ? '#fff' : '#6b7280',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: FONT,
              transition: 'all 0.15s ease',
              boxShadow: mode === m ? '0 1px 4px rgba(197,5,12,0.3)' : 'none',
            }}
          >
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Fields */}
      {mode === 'signup' && (
        <input
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = '#C5050C')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
        />
      )}
      <input
        placeholder={mode === 'signup' ? 'UW-Madison email (@wisc.edu)' : 'Email address'}
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
        onFocus={e => (e.currentTarget.style.borderColor = '#C5050C')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ ...inputStyle, marginBottom: '0' }}
        onFocus={e => (e.currentTarget.style.borderColor = '#C5050C')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
      />

      {/* Error */}
      {error && (
        <div style={{ fontSize: '13px', color: '#C5050C', marginTop: '10px', fontFamily: FONT }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        style={{
          width: '100%',
          background: '#C5050C',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          padding: '13px',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          fontFamily: FONT,
          marginTop: '16px',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
        onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
      >
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </button>

      {mode === 'signup' && (
        <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', marginTop: '12px', fontFamily: FONT }}>
          MadStorage is exclusively for UW-Madison students.
        </p>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [viewMode, setViewMode] = useState<'home' | 'requests' | 'space'>('home');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'request' | 'space'>('request');

  const [requests, setRequests] = useState<StorageRequest[]>([]);
  const [spaces, setSpaces] = useState<StorageSpace[]>([]);

  // --- NEW: State for Form Inputs ---
  const [formData, setFormData] = useState({
    name: "Bucky Badger", // Default for hackathon
    profileImage: "https://i.pravatar.cc/150?img=11",
    items: "",
    budget: "",
    timeframe: "",
    neighborhood: "",
    description: "",
    spaceType: "",
    spaceImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64", // Default image
    price: "",
  });

// 2. FETCH: This pulls from your Python API when the app loads
useEffect(() => {
  const loadData = async () => {
    try {
      const reqRes = await fetch('http://127.0.0.1:8000/api/requests');
      const spaceRes = await fetch('http://127.0.0.1:8000/api/spaces');
      setRequests(await reqRes.json());
      setSpaces(await spaceRes.json());
    } catch (err) {
      console.error("Make sure your Python server is running on port 8000!");
    }
  };
  loadData();
}, []);



  const openModal = (type: 'request' | 'space') => {
    setModalType(type);
    setShowModal(true);
  };

  // PASTE THIS RIGHT HERE:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const endpoint = modalType === 'request' ? 'requests' : 'spaces';
  const payload = modalType === 'request'
    ? { name: formData.name, profileImage: formData.profileImage, items: formData.items, budget: formData.budget, timeframe: formData.timeframe, neighborhood: formData.neighborhood, description: formData.description }
    : { name: formData.name, profileImage: formData.profileImage, neighborhood: formData.neighborhood, spaceImage: formData.spaceImage, spaceType: formData.spaceType, items: formData.items, timeframe: formData.timeframe, description: formData.description, price: formData.price ? parseFloat(formData.price) : null };

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const newItem = await response.json();
      if (modalType === 'request') setRequests([...requests, newItem]);
      else setSpaces([...spaces, newItem]);
      setShowModal(false);
    } else {
      const err = await response.json().catch(() => ({}));
      console.error('Submit failed:', response.status, err);
    }
  } catch (error) {
    console.error("Connection failed:", error);
  }
};
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8f9fa; }
      `}</style>

      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px',
          minHeight: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'nowrap',
        }}>
          {/* Logo */}
          <div
            onClick={() => setViewMode('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'opacity 0.15s ease', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <img
              src={logo}
              alt="MadStorage logo"
              style={{ height: '40px', width: 'auto' }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: '800', fontSize: '16px', color: '#111827', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>MadStorage</div>
              <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '500' }}>Student Storage Marketplace</div>
            </div>
          </div>

          {/* Toggle */}
          <div style={{
            display: 'flex', background: '#f3f4f6', borderRadius: '100px', padding: '4px', gap: '2px',
            flexShrink: 0,
          }}>
            {(['requests', 'space'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '8px 16px', borderRadius: '100px', border: 'none',
                  background: viewMode === mode ? '#C5050C' : 'transparent',
                  color: viewMode === mode ? '#fff' : '#6b7280',
                  fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                  transition: 'all 0.15s ease', fontFamily: FONT,
                  boxShadow: viewMode === mode ? '0 1px 4px rgba(197,5,12,0.3)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {mode === 'requests' ? 'Requests' : 'Spaces'}
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => openModal(viewMode === 'space' ? 'space' : 'request')}
            style={{
              background: '#C5050C', color: '#fff', border: 'none', borderRadius: '10px',
              padding: '10px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'background 0.15s ease', flexShrink: 0, whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            {viewMode === 'space' ? 'List Your Space' : 'Create Storage Request'}
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 32px' }}>

        {/* HOME */}
        {viewMode === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
            <img
              src={logo}
              alt="MadStorage"
              style={{ height: '180px', width: 'auto', marginBottom: '20px' }}
            />
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
              Welcome to MadStorage
            </h2>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
              Connect with fellow students for storage solutions
            </p>
            <AuthCard onSuccess={() => setViewMode('requests')} />
          </div>
        )}

        {/* STORAGE REQUESTS */}
        {viewMode === 'requests' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontWeight: '800', fontSize: '22px', color: '#111827' }}>Storage Requests Near You</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {requests.length} students looking for storage right now
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {requests.map((request, index) => (
                <StorageRequestCard key={index} {...request} />
              ))}
            </div>
          </>
        )}

        {/* STORAGE SPACES */}
        {viewMode === 'space' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontWeight: '800', fontSize: '22px', color: '#111827' }}>Storage Spaces Near You</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {spaces.length} spaces available from fellow Badgers
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {spaces.map((space, index) => (
                <StorageSpaceCard key={index} {...space} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px', padding: '32px',
              width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontWeight: '800', fontSize: '20px', color: '#111827', fontFamily: FONT }}>
                {modalType === 'request' ? 'Post a Storage Request' : 'List Your Space'}
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}>
                ✕
              </button>
            </div>

            {modalType === 'request' ? (
              <>
                {[
                  { label: 'What do you need to store?', key: 'items' as const, placeholder: 'e.g., 4 boxes, 1 mini fridge' },
                  { label: 'Budget', key: 'budget' as const, placeholder: 'e.g., $150-200' },
                  { label: 'Timeframe', key: 'timeframe' as const, placeholder: 'e.g., May 15 - Aug 20' },
                ].map(({ label, key, placeholder }) => (
                  <div key={label} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>{label}</label>
                    <input 
                      value={formData[key]} // Links the input to your state
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} // Updates state as you type
                      placeholder={placeholder} 
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '10px',
                        border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                      }}
                    />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>Space Type</label>
                  <select 
                    value={formData.spaceType} //
                    onChange={(e) => setFormData({ ...formData, spaceType: e.target.value })} //
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', background: '#fff', outline: 'none',
                    }}
                  >
                    <option value="">Select a space type</option>
                    {['Bedroom', 'Spare Bedroom', 'Bedroom Closet', 'Storage Closet', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>What can it fit?</label>
                  <input 
                    value={formData.items}
                    onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                    placeholder="e.g., 5-6 boxes, 1 mini fridge, 1 bike (or 5x5, 10x10 for savings)" 
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>Monthly rate ($)</label>
                  <input 
                    type="number"
                    min="0"
                    step="5"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g., 45" 
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>Available Timeframe</label>
                  <input 
                    value={formData.timeframe} // Add this
                    onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })} // Add this
                    placeholder="e.g., May 15 - Aug 20" 
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>Description</label>
                  <textarea 
                    value={formData.description} //
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} //
                    placeholder="Describe your space — size, access, any restrictions..." 
                    rows={3} 
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none', resize: 'vertical',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C5050C')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>Photo of Your Space</label>
                  <div style={{
                    border: '2px dashed #e5e7eb', borderRadius: '10px', padding: '24px',
                    textAlign: 'center', cursor: 'pointer', background: '#fafafa',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#C5050C')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT }}>Click to upload a photo</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginTop: '4px' }}>JPG, PNG up to 10MB</div>
                  </div>
                </div>
              </>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                {modalType === 'request' ? 'Preferred Location' : 'Your Neighborhood'}
              </label>
              <select 
              value={formData.neighborhood} 
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', background: '#fff', outline: 'none',
              }}
            >
              <option value="">Select a neighborhood</option>
              {['State St', 'Langdon', 'Willy St', 'Eagle Heights'].map(n => <option key={n}>{n}</option>)}
            </select>
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width: '100%', background: '#C5050C', color: '#fff', border: 'none',
                borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700',
                cursor: 'pointer', fontFamily: FONT,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
            >
              {modalType === 'request' ? 'Post Request' : 'List Space'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;