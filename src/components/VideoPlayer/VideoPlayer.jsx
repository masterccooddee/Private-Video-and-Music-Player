import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import VideoJS from './VideoJS';

const VideoPlayer = () => {
    const location = useLocation();
    const videoData = location.state || {};
    console.log('videoData:', videoData);
    let videoID = '';
    if (videoData.episodes !== undefined) {
        videoID = String(videoData.id) + '-' + String(videoData.episodes[0].id); // 如果有集數，則使用集數ID
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
          sub: data.subtitle_url
        }));
        console.log('載入完成:', data);
        setIsLoading(false);
        
      })
      .catch(err => {
        console.error('失敗:', err);
        
      });
  }, [videoID]);

  const handleChangeVideo = (newSrc) => {
    setIsLoading(true); // 切換影片時先顯示載入狀態
    console.log('切換影片到:', newSrc);
    fetch(`/video/video:${newSrc}`)
      .then(res => res.json())
      .then(data => {
        setOptions(() => ({
        ...videooptions,
        sources: [
          {
            src: data.video_url, // 更新為新的影片URL
            type: 'application/dash+xml',
          },
        ],
        poster: data.poster_url, // 更新為新的海報URL
        sub: data.subtitle_url // 更新為新的字幕URL
      }));
        console.log('切換影片:', data);
        setIsLoading(false); // 切換影片時先顯示載入狀態
      })
      .catch(err => {
        console.error('切換影片失敗:', err);
      });
    
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2>{videoData?.name || '影片播放器'}</h2>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <VideoJS options={options}/>
      )}

      <div style={{ marginTop: '100px', textAlign: 'center' }}>
        {Array.isArray(videoData.episodes) && videoData.episodes.map((ep, idx) => (
          <button
            key={ep.id}
            onClick={() =>
              handleChangeVideo(String(videoData.id) + '-' + String(ep.id))
            }
            style={{ margin: '0 8px' }}
          >
            影片 {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VideoPlayer;
