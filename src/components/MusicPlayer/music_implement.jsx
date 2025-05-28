import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useMusicPlayer = (audioRef) => {
    const [currentTrackId, setCurrentTrackId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [track, setTrack] = useState(null);
    const [dominantColor, setDominantColor] = useState('#1e1e1e');

    //   const trackIds = ['1-1', '1-2', '2', '3', '4', '5', '6'];
    console.log('audioRef:', audioRef);
    useEffect(() => {
        fetch(`/music/music:${audioRef}`)
                .then(response => response.json())
                .then(data => {
                    console.log('Music data:', data);
                    loadTrack(data.Musicid,data);
                })
        }, []);

    // loadTrack(audioRef);
    // 格式化時間
    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    // 提取封面主色
    const getDominantColor = (imgSrc, callback) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = imgSrc;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < imageData.length; i += 4) {
                r += imageData[i];
                g += imageData[i + 1];
                b += imageData[i + 2];
                count++;
            }
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);
            callback(`rgb(${r}, ${g}, ${b})`);
        };
        img.onerror = () => callback('#1e1e1e');
    };

    // 載入歌曲
    const loadTrack = (Musicid, data) => {
        //
        // const location = useLocation();
        // const musicData = location.state || {};
        // console.log('musicData:', musicData);
        // let Musicid = '';
        // if (musicData.type !== "music") { // 處理series
        //     Musicid = String(musicData.from_music_id) + '-' + String(musicData.id);
        // }
        // else{
        //     Musicid = String(musicData.id)
        // }
        // console.log('musicID:', Musicid);
        //
        console.log('Loading track with ID:', Musicid);
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        setIsLoading(true);
        try {
            console.log('Loading track:', Musicid);
            
            console.log('Track data:', data);
            const trackData = {
                Musicid,
                name: data.name || `Song ${Musicid}`,
                artist: data.artist || 'Unknown Artist',
                music_url: data.music_url,
                cover_url: data.cover_url || '/assets/default-cover.jpg',
            };
            setTrack(trackData);
            setCurrentTrackId(Musicid);
            audioRef.current.src = trackData.music_url;
            audioRef.current.volume = volume;
            getDominantColor(trackData.cover_url, setDominantColor);
            audioRef.current.play();
            setIsPlaying(true);
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching audio URL:', err);
            setError(`無法載入歌曲 ID ${Musicid}`);
            setIsLoading(false);
        }
    };

    // 顯示錯誤
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // 播放/暫停
    const togglePlay = async () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            try {
                await audioRef.current.play();
            } catch (err) {
                setError(`無法播放音檔: ${audioRef.current.src}`);
            }
        }
        setIsPlaying(!isPlaying);
    };

    // 上一首
    const playPrevious = () => {
        // const currentIndex = trackIds.indexOf(currentTrackId);
        // const prevIndex = currentIndex > 0 ? currentIndex - 1 : trackIds.length - 1;
        // loadTrack(trackIds[prevIndex]);
    };

    // 下一首
    const playNext = () => {
        // const currentIndex = trackIds.indexOf(currentTrackId);
        // const nextIndex = currentIndex < trackIds.length - 1 ? currentIndex + 1 : 0;
        // loadTrack(trackIds[nextIndex]);
    };

    // 關閉播放器
    const closePlayer = () => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        setCurrentTrackId(null);
        setTrack(null);
        setIsFullScreen(false);
    };

    // 切換全螢幕
    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    // 更新進度
    // useEffect(() => {
    //     const audio = audioRef.current;
    //     const updateProgress = () => {
    //         setCurrentTime(audio.currentTime);
    //         setDuration(audio.duration || 0);
    //     };
    //     audio.addEventListener('timeupdate', updateProgress);
    //     audio.addEventListener('loadedmetadata', () => {
    //         setDuration(audio.duration);
    //     });
    //     audio.addEventListener('error', () => {
    //         setError(`音檔載入失敗: ${audio.src}`);
    //         setIsLoading(false);
    //     });
    //     return () => {
    //         audio.removeEventListener('timeupdate', updateProgress);
    //         audio.removeEventListener('loadedmetadata', () => { });
    //         audio.removeEventListener('error', () => { });
    //     };
    // }, []);

    // 子組件：TrackList
    //   const TrackList = () => (
    //     <div className="track-list">
    //       {trackIds.map((Musicid) => (
    //         <div
    //           key={Musicid}
    //           className="track-button"
    //           onClick={() => loadTrack(Musicid)}
    //         >
    //           Song {Musicid}
    //         </div>
    //       ))}
    //     </div>
    //   );

    // 子組件：TrackInfo
    const TrackInfo = ({ cover, name, artist, isMinimized, closePlayer }) => (
        <div className="track-info">
            <img
                src={cover}
                alt="專輯封面"
                className="img"
            />
            <div className="track-info-text">
                <p className="name" style={isMinimized ? {} : { fontSize: '1.8rem', margin: '10px 0' }}>{name}</p>
                <p className="artist" style={isMinimized ? {} : { fontSize: '1.2rem', color: '#b0b0b0' }}>{artist}</p>
            </div>
            {isMinimized && (
                <button className="control-button" onClick={closePlayer}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="2">
                        <path d="M6 6l12 12M6 18L18 6" />
                    </svg>
                </button>
            )}
        </div>
    );

    // 子組件：Controls
    const Controls = ({ isFullScreen }) => (
        <div className="controls" style={isFullScreen ? { margin: '20px 0' } : {}}>
            <button className="button" onClick={playPrevious}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="2.5">
                    <path d="M11 5L3 12l8 7V5zM21 5v14" />
                </svg>
            </button>
            <button
                className="button play-pause-button"
                onClick={togglePlay}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="2.5">
                    {isPlaying ? (
                        <path d="M9 4h2v16H9V4zm6 0h2v16h-2V4z" />
                    ) : (
                        <path d="M5 3l14 9-14 9V3z" />
                    )}
                </svg>
            </button>
            <button className="button" onClick={playNext}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="2.5">
                    <path d="M13 5l8 7-8 7V5zM3 5v14" />
                </svg>
            </button>
            <div className="volume-control">
                <span className="volume-label">{Math.round(volume * 100)}%</span>
                <div
                    className="volume-bar"
                    style={{ '--volume': `${volume * 100}%` }}
                    onMouseDown={(e) => {
                        const bar = e.target;
                        const rect = bar.getBoundingClientRect();
                        const updateVolume = (e) => {
                            const x = e.clientX - rect.left;
                            const newVolume = Math.min(Math.max(x / rect.width, 0), 1);
                            setVolume(newVolume);
                            audioRef.current.volume = newVolume;
                        };
                        updateVolume(e);
                        document.addEventListener('mousemove', updateVolume);
                        document.addEventListener('mouseup', () => {
                            document.removeEventListener('mousemove', updateVolume);
                        }, { once: true });
                    }}
                />
            </div>
        </div>
    );

    // 子組件：ProgressBar
    const ProgressBar = ({ isFullScreen }) => {
        const handleProgressDrag = (e) => {
            const bar = e.target;
            const rect = bar.getBoundingClientRect();
            const updateProgress = (e) => {
                const x = e.clientX - rect.left;
                const percent = Math.min(Math.max(x / rect.width, 0), 1);
                audioRef.current.currentTime = percent * duration;
            };
            document.addEventListener('mousemove', updateProgress);
            document.addEventListener('mouseup', () => {
                document.removeEventListener('mousemove', updateProgress);
            }, { once: true });
        };

        const progressPercent = (currentTime / duration) * 100 || 0;

        return (
            <div className="progress-container" style={isFullScreen ? { width: '80%', maxWidth: '600px' } : {}}>
                <div
                    className="progress-bar"
                    style={{ '--progress': `${progressPercent}%` }}
                    onMouseDown={handleProgressDrag}
                />
                <div className="progress-time">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        );
    };

    // 子組件：PlayerMinimized
    const PlayerMinimized = () => (
        <div
            className={`player-minimized ${track ? 'active' : ''}`}
            onClick={(e) => {
                if (!e.target.closest('.button, .control-button, .progress-bar, .volume-bar, .volume-label, .play-pause-button')) {
                    toggleFullScreen();
                }
            }}
        >
            {track && (
                <>
                    <TrackInfo cover={track.cover_url} name={track.name} artist={track.artist} isMinimized={true} closePlayer={closePlayer} />
                    <Controls />
                    <ProgressBar />
                </>
            )}
        </div>
    );

    // 子組件：PlayerFullscreen
    const PlayerFullscreen = () => (
        <div
            className={`player-fullscreen ${isFullScreen ? 'active' : ''}`}
            style={{ background: `linear-gradient(180deg, ${dominantColor}, #0a0a0a)` }}
        >
            <div className="top-controls">
                <div className="volume-control">
                    <span className="volume-label">{Math.round(volume * 100)}%</span>
                    <div
                        className="volume-bar"
                        style={{ '--volume': `${volume * 100}%` }}
                        onMouseDown={(e) => {
                            const bar = e.target;
                            const rect = bar.getBoundingClientRect();
                            const updateVolume = (e) => {
                                const x = e.clientX - rect.left;
                                const newVolume = Math.min(Math.max(x / rect.width, 0), 1);
                                setVolume(newVolume);
                                audioRef.current.volume = newVolume;
                            };
                            updateVolume(e);
                            document.addEventListener('mousemove', updateVolume);
                            document.addEventListener('mouseup', () => {
                                document.removeEventListener('mousemove', updateVolume);
                            }, { once: true });
                        }}
                    />
                </div>
                <button className="control-button" onClick={closePlayer}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="2">
                        <path d="M6 6l12 12M6 18L18 6" />
                    </svg>
                </button>
            </div>
            <div className="bottom-right-controls">
                <button className="control-button" onClick={toggleFullScreen}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="2">
                        <path d="M7 14H4v5h5v-3H7v-2zm10 0h3v5h-5v-3h2v-2zm0-10h3v5h-5V6h2V4zM7 4H4v5h5V6H7V4z" />
                    </svg>
                </button>
            </div>
            {track && (
                <>
                    <TrackInfo cover={track.cover_url} name={track.name} artist={track.artist} isMinimized={false} />
                    <Controls isFullScreen={true} />
                    <ProgressBar isFullScreen={true} />
                </>
            )}
        </div>
    );

    // 子組件：LoadingOverlay
    const LoadingOverlay = () => (
        <div className={`loading-overlay ${isLoading ? 'active' : ''}`}>
            <div className="spinner" />
        </div>
    );

    // 渲染函數
    const render = () => (
        <>
            {/* {error && <div className="error">{error}</div>} */}
            {/* <TrackList /> */}
            <PlayerMinimized />
            <PlayerFullscreen />
            <LoadingOverlay />
        </>
    );

    return { render };
};

export default useMusicPlayer;