import React, { useEffect, useRef, useState } from 'react';
import './index.css';

const useMusicPlayer = (Musicid, trackList = []) => {
    const audioRef = useRef(new Audio());
    const containerRef = useRef(null);
    const progressBarRef = useRef(null);
    const volumeBarRef = useRef(null);
    const [track, setTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [error, setError] = useState(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [backgroundColor, setBackgroundColor] = useState('#0a0a0a');
    const [isLoading, setIsLoading] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [isDraggingProgress, setIsDraggingProgress] = useState(false);
    const [isDraggingVolume, setIsDraggingVolume] = useState(false);

    // 提取專輯封面主色調
    const extractColor = (imgSrc) => {
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
            setBackgroundColor(`rgb(${r}, ${g}, ${b})`);
        };
    };

    const loadTrack = (index) => {
        setIsLoading(true);
        const data = trackList[index] || {};
        const trackData = {
            Musicid,
            name: data.name || `Song ${Musicid}`,
            artist: data.artist || '未知歌手',
            music_url: data.music_url,
            cover_url: data.cover_url || '/assets/default-cover.jpg',
        };
        setTrack(trackData);
        audioRef.current.src = trackData.music_url;
        audioRef.current.load();
        audioRef.current.volume = volume;
        setProgress(0);
        setIsPlaying(true);
        audioRef.current.play().catch(err => setError('播放失敗。'));
        extractColor(trackData.cover_url);
        setCurrentTrackIndex(index);
        setIsLoading(false);
    };

    useEffect(() => {
        setIsLoading(true);
        fetch(`/music/music:${Musicid}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`載入錯誤: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const trackData = {
                    Musicid,
                    name: data.name || `Song ${Musicid}`,
                    artist: data.artist || '未知歌手',
                    music_url: data.music_url,
                    cover_url: data.cover_url || '/assets/default-cover.jpg',
                };
                setTrack(trackData);
                audioRef.current.src = trackData.music_url;
                audioRef.current.volume = volume;
                extractColor(trackData.cover_url);
                setIsPlaying(true);
                audioRef.current.play().catch(err => setError('播放失敗。'));
                setError(null);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('載入失敗:', err.message);
                setError('無法載入音樂。');
                setIsLoading(false);
            });

        return () => {
            audioRef.current.pause();
            audioRef.current.src = '';
        };
    }, [Musicid]);

    useEffect(() => {
        const interval = setInterval(() => {
            const audio = audioRef.current;
            if (audio && audio.duration && !isDraggingProgress) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [isDraggingProgress]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(err => setError('播放失敗。'));
        }
        setIsPlaying(!isPlaying);
    };

    const handleNext = () => {
        if (trackList.length > 0) {
            const nextIndex = (currentTrackIndex + 1) % trackList.length;
            loadTrack(nextIndex);
        }
    };

    const handlePrevious = () => {
        if (trackList.length > 0) {
            const prevIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length;
            loadTrack(prevIndex);
        }
    };

    const handleProgressDrag = (e) => {
        const progressBar = progressBarRef.current;
        if (!progressBar) return;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newProgress = Math.max(0, Math.min(100, (clickX / width) * 100));
        setProgress(newProgress);
        const audio = audioRef.current;
        if (audio && audio.duration) {
            audio.currentTime = (newProgress / 100) * audio.duration;
        }
    };

    const handleVolumeDrag = (e) => {
        const volumeBar = volumeBarRef.current;
        if (!volumeBar) return;
        const rect = volumeBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newVolume = Math.max(0, Math.min(1, clickX / width));
        audioRef.current.volume = newVolume;
        setVolume(newVolume);
    };

    const handleMouseDownProgress = (e) => {
        setIsDraggingProgress(true);
        handleProgressDrag(e);
    };

    const handleMouseMoveProgress = (e) => {
        if (isDraggingProgress) {
            handleProgressDrag(e);
        }
    };

    const handleMouseDownVolume = (e) => {
        setIsDraggingVolume(true);
        handleVolumeDrag(e);
    };

    const handleMouseMoveVolume = (e) => {
        if (isDraggingVolume) {
            handleVolumeDrag(e);
        }
    };

    const handleMouseUp = () => {
        setIsDraggingProgress(false);
        setIsDraggingVolume(false);
    };

    const handleClose = () => {
        audioRef.current.pause();
        audioRef.current.src = '';
        setIsClosed(true);
    };

    const toggleFullscreen = () => setFullscreen(!fullscreen);

    const handleContainerClick = (e) => {
        if (!e.target.closest('.controls-container') && !e.target.closest('.progress-bar') && !e.target.closest('.volume-control')) {
            toggleFullscreen();
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const render = () => {
        if (isClosed) return null;
        if (error) return <div className="error">{error}</div>;
        if (!track || isLoading) return <div className="loading-overlay active"><div className="spinner"></div></div>;

        return (
            <div
                className={`player-${fullscreen ? 'fullscreen' : 'minimized'} active`}
                style={fullscreen ? { background: `linear-gradient(180deg, ${backgroundColor}, #0a0a0a)` } : {}}
                onClick={handleContainerClick}
                ref={containerRef}
                onMouseMove={handleMouseMoveProgress}
                onMouseUp={handleMouseUp}
            >
                <div className="track-info">
                    <img className="img" src={track.cover_url} alt="專輯封面" />
                    <div className="track-info-text">
                        <div className="name">{track.name}</div>
                        <div className="artist">{track.artist}</div>
                    </div>
                </div>
                <div className="controls-container">
                    <div className="progress-container">
                        {fullscreen ? (
                            <>
                                <span className="progress-time" style={{marginRight: 8}}>{formatTime(audioRef.current.currentTime || 0)}</span>
                                <div className="progress-bar" ref={progressBarRef} onMouseDown={handleMouseDownProgress} style={{ '--progress': `${progress}%` }}></div>
                                <span className="progress-time" style={{marginLeft: 8}}>{formatTime(audioRef.current.duration || 0)}</span>
                            </>
                        ) : (
                            <>
                                <span className="progress-time" style={{marginRight: 8}}>{formatTime(audioRef.current.currentTime || 0)}</span>
                                <div className="progress-bar" ref={progressBarRef} onMouseDown={handleMouseDownProgress} style={{ '--progress': `${progress}%` }}></div>
                            </>
                        )}
                    </div>
                    <div className="controls">
                        <div className="control-button" onClick={handlePrevious}>⏮</div>
                        <div className="control-button play-pause-button" onClick={togglePlay}>
                            {isPlaying ? (
                                '⏸'
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <polygon points="6,4 20,12 6,20" fill="#fff" />
                                </svg>
                            )}
                        </div>
                        <div className="control-button" onClick={handleNext}>⏭</div>
                    </div>
                    <div className="right-controls">
                        <div className="volume-control" onMouseMove={handleMouseMoveVolume} onMouseDown={handleMouseDownVolume}>
                            <span className="volume-label">音量</span>
                            <div className="volume-bar" ref={volumeBarRef} style={{ '--volume': `${volume * 100}%` }}></div>
                        </div>
                        <div className="control-button" onClick={handleClose}>✖</div>
                    </div>
                </div>
                {fullscreen && (
                    <div className="top-controls">
                        <div className="control-button" onClick={toggleFullscreen}>🗕</div>
                    </div>
                )}
            </div>
        );
    };

    return { render };
};

export default useMusicPlayer;