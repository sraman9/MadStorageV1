import React, { useState, useEffect, useRef } from 'react';
import StorageRequestCard from './components/StorageRequestCard';
import StorageSpaceCard from './components/StorageSpaceCard';
import { supabase } from './lib/supabase';
import logo from './assets/logo.png';


interface StorageRequest {
  userId?: string;
  name: string;
  profileImage: string;
  neighborhood: string;
  items: string[];
  budget: string;
  timeframe: string;
  description: string;
}

interface StorageSpace {
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
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [viewMode, setViewMode] = useState<'home' | 'requests' | 'space' | 'profile'>('home');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'request' | 'space'>('request');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [authToast, setAuthToast] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState('');
  const [contactPopup, setContactPopup] = useState<{ name: string; avatarUrl: string; phone: string; email: string } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement>(null);

  const [requests, setRequests] = useState<StorageRequest[]>([]);
  const [spaces, setSpaces] = useState<StorageSpace[]>([]);

  const loadProfile = async (u: { id: string; email?: string; user_metadata?: { full_name?: string } }) => {
    setProfileName(u.user_metadata?.full_name || '');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    if (profile) {
      setProfileAvatarUrl(profile.avatar_url || '');
      setProfilePhone(profile.phone || '');
      setProfileName(profile.full_name || u.user_metadata?.full_name || '');
    } else {
      setShowOnboarding(true);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u);
      else { setProfileAvatarUrl(''); setProfilePhone(''); }
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

  const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAvatarSelect = (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Only JPEG and PNG files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be under 10MB.');
      return;
    }
    setProfileAvatarFile(file);
    setProfileAvatarPreview(URL.createObjectURL(file));
  };

