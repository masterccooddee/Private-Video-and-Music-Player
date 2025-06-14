import React, { useEffect, useRef, useState } from 'react';
import { TbPlayerPlayFilled, TbPlayerPauseFilled,TbPlayerSkipBackFilled ,TbPlayerSkipForwardFilled } from "react-icons/tb";
import { RiCloseFill } from "react-icons/ri";
import './index.css';
import default_Cover_Path from './ka3.jpg';

const useMusicPlayer = (Musicid, musicData, trackList = []) => {
    const audioRef = useRef(new Audio());
    const containerRef = useRef(null);
    const progressBarRef = useRef(null);
    const volumeBarRef = useRef(null);
    const randomTracksRef = useRef([]);
    const currentRandomIndexRef = useRef(-1);
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
    const [marqueeOffset, setMarqueeOffset] = useState(0);
    const [marqueeReset, setMarqueeReset] = useState(false);
    const marqueeRef = useRef(null);
    const [randomTracks, setRandomTracks] = useState([]);
    const [currentRandomIndex, setCurrentRandomIndex] = useState(-1);
    const [isRequesting, setIsRequesting] = useState(false);
    const requestTimeoutRef = useRef(null);
    const spinnerTimeoutRef = useRef(null);
    const info = musicData?.info ? JSON.parse(musicData.info) : {};

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

    // 載入隨機音樂列表
    const loadRandomTracks = async () => {
        if (isRequesting) return randomTracksRef.current;
        
        setIsRequesting(true);
        try {
            const response = await fetch('/random_music');
            if (!response.ok) {
                throw new Error(`載入錯誤: ${response.status}`);
            }
            const data = await response.json();
            console.log("random_music:", data);
            setRandomTracks(data);
            randomTracksRef.current = data;
            return data;
        } catch (err) {
            console.error('載入失敗:', err.message);
            setError('無法載入音樂。');
            return randomTracksRef.current;
        } finally {
            setIsRequesting(false);
        }
    };

    // 播放指定音樂
    const playMusic = async (musicId, musicData) => {
        if (!musicId || !musicData) {
            console.error('無效的音樂ID或數據');
            return;
        }

        if (isRequesting) {
            console.log('正在處理其他請求，請稍候...');
            return;
        }

        setIsRequesting(true);
        setIsClosed(false);

        // 立即隱藏任何現有的載入動畫
        setIsLoading(false);

        // 設定一個1秒的延遲來顯示載入動畫
        spinnerTimeoutRef.current = setTimeout(() => {
            setIsLoading(true);
        }, 1000); // 1秒延遲

        try {
            const response = await fetch(`/music/music:${musicId}`);
            console.log("音樂數據musicId:", musicId);
            if (!response.ok) {
                throw new Error(`載入錯誤: ${response.status}`);
            }
            const data = await response.json();
            console.log("音樂數據:", data);
            const trackData = {
                Musicid: musicId,
                name: musicData.name || `Song ${musicId}`,
                artist: musicData.info ? JSON.parse(musicData.info).artist || '未知歌手' : '未知歌手',
                music_url: data.music_url,
                cover_url: data.cover_url || default_Cover_Path,
            };
            setTrack(trackData);
            audioRef.current.src = trackData.music_url;
            audioRef.current.volume = volume;
            extractColor(trackData.cover_url);
            setIsPlaying(true);
            await audioRef.current.play();
            setError(null);

            // 更新專輯播放索引
            if (trackList && trackList.length > 0) {
                const foundIndex = trackList.findIndex(track => {
                    const trackIdentifier = track.from_music_id ? `${track.from_music_id}-${track.id}` : track.id;
                    return trackIdentifier === musicId;
                });
                if (foundIndex !== -1) {
                    console.log('更新專輯索引:', foundIndex);
                    setCurrentTrackIndex(() => {
                        console.log('Setting initial currentTrackIndex to:', foundIndex);
                        return foundIndex;
                    });
                    // 更新 UI
                    document.querySelector('.track-item.active')?.classList.remove('active');
                    document.querySelector(`.track-item:nth-child(${foundIndex + 1})`)?.classList.add('active');
                }
            } else {
                // 如果是隨機播放模式，更新 currentRandomIndex
                const tracks = randomTracksRef.current;
                if (tracks && tracks.length > 0) {
                    const foundIndex = tracks.findIndex(track => {
                        const trackIdentifier = track.from_music_id ? `${track.from_music_id}-${track.id}` : track.id;
                        return trackIdentifier === musicId;
                    });
                    console.log('Found index in random tracks:', foundIndex);
                    if (foundIndex !== -1) {
                        currentRandomIndexRef.current = foundIndex;
                        setCurrentRandomIndex(foundIndex);
                    }
                }
            }
        } catch (err) {
            console.error('播放失敗:', err);
            setError('播放失敗。');
            // 如果是伺服器錯誤，等待一段時間後重試
            if (err.message.includes('500')) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } finally {
            // 清除載入動畫計時器
            if (spinnerTimeoutRef.current) {
                clearTimeout(spinnerTimeoutRef.current);
                spinnerTimeoutRef.current = null;
            }
            setIsLoading(false); // 確保載入完成後隱藏動畫
            // 添加延遲，防止請求過於頻繁
            setTimeout(() => {
                setIsRequesting(false);
            }, 500);
        }
    };

    // 處理下一首
    const handleNext = async (e) => {
        e.stopPropagation();
        if (isRequesting) {
            console.log('正在處理其他請求，請稍候...');
            return;
        }

        if (trackList && trackList.length > 0) {
            // 使用函数式更新来获取最新的 currentTrackIndex
            setCurrentTrackIndex(prevIndex => {
                const nextIndex = (prevIndex + 1) % trackList.length;
                console.log('nextIndex: ', nextIndex);
                console.log('currentTrackIndex before update:', prevIndex);
                
                // 更新 UI
                document.querySelector('.track-item.active')?.classList.remove('active');
                document.querySelector(`.track-item:nth-child(${nextIndex+1})`)?.classList.add('active');
                
                const nextTrack = trackList[nextIndex];
                const trackId = `${nextTrack.from_music_id}-${nextTrack.id}`;
                // 使用 Promise 来处理异步操作
                playMusic(trackId, nextTrack).catch(console.error);
                
                return nextIndex;
            });
        } else {
            // 隨機音樂切換
            let tracks = randomTracksRef.current;
            // console.log('Current random index:', currentRandomIndexRef.current);
            // console.log('Available tracks:', tracks);
            
            if (tracks.length === 0) {
                tracks = await loadRandomTracks();
            }
            if (tracks && tracks.length > 0) {
                let nextIndex;
                if (currentRandomIndexRef.current === -1) { // 如果是第一次從單曲切換到隨機播放
                    nextIndex = 0; // 播放隨機列表的第一首歌
                } else {
                    nextIndex = (currentRandomIndexRef.current + 1) % tracks.length;
                }
                console.log('Next index to play:', nextIndex);
                
                document.querySelector('.track-item.active')?.classList.remove('active');
                document.querySelector(`.track-item:nth-child(${nextIndex + 1})`)?.classList.add('active');
                currentRandomIndexRef.current = nextIndex;
                setCurrentRandomIndex(nextIndex);
                const nextTrack = tracks[nextIndex];
                if (nextTrack && nextTrack.id) {
                    const trackId = nextTrack.from_music_id ? `${nextTrack.from_music_id}-${nextTrack.id}` : nextTrack.id;
                    console.log('Playing next track:', trackId);
                    await playMusic(trackId, nextTrack);
                }
            }
        }
    };

    // 處理上一首
    const handlePrevious = async (e) => {
        e.stopPropagation();
        if (isRequesting) {
            console.log('正在處理其他請求，請稍候...');
            return;
        }

        if (trackList && trackList.length > 0) {
            // 專輯內切換
            const prevIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length;
            document.querySelector('.track-item.active')?.classList.remove('active');
            document.querySelector(`.track-item:nth-child(${prevIndex + 1})`)?.classList.add('active');
            setCurrentTrackIndex(prevIndex);
            const prevTrack = trackList[prevIndex];
            const trackId = `${prevTrack.from_music_id}-${prevTrack.id}`;
            await playMusic(trackId, prevTrack);
        } else {
            // 隨機音樂切換
            let tracks = randomTracksRef.current;
            if (tracks.length === 0) {
                tracks = await loadRandomTracks();
            }
            if (tracks && tracks.length > 0) {
                let prevIndex;
                if (currentRandomIndexRef.current === -1) { // 如果是第一次從單曲切換到隨機播放
                    prevIndex = tracks.length - 1; // 播放隨機列表的最後一首歌
                } else {
                    prevIndex = (currentRandomIndexRef.current - 1 + tracks.length) % tracks.length;
                }
                document.querySelector('.track-item.active')?.classList.remove('active');
                document.querySelector(`.track-item:nth-child(${prevIndex + 1})`)?.classList.add('active');
                currentRandomIndexRef.current = prevIndex;
                setCurrentRandomIndex(prevIndex);
                const prevTrack = tracks[prevIndex];
                if (prevTrack && prevTrack.id) {
                    const trackId = prevTrack.from_music_id ? `${prevTrack.from_music_id}-${prevTrack.id}` : prevTrack.id;
                    await playMusic(trackId, prevTrack);
                }
            }
        }
    };

    useEffect(() => {
        if (!Musicid) {
            console.log('還沒有musicid');
            return;
        }

        // 當 Musicid 變化時，尋找其在 trackList 中的索引並更新 currentTrackIndex
        if (trackList && trackList.length > 0) {
            const foundIndex = trackList.findIndex(track => {
                const trackIdentifier = track.from_music_id ? `${track.from_music_id}-${track.id}` : track.id;
                return trackIdentifier === Musicid;
            });
            if (foundIndex !== -1) {
                console.log('foundIndex: ', foundIndex);
                // 使用函数式更新
                setCurrentTrackIndex(() => {
                    console.log('Setting initial currentTrackIndex to:', foundIndex);
                    return foundIndex;
                });
            }
        }

        playMusic(Musicid, musicData);

        // 添加音频结束事件监听
        const handleEnded = () => {
            // console.log('After randomTracks: ', randomTracksRef.current);
            // console.log('Current random index before next:', currentRandomIndexRef.current);
            handleNext({ stopPropagation: () => {} });
        };
        audioRef.current.addEventListener('ended', handleEnded);

        return () => {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current.removeEventListener('ended', handleEnded);
            if (requestTimeoutRef.current) {
                clearTimeout(requestTimeoutRef.current);
            }
            document.body.style.overflow = 'auto';
        };
    }, [Musicid]);

    // 添加监听 currentTrackIndex 变化的 useEffect
    useEffect(() => {
        console.log('currentTrackIndex changed to:', currentTrackIndex);
    }, [currentTrackIndex]);

    useEffect(() => {
        const interval = setInterval(() => {
            const audio = audioRef.current;
            if (audio && audio.duration && !isDraggingProgress) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [isDraggingProgress]);

    useEffect(() => {
        if (!track || track.name.length <= 27) return;
        let animationFrame;
        let startTimeout;
        let endTimeout;
        let offset = 0;
        let step = 1; // px per frame
        let delayStart = 1000; // 1秒後開始
        let delayEnd = 2000;   // 結尾停2秒

        const scroll = () => {
            if (!marqueeRef.current) return;
            const containerWidth = marqueeRef.current.parentElement.offsetWidth;
            const textWidth = marqueeRef.current.scrollWidth;
            if (offset > textWidth - containerWidth) {
                // 到尾巴，停2秒再重來
                endTimeout = setTimeout(() => {
                    offset = 0;
                    setMarqueeOffset(0);
                    setMarqueeReset(true);
                    startTimeout = setTimeout(() => {
                        setMarqueeReset(false);
                        animationFrame = requestAnimationFrame(scroll);
                    }, delayStart);
                }, delayEnd);
                return;
            }
            offset += step;
            setMarqueeOffset(-offset);
            animationFrame = requestAnimationFrame(scroll);
        };

        setMarqueeOffset(0);
        setMarqueeReset(false);

        startTimeout = setTimeout(() => {
            animationFrame = requestAnimationFrame(scroll);
        }, delayStart);

        return () => {
            cancelAnimationFrame(animationFrame);
            clearTimeout(startTimeout);
            clearTimeout(endTimeout);
        };
    }, [track && track.name, fullscreen]);

    useEffect(() => {
        if (fullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [fullscreen]);

    useEffect(() => {
        if (isClosed) {
            setFullscreen(false);
            document.body.style.overflow = 'auto';
        }
    }, [isClosed]);

    const togglePlay = (e) => {
        e.stopPropagation();
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(err => setError('播放失敗。'));
        }
        setIsPlaying(!isPlaying);
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
        setFullscreen(false);
        document.body.style.overflow = 'auto';
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

        // 處理歌名顯示方式
        let nameNode;
        if (track.name.length > 20) {
            nameNode = (
                <div
                    className={`name marquee${fullscreen ? ' fullscreen' : ' minimized'}`}
                    style={{ position: 'relative', overflow: 'hidden' }}
                >
                    <span
                        ref={marqueeRef}
                        style={{
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            transform: `translateX(${marqueeOffset}px)`,
                            transition: marqueeReset ? 'none' : 'transform 0.03s linear'
                        }}
                    >
                        {track.name}
                    </span>
                </div>
            );
        } else {
            nameNode = <div className="name">{track.name}</div>;
        }

        return (
            <div
                className={`player-${fullscreen ? 'fullscreen' : 'minimized'} active`}
                style={fullscreen ? { background: `linear-gradient(180deg, ${backgroundColor}, #0a0a0a)` } : {}}
                onClick={handleContainerClick}
                ref={containerRef}
                onMouseMove={handleMouseMoveProgress}
                onMouseUp={handleMouseUp}
            >
                {/* 將圖片獨立出來，使其在全螢幕模式下可以獨立置中 */}
                {fullscreen && (
                    <div className="track-info">
                        <img className="img" src={track.cover_url} alt="專輯封面" />
                        <div className="track-info-text">
                            {nameNode}
                            <div className="artist">{track.artist}</div>
                        </div>
                    </div>
                )}
                {/* 在最小化模式下保持原來的 .track-info 結構 */}
                {!fullscreen && (
                    <>
                        <div className="track-info">
                            <img className="img" src={track.cover_url} alt="專輯封面" />
                            <div className="track-info-text">
                                {nameNode}
                                <div className="artist">{track.artist}</div>
                            </div>
                        </div>

                        <div className="controls">
                            <div className="control-button" onClick={handlePrevious}><TbPlayerSkipBackFilled /></div>
                            <div className="control-button play-pause-button" onClick={togglePlay}>
                                {isPlaying ? (
                                    <TbPlayerPauseFilled />
                                ) : (
                                    // <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    //     <polygon points="6,4 20,12 6,20" fill="#fff" />
                                    // </svg>
                                    <TbPlayerPlayFilled />
                                )}
                            </div>
                            <div className="control-button" onClick={handleNext}><TbPlayerSkipForwardFilled /></div>
                        </div>

                        <div className="progress-container">
                            <span className="progress-time" style={{marginRight: 8}}>{formatTime(audioRef.current.currentTime || 0)}</span>
                            <div className="progress-bar" ref={progressBarRef} onMouseDown={handleMouseDownProgress} style={{ '--progress': `${progress}%` }}></div>
                            <span className="progress-time" style={{marginLeft: 8}}>{formatTime(audioRef.current.duration || 0)}</span>
                        </div>
                    </>
                )}

                {!fullscreen && (
                    <div className="right-controls">
                        <div className="volume-control" onMouseMove={handleMouseMoveVolume} onMouseDown={handleMouseDownVolume}>
                            <span className="volume-label">音量</span>
                            <div className="volume-bar" ref={volumeBarRef} style={{ '--volume': `${volume * 100}%` }}></div>
                        </div>
                        <div className="control-button close-btn" onClick={handleClose}><RiCloseFill /></div>
                    </div>
                )}

                {fullscreen && (
                    <>
                        <div className="progress-container">
                            <span className="progress-time" style={{marginRight: 8}}>{formatTime(audioRef.current.currentTime || 0)}</span>
                            <div className="progress-bar" ref={progressBarRef} onMouseDown={handleMouseDownProgress} style={{ '--progress': `${progress}%` }}></div>
                            <span className="progress-time" style={{marginLeft: 8}}>{formatTime(audioRef.current.duration || 0)}</span>
                        </div>
                        <div className="controls fullscreen-controls">
                            <div className="control-button" onClick={handlePrevious}><TbPlayerSkipBackFilled /></div>
                            <div className="control-button play-pause-button" onClick={togglePlay}>
                                {isPlaying ? (
                                    <TbPlayerPauseFilled />
                                ) : (
                                    // <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    //     <polygon points="6,4 20,12 6,20" fill="#fff" />
                                    // </svg>
                                    <TbPlayerPlayFilled />
                                )}
                            </div>
                            <div className="control-button" onClick={handleNext}><TbPlayerSkipForwardFilled /></div>
                        </div>
                        <div className="fullscreen-controls-bottom">
                            <div className="volume-control" onMouseMove={handleMouseMoveVolume} onMouseDown={handleMouseDownVolume}>
                                <span className="volume-label">音量</span>
                                <div className="volume-bar" ref={volumeBarRef} style={{ '--volume': `${volume * 100}%` }}></div>
                            </div>
                            <div className="control-button close-btn" onClick={handleClose}><RiCloseFill /></div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return { render, randomTracks, loadRandomTracks, setCurrentRandomIndex, setIsClosed };
};

export default useMusicPlayer;