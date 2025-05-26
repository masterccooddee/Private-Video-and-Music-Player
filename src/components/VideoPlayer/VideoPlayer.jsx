import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import VideoJS from './VideoJS';


const VideoPlayer = () => {
    const location = useLocation();
    const videoData = location.state || {};
    let videoID = '';
    if (videoData.from_video_id === undefined) {
        videoID = String(videoData.from_video_id) + '-' + String(videoData.id);
        
    }
    else{
        videoID = String(videoData.id)
    }
    console.log('videoID:', videoID);
  let videooptions = {
    controls: true,
    autoplay: false,
    width:1280,
    height:720,
    preload: 'auto',
    sources: [
      {
            src: '', // 這裡的 src 將在後面動態設置
            type: 'application/dash+xml',
      },
    ],
  };
  const [option, setOpt] = useState(videooptions);
  const [isLoading, setIsLoading] = useState(true); // 用於追蹤是否正在加載
  let havefetch = false;
    
  useEffect(() => {
    if (havefetch) return; // 確保只執行一次
    havefetch = true;
    fetch(`/video/video:${videoID}`)
    .then(res => res.json())
    .then(data => {
      setOpt(opt =>(
        {
          ...opt,
          sources: [
            {
              src: data.video_url, // 設定視頻源
              type: 'application/dash+xml',
            },
          ],
              poster:  data.poster_url, // 設定海報圖
        }
      )); // 設定視頻源
      console.log(data);
      setIsLoading(false);
    })
  },[]);
  

  // 切換視頻源
  const handleChangeVideo = (newSrc) => {
    setOpt(() => ({
      ...videooptions,
      sources: [
        {
          src: newSrc,
          type: 'application/dash+xml',
        },
      ],
    }));
  };

    return (
        <div>
            {isLoading ? <p>Loading</p> : <VideoJS options={option} />}
            <div style={{ marginTop: '100px', textAlign: 'center' }}>
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
