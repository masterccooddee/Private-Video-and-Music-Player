import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/MediaCard.css';

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/get_all')
      .then(res => {
        const raw = res.data;
        // console.log('Received data:', raw);
        const videoList = raw.videos.filter(v => v.type === 'video');
        const videoSeriesList = raw.videos.filter(v => v.type === 'series');

        const groupedSeries = Object.values(
          raw.video_series.reduce((acc, ep) => {
            const parent = videoSeriesList.find(s => s.id === ep.from_video_id);
            if (!parent) return acc;

            if (!acc[ep.from_video_id]) {
              acc[ep.from_video_id] = {
                id: parent.id,
                name: parent.name,
                poster: parent.poster,
                firstEpisodeFile: `${ep.season}.mp4`,
                episodes: [],
              };
            }
            acc[ep.from_video_id].episodes.push(ep);
            return acc;
          }, {})
        );

        setData({
          videos: videoList,
          video_series: groupedSeries,
          music: raw.music
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  }, []);

  const renderMediaList = (items, type) => {
    if (!items || items.length === 0) return null;

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '20px',
      }}>
        {items.map(item => {
          const imageUrl = item.poster ?? item.cover ?? '';
          const hasImage = !!imageUrl;
          // console.log('Rendering item:', item);
          const handleClick = () => {
            if (type === 'video') {
              navigate('/video', { state: { id: item.id, name: item.name } });
            } else if (type === 'video_series') {
              navigate('/video', {
                state: {
                  id: item.id,
                  name: item.name,
                  poster: item.poster,
                  file: item.firstEpisodeFile,
                  episodes: item.episodes
                },
              });

              // console.log('Sending to video player:', {
              //   id: item.id,
              //   name: item.name,
              //   poster: item.poster,
              //   file: item.firstEpisodeFile,
              //   episodes: item.episodes
              // });

            } else if (type === 'music') {
              navigate('/music', { state: item });
            }
          };

          return (
            <div className="card" key={`${type}-${item.id}`} onClick={handleClick}>
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

      {data?.videos?.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>影片</h3>
          {renderMediaList(data.videos, 'video')}
        </div>
      )}

      {data?.video_series?.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>影片集</h3>
          {renderMediaList(data.video_series, 'video_series')}
        </div>
      )}

      {data?.music?.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>音樂</h3>
          {renderMediaList(data.music, 'music')}
        </div>
      )}
    </div>
  );
}
