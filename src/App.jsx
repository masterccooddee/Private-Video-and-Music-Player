import React, { useState, useEffect, useRef } from 'react';
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
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import VideoStatus from './components/VideoStatus/videostatus';
import MusicPlayer from './components/MusicPlayer/MusicPlayer';
import { Toast } from "primereact/toast";
import 'primereact/resources/themes/lara-light-blue/theme.css';

export default function App() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const successtoast = React.useRef(null);
    const infotoast = React.useRef(null);
    const ws = React.useRef(null);
    const [videoStatus, setVideoStatus] = useState([]);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
        document.body.classList.toggle('light-mode', !isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        ws.current = new WebSocket(`ws://${window.location.hostname}:8080`);

        ws.current.onopen = () => {
            console.log('WebSocket connection established');
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const completedItems = data.filter((item) => item.percent === 100);
            completedItems.forEach((item) => {
                successtoast.current.show({
                    severity: "success",
                    summary: "轉換完成",
                    detail: `${item.name} 已完成轉換`,
                    life: 30000,
                });
            });

            const filteredData = data.filter(item => item.percent < 100);
            setVideoStatus(filteredData);
        };

        ws.current.onclose = () => {
            console.log('WebSocket connection closed');
            infotoast.current.show({
                severity: "error",
                summary: "WebSocket 連線已關閉",
                detail: "請檢查伺服器是否運行",
                sticky: true,
            });
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            ws.current.close();
            console.log('WebSocket connection closed on component unmount');
        };
    }, []);

    return (
        <div className="container">
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
                    marginLeft: isSidebarCollapsed ? 55 : 200,
                    transition: 'margin-left 0.3s',
                    padding: '1rem',
                }}
            >
                <Topbar isDarkMode={isDarkMode} />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/rank" element={<VideoStatus videoStatus={videoStatus} />} />
                    <Route path="/tag" element={<TagPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/video" element={<VideoPlayer />} />
                    <Route path="/music" element={<MusicPlayer />} />
                </Routes>
            </main>
        </div>
    );
}