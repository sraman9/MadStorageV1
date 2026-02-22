import React, { useState, useEffect } from 'react';
import StorageRequestCard from './components/StorageRequestCard';
import StorageSpaceCard from './components/StorageSpaceCard';
import { supabase } from './lib/supabase';
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
  id?: string;
  userId?: string;
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
  avgRating?: number | null;
  ratingCount?: number;
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

  const handleSubmit = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !name) { setError('Please enter your name.'); return; }
    if (mode === 'signup' && !email.endsWith('@wisc.edu')) {
      setError('Please use your @wisc.edu email address.');
      return;
    }
    setError('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
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
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [viewMode, setViewMode] = useState<'home' | 'requests' | 'space'>('home');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'request' | 'space'>('request');

  const [requests, setRequests] = useState<StorageRequest[]>([]);
  const [spaces, setSpaces] = useState<StorageSpace[]>([]);

  // --- Auth state: listen for sign in/out ──────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- State for Form Inputs ---
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

  // --- Rating modal state ---
  const [ratingSpaceId, setRatingSpaceId] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const openRatingModal = (spaceId: string) => {
    if (!user) { alert('Sign in to rate a space.'); return; }
    const space = spaces.find(s => s.id === spaceId);
    if (space?.userId && space.userId === user.id) {
      alert("You can't rate your own space.");
      return;
    }
    setRatingSpaceId(spaceId);
    setRatingScore(0);
    setRatingHover(0);
    setRatingComment('');
  };

  const submitRating = async () => {
    if (!user || !ratingSpaceId || ratingScore < 1) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ space_id: ratingSpaceId, reviewer_id: user.id, score: ratingScore, comment: ratingComment }),
      });
      if (!res.ok) {
        const { data, error } = await supabase.from('ratings').upsert({
          space_id: ratingSpaceId, reviewer_id: user.id, score: ratingScore, comment: ratingComment,
        }, { onConflict: 'space_id,reviewer_id' }).select().single();
        if (error) throw error;
        if (!data) throw new Error('No data returned');
      }
      setRatingSpaceId(null);
      loadData();
    } catch (err) {
      console.error('Rating failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const mapSupabaseRequest = (r: Record<string, unknown>): StorageRequest => ({
    name: (r.name as string) || 'Student',
    profileImage: (r.profile_image as string) || 'https://i.pravatar.cc/150?img=11',
    neighborhood: (r.neighborhood as string) || '',
    items: typeof r.items === 'string' ? (r.items ? (r.items as string).split(',').map((s: string) => s.trim()).filter(Boolean) : []) : [],
    budget: (r.budget as string) || '',
    timeframe: (r.timeframe as string) || '',
    description: (r.description as string) || '',
  });

  const mapSupabaseSpace = (s: Record<string, unknown>): StorageSpace => {
    const items = s.items;
    const capacity = typeof items === 'string' ? (items ? (items as string).split(',').map((x: string) => x.trim()).filter(Boolean) : []) : (Array.isArray(s.capacity) ? s.capacity : []);
    return {
      id: (s.id as string) || undefined,
      userId: (s.user_id as string) || (s.userId as string) || undefined,
      name: (s.name as string) || 'Host',
      profileImage: (s.profile_image as string) || 'https://i.pravatar.cc/150?img=11',
      neighborhood: (s.neighborhood as string) || '',
      spaceImage: (s.space_image as string) || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
      spaceType: (s.space_type as string) || 'Storage',
      capacity: capacity as string[],
      timeframe: (s.timeframe as string) || '',
      description: (s.description as string) || '',
      price: s.price != null ? Number(s.price) : null,
      avgRating: s.avgRating != null ? Number(s.avgRating) : null,
      ratingCount: s.ratingCount != null ? Number(s.ratingCount) : 0,
    };
  };

  // Load data: try backend first (has savings), fallback to Supabase
  const loadData = async () => {
    try {
      const reqRes = await fetch('http://127.0.0.1:8000/api/requests');
      const spaceRes = await fetch('http://127.0.0.1:8000/api/spaces');
      if (reqRes.ok && spaceRes.ok) {
        setRequests(await reqRes.json());
        setSpaces(await spaceRes.json());
        return;
      }
    } catch {
      /* backend not available */
    }
    try {
      const { data: reqData } = await supabase.from('storage_requests').select('*');
      const { data: spaceData } = await supabase.from('storage_spaces').select('*');
      setRequests((reqData ?? []).map((r) => mapSupabaseRequest(r)));
      setSpaces((spaceData ?? []).map((s) => mapSupabaseSpace(s)));
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);



  const openModal = (type: 'request' | 'space') => {
    setModalType(type);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (modalType === 'request') {
        const { data, error } = await supabase.from('storage_requests').insert({
          user_id: user.id,
          name: formData.name,
          profile_image: formData.profileImage,
          neighborhood: formData.neighborhood || 'Madison',
          items: formData.items,
          budget: formData.budget,
          timeframe: formData.timeframe,
          description: formData.description,
        }).select().single();
        if (error) throw error;
        setRequests((prev) => [...prev, mapSupabaseRequest(data)]);
      } else {
        const capacity = formData.items ? formData.items.split(',').map((s) => s.trim()).filter(Boolean) : [];
        const { data, error } = await supabase.from('storage_spaces').insert({
          user_id: user.id,
          name: formData.name,
          profile_image: formData.profileImage,
          neighborhood: formData.neighborhood || 'Madison',
          space_image: formData.spaceImage,
          space_type: formData.spaceType || 'Other',
          items: formData.items,
          capacity,
          timeframe: formData.timeframe,
          description: formData.description,
          price: formData.price ? parseFloat(formData.price) : null,
        }).select().single();
        if (error) throw error;
        setSpaces((prev) => [...prev, mapSupabaseSpace(data)]);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Submit failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to post. Check the console.');
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

          {/* CTA + Sign Out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => openModal(viewMode === 'space' ? 'space' : 'request')}
              style={{
                background: '#C5050C', color: '#fff', border: 'none', borderRadius: '10px',
                padding: '10px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'background 0.15s ease', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
              {viewMode === 'space' ? 'List Your Space' : 'Create Storage Request'}
            </button>
            {user && (
              <button
                onClick={async () => await supabase.auth.signOut()}
                style={{
                  background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb',
                  borderRadius: '10px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT,
                }}
              >
                Sign Out
              </button>
            )}
          </div>
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
              {user ? 'Welcome back' : 'Welcome to MadStorage'}
            </h2>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
              Connect with fellow students for storage solutions
            </p>
            {user ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setViewMode('requests')}
                  style={{
                    background: '#C5050C', color: '#fff', border: 'none', borderRadius: '12px',
                    padding: '14px 28px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT,
                  }}
                >
                  View Storage Requests
                </button>
                <button
                  onClick={() => { setViewMode('space'); }}
                  style={{
                    background: '#fff', color: '#C5050C', border: '1.5px solid #C5050C',
                    borderRadius: '12px', padding: '14px 28px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT,
                  }}
                >
                  View Storage Spaces
                </button>
                <button
                  onClick={async () => { await supabase.auth.signOut(); }}
                  style={{
                    background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb',
                    borderRadius: '12px', padding: '14px 20px', fontSize: '14px', cursor: 'pointer', fontFamily: FONT,
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <AuthCard onSuccess={() => setViewMode('requests')} />
            )}
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
                <StorageSpaceCard key={space.id || index} {...space} onRate={openRatingModal} />
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

            {!user ? (
              <div style={{ padding: '20px 0' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', fontFamily: FONT }}>
                  Sign in to post your {modalType === 'request' ? 'request' : 'space'}.
                </p>
                <AuthCard onSuccess={() => {}} />
              </div>
            ) : modalType === 'request' ? (
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

            {user && (
              <>
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
                  type="button"
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
              </>
            )}
          </div>
        </div>
      )}
      {/* Rating Modal */}
      {ratingSpaceId && (
        <div
          onClick={() => setRatingSpaceId(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px', padding: '32px',
              width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontWeight: '800', fontSize: '20px', color: '#111827', fontFamily: FONT, margin: 0 }}>Rate This Space</h2>
              <button onClick={() => setRatingSpaceId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}>
                ✕
              </button>
            </div>

            {/* Star picker */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  onClick={() => setRatingScore(star)}
                  onMouseEnter={() => setRatingHover(star)}
                  onMouseLeave={() => setRatingHover(0)}
                  style={{
                    fontSize: '36px',
                    cursor: 'pointer',
                    color: star <= (ratingHover || ratingScore) ? '#f59e0b' : '#d1d5db',
                    transition: 'color 0.1s ease, transform 0.1s ease',
                    transform: star <= (ratingHover || ratingScore) ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  &#9733;
                </span>
              ))}
            </div>
            {ratingScore > 0 && (
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#374151', fontFamily: FONT, marginBottom: '16px' }}>
                {ratingScore === 1 && 'Poor'}
                {ratingScore === 2 && 'Fair'}
                {ratingScore === 3 && 'Good'}
                {ratingScore === 4 && 'Very Good'}
                {ratingScore === 5 && 'Excellent'}
              </p>
            )}

            {/* Comment */}
            <textarea
              placeholder="Leave a comment (optional)..."
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT,
                color: '#111827', outline: 'none', resize: 'vertical', marginBottom: '16px',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#f59e0b')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />

            <button
              disabled={ratingScore < 1 || ratingSubmitting}
              onClick={submitRating}
              style={{
                width: '100%',
                background: ratingScore < 1 ? '#d1d5db' : ratingSubmitting ? '#9ca3af' : '#f59e0b',
                color: '#fff', border: 'none', borderRadius: '12px',
                padding: '14px', fontSize: '15px', fontWeight: '700',
                cursor: ratingScore < 1 || ratingSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: FONT, transition: 'background 0.15s ease',
              }}
            >
              {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;