  const handleOnboardingSubmit = async () => {
    if (!user) return;
    if (!profileAvatarFile) { alert('Please upload a profile picture.'); return; }
    if (!profilePhone.trim()) { alert('Please enter your phone number.'); return; }
    try {
      const avatarUrl = await uploadAvatar(profileAvatarFile, user.id);
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: profileName,
        avatar_url: avatarUrl,
        phone: profilePhone.trim(),
        email: user.email || '',
      });
      if (error) throw error;
      setProfileAvatarUrl(avatarUrl);
      setProfileAvatarPreview('');
      setProfileAvatarFile(null);
      setShowOnboarding(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save profile.');
    }
  };

  const handleContact = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setContactPopup({
        name: data?.full_name || 'Student',
        avatarUrl: data?.avatar_url || '',
        phone: data?.phone || 'Not provided',
        email: data?.email || 'Not provided',
      });
    } catch {
      setContactPopup({ name: 'Student', avatarUrl: '', phone: 'Not provided', email: 'Not provided' });
    }
  };

  const mapSupabaseRequest = (r: Record<string, unknown>): StorageRequest => ({
    userId: (r.user_id as string) || undefined,
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
      userId: (s.user_id as string) || undefined,
      name: (s.name as string) || 'Host',
      profileImage: (s.profile_image as string) || 'https://i.pravatar.cc/150?img=11',
      neighborhood: (s.neighborhood as string) || '',
      spaceImage: (s.space_image as string) || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
      spaceType: (s.space_type as string) || 'Storage',
      capacity: capacity as string[],
      timeframe: (s.timeframe as string) || '',
      description: (s.description as string) || '',
      price: s.price != null ? Number(s.price) : null,
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
          name: profileName || formData.name,
          profile_image: profileAvatarUrl || formData.profileImage,
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
          name: profileName || formData.name,
          profile_image: profileAvatarUrl || formData.profileImage,
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
                onClick={() => {
                  if (user) { setViewMode(mode); }
                  else { setAuthToast(true); setTimeout(() => setAuthToast(false), 2500); }
                }}
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

          {/* CTA + Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
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
              {viewMode === 'space' ? 'List Space' : 'Add Request'}
            </button>

            {user && (
              <div style={{ position: 'relative' }}>
                {profileAvatarUrl ? (
                  <img
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    src={profileAvatarUrl}
                    alt="Profile"
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #e5e7eb',
                      objectFit: 'cover', cursor: 'pointer', transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#C5050C')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                ) : (
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #e5e7eb',
                      background: '#C5050C', color: '#fff', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700',
                      fontFamily: FONT, padding: 0, transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#C5050C')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  >
                    {(profileName || user.email || 'U').charAt(0).toUpperCase()}
                  </button>
                )}
                {showProfileDropdown && (
                  <>
                    <div
                      onClick={() => setShowProfileDropdown(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                    />
                    <div style={{
                      position: 'absolute', right: 0, top: '44px', background: '#fff',
                      borderRadius: '12px', border: '1px solid #e5e7eb',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: '200px',
                      zIndex: 200, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#111827', fontFamily: FONT }}>
                          {profileName || 'Badger'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginTop: '2px' }}>
                          {user.email || ''}
                        </div>
                      </div>
                      <button
                        onClick={() => { setShowProfileDropdown(false); setViewMode('profile'); }}
                        style={{
                          width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                          textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#111827',
                          fontFamily: FONT, fontWeight: '500',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Profile Settings
                      </button>
                      <button
                        onClick={async () => { setShowProfileDropdown(false); await supabase.auth.signOut(); setViewMode('home'); }}
                        style={{
                          width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                          borderTop: '1px solid #f3f4f6', textAlign: 'left', cursor: 'pointer',
                          fontSize: '13px', color: '#C5050C', fontFamily: FONT, fontWeight: '500',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fff1f1')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
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
              </div>
            ) : (
              <AuthCard onSuccess={() => setViewMode('requests')} />
            )}
          </div>
        )}

        {/* STORAGE REQUESTS */}
        {viewMode === 'requests' && (
          user ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontWeight: '800', fontSize: '22px', color: '#111827' }}>Storage Requests Near You</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  {requests.length} students looking for storage right now
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {requests.map((request, index) => (
                <StorageRequestCard key={index} {...request} onContact={handleContact} />
              ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                Sign in to view requests
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', fontFamily: FONT }}>
                You need a UW-Madison account to browse storage requests.
              </p>
              <AuthCard onSuccess={() => setViewMode('requests')} />
            </div>
          )
        )}

        {/* PROFILE */}
        {viewMode === 'profile' && user && (
          <div style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 0' }}>
            <h2 style={{ fontWeight: '800', fontSize: '22px', color: '#111827', marginBottom: '24px', fontFamily: FONT }}>
              Profile Settings
            </h2>
            <div style={{
              background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '28px',
            }}>
              {/* Avatar */}
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  onClick={() => profileAvatarInputRef.current?.click()}
                  style={{
                    width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                    border: '2px dashed #e5e7eb', cursor: 'pointer', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f9fafb', position: 'relative',
                  }}
                >
                  {(profileAvatarPreview || profileAvatarUrl) ? (
                    <img src={profileAvatarPreview || profileAvatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '28px', color: '#d1d5db' }}>+</span>
                  )}
                </div>
                <input ref={profileAvatarInputRef} type="file" accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={e => { handleAvatarSelect(e.target.files?.[0]); setProfileSaved(false); }}
                />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827', fontFamily: FONT }}>Profile Picture</div>
                  <div
                    onClick={() => profileAvatarInputRef.current?.click()}
                    style={{ fontSize: '13px', color: '#C5050C', cursor: 'pointer', fontFamily: FONT, marginTop: '2px' }}
                  >
                    Change photo
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginTop: '2px' }}>JPEG or PNG only</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                  Display Name
                </label>
                <input
                  value={profileName}
                  onChange={(e) => { setProfileName(e.target.value); setProfileSaved(false); }}
                  placeholder="Your name"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                  Phone Number
                </label>
                <input
                  value={profilePhone}
                  onChange={(e) => { setProfilePhone(e.target.value); setProfileSaved(false); }}
                  placeholder="(608) 555-1234"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                  Email
                </label>
                <input
                  value={user.email || ''}
                  disabled
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#9ca3af',
                    background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                onClick={async () => {
                  try {
                    let avatarUrl = profileAvatarUrl;
                    if (profileAvatarFile) {
                      avatarUrl = await uploadAvatar(profileAvatarFile, user.id);
                    }
                    const { error } = await supabase.from('profiles').upsert({
                      id: user.id,
                      full_name: profileName,
                      avatar_url: avatarUrl,
                      phone: profilePhone.trim(),
                      email: user.email || '',
                    });
                    if (error) throw error;
                    await supabase.auth.updateUser({ data: { full_name: profileName } });
                    setProfileAvatarUrl(avatarUrl);
                    setProfileAvatarFile(null);
                    setProfileAvatarPreview('');
                    setProfileSaved(true);
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Failed to save.');
                  }
                }}
                style={{
                  background: '#C5050C', color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '12px 24px', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                  fontFamily: FONT, transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
              >
                Save Changes
              </button>
              {profileSaved && (
                <span style={{ marginLeft: '12px', fontSize: '13px', color: '#16a34a', fontFamily: FONT }}>
                  Saved!
                </span>
              )}
            </div>
          </div>
        )}

        {/* STORAGE SPACES */}
        {viewMode === 'space' && (
          user ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontWeight: '800', fontSize: '22px', color: '#111827' }}>Storage Spaces Near You</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  {spaces.length} spaces available from fellow Badgers
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {spaces.map((space, index) => (
                <StorageSpaceCard key={index} {...space} onContact={handleContact} />
              ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                Sign in to view spaces
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', fontFamily: FONT }}>
                You need a UW-Madison account to browse storage spaces.
              </p>
              <AuthCard onSuccess={() => setViewMode('space')} />
            </div>
          )
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

      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '32px',
            width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <h2 style={{ fontWeight: '800', fontSize: '20px', color: '#111827', fontFamily: FONT, marginBottom: '4px' }}>
              Complete Your Profile
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT, marginBottom: '24px' }}>
              Add a photo and contact info so other students can reach you.
            </p>

            {/* Avatar upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: '96px', height: '96px', borderRadius: '50%',
                  border: profileAvatarPreview ? 'none' : '2px dashed #d1d5db',
                  cursor: 'pointer', overflow: 'hidden', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', background: '#f9fafb',
                }}
              >
                {profileAvatarPreview ? (
                  <img src={profileAvatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', marginBottom: '2px' }}>📷</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: FONT }}>Upload</div>
                  </div>
                )}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png"
                style={{ display: 'none' }}
                onChange={e => handleAvatarSelect(e.target.files?.[0])}
              />
              <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginTop: '8px' }}>
                JPEG or PNG only, up to 10MB
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                Phone Number
              </label>
              <input
                value={profilePhone}
                onChange={e => setProfilePhone(e.target.value)}
                placeholder="(608) 555-1234"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Name (pre-filled from signup) */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                Display Name
              </label>
              <input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleOnboardingSubmit}
              style={{
                width: '100%', background: '#C5050C', color: '#fff', border: 'none',
                borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700',
                cursor: 'pointer', fontFamily: FONT, transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
            >
              Save & Continue
            </button>
          </div>
        </div>
      )}

      {/* Contact Popup */}
      {contactPopup && (
        <div
          onClick={() => setContactPopup(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px', padding: '32px',
              width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => setContactPopup(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' }}
            >
              ✕
            </button>

            {/* Avatar */}
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%', margin: '0 auto 16px',
              overflow: 'hidden', border: '3px solid #f3f4f6', background: '#f9fafb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {contactPopup.avatarUrl ? (
                <img src={contactPopup.avatarUrl} alt={contactPopup.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '32px', fontWeight: '700', color: '#C5050C', fontFamily: FONT }}>
                  {contactPopup.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <h3 style={{ fontWeight: '800', fontSize: '18px', color: '#111827', fontFamily: FONT, marginBottom: '16px' }}>
              {contactPopup.name}
            </h3>

            {/* Contact rows */}
            <div style={{ textAlign: 'left' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                background: '#f9fafb', borderRadius: '10px', marginBottom: '8px',
              }}>
                <span style={{ fontSize: '18px' }}>📧</span>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT }}>Email</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', fontFamily: FONT }}>{contactPopup.email}</div>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                background: '#f9fafb', borderRadius: '10px',
              }}>
                <span style={{ fontSize: '18px' }}>📱</span>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT }}>Phone</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', fontFamily: FONT }}>{contactPopup.phone}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setContactPopup(null)}
              style={{
                width: '100%', marginTop: '20px', background: '#C5050C', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', fontFamily: FONT, transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Auth toast */}
      {authToast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#111827', color: '#fff', padding: '12px 24px', borderRadius: '12px',
          fontSize: '14px', fontWeight: '600', fontFamily: FONT, zIndex: 2000,
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'fadeInUp 0.25s ease',
        }}>
          <span style={{ fontSize: '16px' }}>🔒</span>
          Please sign in to access this page.
        </div>
      )}
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

export default App;