import React, { useState } from 'react';

interface StorageRequestCardProps {
  name: string;
  profileImage: string;
  neighborhood: string;
  items: string[];
  budget: string;
  timeframe: string;
  description?: string;
}

const StorageRequestCard: React.FC<StorageRequestCardProps> = ({
  name,
  profileImage,
  items,
  budget,
  timeframe,
  description,
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
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        cursor: 'default',
        boxSizing: 'border-box',
      }}
    >
      {/* Profile Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={profileImage}
            alt={name}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #f3f4f6',
            }}
          />
          {/* Verified badge */}
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '18px',
            height: '18px',
            background: '#C5050C',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            fontSize: '9px',
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
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {name}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#f3f4f6', marginBottom: '16px' }} />

      {/* Items */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {items.map((item, i) => (
            <span key={i} style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '12px',
              color: '#374151',
              fontWeight: '500',
              fontFamily: "'DM Sans', system-ui, sans-serif",
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
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {description}
        </p>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Budget + Timeframe */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <div style={{
          flex: 1,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '10px',
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Budget</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{budget}</div>
        </div>
        <div style={{
          flex: 1,
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>Timeframe</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d4ed8', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{timeframe}</div>
        </div>
      </div>

      {/* Contact Button */}
      <button
        onMouseEnter={() => setBtnHovered(true)}
        onMouseLeave={() => setBtnHovered(false)}
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
          fontFamily: "'DM Sans', system-ui, sans-serif",
          letterSpacing: '0.02em',
        }}
      >
        Contact
      </button>
    </div>
  );
};

export default StorageRequestCard;