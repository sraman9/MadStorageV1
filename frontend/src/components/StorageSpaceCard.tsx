import React, { useState } from 'react';

interface StorageSpaceCardProps {
  userId?: string;
  name: string;
  profileImage: string;
  neighborhood: string;
  spaceImage: string;
  spaceType: string;
  capacity: string[];
  timeframe: string;
  description?: string;
  price?: number | null;
  marketAvg?: number;
  savings?: number | null;
  onContact?: (userId: string) => void;
}

const FONT = "'DM Sans', system-ui, sans-serif";

const StorageSpaceCard: React.FC<StorageSpaceCardProps> = ({
  userId,
  name,
  profileImage,
  neighborhood,
  spaceImage,
  spaceType,
  capacity,
  timeframe,
  description,
  price,
  marketAvg,
  savings,
  onContact,
}) => {
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        boxShadow: hovered
          ? '0 8px 30px rgba(0,0,0,0.12)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: 'default',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Space Photo */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={spaceImage}
          alt={`${name}'s ${spaceType}`}
          style={{
            width: '100%',
            height: '160px',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        {/* Space type badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(0,0,0,0.65)',
          color: '#fff',
          borderRadius: '20px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: '700',
          fontFamily: FONT,
          backdropFilter: 'blur(4px)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {spaceType}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Profile Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={profileImage}
              alt={name}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #f3f4f6',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '16px',
              height: '16px',
              background: '#C5050C',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              fontSize: '8px',
            }}>
              🦡
            </div>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontWeight: '700',
              fontSize: '15px',
              color: '#111827',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: FONT,
            }}>
              {name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: FONT }}>{neighborhood}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f3f4f6', marginBottom: '14px' }} />

        {/* Capacity */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#6b7280',
            marginBottom: '8px',
            fontFamily: FONT,
          }}>
            Can fit
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {capacity.map((item, i) => (
              <span key={i} style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                padding: '4px 10px',
                fontSize: '12px',
                color: '#374151',
                fontWeight: '500',
                fontFamily: FONT,
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            lineHeight: '1.6',
            marginBottom: '16px',
            fontFamily: FONT,
          }}>
            {description}
          </p>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Timeframe */}
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT }}>Available</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d4ed8', fontFamily: FONT }}>{timeframe}</div>
          </div>
        </div>

        {/* Price & Savings */}
        {(price != null && price > 0) && (
          <div style={{
            background: savings && savings > 0 ? '#f0fdf4' : '#f9fafb',
            border: `1px solid ${savings && savings > 0 ? '#bbf7d0' : '#e5e7eb'}`,
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', fontFamily: FONT, margin: 0 }}>${price}/mo</h2>
              {savings != null && savings > 0 && (
                <span style={{
                  fontSize: '14px', fontWeight: '700', color: '#16a34a', fontFamily: FONT,
                  background: '#dcfce7', padding: '4px 10px', borderRadius: '20px',
                }}>
                  Save ${savings}/mo vs commercial
                </span>
              )}
            </div>
          </div>
        )}

        {/* Contact Button */}
        <button
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          onClick={() => userId && onContact?.(userId)}
          style={{
            width: '100%',
            background: btnHovered ? '#a0040a' : '#C5050C',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
            fontFamily: FONT,
            letterSpacing: '0.02em',
          }}
        >
          Contact
        </button>
      </div>
    </div>
  );
};

export default StorageSpaceCard;