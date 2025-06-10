import React, { useState, useEffect, useRef } from 'react';
import styles from './Topbar.module.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Topbar({ isDarkMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchTerm) {
      setSuggestions([]);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`/search?keyword=${encodeURIComponent(searchTerm)}`);
        setSuggestions(res.data || []);
        setShowSuggestions(true);
        console.log('搜尋結果:', res.data);
      } catch (err) {
        console.error('搜尋失敗:', err);
        setSuggestions([]);
      }
    }, 300);
  }, [searchTerm]);

  const handleClick = async (item) => {
    setSearchTerm(item.name || item.title || '');
    setShowSuggestions(false);
    // console.log('item:', item);
    // console.log('item type:', item.type);
    const saveRecent = (item) => {
        const existing = JSON.parse(localStorage.getItem('recentlyWatched') || '[]');
        const filtered = existing.filter(i => i.id !== item.id || i.type !== item.type);
        const updated = [item, ...filtered].slice(0, 10); // 最多紀錄10筆
        localStorage.setItem('recentlyWatched', JSON.stringify(updated));
    };
    saveRecent(item);    
    if (item.type === 'video') {
      navigate('/video', {
        state: {
          id: item.id,
          name: item.name,
        },
      });
    } else if (item.type === 'series') {   //可能有點問題，之後再說
      try {
        const res = await axios.get('/get_all');
        // console.log('Received data:', res.data);
        const raw = res.data;

        const seriesList = raw.videos.filter(v => v.type === 'series');
        const targetParent = seriesList.find(s => s.id === item.id);
        const episodes = raw.video_series.filter(ep => ep.from_video_id === item.id);
        
        // console.log('Sending to video player:', {
        //   id: item.id,
        //   name: item.name,
        //   poster: item.poster,
        //   file: item.firstEpisodeFile,
        //   episodes: item.episodes
        // });

        navigate('/video', {
          state: {
            id: targetParent.id,
            name: targetParent.name,
            poster: targetParent.poster,
            file: episodes[0]?.file ?? `${episodes[0]?.season}.mp4`,
            episodes: episodes
          }
        });
      } catch (err) {
        console.error('取得影片集資訊失敗:', err);
      }
    } else if (item.type === 'music') {
      navigate('/music', { state: item });
    }
  };

  return (
    <div className={`${styles.topbar} ${isDarkMode ? styles.darkMode : ''}`}>
      <h1 className={styles.title}>歡迎來到影音資料庫</h1>
      <div className={styles.searchContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜尋影片..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className={styles.suggestions}>
            {suggestions.map((item) => (
              <li key={item.id} onClick={() => handleClick(item)}>
                {item.name || item.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Topbar;
