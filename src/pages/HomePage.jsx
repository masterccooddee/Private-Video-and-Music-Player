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
                console.log('Received data:', raw);
                const videoList = raw.videos.filter(v => v.type === 'video');
                const videoSeriesList = raw.videos.filter(v => v.type === 'series');
                const musicList = raw.music.filter(v => v.type === 'music');
                const musicSeriesList = raw.music.filter(v => v.type === 'series');
                // console.log('musicList:', musicList);
                // console.log("musicSeriesList:", musicSeriesList);

                const videoGroupedSeries = Object.values(
                    raw.video_series.reduce((acc, ep) => {
                        const parent = videoSeriesList.find(s => s.id === ep.from_video_id);
                        if (!parent) return acc;
                        // console.log('video Parent:', parent);
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

                const musicGroupedSeries = Object.values(
                    raw.music_series.reduce((acc, ep) => {
                        const parent = musicSeriesList.find(s => s.id === ep.from_music_id);
                        if (!parent) return acc;

                        if (!acc[ep.from_music_id]) {
                            acc[ep.from_music_id] = {
                                id: parent.id,
                                name: parent.name,
                                poster: '',
                                firstEpisodeFile: `${ep.season}.mp3`,
                                episodes: [ep], 
                            };
                        } else {
                            acc[ep.from_music_id].episodes.push(ep);
                        }

                        const group = acc[ep.from_music_id];
                        if (!group.poster) {
                            const firstEp = group.episodes[0];
                            group.poster = parent.cover || firstEp.cover || '';
                        }

                        return acc;
                    }, {})
                );

                setData({
                    videos: videoList,
                    video_series: videoGroupedSeries,
                    music: musicList,
                    music_series: musicGroupedSeries
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

                    const saveRecent = (item) => {
                        const existing = JSON.parse(localStorage.getItem('recentlyWatched') || '[]');
                        const filtered = existing.filter(i => i.id !== item.id || i.type !== item.type);
                        const updated = [item, ...filtered].slice(0, 10); // 最多紀錄10筆
                        localStorage.setItem('recentlyWatched', JSON.stringify(updated));
                        };
                    
                    const handleClick = () => {
                        saveRecent(item);
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
                            navigate('/music', { state: { id: item.id, name: item.name, type: item.type, info: item.info } });
                        } else if (type === 'music_series') {
                            navigate('/music', {
                                state: {
                                    id: item.id,
                                    name: item.name,
                                    poster: item.cover,
                                    file: item.firstEpisodeFile,
                                    type: item.type,
                                    episodes: item.episodes
                                },
                            });
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
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>音樂</h3>
                    {renderMediaList(data.music, 'music')}
                </div>
            )}

            {data?.music_series?.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>音樂集</h3>
                    {renderMediaList(data.music_series, 'music_series')}
                </div>
            )}
        </div>
    );
}
