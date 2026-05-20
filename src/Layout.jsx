import { getCurrentUser, logout } from '@/api/auth';
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Mail, 
  Calendar, 
  BarChart3, 
  Megaphone,
  LogOut
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    // TODO: Fetch current user from your auth API for nav role-based tabs
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const tabs = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(user?.role === 'manager' || user?.role === 'admin' ? [{ id: 'ManagerDashboard', label: 'Manager', icon: Users }] : []),
    { id: 'Campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'Leads', label: 'Leads', icon: Users },
    { id: 'Clients', label: 'Clients', icon: Building2 },
    { id: 'Webmail', label: 'Webmail', icon: Mail },
    { id: 'Calendar', label: 'Calendar', icon: Calendar },
    { id: 'Statistics', label: 'Statistics', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-[#212121]">
      <style>{`
        @import url('https://fonts.cdnfonts.com/css/akkurat');
        
        :root {
          --primary-green: #00c600;
          --dark-bg: #212121;
          --dark-secondary: #2a2a2a;
          --dark-tertiary: #333333;
        }
        
        * {
          font-family: 'Akkurat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        body {
          background: #212121;
        }
        
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: #2a2a2a;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #00c600;
          border-radius: 3px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #00dd00;
        }
      `}</style>

      {/* Header */}
      <header className="bg-[#2a2a2a] border-b border-[#333333] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00c600] rounded-lg flex items-center justify-center">
                <span className="text-[#212121] font-bold text-xl">KG</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">KG Marketing</h1>
                <p className="text-gray-400 text-xs">Campaign-in-a-Box</p>
              </div>
            </div>
            <button
              onClick={() => {
                // TODO: Wire logout to your auth provider
                logout();
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-[#00c600] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="max-w-[1600px] mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-custom">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentPageName === tab.id;
              return (
                <a
                  key={tab.id}
                  href={`/${tab.id}`}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-[#00c600] text-[#00c600]'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </a>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}