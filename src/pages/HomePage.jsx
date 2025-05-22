import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/get_all')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  }, []);

  const getNavigationPath = (item, type) => {
    if (type === 'video') return `/video/video:${item.id}`;
    if (type === 'video_series') return `/video/video:${item.from_video_id}-${item.id}`;
    if (type === 'music') return `/music/music:${item.id}`;
    if (type === 'music_series') return `/music/music:${item.from_music_id}-${item.id}`;
    return '/';
  };

  const renderMediaList = (items, type) => {
    if (!items || items.length === 0) return null;

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '20px',
      }}>
        {items.map(item => {
          const imageUrl =
            item.poster ?? item.cover ?? '';

          const hasImage = !!imageUrl;

          return (
            <div
              key={`${type}-${item.id}`}
              onClick={() => navigate(getNavigationPath(item, type))}
              style={{
                border: '1px solid #ddd',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
              onMouseOut={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{
                width: '100%',
                aspectRatio: '16/9',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {hasImage ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
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
                  {item.name || '無標題'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '16px' }}>這是首頁</h1>

      {loading && <div>載入中...</div>}
      {error && <div style={{ color: 'red' }}>發生錯誤：{error.message}</div>}

      {(data?.videos?.length > 0 || data?.video_series?.length > 0) && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>影片</h3>
          {renderMediaList(data.videos, 'video')}
          {renderMediaList(data.video_series, 'video_series')}
        </div>
      )}

      {(data?.music?.length > 0 || data?.music_series?.length > 0) && (
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>音樂</h3>
          {renderMediaList(data.music, 'music')}
          {renderMediaList(data.music_series, 'music_series')}
        </div>
      )}
    </div>
  );
}
