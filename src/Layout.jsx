import { useAuth } from '@/lib/AuthContext';
import { NavLink } from 'react-router-dom';

const tabs = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'leads', label: 'Leads' },
  { path: 'campaigns', label: 'Campaigns' },
  { path: 'clients', label: 'Clients' },
];

export default function Layout({ children, currentPageName }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-kg-black">
      <style>{`
        :root {
          --kg-btn: #22A855;
          --kg-btn-hover: #28BC5C;
          --kg-card: #0a1f0a;
          --kg-input: #0C180E;
        }
        
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        }
        
        body {
          background: #000000;
          font-size: 18px;
        }
        
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: #0C180E;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #22A855;
          border-radius: 3px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #28BC5C;
        }
      `}</style>

      <header className="bg-kg-card border-b border-green-500/30 sticky top-0 z-50 h-8">
        <div className="max-w-[1600px] mx-auto h-8 px-4 flex items-center justify-between gap-4">
          <NavLink to="/dashboard" className="flex items-center gap-2 hover:opacity-90 shrink-0">
            <img
              src="/kg-logo.png"
              alt="KG"
              className="h-6 w-6 rounded object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden h-6 w-6 bg-kg-btn rounded flex items-center justify-center shadow-kg-btn">
              <span className="text-white font-medium text-[18px]">KG</span>
            </div>
            <span className="text-white font-medium text-[18px] leading-none hidden sm:inline">
              KG Marketing
            </span>
          </NavLink>

          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-custom flex-1 justify-center min-w-0">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={`/${tab.path}`}
                className={({ isActive }) =>
                  `kg-link px-4 h-8 inline-flex items-center border-b-2 transition-all whitespace-nowrap ${
                    isActive || currentPageName === tab.path
                      ? 'border-green-500 text-green-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => logout()}
            className="kg-link shrink-0 px-3 h-8 inline-flex items-center text-gray-300 hover:text-green-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 md:px-8 py-8 md:py-10">{children}</main>
    </div>
  );
}
