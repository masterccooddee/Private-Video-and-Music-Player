import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VideoJS from './VideoJS';

const VideoPlayer = () => {
  const { state: videoData } = useLocation(); // 拿到首頁傳來的 item（應包含 id）
  const navigate = useNavigate();

  const defaultOptions = {
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

  const [options, setOptions] = useState(defaultOptions);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoData?.id) {
      console.warn('沒有影片 ID，返回首頁');
      navigate('/');
      return;
    }

    fetch(`/video/video:${videoData.id}`)
      .then(res => res.json())
      .then(data => {
        setOptions(opt => ({
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
        navigate('/');
      });
  }, [videoData]);

  const handleChangeVideo = (newSrc) => {
    setOptions(() => ({
      ...defaultOptions,
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
