import React, { use, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useMusicPlayer from './music_implement.jsx';
import './index.css';
import '../VideoStatus/videostatus.css';

const MusicPlayer = () => {
    const location = useLocation();
    const [musicData, setMusicData] = React.useState(location.state || {});
    const [Musicid, setMusicid] = React.useState('');
    const [currentTrack, setCurrentTrack] = useState(null);
    const [showRandomTracks, setShowRandomTracks] = useState(false);

    useEffect(() => {
        const musicData = location.state || {};
        console.log('musicData:', musicData);

        // 如果是專輯，只設定基本訊息，不設 Musicid
        if (musicData.type === undefined && musicData.episodes) {
            setMusicData(musicData);
            setMusicid('');
            setCurrentTrack(null);
            setShowRandomTracks(false);
            return;
        }

        // 如果是一般音樂，設置 Musicid 和當前歌曲，並顯示隨機音樂
        let Musicid = '';
        if (musicData.type !== "music") {
            Musicid = `${musicData.from_music_id}-${musicData.id}`;
        } else {
            Musicid = `${musicData.id}`;
        }
        setMusicData(musicData);
        setMusicid(Musicid);
        if (musicData.type === "music") {
            setCurrentTrack(musicData);
            setShowRandomTracks(true);
        }
        console.log('musicID:', Musicid);
        
        
    }, [location]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleTrackClick = (track, index) => {
        document.querySelector('.track-item.active')?.classList.remove('active');
        setCurrentTrack(track);
        const trackId = track.from_music_id ? `${track.from_music_id}-${track.id}` : track.id;
        setMusicid(trackId);
        if (index !== undefined) {
            setCurrentRandomIndex(index);
        }
    };
    
    const { render, randomTracks, loadRandomTracks, setCurrentRandomIndex } = useMusicPlayer(Musicid, currentTrack || musicData, musicData.episodes);

    useEffect(() => {
        if (showRandomTracks && randomTracks.length === 0) {
            loadRandomTracks();
        }
    }, [showRandomTracks, randomTracks.length, loadRandomTracks]);

    return (
        <div className="container">
            {musicData.episodes && (
                <div className="album-tracks">
                    {/* <h2 className="notConverting">{musicData.name}</h2> */}
                    <h2 className="album-title">{musicData.name}</h2>
                    <div className="track-list">
                        {musicData.episodes.map((track, index) => {
                            const trackInfo = track.info ? JSON.parse(track.info) : {};
                            return (
                                <div 
                                    key={track.id} 
                                    className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                                    onClick={() => handleTrackClick(track, index)}
                                >
                                    <div className="track-number">{index + 1}</div>
                                    <div className="track-info">
                                        <div className="track-name">{track.name || trackInfo.title}</div>
                                        <div className="track-artist">{trackInfo.artist || '未知歌手'}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {showRandomTracks && randomTracks.length > 0 && (
                <div className="album-tracks">
                    <h2 className="album-title">Music Recommendations</h2>
                    <div className="track-list">
                        {randomTracks.map((track, index) => {
                            const trackInfo = track.info ? JSON.parse(track.info) : {};
                            return (
                                <div 
                                    key={track.id} 
                                    // className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                                    className={`track-item ${currentTrack && currentTrack.id === track.id && currentTrack.from_music_id === track.from_music_id ? 'active' : ''}`}
                                    onClick={() => handleTrackClick(track, index)}
                                >
                                    <div className="track-number">{index + 1}</div>
                                    <div className="track-info">
                                        <div className="track-name">{track.name || trackInfo.title}</div>
                                        <div className="track-artist">{trackInfo.artist || '未知歌手'}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {(currentTrack || (musicData.type === "music" && Musicid)) && render()}
        </div>
    );
};

export default MusicPlayer;
