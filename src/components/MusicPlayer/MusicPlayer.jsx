import React, { useEffect, useRef } from 'react';
import useMusicPlayer from './music_implement.jsx';
import { useLocation } from 'react-router-dom';
import './index.css';

const MusicPlayer = () => {
    // const audioRef = useRef(new Audio());
    // new add
    const location = useLocation();
    
    const musicData = location.state || {};
    console.log('musicData:', musicData);
    let Musicid = '';
    if (musicData.type !== "music") { // 處理series
        Musicid = String(musicData.from_music_id) + '-' + String(musicData.id);
    }
    else {
        Musicid = String(musicData.id)
    }
    console.log('musicID:', Musicid);

    

    
    //
    // const { render } = useMusicPlayer(audioRef);
    const { render } = useMusicPlayer(Musicid);

    return (
        <div className="container">
            {render()}
            <p>hello</p>
        </div>
    );
};

export default MusicPlayer;