import React, { useRef } from 'react';
import useMusicPlayer from './music_implement.jsx';
import './index.css';

const MusicPlayer = () => {
  const audioRef = useRef(new Audio());
  const { render } = useMusicPlayer(audioRef);

  return (
    <div className="container">
      {render()}
    </div>
  );
};

export default MusicPlayer;