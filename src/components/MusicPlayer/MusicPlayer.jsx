import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import useMusicPlayer from './music_implement.jsx';
import './index.css';

const MusicPlayer = () => {
    const location = useLocation();
    const [musicData, setMusicData] = React.useState(location.state || {});
    const [Musicid, setMusicid] = React.useState('');
    const [currentTrack, setCurrentTrack] = useState(null);

    useEffect(() => {
        const musicData = location.state || {};
        console.log('musicData:', musicData);

        // 如果是专辑，只设置基本信息，不设置 Musicid
        if (musicData.type === undefined && musicData.episodes) {
            setMusicData(musicData);
            setMusicid('');
            setCurrentTrack(null);
            return;
        }

        // 如果是普通音乐，设置 Musicid 和当前曲目
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
        }
        console.log('musicID:', Musicid);
        
    }, [location]);

    const handleTrackClick = (track) => {
        setCurrentTrack(track);
        const trackId = `${track.from_music_id}-${track.id}`;
        setMusicid(trackId);
    };
    
    const { render } = useMusicPlayer(Musicid, currentTrack || musicData, musicData.episodes);

    return (
        <div className="container">
            {musicData.episodes && (
                <div className="album-tracks">
                    <h2 className="album-title">{musicData.name}</h2>
                    <div className="track-list">
                        {musicData.episodes.map((track, index) => {
                            const trackInfo = track.info ? JSON.parse(track.info) : {};
                            return (
                                <div 
                                    key={track.id} 
                                    className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                                    onClick={() => handleTrackClick(track)}
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
