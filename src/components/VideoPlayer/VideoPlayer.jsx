import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import VideoJS from './VideoJS';

const VideoPlayer = () => {
    const location = useLocation();
    const videoData = location.state || {};
    console.log('videoData:', videoData);
    let videoID = '';
    if (videoData.from_video_id !== undefined) {
        videoID = String(videoData.from_video_id) + '-' + String(videoData.id);
    }
    else{
        videoID = String(videoData.id)
    }
    console.log('videoID:', videoID);
  let videooptions = {
    controls: true,
    autoplay: false,
    width: 1280,
    height: 720,
    preload: 'auto',
    sources: [
      {
        src: '', // 會在後面更新
        type: 'application/dash+xml',
      },
    ],
  };

    const [options, setOptions] = useState(videooptions);
    const [isLoading, setIsLoading] = useState(true);
    const havefetch = useRef(false);
  useEffect(() => {
      if (havefetch.current) return; // 確保只執行一次
      havefetch.current = true;
    fetch(`/video/video:${videoID}`)
    .then(res => res.json())
    .then(data => {
        setOptions(opt =>(
        {
          ...opt,
          sources: [
            {
              src: data.video_url,
              type: 'application/dash+xml',
            },
          ],
          poster: data.poster_url,
        }));
        console.log('載入完成:', data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('失敗:', err);
        
      });
  }, [videoID]);

  const handleChangeVideo = (newSrc) => {
    setOptions(() => ({
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
    <div style={{ padding: '24px' }}>
      <h2>{videoData?.name || '影片播放器'}</h2>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <VideoJS options={options} />
      )}

      <div style={{ marginTop: '100px', textAlign: 'center' }}>
        <button
          onClick={() =>
            handleChangeVideo('https://dash.akamaized.net/envivio/EnvivioDash3/manifest.mpd')
          }
        >
          影片 1
        </button>
        <button
          onClick={() =>
            handleChangeVideo('https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd')
          }
        >
          影片 2
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
