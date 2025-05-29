import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { TabView, TabPanel } from 'primereact/tabview';
import VideoJS from './VideoJS';

const VideoPlayer = () => {
    const location = useLocation();
    const videoData = location.state || {};
    const [currentEpId, setCurrentEpId] = useState(
      videoData.episodes && videoData.episodes[0] ? videoData.episodes[0].id : null
   ); // 預設使用第一集的ID
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

  const handleChangeVideo = (newSrc, epId) => {
    setIsLoading(true);
    setCurrentEpId(epId); // 設定目前播放的集數
    fetch(`/video/video:${newSrc}`)
    .then(res => res.json())
    .then(data => {
        setOptions(() => ({
            ...videooptions,
            sources: [
                {
                    src: data.video_url,
                    type: 'application/dash+xml',
                },
            ],
            poster: data.poster_url,
            sub: data.subtitle_url
        }));
        setIsLoading(false);
    })
    .catch(err => {
        console.error('切換影片失敗:', err);
    });
};

  const episodesBySeason = {};
    if (Array.isArray(videoData.episodes)) {
        videoData.episodes.forEach(ep => {
            if(ep.season === undefined || ep.season === 'NONE') ep.season = 'S1'; // 如果沒有季數，預設為第1季
            const season = ep.season;
            if (!episodesBySeason[season]) episodesBySeason[season] = [];
            episodesBySeason[season].push(ep);
        });
    }

    return (
      <div style={{ padding: '24px', textAlign:'left' }}>
          <h2>{videoData?.name || '影片播放器'}</h2>
          {isLoading ? (
              <p>Loading...</p>
          ) : (
              <VideoJS options={options}/>
          )}

          <TabView>
              {Object.keys(episodesBySeason).sort().map(season => (
                  <TabPanel header={season} key={season}>
                      <div style={{
                        textAlign: 'left',
                        marginTop: 24,
                        marginBottom: 24,
                        gap: '12px',
                        display: 'flex',
                        flexWrap: 'wrap'
                      }}>
                          {episodesBySeason[season].map((ep, idx) => (
                              <button
                                key={ep.id}
                                onClick={() =>
                                  handleChangeVideo(String(videoData.id) + '-' + String(ep.id), ep.id)
                                }
                                style={{
                                  margin: '0 12px',
                                  width: '80px',
                                  height: '40px',
                                  display: 'inline-block',
                                  fontSize: '16px',
                                  background: currentEpId === ep.id ? '#1976d2' : '',
                                  color: currentEpId === ep.id ? '#fff' : '',
                                  border: currentEpId === ep.id ? '2px solid #1976d2' : ''
                                }}
                              >
                                {ep.name || String(idx + 1)}
                              </button>
                          ))}
                      </div>
                  </TabPanel>
              ))}
          </TabView>
      </div>
  );
};

export default VideoPlayer;
