import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'

const navItems = [
  { icon: 'home.svg', text: '首頁', to: '/' },
  { icon: 'rank.svg', text: '排行榜', to: '/rank' },
  { icon: 'tag.svg', text: '標籤', to: '/tag' },
  { icon: 'thumb_up.svg', text: '我的收藏', to: '/favorites' },
  { icon: 'upload.svg', text: '上傳資源', to: '/upload' },
  { icon: 'user.svg', text: '個人中心', to: '/profile' },
  { icon: 'login.svg', text: '登入 / 註冊', to: '/login' }
]

function Sidebar({ isDarkMode, isCollapsed, onToggleSidebar, onToggleDarkMode }) {
  const location = useLocation()

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : styles.expanded} ${isDarkMode ? styles.darkMode : ''}`}>
      <div className={styles.sidebarHeader}>
        <button id="toggle-btn" className={styles.toggleBtn} onClick={onToggleSidebar}>
          <img src="/icons/menu.svg" className={styles.icon} />
        </button>
        <span className={styles.logoText}>影音資料庫</span>
      </div>
      <ul className={styles.navList}>
        {navItems.map((item, i) => (
          <Link
            to={item.to}
            className={`${styles.sidebarLink} ${location.pathname === item.to ? styles.active : ''}`}
            key={i}
          >
            <img src={`/icons/${item.icon}`} className={styles.icon} />
            <span>{item.text}</span>
          </Link>
        ))}
        <li className={styles.sidebarLink} onClick={onToggleDarkMode}>
          <img
            src={isDarkMode ? '/icons/sun.svg' : '/icons/moon.svg'}
            className={styles.icon}
          />
          <span>{isDarkMode ? '日間模式' : '夜間模式'}</span>
        </li>
      </ul>
    </aside>
  )
}

export default Sidebar
