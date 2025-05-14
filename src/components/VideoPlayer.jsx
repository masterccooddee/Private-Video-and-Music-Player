import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { MediaPlayer } from 'dashjs';

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const dashPlayerRef = useRef(null);

  const [src, setSrc] = useState('https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd');
  const [poster, setPoster] = useState('https://via.placeholder.com/640x360');
  const [subtitles, setSubtitles] = useState('./example.vtt'); // 字幕文件的 URL

  useEffect(() => {
    const videoElement = videoRef.current;

    // 初始化播放器
    if (videoElement) {
      setTimeout(() => {
        // 初始化 video.js 播放器
        const player = videojs(videoElement, {
          controls: true,
          autoplay: false,
          preload: 'auto',
          poster,
        });

        // 添加字幕 track
        videoElement.innerHTML += `
          <track kind="subtitles" src="${subtitles}" srclang="en" label="English" default>
        `;

        // 初始化 dash.js 播放器
        const dashPlayer = MediaPlayer().create();
        dashPlayer.initialize(videoElement, src, false);
        dashPlayerRef.current = dashPlayer;

        return () => {
          player.dispose();
          dashPlayer.reset();
        };
      }, 100);
    }
  }, [src, poster, subtitles]);  // 監聽字幕、視頻源或海報的變化

  // 切換視頻源
  const handleChangeVideo = (newSrc, newSubtitles) => {
    setSrc(newSrc);
    setSubtitles(newSubtitles);  // 設定新的字幕文件
  };

  return (
    <div>
      <video
        ref={videoRef}
        className="video-js vjs-default-skin"
        controls
        style={{ width: '200%', height: 'auto', maxWidth: '640px' }}
      >
        {/* 字幕軌道 */}
        <track kind="subtitles" src={subtitles} srclang="en" label="English" default />
      </video>

      {/* 切換視頻按鈕 */}
      <div style={{ marginTop: '400px', textAlign: 'center' }}>
        <button onClick={() => handleChangeVideo('https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd', 'example.vtt')}>
          影片 1
        </button>
        <button onClick={() => handleChangeVideo('https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd', 'example.vtt')}>
          影片 2
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
