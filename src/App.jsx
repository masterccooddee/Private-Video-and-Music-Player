import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import { Toast } from 'primereact/toast';
import 'primereact/resources/themes/lara-light-blue/theme.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const RankPage = lazy(() => import('./pages/RankPage'));
const TagPage = lazy(() => import('./pages/TagPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const VideoPlayer = lazy(() => import('./components/VideoPlayer/VideoPlayer'));
const VideoStatus = lazy(() => import('./components/VideoStatus/videostatus'));
const MusicPlayer = lazy(() => import('./components/MusicPlayer/MusicPlayer'));


export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const successtoast = useRef(null);
  const infotoast = useRef(null);
  const ws = useRef(null);
  const [videoStatus, setVideoStatus] = useState([]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    ws.current = new WebSocket(`ws://${window.location.hostname}:8080`);
    ws.current.onopen = () => console.log('WebSocket connection established');
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const completedItems = data.filter((item) => item.percent === 100 && item.finished);
      completedItems.forEach((item) => {
        successtoast.current.show({
          severity: 'success',
          summary: '轉換完成',
          detail: `${item.name} 已完成轉換`,
          life: 30000,
        });
      });
      const filteredData = data.filter(item => !(item.finished));
      setVideoStatus(filteredData);
    };
    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
      infotoast.current.show({
        severity: 'error',
        summary: 'WebSocket 連線已關閉',
        detail: '請檢查伺服器是否運行',
        sticky: true,
      });
    };
    ws.current.onerror = (error) => console.error('WebSocket error:', error);

    return () => {
      ws.current.close();
      console.log('WebSocket connection closed on component unmount');
    };
  }, []);

  return (
    <div
      className="container"
      style={{
        backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
        color: isDarkMode ? '#fff' : '#000',
        minHeight: '100vh',
      }}
    >
      <Toast ref={successtoast} position="top-right" />
      <Toast ref={infotoast} position="top-center" />

      <Sidebar
        isDarkMode={isDarkMode}
        isCollapsed={isSidebarCollapsed}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => {
          if (window.innerWidth <= 768) {
            setIsSidebarOpen(prev => !prev);
          } else {
            setIsSidebarCollapsed(prev => !prev);
          }
        }}
        onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
        onCloseSidebar={() => setIsSidebarOpen(false)}
      />

      <main
        className="main-content"
        style={{
          marginLeft: isSidebarCollapsed ? 100 : 200,
          marginRight:100,
          padding: '1% 12%',
          minHeight: '100vh',
          backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
          color: isDarkMode ? '#fff' : '#000',
          transition: 'margin-left 0.3s ease, margin-right 0.3s ease',
        }}
      >
        <Topbar isDarkMode={isDarkMode} />
        <Suspense
          fallback={
            <div
              style={{
                minHeight: '100vh',
                backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
              }}
            />
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/convert" element={<VideoStatus videoStatus={videoStatus} />} />
            <Route path="/tag" element={<TagPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/video" element={<VideoPlayer />} />
            <Route path="/music" element={<MusicPlayer />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
