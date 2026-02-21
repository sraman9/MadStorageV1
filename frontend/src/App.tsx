import React, { useState } from 'react';
import StorageRequestCard from './components/StorageRequestCard';
import StorageSpaceCard from './components/StorageSpaceCard';

const sampleRequests = [
  {
    name: 'Emma Johnson',
    profileImage: 'https://i.pravatar.cc/150?img=47',
    neighborhood: 'State St',
    items: ['4 boxes', '1 mini fridge', '2 suitcases'],
    budget: '$150-200',
    timeframe: 'May 15 - Aug 20',
    description: 'International student heading home for summer. Need secure storage close to campus.',
  },
  {
    name: 'Marcus Chen',
    profileImage: 'https://i.pravatar.cc/150?img=12',
    neighborhood: 'Langdon',
    items: ['1 bicycle', '3 boxes', '1 desk lamp'],
    budget: '$100-150',
    timeframe: 'Jun 1 - Aug 30',
    description: 'Summer internship in another city. Looking for reliable storage.',
  },
  {
    name: 'Sarah Williams',
    profileImage: 'https://i.pravatar.cc/150?img=45',
    neighborhood: 'State St',
    items: ['2 boxes', '1 TV', '1 desk'],
    budget: '$120-180',
    timeframe: 'May 20 - Sep 1',
    description: 'Graduating senior storing items before moving.',
  },
  {
    name: 'David Kim',
    profileImage: 'https://i.pravatar.cc/150?img=33',
    neighborhood: 'Langdon',
    items: ['5 boxes', '1 mattress', '1 chair'],
    budget: '$180-250',
    timeframe: 'Jun 10 - Aug 25',
    description: 'Study abroad semester, need temporary storage.',
  },
  {
    name: 'Priya Patel',
    profileImage: 'https://i.pravatar.cc/150?img=27',
    neighborhood: 'Willy St',
    items: ['3 boxes', '1 guitar', '1 lamp'],
    budget: '$80-120',
    timeframe: 'May 10 - Jul 31',
    description: 'Subletting my apartment for the summer, need a place for a few things.',
  },
  {
    name: 'Jake Torres',
    profileImage: 'https://i.pravatar.cc/150?img=68',
    neighborhood: 'Eagle Heights',
    items: ['2 suitcases', '1 box', '1 backpack'],
    budget: '$60-100',
    timeframe: 'Jun 15 - Aug 15',
    description: 'Grad student on research travel. Just need light summer storage.',
  },
];

const sampleSpaces = [
  {
    name: 'Alex Rivera',
    profileImage: 'https://i.pravatar.cc/150?img=11',
    neighborhood: 'State St',
    spaceImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    spaceType: 'Basement',
    capacity: ['8-10 boxes', '1 mini fridge', '2 suitcases', '1 bike'],
    timeframe: 'May 1 - Sep 1',
    description: 'Dry, clean basement with plenty of room. Easy street access, no stairs for large items. Happy to share photos.',
  },
  {
    name: 'Mia Thompson',
    profileImage: 'https://i.pravatar.cc/150?img=23',
    neighborhood: 'Langdon',
    spaceImage: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=600&q=80',
    spaceType: 'Spare Room',
    capacity: ['4-5 boxes', '1 desk', '1 chair', '1 lamp'],
    timeframe: 'Jun 1 - Aug 20',
    description: 'Furnished spare bedroom I won\'t be using. Secure, locked, climate controlled. Perfect for furniture and boxes.',
  },
  {
    name: 'Ben Kowalski',
    profileImage: 'https://i.pravatar.cc/150?img=52',
    neighborhood: 'Eagle Heights',
    spaceImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
    spaceType: 'Garage',
    capacity: ['15+ boxes', '1 mattress', '1 couch', '2 bikes'],
    timeframe: 'May 15 - Aug 31',
    description: 'Two-car garage with one spot free all summer. Great for large items. Has a padlock, very secure.',
  },
  {
    name: 'Chloe Park',
    profileImage: 'https://i.pravatar.cc/150?img=44',
    neighborhood: 'Willy St',
    spaceImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80',
    spaceType: 'Storage Closet',
    capacity: ['3-4 boxes', '2 suitcases', '1 backpack'],
    timeframe: 'May 20 - Jul 15',
    description: 'Large walk-in closet with shelving. Great for lighter items and luggage. Climate controlled apartment building.',
  },
  {
    name: 'Omar Hussain',
    profileImage: 'https://i.pravatar.cc/150?img=61',
    neighborhood: 'State St',
    spaceImage: 'https://images.unsplash.com/photo-1591129841117-3adfd313e34f?w=600&q=80',
    spaceType: 'Basement',
    capacity: ['6-8 boxes', '1 TV', '1 mini fridge'],
    timeframe: 'Jun 10 - Sep 5',
    description: 'Finished basement corner unit. Clean and dry. Staying in Madison all summer and happy to coordinate pickup/dropoff.',
  },
  {
    name: 'Lily Nguyen',
    profileImage: 'https://i.pravatar.cc/150?img=36',
    neighborhood: 'Langdon',
    spaceImage: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=80',
    spaceType: 'Spare Room',
    capacity: ['5-6 boxes', '1 suitcase', '1 guitar', '1 lamp'],
    timeframe: 'May 10 - Aug 10',
    description: 'Second bedroom in my apartment, standing empty while my roommate is abroad. Plenty of closet space too.',
  },
];

