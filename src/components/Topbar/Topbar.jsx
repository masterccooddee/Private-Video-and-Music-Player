import React, { useState, useEffect, useRef } from 'react';
import styles from './Topbar.module.css';
import axios from 'axios';

function Topbar({ isDarkMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef(null);

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
      } catch (err) {
        console.error('搜尋失敗:', err);
        setSuggestions([]);
      }
    }, 300);
  }, [searchTerm]);

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
              <li
                key={item.id}
                onClick={() => {
                  setSearchTerm(item.name || item.title || '');
                  setShowSuggestions(false);
                  //後加上跳轉
                }}
              >
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
