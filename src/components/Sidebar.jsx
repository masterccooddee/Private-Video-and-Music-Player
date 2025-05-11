import React from 'react'
import { Link } from 'react-router-dom'

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
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="sidebar-header">
        <button id="toggle-btn" onClick={onToggleSidebar}>
          <img src="/icons/menu.svg" className="icon" />
        </button>
        <span className="logo-text">影音資料庫</span>
      </div>
      <ul>
        {navItems.map((item, i) => (
          <Link to={item.to} className="sidebar-link" key={i}>
          <li>
            <img src={`/icons/${item.icon}`} className="icon" />
            <span>{item.text}</span>
          </li>
        </Link>        
        ))}
        <li id="dark-mode-toggle" className="sidebar-link" onClick={onToggleDarkMode}>
          <img
            src={isDarkMode ? '/icons/sun.svg' : '/icons/moon.svg'}
            className="icon"
          />
          <span>{isDarkMode ? '日間模式' : '夜間模式'}</span>
        </li>
      </ul>
    </aside>
  )
}

export default Sidebar
