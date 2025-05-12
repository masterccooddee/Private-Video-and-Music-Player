// Topbar.jsx
import React from 'react'
import styles from './Topbar.module.css'

function Topbar({ isDarkMode }) {
  return (
    <div className={`${styles.topbar} ${isDarkMode ? styles.darkMode : ''}`}>
      <h1 className={styles.title}>歡迎來到影音資料庫</h1>
      <input type="text" className={styles.searchInput} placeholder="搜尋影片..." />
    </div>
  )
}

export default Topbar
