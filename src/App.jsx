import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import HomePage from './pages/HomePage';
import RankPage from './pages/RankPage';
import TagPage from './pages/TagPage';
import FavoritesPage from './pages/FavoritesPage';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import VideoPlayer from './components/VideoPlayer';

import { useState, useEffect } from 'react';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="container">
      <Sidebar
        isDarkMode={isDarkMode}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(p => !p)}
        onToggleDarkMode={() => setIsDarkMode(p => !p)}
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
          <Route path="/video/:id" element={<VideoPlayer />} />
        </Routes>
      </main>
    </div>
  );
}
