import React from 'react';
import { useLocation } from 'react-router-dom';
import useMusicPlayer from './music_implement.jsx';
import './index.css';

const MusicPlayer = () => {
    const location = useLocation();
    const musicData = location.state || {};
    console.log('musicData:', musicData);

    let Musicid = '';
    if (musicData.type !== "music") {
        Musicid = `${musicData.from_music_id}-${musicData.id}`;
    } else {
        Musicid = `${musicData.id}`;
    }

    console.log('musicID:', Musicid);
    const { render } = useMusicPlayer(Musicid);

    return (
        <div className="container">
            {render()}
        </div>
    );
};

export default MusicPlayer;