const FONT = "'DM Sans', system-ui, sans-serif";

function App() {
  const [viewMode, setViewMode] = useState<'home' | 'requests' | 'space'>('home');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'request' | 'space'>('request');

  const openModal = (type: 'request' | 'space') => {
    setModalType(type);
    setShowModal(true);
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
          padding: '0 32px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          {/* Logo */}
          <div
            onClick={() => setViewMode('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'opacity 0.15s ease' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <div style={{
              width: '32px', height: '32px', background: '#C5050C', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
            }}>
              🦡
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '18px', color: '#111827', lineHeight: 1 }}>MadStorage</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>Student Storage Marketplace</div>
            </div>
          </div>

          {/* Toggle */}
          <div style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', background: '#f3f4f6', borderRadius: '100px', padding: '4px', gap: '2px',
          }}>
            {(['requests', 'space'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '8px 20px', borderRadius: '100px', border: 'none',
                  background: viewMode === mode ? '#C5050C' : 'transparent',
                  color: viewMode === mode ? '#fff' : '#6b7280',
                  fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                  transition: 'all 0.15s ease', fontFamily: FONT,
                  boxShadow: viewMode === mode ? '0 1px 4px rgba(197,5,12,0.3)' : 'none',
                }}
              >
                {mode === 'requests' ? 'Storage Requests' : 'Storage Spaces'}
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => openModal(viewMode === 'space' ? 'space' : 'request')}
            style={{
              background: '#C5050C', color: '#fff', border: 'none', borderRadius: '10px',
              padding: '10px 18px', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
              fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'background 0.15s ease',
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
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🏠</div>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '12px' }}>Welcome to MadStorage</h2>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '40px' }}>
              Connect with fellow students for storage solutions
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setViewMode('requests')}
                style={{
                  background: '#C5050C', color: '#fff', border: 'none', borderRadius: '12px',
                  padding: '14px 28px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', fontFamily: FONT,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#a0040a')}
                onMouseLeave={e => (e.currentTarget.style.background = '#C5050C')}
              >
                Storage Requests
              </button>
              <button
                onClick={() => setViewMode('space')}
                style={{
                  background: '#fff', color: '#C5050C', border: '1.5px solid #C5050C',
                  borderRadius: '12px', padding: '14px 28px', fontSize: '16px', fontWeight: '700',
                  cursor: 'pointer', fontFamily: FONT,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fff1f1')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                Storage Spaces
              </button>
            </div>
          </div>
        )}

        {/* STORAGE REQUESTS */}
        {viewMode === 'requests' && (
          <>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontWeight: '800', fontSize: '22px', color: '#111827' }}>Storage Requests Near You</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                {sampleRequests.length} students looking for storage right now
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {sampleRequests.map((request, index) => (
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
                {sampleSpaces.length} spaces available from fellow Badgers
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {sampleSpaces.map((space, index) => (
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
                  { label: 'What do you need to store?', placeholder: 'e.g., 4 boxes, 1 mini fridge' },
                  { label: 'Budget', placeholder: 'e.g., $150-200' },
                  { label: 'Timeframe', placeholder: 'e.g., May 15 - Aug 20' },
                ].map(({ label, placeholder }) => (
                  <div key={label} style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>{label}</label>
                    <input placeholder={placeholder} style={{
                      width: '100%', padding: '12px 14px', borderRadius: '10px',
                      border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                    }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#C5050C')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                    />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>Space Type</label>
                  <select style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', background: '#fff', outline: 'none',
                  }}>
                    <option value="">Select a space type</option>
                    {['Basement', 'Garage', 'Spare Room', 'Storage Closet', 'Attic', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>What can it fit?</label>
                  <input placeholder="e.g., 5-6 boxes, 1 mini fridge, 1 bike" style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                  }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C5050C')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>Available Timeframe</label>
                  <input placeholder="e.g., May 15 - Aug 20" style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', outline: 'none',
                  }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#C5050C')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: '#111827', marginBottom: '8px', fontFamily: FONT }}>Description</label>
                  <textarea placeholder="Describe your space — size, access, any restrictions..." rows={3} style={{
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
              <select style={{
                width: '100%', padding: '12px 14px', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', fontSize: '14px', fontFamily: FONT, color: '#111827', background: '#fff', outline: 'none',
              }}>
                <option value="">Select a neighborhood</option>
                {['State St', 'Langdon', 'Willy St', 'Eagle Heights'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>

            <button
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