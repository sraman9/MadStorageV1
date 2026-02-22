import React, { useState, useEffect, useRef } from 'react';
import StorageRequestCard from './components/StorageRequestCard';
import StorageSpaceCard from './components/StorageSpaceCard';
import { supabase } from './lib/supabase';
import logo from './assets/logo.png';


interface StorageRequest {
  id?: string;
  userId?: string;
  name: string;
  profileImage: string;
  neighborhood: string;
  items: string[];
  budget: string;
  timeframe: string;
  description: string;
}

interface Match {
  id: string;
  spaceId: string;
  requestId?: string;
  requesterId: string;
  hostId: string;
  status: 'requested' | 'active' | 'completed' | 'declined';
  requesterDone: boolean;
  hostDone: boolean;
  createdAt: string;
  spaceName?: string;
  spaceImage?: string;
  spaceNeighborhood?: string;
  spaceType?: string;
  requesterName?: string;
  requesterAvatar?: string;
  hostName?: string;
  hostAvatar?: string;
  requestItems?: string;
  requestBudget?: string;
  spacePrice?: number;
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

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const isValidPhone = (value: string): boolean => value.replace(/\D/g, '').length === 10;

const formatBudget = (value: string): string => {
  const cleaned = value.replace(/[^0-9\-$.,\s]/g, '');
  if (!cleaned) return '';
  if (!cleaned.startsWith('$')) return `$${cleaned}`;
  return cleaned;
};

const ERR_STYLE: React.CSSProperties = {
  fontSize: '12px', color: '#C5050C', marginTop: '4px', fontFamily: FONT,
};

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
  const [viewMode, setViewMode] = useState<'home' | 'requests' | 'space' | 'profile' | 'history'>('home');
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [reviewsPopup, setReviewsPopup] = useState<{ userId: string; userName: string; reviews: { score: number; comment: string; reviewerName: string; reviewerAvatar: string; createdAt: string }[] } | null>(null);
  const [, setReviewsLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement>(null);
  const spaceImageInputRef = useRef<HTMLInputElement>(null);
  const [spaceImageFile, setSpaceImageFile] = useState<File | null>(null);
  const [spaceImagePreview, setSpaceImagePreview] = useState('');

  const [requests, setRequests] = useState<StorageRequest[]>([]);
  const [spaces, setSpaces] = useState<StorageSpace[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [historyDetail, setHistoryDetail] = useState<Match | null>(null);
  const [profileReviews, setProfileReviews] = useState<{ score: number; comment: string; reviewerName: string; reviewerAvatar: string; createdAt: string }[]>([]);
  const [profileAvgRating, setProfileAvgRating] = useState<number | null>(null);

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
      if (u) { loadProfile(u); loadMatches(u.id); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) { loadProfile(u); loadMatches(u.id); }
      else { setProfileAvatarUrl(''); setProfilePhone(''); setMatches([]); }
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

  // --- Rating modal state (rates a user's profile) ---
  const [ratingUserId, setRatingUserId] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const openRatingModal = (targetUserId: string) => {
    if (!user) { alert('Sign in to leave a review.'); return; }
    if (targetUserId === user.id) {
      alert("You can't review yourself.");
      return;
    }
    setRatingUserId(targetUserId);
    setRatingScore(0);
    setRatingHover(0);
    setRatingComment('');
  };

  const submitRating = async () => {
    if (!user || !ratingUserId || ratingScore < 1) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewed_user_id: ratingUserId, reviewer_id: user.id, score: ratingScore, comment: ratingComment }),
      });
      if (!res.ok) {
        const { data, error } = await supabase.from('ratings').upsert({
          reviewed_user_id: ratingUserId, reviewer_id: user.id, score: ratingScore, comment: ratingComment,
        }, { onConflict: 'reviewed_user_id,reviewer_id' }).select().single();
        if (error) throw error;
        if (!data) throw new Error('No data returned');
      }
      setRatingUserId(null);
      loadData();
    } catch (err) {
      console.error('Rating failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const loadProfileReviews = async (userId: string) => {
    try {
      const { data: reviews } = await supabase
        .from('ratings')
        .select('*')
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false });

      const enriched = await Promise.all(
        (reviews ?? []).map(async (r: Record<string, unknown>) => {
          const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', r.reviewer_id).single();
          return {
            score: Number(r.score),
            comment: (r.comment as string) || '',
            reviewerName: profile?.full_name || 'Student',
            reviewerAvatar: profile?.avatar_url || '',
            createdAt: (r.created_at as string) || '',
          };
        })
      );

      setProfileReviews(enriched);
      if (enriched.length > 0) {
        const avg = enriched.reduce((sum, r) => sum + r.score, 0) / enriched.length;
        setProfileAvgRating(Math.round(avg * 10) / 10);
      } else {
        setProfileAvgRating(null);
      }
    } catch {
      setProfileReviews([]);
      setProfileAvgRating(null);
    }
  };

  const mapMatch = (m: Record<string, unknown>): Match => ({
    id: m.id as string,
    spaceId: m.space_id as string,
    requestId: (m.request_id as string) || undefined,
    requesterId: m.requester_id as string,
    hostId: m.host_id as string,
    status: m.status as Match['status'],
    requesterDone: m.requester_done as boolean,
    hostDone: m.host_done as boolean,
    createdAt: m.created_at as string,
  });

  const enrichMatch = async (match: Match): Promise<Match> => {
    try {
      const spaceRes = await supabase.from('storage_spaces').select('name, space_image, neighborhood, space_type, price').eq('id', match.spaceId).maybeSingle();
      const reqRes = await supabase.from('profiles').select('full_name, avatar_url').eq('id', match.requesterId).maybeSingle();
      const hostRes = await supabase.from('profiles').select('full_name, avatar_url').eq('id', match.hostId).maybeSingle();
      let requestItems = '';
      let requestBudget = '';
      if (match.requestId) {
        const reqDataRes = await supabase.from('storage_requests').select('items, budget').eq('id', match.requestId).maybeSingle();
        if (reqDataRes.data) { requestItems = reqDataRes.data.items || ''; requestBudget = reqDataRes.data.budget || ''; }
      }
      return {
        ...match,
        spaceName: spaceRes.data?.name || 'Space',
        spaceImage: spaceRes.data?.space_image || '',
        spaceNeighborhood: spaceRes.data?.neighborhood || '',
        spaceType: spaceRes.data?.space_type || '',
        spacePrice: spaceRes.data?.price != null ? Number(spaceRes.data.price) : undefined,
        requesterName: reqRes.data?.full_name || 'Student',
        requesterAvatar: reqRes.data?.avatar_url || '',
        hostName: hostRes.data?.full_name || 'Host',
        hostAvatar: hostRes.data?.avatar_url || '',
        requestItems,
        requestBudget,
      };
    } catch {
      return match;
    }
  };

  const loadMatches = async (userId: string) => {
    let raw: Match[] = [];
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/matches/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        raw = (data as Record<string, unknown>[]).map(mapMatch);
      }
    } catch { /* backend unavailable */ }
    if (raw.length === 0) {
      try {
        const { data: asReq } = await supabase.from('matches').select('*').eq('requester_id', userId);
        const { data: asHost } = await supabase.from('matches').select('*').eq('host_id', userId);
        const seen = new Set<string>();
        const all: Record<string, unknown>[] = [];
        for (const m of [...(asReq || []), ...(asHost || [])]) {
          if (!seen.has(m.id)) { seen.add(m.id); all.push(m); }
        }
        raw = all.map(mapMatch);
      } catch { setMatches([]); return; }
    }
    const enriched = await Promise.all(raw.map(enrichMatch));
    setMatches(enriched);
  };

  const [requestPickerSpaceId, setRequestPickerSpaceId] = useState<string | null>(null);

  const handleRequestSpace = (spaceId: string) => {
    if (!user) { alert('Sign in to request a space.'); return; }
    const space = spaces.find(s => s.id === spaceId);
    if (space?.userId === user.id) { alert("You can't request your own space."); return; }
    const existing = matches.find(m => m.spaceId === spaceId && m.requesterId === user.id && (m.status === 'requested' || m.status === 'active'));
    if (existing) { alert('You already requested this space.'); return; }
    const myRequests = requests.filter(r => r.userId === user.id);
    if (myRequests.length === 0) {
      alert('You need to create a storage request first before requesting a space.');
      return;
    }
    setRequestPickerSpaceId(spaceId);
  };

  const handlePickRequest = (requestId: string) => {
    if (!requestPickerSpaceId) return;
    setRequestPickerSpaceId(null);
    submitMatchDirect(requestPickerSpaceId, requestId);
  };

  const submitMatchDirect = async (spaceId: string, requestId?: string) => {
    if (!user) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ space_id: spaceId, requester_id: user.id, request_id: requestId || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || 'Failed to request space.');
        return;
      }
      await loadMatches(user.id);
    } catch {
      alert('Failed to request space.');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!user) return;
    if (!confirm('Delete this request? Any pending matches using it will also be removed.')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/requests/${requestId}?user_id=${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || 'Failed to delete.');
        return;
      }
      setRequests(prev => prev.filter(r => r.id !== requestId));
      await loadMatches(user.id);
    } catch {
      try {
        await supabase.from('matches').delete().eq('request_id', requestId).eq('status', 'requested');
        await supabase.from('storage_requests').delete().eq('id', requestId);
        setRequests(prev => prev.filter(r => r.id !== requestId));
        await loadMatches(user.id);
      } catch { alert('Failed to delete request.'); }
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    if (!user) return;
    if (!confirm('Delete this listing? Any pending match requests on it will also be removed.')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/spaces/${spaceId}?user_id=${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || 'Failed to delete.');
        return;
      }
      setSpaces(prev => prev.filter(s => s.id !== spaceId));
      await loadMatches(user.id);
    } catch {
      try {
        await supabase.from('matches').delete().eq('space_id', spaceId).eq('status', 'requested');
        await supabase.from('storage_spaces').delete().eq('id', spaceId);
        setSpaces(prev => prev.filter(s => s.id !== spaceId));
        await loadMatches(user.id);
      } catch { alert('Failed to delete listing.'); }
    }
  };

  const handleAcceptMatch = async (matchId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/matches/${matchId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) { const err = await res.json(); alert(err.detail || 'Failed.'); return; }
      await loadMatches(user.id);
    } catch { alert('Failed to accept.'); }
  };

  const handleDeclineMatch = async (matchId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/matches/${matchId}/decline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) { const err = await res.json(); alert(err.detail || 'Failed.'); return; }
      await loadMatches(user.id);
    } catch { alert('Failed to decline.'); }
  };

  const handleMarkDone = async (matchId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/matches/${matchId}/done`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) { const err = await res.json(); alert(err.detail || 'Failed.'); return; }
      await loadMatches(user.id);
    } catch { alert('Failed to mark done.'); }
  };

  const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSpaceImageSelect = (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Only JPEG and PNG files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be under 10MB.');
      return;
    }
    setSpaceImageFile(file);
    setSpaceImagePreview(URL.createObjectURL(file));
    setFormErrors(p => ({ ...p, spaceImage: '' }));
  };

  const uploadSpaceImage = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `spaces/${userId}/${Date.now()}.${ext}`;
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
    if (!isValidPhone(profilePhone)) { alert('Please enter a valid 10-digit phone number.'); return; }
    if (!profileName.trim()) { alert('Please enter your display name.'); return; }
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

  const handleViewReviews = async (targetUserId: string) => {
    setReviewsLoading(true);
    try {
      const { data: targetProfile } = await supabase.from('profiles').select('full_name').eq('id', targetUserId).single();
      const { data: reviews } = await supabase
        .from('ratings')
        .select('*')
        .eq('reviewed_user_id', targetUserId)
        .order('created_at', { ascending: false });

      const enriched = await Promise.all(
        (reviews ?? []).map(async (r: Record<string, unknown>) => {
          const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', r.reviewer_id).single();
          return {
            score: Number(r.score),
            comment: (r.comment as string) || '',
            reviewerName: profile?.full_name || 'Student',
            reviewerAvatar: profile?.avatar_url || '',
            createdAt: (r.created_at as string) || '',
          };
        })
      );

      setReviewsPopup({
        userId: targetUserId,
        userName: targetProfile?.full_name || 'User',
        reviews: enriched,
      });
    } catch {
      alert('Could not load reviews.');
    } finally {
      setReviewsLoading(false);
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
    id: (r.id as string) || undefined,
    userId: (r.user_id as string) || (r.userId as string) || undefined,
    name: (r.name as string) || 'Student',
    profileImage: (r.profileImage as string) || (r.profile_image as string) || 'https://i.pravatar.cc/150?img=11',
    neighborhood: (r.neighborhood as string) || '',
    items: typeof r.items === 'string' ? (r.items ? (r.items as string).split(',').map((s: string) => s.trim()).filter(Boolean) : []) : [],
    budget: (r.budget as string) || '',
    timeframe: (r.timeframe as string) || '',
    description: (r.description as string) || '',
  });

  const inferMarketAvg = (sizeText: string): number => {
    const t = (sizeText || '').toLowerCase();
    if (/5\s*[x×]\s*5|small|locker|closet/.test(t)) return 85.0;
    if (/10\s*[x×]\s*(15|20|25|30)|large/.test(t)) return 180.0;
    return 120.0;
  };

  const mapSupabaseSpace = (s: Record<string, unknown>): StorageSpace => {
    const items = s.items;
    const capacity = typeof items === 'string' ? (items ? (items as string).split(',').map((x: string) => x.trim()).filter(Boolean) : []) : (Array.isArray(s.capacity) ? s.capacity : []);
    const price = s.price != null ? Number(s.price) : null;
    const spaceType = (s.space_type as string) || (s.spaceType as string) || 'Storage';
    const sizeText = spaceType + ' ' + (capacity as string[]).join(' ');
    const marketAvg = s.marketAvg != null ? Number(s.marketAvg) : inferMarketAvg(sizeText);
    const savings = s.savings != null ? Number(s.savings) : (price && price > 0 ? Math.round((marketAvg - price) * 100) / 100 : null);
    return {
      id: (s.id as string) || undefined,
      userId: (s.user_id as string) || (s.userId as string) || undefined,
      name: (s.name as string) || 'Host',
      profileImage: (s.profileImage as string) || (s.profile_image as string) || 'https://i.pravatar.cc/150?img=11',
      neighborhood: (s.neighborhood as string) || '',
      spaceImage: (s.spaceImage as string) || (s.space_image as string) || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
      spaceType,
      capacity: capacity as string[],
      timeframe: (s.timeframe as string) || '',
      description: (s.description as string) || '',
      price,
      marketAvg,
      savings: savings && savings > 0 ? savings : null,
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
        const spaceData = await spaceRes.json();
        setSpaces((spaceData as Record<string, unknown>[]).map((s) => mapSupabaseSpace(s)));
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
    setFormErrors({});
    setSpaceImageFile(null);
    setSpaceImagePreview('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const errs: Record<string, string> = {};
    if (!formData.items.trim()) errs.items = 'Required';
    if (!formData.neighborhood) errs.neighborhood = 'Please select a neighborhood';
    if (modalType === 'request') {
      if (!formData.budget.trim()) errs.budget = 'Required';
      if (!formData.timeframe.trim()) errs.timeframe = 'Required';
    } else {
      if (!formData.spaceType) errs.spaceType = 'Please select a space type';
      if (!formData.price || parseFloat(formData.price) <= 0) errs.price = 'Enter a price above $0';
      if (!formData.timeframe.trim()) errs.timeframe = 'Required';
      if (!spaceImageFile && formData.spaceImage === 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64') errs.spaceImage = 'Please upload a photo of your space';
    }
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
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
        let spaceImageUrl = formData.spaceImage;
        if (spaceImageFile) {
          spaceImageUrl = await uploadSpaceImage(spaceImageFile, user.id);
        }
        const capacity = formData.items ? formData.items.split(',').map((s) => s.trim()).filter(Boolean) : [];
        const { error } = await supabase.from('storage_spaces').insert({
          user_id: user.id,
          name: profileName || formData.name,
          profile_image: profileAvatarUrl || formData.profileImage,
          neighborhood: formData.neighborhood || 'Madison',
          space_image: spaceImageUrl,
          space_type: formData.spaceType || 'Other',
          items: formData.items,
          capacity,
          timeframe: formData.timeframe,
          description: formData.description,
          price: formData.price ? parseFloat(formData.price) : null,
        }).select().single();
        if (error) throw error;
      }
      setSpaceImageFile(null);
      setSpaceImagePreview('');
      setShowModal(false);
      await loadData();
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
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)', minWidth: '280px', maxWidth: '340px',
                      zIndex: 200, overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#111827', fontFamily: FONT }}>
                          {profileName || 'Badger'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginTop: '2px' }}>
                          {user.email || ''}
                        </div>
                      </div>

                      {/* Your Requests section */}
                      {(() => {
                        const myReqs = requests.filter(r => r.userId === user.id && !matches.some(m => m.requestId === r.id && (m.status === 'active' || m.status === 'completed')));
                        return (
                          <div style={{ borderBottom: '1px solid #f3f4f6', padding: '10px 16px', flexShrink: 0 }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', fontFamily: FONT, marginBottom: '8px' }}>
                              Your Requests ({myReqs.length})
                            </div>
                            {myReqs.length === 0 ? (
                              <div style={{ fontSize: '12px', color: '#d1d5db', fontFamily: FONT, padding: '4px 0' }}>No active requests</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                                {myReqs.map(req => {
                                  const reqMatch = matches.find(m => m.requestId === req.id && m.status === 'requested');
                                  return (
                                    <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#f9fafb', borderRadius: '8px' }}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {req.items.length > 0 ? req.items.slice(0, 2).join(', ') : req.neighborhood}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: FONT }}>
                                          {req.neighborhood}{req.budget ? ` · ${req.budget}` : ''}
                                        </div>
                                      </div>
                                      <span style={{
                                        fontSize: '9px', fontWeight: '700', fontFamily: FONT, textTransform: 'uppercase',
                                        padding: '2px 6px', borderRadius: '20px', flexShrink: 0,
                                        background: reqMatch ? '#fef3c7' : '#f3f4f6',
                                        color: reqMatch ? '#d97706' : '#6b7280',
                                      }}>
                                        {reqMatch ? 'Pending' : 'Open'}
                                      </span>
                                      {!reqMatch && req.id && (
                                        <button
                                          onClick={e => { e.stopPropagation(); handleDeleteRequest(req.id!); }}
                                          title="Delete request"
                                          style={{
                                            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#d1d5db', transition: 'color 0.15s ease',
                                          }}
                                          onMouseEnter={e => (e.currentTarget.style.color = '#C5050C')}
                                          onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Your Listings section */}
                      {(() => {
                        const mySpaces = spaces.filter(s => s.userId === user.id && !matches.some(m => m.spaceId === s.id && (m.status === 'active' || m.status === 'completed')));
                        return (
                          <div style={{ borderBottom: '1px solid #f3f4f6', padding: '10px 16px', flexShrink: 0 }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', fontFamily: FONT, marginBottom: '8px' }}>
                              Your Listings ({mySpaces.length})
                            </div>
                            {mySpaces.length === 0 ? (
                              <div style={{ fontSize: '12px', color: '#d1d5db', fontFamily: FONT, padding: '4px 0' }}>No active listings</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                                {mySpaces.map(sp => {
                                  const spaceMatch = matches.find(m => m.spaceId === sp.id && m.status === 'active');
                                  const pendingCount = matches.filter(m => m.spaceId === sp.id && m.status === 'requested').length;
                                  return (
                                    <div key={sp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#f9fafb', borderRadius: '8px' }}>
                                      <img src={sp.spaceImage} alt={sp.spaceType} style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {sp.spaceType} · {sp.neighborhood}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: FONT }}>
                                          {sp.price ? `$${sp.price}/mo` : 'No price set'}
                                          {pendingCount > 0 && !spaceMatch ? ` · ${pendingCount} pending` : ''}
                                        </div>
                                      </div>
                                      <span style={{
                                        fontSize: '9px', fontWeight: '700', fontFamily: FONT, textTransform: 'uppercase',
                                        padding: '2px 6px', borderRadius: '20px', flexShrink: 0,
                                        background: spaceMatch ? '#dcfce7' : pendingCount > 0 ? '#fef3c7' : '#f3f4f6',
                                        color: spaceMatch ? '#16a34a' : pendingCount > 0 ? '#d97706' : '#6b7280',
                                      }}>
                                        {spaceMatch ? 'Active' : pendingCount > 0 ? `${pendingCount} req` : 'Open'}
                                      </span>
                                      {!spaceMatch && pendingCount === 0 && sp.id && (
                                        <button
                                          onClick={e => { e.stopPropagation(); handleDeleteSpace(sp.id!); }}
                                          title="Delete listing"
                                          style={{
                                            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#d1d5db', transition: 'color 0.15s ease',
                                          }}
                                          onMouseEnter={e => (e.currentTarget.style.color = '#C5050C')}
                                          onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <button
                        onClick={() => { setShowProfileDropdown(false); setViewMode('profile'); if (user) { loadProfileReviews(user.id); loadMatches(user.id); } }}
                        style={{
                          width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                          textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#111827',
                          fontFamily: FONT, fontWeight: '500', flexShrink: 0,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Profile Settings
                      </button>
                      <button
                        onClick={() => { setShowProfileDropdown(false); setViewMode('history'); if (user) loadMatches(user.id); }}
                        style={{
                          width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                          textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: '#111827',
                          fontFamily: FONT, fontWeight: '500', flexShrink: 0,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        History
                      </button>
                      <button
                        onClick={async () => { setShowProfileDropdown(false); await supabase.auth.signOut(); setViewMode('home'); }}
                        style={{
                          width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                          borderTop: '1px solid #f3f4f6', textAlign: 'left', cursor: 'pointer',
                          fontSize: '13px', color: '#C5050C', fontFamily: FONT, fontWeight: '500', flexShrink: 0,
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
                  {requests.filter(r => !matches.some(m => m.requestId === r.id && (m.status === 'active' || m.status === 'completed'))).length} students looking for storage right now
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {requests.filter(r => !matches.some(m => m.requestId === r.id && (m.status === 'active' || m.status === 'completed'))).map((request, index) => (
                <StorageRequestCard key={request.id || index} {...request} onContact={handleContact} />
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
                  Phone Number <span style={{ color: '#C5050C' }}>*</span>
                </label>
                <input
                  value={profilePhone}
                  onChange={(e) => { setProfilePhone(formatPhone(e.target.value)); setProfileSaved(false); }}
                  placeholder="(608) 555-1234"
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: `1.5px solid ${profilePhone && !isValidPhone(profilePhone) ? '#C5050C' : '#e5e7eb'}`,
                    fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {profilePhone && !isValidPhone(profilePhone) && (
                  <div style={ERR_STYLE}>Enter a 10-digit US phone number</div>
                )}
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
                  if (!profileName.trim()) { alert('Please enter a display name.'); return; }
                  if (!isValidPhone(profilePhone)) { alert('Please enter a valid 10-digit phone number.'); return; }
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

            {/* Your Reviews */}
            <div style={{
              background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '28px', marginTop: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontWeight: '800', fontSize: '18px', color: '#111827', fontFamily: FONT, margin: 0 }}>
                  Your Reviews
                </h3>
                {profileAvgRating != null && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontFamily: FONT }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} style={{ color: s <= Math.round(profileAvgRating) ? '#f59e0b' : '#d1d5db', fontSize: '16px' }}>&#9733;</span>
                    ))}
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {profileAvgRating.toFixed(1)} ({profileReviews.length})
                    </span>
                  </span>
                )}
              </div>

              {profileReviews.length === 0 ? (
                <p style={{ fontSize: '14px', color: '#9ca3af', fontFamily: FONT, textAlign: 'center', padding: '24px 0' }}>
                  No reviews yet. Reviews from other users will appear here.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profileReviews.map((rev, idx) => (
                    <div key={idx} style={{
                      background: '#f9fafb', borderRadius: '14px', padding: '16px 18px',
                      border: '1px solid #e5e7eb',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%', background: '#e5e7eb',
                          overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {rev.reviewerAvatar ? (
                            <img src={rev.reviewerAvatar} alt={rev.reviewerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#C5050C', fontFamily: FONT }}>
                              {rev.reviewerName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', fontFamily: FONT }}>{rev.reviewerName}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>
                            {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} style={{ color: s <= rev.score ? '#f59e0b' : '#d1d5db', fontSize: '16px' }}>&#9733;</span>
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p style={{
                          fontSize: '13px', color: '#374151', lineHeight: '1.6', fontFamily: FONT,
                          margin: 0, marginTop: '4px',
                        }}>
                          {rev.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incoming Requests (host sees these) */}
            {matches.filter(m => m.status === 'requested' && m.hostId === user.id).length > 0 && (
              <div style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '28px', marginTop: '24px',
              }}>
                <h3 style={{ fontWeight: '800', fontSize: '18px', color: '#111827', fontFamily: FONT, margin: 0, marginBottom: '20px' }}>
                  Incoming Requests
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {matches.filter(m => m.status === 'requested' && m.hostId === user.id).map(match => (
                    <div key={match.id} style={{
                      background: '#fffbeb', borderRadius: '14px', padding: '18px',
                      border: '1px solid #fde68a',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%', background: '#e5e7eb',
                          overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {match.requesterAvatar ? (
                            <img src={match.requesterAvatar} alt={match.requesterName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#C5050C', fontFamily: FONT }}>
                              {(match.requesterName || 'S').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            onClick={() => handleContact(match.requesterId)}
                            style={{ fontWeight: '700', fontSize: '15px', color: '#C5050C', fontFamily: FONT, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.15s ease' }}
                            onMouseEnter={e => (e.currentTarget.style.textDecorationColor = '#C5050C')}
                            onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
                          >
                            {match.requesterName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT }}>
                            wants your space: {match.spaceName}
                          </div>
                          {match.requestItems && (
                            <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT, marginTop: '2px' }}>
                              Items: {match.requestItems} {match.requestBudget ? `· Budget: ${match.requestBudget}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAcceptMatch(match.id)}
                          style={{
                            flex: 1, background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px',
                            padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT,
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#15803d')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#16a34a')}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineMatch(match.id)}
                          style={{
                            flex: 1, background: '#fff', color: '#C5050C', border: '1.5px solid #C5050C', borderRadius: '10px',
                            padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT,
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fff1f1'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Jobs (active matches for both host and requester) */}
            {matches.filter(m => m.status === 'active').length > 0 && (
              <div style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '28px', marginTop: '24px',
              }}>
                <h3 style={{ fontWeight: '800', fontSize: '18px', color: '#111827', fontFamily: FONT, margin: 0, marginBottom: '20px' }}>
                  Pending Jobs
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {matches.filter(m => m.status === 'active').map(match => {
                    const isHost = match.hostId === user.id;
                    const myDone = isHost ? match.hostDone : match.requesterDone;
                    const otherDone = isHost ? match.requesterDone : match.hostDone;
                    const otherName = isHost ? match.requesterName : match.hostName;
                    return (
                      <div key={match.id} style={{
                        background: '#f9fafb', borderRadius: '14px', padding: '18px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
                          {match.spaceImage && (
                            <img src={match.spaceImage} alt={match.spaceName} style={{
                              width: '80px', height: '60px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0,
                            }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827', fontFamily: FONT }}>{match.spaceName}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT, marginTop: '2px' }}>
                              {match.spaceNeighborhood} · {match.spaceType}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT, marginTop: '4px' }}>
                              {isHost ? `Requester: ${match.requesterName}` : `Host: ${match.hostName}`}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '600', fontFamily: FONT, textTransform: 'uppercase',
                            letterSpacing: '0.05em', color: '#6b7280',
                          }}>
                            Status:
                          </span>
                          <span style={{
                            fontSize: '12px', fontWeight: '600', fontFamily: FONT,
                            background: myDone ? '#dcfce7' : '#fef3c7',
                            color: myDone ? '#16a34a' : '#d97706',
                            padding: '3px 10px', borderRadius: '20px',
                          }}>
                            You: {myDone ? 'Done' : 'In progress'}
                          </span>
                          <span style={{
                            fontSize: '12px', fontWeight: '600', fontFamily: FONT,
                            background: otherDone ? '#dcfce7' : '#fef3c7',
                            color: otherDone ? '#16a34a' : '#d97706',
                            padding: '3px 10px', borderRadius: '20px',
                          }}>
                            {otherName}: {otherDone ? 'Done' : 'In progress'}
                          </span>
                        </div>

                        {!myDone && (
                          <button
                            onClick={() => handleMarkDone(match.id)}
                            style={{
                              width: '100%', background: '#C5050C', color: '#fff', border: 'none', borderRadius: '10px',
                              padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT,
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
                          >
                            Mark as Done
                          </button>
                        )}
                        {myDone && !otherDone && (
                          <p style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT, textAlign: 'center', margin: 0 }}>
                            Waiting for {otherName} to confirm...
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sent Requests (requester sees these - waiting for host) */}
            {matches.filter(m => m.status === 'requested' && m.requesterId === user.id).length > 0 && (
              <div style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '28px', marginTop: '24px',
              }}>
                <h3 style={{ fontWeight: '800', fontSize: '18px', color: '#111827', fontFamily: FONT, margin: 0, marginBottom: '20px' }}>
                  Sent Requests
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {matches.filter(m => m.status === 'requested' && m.requesterId === user.id).map(match => (
                    <div key={match.id} style={{
                      background: '#eff6ff', borderRadius: '14px', padding: '18px',
                      border: '1px solid #bfdbfe',
                    }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        {match.spaceImage && (
                          <img src={match.spaceImage} alt={match.spaceName} style={{
                            width: '60px', height: '46px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0,
                          }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', fontFamily: FONT }}>{match.spaceName}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT }}>Host: {match.hostName}</div>
                        </div>
                        <span style={{
                          fontSize: '11px', fontWeight: '700', fontFamily: FONT, textTransform: 'uppercase',
                          background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', flexShrink: 0,
                        }}>
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STORAGE SPACES */}
        {viewMode === 'space' && (
          user ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontWeight: '800', fontSize: '22px', color: '#111827' }}>Storage Spaces Near You</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                  {spaces.filter(s => !matches.some(m => m.spaceId === s.id && (m.status === 'active' || m.status === 'completed'))).length} spaces available from fellow Badgers
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {spaces.filter(s => !matches.some(m => m.spaceId === s.id && (m.status === 'active' || m.status === 'completed'))).map((space, index) => (
                <StorageSpaceCard
                  key={space.id || index}
                  {...space}
                  onRate={openRatingModal}
                  onContact={handleContact}
                  onViewReviews={handleViewReviews}
                  onRequestSpace={space.userId !== user.id ? handleRequestSpace : undefined}
                  hasRequested={matches.some(m => m.spaceId === space.id && m.requesterId === user.id && (m.status === 'requested' || m.status === 'active'))}
                />
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

        {/* HISTORY */}
        {viewMode === 'history' && user && (
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 0' }}>
            <h2 style={{ fontWeight: '800', fontSize: '22px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
              History
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', fontFamily: FONT }}>
              Your completed storage matches.
            </p>

            {matches.filter(m => m.status === 'completed').length === 0 ? (
              <div style={{
                background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '40px 28px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '14px', color: '#9ca3af', fontFamily: FONT }}>
                  No completed jobs yet. Completed matches will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {matches.filter(m => m.status === 'completed').map(match => {
                  const isHost = match.hostId === user.id;
                  const otherName = isHost ? match.requesterName : match.hostName;
                  const otherAvatar = isHost ? match.requesterAvatar : match.hostAvatar;
                  return (
                    <div
                      key={match.id}
                      onClick={() => setHistoryDetail(match)}
                      style={{
                        background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
                        cursor: 'pointer', transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', gap: '16px', padding: '20px', alignItems: 'center' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '50%', background: '#e5e7eb',
                          overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {otherAvatar ? (
                            <img src={otherAvatar} alt={otherName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '18px', fontWeight: '700', color: '#C5050C', fontFamily: FONT }}>
                              {(otherName || 'U').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827', fontFamily: FONT }}>{otherName}</div>
                            <span style={{
                              fontSize: '10px', fontWeight: '700', fontFamily: FONT, textTransform: 'uppercase',
                              background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '20px',
                              letterSpacing: '0.05em',
                            }}>
                              Completed
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#374151', fontFamily: FONT }}>
                            {isHost ? 'Stored for them' : 'They hosted your items'}
                            {match.spaceName ? ` · ${match.spaceName}` : ''}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginTop: '2px' }}>
                            {new Date(match.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                    What do you need to store? <span style={{ color: '#C5050C' }}>*</span>
                  </label>
                  <input
                    value={formData.items}
                    onChange={(e) => { setFormData({ ...formData, items: e.target.value }); setFormErrors(p => ({ ...p, items: '' })); }}
                    placeholder="e.g., 4 boxes, 1 mini fridge"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: `1.5px solid ${formErrors.items ? '#C5050C' : '#e5e7eb'}`, fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    }}
                  />
                  {formErrors.items && <div style={ERR_STYLE}>{formErrors.items}</div>}
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                    Budget <span style={{ color: '#C5050C' }}>*</span>
                  </label>
                  <input
                    value={formData.budget}
                    onChange={(e) => { setFormData({ ...formData, budget: formatBudget(e.target.value) }); setFormErrors(p => ({ ...p, budget: '' })); }}
                    placeholder="e.g., $150-200"
                    maxLength={20}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: `1.5px solid ${formErrors.budget ? '#C5050C' : '#e5e7eb'}`, fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    }}
                  />
                  {formErrors.budget && <div style={ERR_STYLE}>{formErrors.budget}</div>}
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                    Timeframe <span style={{ color: '#C5050C' }}>*</span>
                  </label>
                  <input
                    value={formData.timeframe}
                    onChange={(e) => { setFormData({ ...formData, timeframe: e.target.value }); setFormErrors(p => ({ ...p, timeframe: '' })); }}
                    placeholder="e.g., May 15 - Aug 20"
                    maxLength={40}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: `1.5px solid ${formErrors.timeframe ? '#C5050C' : '#e5e7eb'}`, fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    }}
                  />
                  {formErrors.timeframe && <div style={ERR_STYLE}>{formErrors.timeframe}</div>}
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                    Space Type <span style={{ color: '#C5050C' }}>*</span>
                  </label>
                  <select 
                    value={formData.spaceType}
                    onChange={(e) => { setFormData({ ...formData, spaceType: e.target.value }); setFormErrors(p => ({ ...p, spaceType: '' })); }}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: `1.5px solid ${formErrors.spaceType ? '#C5050C' : '#e5e7eb'}`, fontSize: '14px', fontFamily: FONT, color: '#111827', background: '#fff', outline: 'none',
                    }}
                  >
                    <option value="">Select a space type</option>
                    {['Bedroom', 'Spare Bedroom', 'Bedroom Closet', 'Storage Closet', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  {formErrors.spaceType && <div style={ERR_STYLE}>{formErrors.spaceType}</div>}
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                    What can it fit? <span style={{ color: '#C5050C' }}>*</span>
                  </label>
                  <input 
                    value={formData.items}
                    onChange={(e) => { setFormData({ ...formData, items: e.target.value }); setFormErrors(p => ({ ...p, items: '' })); }}
                    placeholder="e.g., 5-6 boxes, 1 mini fridge, 1 bike" 
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: `1.5px solid ${formErrors.items ? '#C5050C' : '#e5e7eb'}`, fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    }}
                  />
                  {formErrors.items && <div style={ERR_STYLE}>{formErrors.items}</div>}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                    Monthly rate ($) <span style={{ color: '#C5050C' }}>*</span>
                  </label>
                  <input 
                    type="number"
                    min="1"
                    step="5"
                    value={formData.price}
                    onChange={(e) => { setFormData({ ...formData, price: e.target.value }); setFormErrors(p => ({ ...p, price: '' })); }}
                    placeholder="e.g., 45" 
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: `1.5px solid ${formErrors.price ? '#C5050C' : '#e5e7eb'}`, fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    }}
                  />
                  {formErrors.price && <div style={ERR_STYLE}>{formErrors.price}</div>}
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                    Available Timeframe <span style={{ color: '#C5050C' }}>*</span>
                  </label>
                  <input 
                    value={formData.timeframe}
                    onChange={(e) => { setFormData({ ...formData, timeframe: e.target.value }); setFormErrors(p => ({ ...p, timeframe: '' })); }}
                    placeholder="e.g., May 15 - Aug 20"
                    maxLength={40}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: `1.5px solid ${formErrors.timeframe ? '#C5050C' : '#e5e7eb'}`, fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    }}
                  />
                  {formErrors.timeframe && <div style={ERR_STYLE}>{formErrors.timeframe}</div>}
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
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                    Photo of Your Space <span style={{ color: '#C5050C' }}>*</span>
                  </label>
                  <input
                    ref={spaceImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    style={{ display: 'none' }}
                    onChange={e => handleSpaceImageSelect(e.target.files?.[0])}
                  />
                  <div
                    onClick={() => spaceImageInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${formErrors.spaceImage ? '#C5050C' : '#e5e7eb'}`, borderRadius: '10px',
                      padding: spaceImagePreview ? '0' : '24px',
                      textAlign: 'center', cursor: 'pointer', background: '#fafafa',
                      overflow: 'hidden', position: 'relative',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#C5050C')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = formErrors.spaceImage ? '#C5050C' : '#e5e7eb')}
                  >
                    {spaceImagePreview ? (
                      <div style={{ position: 'relative' }}>
                        <img src={spaceImagePreview} alt="Space preview" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
                        <div style={{
                          position: 'absolute', bottom: '8px', right: '8px',
                          background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '8px',
                          padding: '4px 10px', fontSize: '11px', fontWeight: '600', fontFamily: FONT,
                        }}>
                          Change photo
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT }}>Click to upload a photo</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT, marginTop: '4px' }}>JPG, PNG up to 10MB</div>
                      </>
                    )}
                  </div>
                  {formErrors.spaceImage && <div style={ERR_STYLE}>{formErrors.spaceImage}</div>}
                </div>
              </>
            )}

            {user && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                    {modalType === 'request' ? 'Preferred Location' : 'Your Neighborhood'} <span style={{ color: '#C5050C' }}>*</span>
                  </label>
                  <select 
                    value={formData.neighborhood} 
                    onChange={(e) => { setFormData({ ...formData, neighborhood: e.target.value }); setFormErrors(p => ({ ...p, neighborhood: '' })); }}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: `1.5px solid ${formErrors.neighborhood ? '#C5050C' : '#e5e7eb'}`, fontSize: '14px', fontFamily: FONT, color: '#111827', background: '#fff', outline: 'none',
                    }}
                  >
                    <option value="">Select a neighborhood</option>
                    {['State St', 'Langdon', 'Willy St', 'Eagle Heights'].map(n => <option key={n}>{n}</option>)}
                  </select>
                  {formErrors.neighborhood && <div style={ERR_STYLE}>{formErrors.neighborhood}</div>}
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
      {ratingUserId && (
        <div
          onClick={() => setRatingUserId(null)}
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
              <h2 style={{ fontWeight: '800', fontSize: '20px', color: '#111827', fontFamily: FONT, margin: 0 }}>Leave a Review</h2>
              <button onClick={() => setRatingUserId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}>
                ✕
              </button>
            </div>

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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                Phone Number <span style={{ color: '#C5050C' }}>*</span>
              </label>
              <input
                value={profilePhone}
                onChange={e => setProfilePhone(formatPhone(e.target.value))}
                placeholder="(608) 555-1234"
                type="tel"
                inputMode="numeric"
                maxLength={14}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  border: `1.5px solid ${profilePhone && !isValidPhone(profilePhone) ? '#C5050C' : '#e5e7eb'}`,
                  fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {profilePhone && !isValidPhone(profilePhone) && (
                <div style={ERR_STYLE}>Enter a 10-digit US phone number</div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>
                Display Name <span style={{ color: '#C5050C' }}>*</span>
              </label>
              <input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Your name"
                maxLength={50}
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

      {/* Reviews Popup */}
      {reviewsPopup && (
        <div
          onClick={() => setReviewsPopup(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '20px', padding: '32px',
              width: '100%', maxWidth: '480px', maxHeight: '80vh', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column', position: 'relative',
            }}
          >
            <button
              onClick={() => setReviewsPopup(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' }}
            >
              ✕
            </button>

            <h3 style={{ fontWeight: '800', fontSize: '18px', color: '#111827', fontFamily: FONT, marginBottom: '4px', paddingRight: '30px' }}>
              Reviews for {reviewsPopup.userName}
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT, marginBottom: '20px' }}>
              {reviewsPopup.reviews.length} review{reviewsPopup.reviews.length !== 1 ? 's' : ''}
            </p>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
              {reviewsPopup.reviews.length === 0 && (
                <p style={{ fontSize: '14px', color: '#9ca3af', fontFamily: FONT, textAlign: 'center', padding: '30px 0' }}>
                  No reviews yet.
                </p>
              )}
              {reviewsPopup.reviews.map((rev, idx) => (
                <div key={idx} style={{
                  background: '#f9fafb', borderRadius: '14px', padding: '16px 18px',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', background: '#e5e7eb',
                      overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {rev.reviewerAvatar ? (
                        <img src={rev.reviewerAvatar} alt={rev.reviewerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#C5050C', fontFamily: FONT }}>
                          {rev.reviewerName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', fontFamily: FONT }}>{rev.reviewerName}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: FONT }}>
                        {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} style={{ color: s <= rev.score ? '#f59e0b' : '#d1d5db', fontSize: '16px' }}>&#9733;</span>
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p style={{
                      fontSize: '13px', color: '#374151', lineHeight: '1.6', fontFamily: FONT,
                      margin: 0, marginTop: '4px',
                    }}>
                      {rev.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setReviewsPopup(null)}
              style={{
                width: '100%', marginTop: '20px', background: '#C5050C', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', fontFamily: FONT, transition: 'background 0.15s ease', flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Request Picker Modal */}
      {requestPickerSpaceId && user && (() => {
        const myRequests = requests.filter(r => r.userId === user.id);
        const availableRequests = myRequests.filter(r =>
          !matches.some(m => m.requestId === r.id && (m.status === 'active' || m.status === 'completed'))
        );
        const targetSpace = spaces.find(s => s.id === requestPickerSpaceId);
        return (
          <div
            onClick={() => setRequestPickerSpaceId(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: '20px', padding: '28px',
                width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                position: 'relative', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              }}
            >
              <button
                onClick={() => setRequestPickerSpaceId(null)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: '16px',
                  color: '#6b7280', borderRadius: '50%', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>

              <h3 style={{ fontWeight: '800', fontSize: '18px', color: '#111827', fontFamily: FONT, marginBottom: '4px', paddingRight: '30px' }}>
                Choose a Request
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT, marginBottom: '20px' }}>
                Select which of your storage requests to use{targetSpace ? ` for ${targetSpace.name}'s ${targetSpace.spaceType}` : ''}.
              </p>

              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {availableRequests.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '30px 0',
                  }}>
                    <p style={{ fontSize: '14px', color: '#9ca3af', fontFamily: FONT, marginBottom: '16px' }}>
                      You have no available requests. Create one first!
                    </p>
                    <button
                      onClick={() => { setRequestPickerSpaceId(null); openModal('request'); }}
                      style={{
                        background: '#C5050C', color: '#fff', border: 'none', borderRadius: '10px',
                        padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                        fontFamily: FONT, transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
                    >
                      Create a Request
                    </button>
                  </div>
                ) : (
                  availableRequests.map(req => (
                    <div
                      key={req.id}
                      onClick={() => req.id && handlePickRequest(req.id)}
                      style={{
                        background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '14px',
                        padding: '16px', cursor: 'pointer', transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#C5050C';
                        e.currentTarget.style.background = '#fef2f2';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(197,5,12,0.1)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT }}>{req.neighborhood}</span>
                        {req.budget && (
                          <>
                            <span style={{ fontSize: '12px', color: '#d1d5db' }}>·</span>
                            <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT }}>{req.budget}</span>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: req.description ? '8px' : '0' }}>
                        {req.items.map((item, i) => (
                          <span key={i} style={{
                            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px',
                            padding: '2px 8px', fontSize: '11px', color: '#374151', fontWeight: '500', fontFamily: FONT,
                          }}>
                            {item}
                          </span>
                        ))}
                      </div>
                      {req.description && (
                        <p style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT, margin: 0, lineHeight: '1.5' }}>
                          {req.description.length > 80 ? req.description.slice(0, 80) + '…' : req.description}
                        </p>
                      )}
                      {req.timeframe && (
                        <div style={{ fontSize: '11px', color: '#2563eb', fontFamily: FONT, marginTop: '6px', fontWeight: '600' }}>
                          {req.timeframe}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setRequestPickerSpaceId(null)}
                style={{
                  width: '100%', marginTop: '16px', background: 'transparent',
                  color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                  padding: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: FONT, transition: 'all 0.15s ease', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C5050C'; e.currentTarget.style.color = '#C5050C'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280'; }}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })()}

      {/* History Detail Popup */}
      {historyDetail && user && (() => {
        const m = historyDetail;
        const isHost = m.hostId === user.id;
        const otherName = isHost ? m.requesterName : m.hostName;
        const otherAvatar = isHost ? m.requesterAvatar : m.hostAvatar;
        const otherId = isHost ? m.requesterId : m.hostId;
        return (
          <div
            onClick={() => setHistoryDetail(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: '20px',
                width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                overflow: 'hidden', position: 'relative',
              }}
            >
              <button
                onClick={() => setHistoryDetail(null)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
              >
                ✕
              </button>

              {m.spaceImage && (
                <img src={m.spaceImage} alt={m.spaceName} style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }} />
              )}

              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontWeight: '800', fontSize: '20px', color: '#111827', fontFamily: FONT, margin: 0 }}>
                    {m.spaceName || 'Storage Space'}
                  </h3>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', fontFamily: FONT, textTransform: 'uppercase',
                    background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: '20px',
                  }}>
                    Completed
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#6b7280', fontFamily: FONT, marginBottom: '16px' }}>
                  {[m.spaceNeighborhood, m.spaceType].filter(Boolean).join(' · ')}
                  {m.spacePrice ? ` · $${m.spacePrice}/mo` : ''}
                </div>

                <div style={{ height: '1px', background: '#f3f4f6', marginBottom: '16px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', background: '#e5e7eb',
                    overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {otherAvatar ? (
                      <img src={otherAvatar} alt={otherName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#C5050C', fontFamily: FONT }}>
                        {(otherName || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827', fontFamily: FONT }}>{otherName}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: FONT }}>
                      {isHost ? 'Requester' : 'Host'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleContact(otherId)}
                    style={{
                      background: '#C5050C', color: '#fff', border: 'none', borderRadius: '10px',
                      padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
                  >
                    Contact
                  </button>
                </div>

                <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>
                  Matched on {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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