import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MediaCard.css';

export default function ProfilePage() {
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('recentlyWatched');
    if (stored) {
      setRecent(JSON.parse(stored));
    }
  }, []);

  const handleClick = (item) => {
    const saveRecent = (item) => {
        const existing = JSON.parse(localStorage.getItem('recentlyWatched') || '[]');
        const filtered = existing.filter(i => i.id !== item.id || i.type !== item.type);
        const updated = [item, ...filtered].slice(0, 10); // 最多紀錄10筆
        localStorage.setItem('recentlyWatched', JSON.stringify(updated));
    };
    saveRecent(item);   
    const { type } = item;
    if (type === 'video') {
      navigate('/video', { state: item });
    } else if (type === 'video_series') {
      navigate('/video', { state: item });
    } else if (type === 'music') {
      navigate('/music', { state: item });
    } else if (type === 'music_series') {
      navigate('/music', { state: item });
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>近期播放紀錄</h2>
      {recent.length === 0 ? (
        <p>目前沒有播放紀錄。</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '20px',
        }}>
          {recent.map((item, idx) => (
            <div className="card" key={idx} onClick={() => handleClick(item)}>
              <div style={{
                width: '100%',
                aspectRatio: '16/9',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.poster || item.cover ? (
                  <img
                    src={item.poster || item.cover}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                ) : (
                  <span style={{ color: 'white', fontSize: '14px', opacity: 0.5 }}>無圖片</span>
                )}
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
