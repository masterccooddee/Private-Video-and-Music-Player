import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleDarkMode = () => setIsDarkMode(prev => !prev)
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev)

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <div className="container">
        <Sidebar
          isDarkMode={isDarkMode}
          isCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onToggleDarkMode={toggleDarkMode}
        />
        <main className="main-content">
          <Topbar />
          <div className="content">
            <p>主內容區</p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
