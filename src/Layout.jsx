import { useAuth } from '@/lib/AuthContext';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Megaphone,
  LogOut,
  Target,
} from 'lucide-react';

const tabs = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'leads', label: 'Leads', icon: Target },
  { path: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { path: 'clients', label: 'Clients', icon: Building2 },
];

export default function Layout({ children, currentPageName }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#212121]">
      <style>{`
        :root {
          --primary-green: #00c600;
          --dark-bg: #212121;
          --dark-secondary: #2a2a2a;
          --dark-tertiary: #333333;
        }
        
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
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

      <header className="bg-[#2a2a2a] border-b border-[#333333] sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <NavLink to="/dashboard" className="flex items-center gap-3 hover:opacity-90">
              <img
                src="/kg-logo.png"
                alt="KG"
                className="w-10 h-10 rounded-lg object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-10 h-10 bg-[#00c600] rounded-lg flex items-center justify-center">
                <span className="text-[#212121] font-bold text-xl">KG</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">KG Marketing</h1>
                <p className="text-gray-400 text-xs">Internal workspace</p>
              </div>
            </NavLink>
            <button
              type="button"
              onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-[#00c600] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>

        <nav className="max-w-[1600px] mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-custom">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.path}
                  to={`/${tab.path}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-6 py-3 border-b-2 transition-all whitespace-nowrap ${
                      isActive || currentPageName === tab.path
                        ? 'border-[#00c600] text-[#00c600]'
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 md:px-8 py-8 md:py-10">{children}</main>
    </div>
  );
}
