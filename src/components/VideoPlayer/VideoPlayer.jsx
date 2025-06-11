import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { TabView, TabPanel } from 'primereact/tabview';
import VideoJS from './VideoJS';
import { TailChase } from 'ldrs/react'
import 'ldrs/react/TailChase.css'
import './VideoPlayer.css';

// Default values shown


const VideoPlayer = () => {
    const location = useLocation();
    const videoData = location.state || {};
    const [currentEpId, setCurrentEpId] = useState(
        videoData.episodes && videoData.episodes[0] ? videoData.episodes[0].id : null
    );

    let videoID = '';
    if (videoData.episodes !== undefined) {
        videoID = String(videoData.id) + '-' + String(videoData.episodes[0].id);
    } else {
        videoID = String(videoData.id);
    }

    const videooptions = {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        sources: [
            {
                src: '', // 會在後面更新
                type: 'application/dash+xml',
            },
        ],
    };

    const [options, setOptions] = useState(videooptions);
    const [isLoading, setIsLoading] = useState(true);
    const [seekDisplay, setSeekDisplay] = useState(null);
    const playerRef = useRef(null);
    const currentEpIdRef = useRef(currentEpId);

    useEffect(() => {
        currentEpIdRef.current = currentEpId;
    }, [currentEpId]);

    useEffect(() => {
        fetch(`/video/video:${videoID}`)
            .then(res => res.json())
            .then(data => {
                setOptions(opt => ({
                    ...opt,
                    sources: [
                        {
                            src: data.video_url,
                            type: 'application/dash+xml',
                        },
                    ],
                    poster: data.poster_url,
                    sub: data.subtitle_url
                }));

                //console.log('載入完成:', data);
                //console.log('videoData:', videoData);
                setIsLoading(false);

            })
            .catch(err => {
                console.error('失敗:', err);

            });

    }, [videoID]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const player = playerRef.current;
            if (!player || typeof player.currentTime !== 'function') return;

            if (e.key === 'ArrowRight') {
                player.currentTime(player.currentTime() + 5);
                // setSeekDisplay('+5s');
                console.log('Seeked forward by 5 seconds');
            }
            if (e.key === 'ArrowLeft') {
                player.currentTime(Math.max(0, player.currentTime() - 5));
                // setSeekDisplay('-5s');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (seekDisplay !== null) {
            const timer = setTimeout(() => setSeekDisplay(null), 800);
            return () => clearTimeout(timer);
        }
    }, [seekDisplay]);

    const handleChangeVideo = (newSrc, epId) => {
        setIsLoading(true);
        setCurrentEpId(epId);

        fetch(`/video/video:${newSrc}`)
            .then(res => res.json())
            .then(data => {
                if (epId === currentEpIdRef.current) {
                    setOptions({
                        ...videooptions,
                        sources: [
                            {
                                src: data.video_url,
                                type: 'application/dash+xml',
                            },
                        ],
                        poster: data.poster_url,
                        sub: data.subtitle_url,
                    });
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error('切換影片失敗:', err);
                setIsLoading(false);
            });
    };

    const episodesBySeason = {};
    if (Array.isArray(videoData.episodes)) {
        videoData.episodes.forEach(ep => {
            if (ep.season === undefined || ep.season === 'NONE') ep.season = 'S1';
            const season = ep.season;
            if (!episodesBySeason[season]) episodesBySeason[season] = [];
            episodesBySeason[season].push(ep);
        });
    }

    return (
        <div className="vp-root">
            <h2 className="vp-title">{videoData?.name || '影片播放器'}</h2>
            {isLoading ? (
                <div className="vp-loading">
                    <TailChase size="100" speed="1.75" color="white" />
                </div>
            ) : (
                <VideoJS
                    options={options}
                    playerRef={playerRef}
                    onReady={(player) => { playerRef.current = player; }}
                />
            )}

            <TabView>
                {Object.keys(episodesBySeason).sort().map(season => (
                    <TabPanel header={season} key={season}>
                        <div className="vp-episodes-panel">
                            {episodesBySeason[season].map((ep, idx) => (
                                <button
                                    key={ep.id}
                                    onClick={() =>
                                        handleChangeVideo(String(videoData.id) + '-' + String(ep.id), ep.id)
                                    }
                                    className={
                                        'vp-episode-btn' + (currentEpId === ep.id ? ' active' : '')
                                    }
                                >
                                    {ep.name || String(idx + 1)}
                                </button>
                            ))}
                        </div>
                    </TabPanel>
                ))}
            </TabView>
        </div>
    );
};

export default VideoPlayer;
