// App.jsx
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar/Sidebar'
import Topbar from './components/Topbar/Topbar'
import HomePage from './pages/HomePage'
import RankPage from './pages/RankPage'
import TagPage from './pages/TagPage'
import FavoritesPage from './pages/FavoritesPage'
import UploadPage from './pages/UploadPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import { useState, useEffect } from 'react'

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    document.body.classList.remove('dark-mode', 'light-mode')
    document.body.classList.add(isDarkMode ? 'dark-mode' : 'light-mode')
  }, [isDarkMode])

  return (
    <div className="container">
      <Sidebar
        isDarkMode={isDarkMode}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
      />
      <main className="main-content">
        <Topbar isDarkMode={isDarkMode} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/tag" element={<TagPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  )
}
