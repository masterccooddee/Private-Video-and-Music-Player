import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useMusicPlayer from './music_implement.jsx';
import './index.css';

const MusicPlayer = () => {
    const location = useLocation();
    const [musicData, setMusicData] = React.useState(location.state || {});
    const [Musicid, setMusicid] = React.useState('');

    useEffect(() => {
        const musicData = location.state || {};
        console.log('musicData:', musicData);

        let Musicid = '';
        if (musicData.type !== "music") {
            Musicid = `${musicData.from_music_id}-${musicData.id}`;
        } else {
            Musicid = `${musicData.id}`;
        }
        setMusicData(musicData);
        setMusicid(Musicid);
        console.log('musicID:', Musicid);
        
    }, [location]);
    
    const { render } = useMusicPlayer(Musicid, musicData);
    return (
        <div className="container">
            {render()}
        </div>
    );
};

export default MusicPlayer;
