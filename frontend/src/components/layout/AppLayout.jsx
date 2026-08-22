import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 900 : true;
  });

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <div className="app-main">
        <Header 
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(prev => !prev)} 
        />
        
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

