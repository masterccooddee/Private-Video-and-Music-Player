import React from 'react'

const navItems = [
  { icon: 'home.svg', text: '首頁' },
  { icon: 'rank.svg', text: '排行榜' },
  { icon: 'tag.svg', text: '標籤' },
  { icon: 'thumb_up.svg', text: '我的收藏' },
  { icon: 'upload.svg', text: '上傳資源' },
  { icon: 'user.svg', text: '個人中心' },
  { icon: 'login.svg', text: '登入 / 註冊' }
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
          <li key={i}>
            <img src={`/icons/${item.icon}`} className="icon" />
            <span>{item.text}</span>
          </li>
        ))}
        <li id="dark-mode-toggle" onClick={onToggleDarkMode}>
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
