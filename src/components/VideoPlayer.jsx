import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';


const VideoPlayer = () => {
  const videoRef = useRef(null);
  const dashPlayerRef = useRef(null);

  const [loading, setLoading] = useState(true)
  const [src, setSrc] = useState(null);
  const [poster, setPoster] = useState(null);
  const [subtitles, setSubtitles] = useState(null); // 字幕文件的 URL

  useEffect(() => {
    const videoElement = videoRef.current;

    // 初始化播放器
    if (videoElement) {
      setTimeout(() => {
        // 初始化 video.js 播放器
        const player = videojs(videoElement, {
          controls: true,
          autoplay: false,
        });
        fetch('http://localhost:3000/video/video:1')
        .then(res => {return res.json()})
        .then(data => {
          setSrc(data.video_url);
          setPoster(data.poster_url);
          setSubtitles(data.subtitles_url); // 設定字幕文件的 URL
          setLoading(false);
        });
        /* // 添加字幕 track
        videoElement.innerHTML += `
          <track kind="subtitles" src="${subtitles}" srclang="en" label="English" default>
        `; */
        // 初始化 dash.js 播放器
        return () => {
          player.dispose();
        };
      }, 10);
    }
  }, [src, poster, subtitles]);  // 監聽字幕、視頻源或海報的變化

  // 切換視頻源
  const handleChangeVideo = (newSrc, newSubtitles) => {
    setSrc(newSrc);
    setSubtitles(newSubtitles);  // 設定新的字幕文件
  };

  return (
    <div>
      {loading && <div>載入中...</div>}
      <video ref ={videoRef}  id="my-video"  className="video-js vjs-default-skin" controls  width="1280" height="720"></video>

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
