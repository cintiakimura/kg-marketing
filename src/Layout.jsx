import { useAuth } from '@/lib/AuthContext';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
          background: rgba(34, 197, 94, 0.45);
          border-radius: 3px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.6);
        }
      `}</style>

      <header className="bg-kg-card border-b border-green-500/30 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <NavLink to="/dashboard" className="flex items-center gap-3 hover:opacity-90 shrink-0">
            <img
              src="/kg-logo.png"
              alt="KG"
              className="w-10 h-10 rounded-lg object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-10 h-10 kg-btn-surface rounded-lg flex items-center justify-center">
              <span className="text-white font-medium text-lg">KG</span>
            </div>
            <span className="text-white font-medium text-lg leading-none hidden sm:inline">
              KG Marketing
            </span>
          </NavLink>

          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-custom flex-1 justify-center min-w-0">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={`/${tab.path}`}
                className={({ isActive }) =>
                  isActive || currentPageName === tab.path
                    ? 'kg-nav-link-active'
                    : 'kg-nav-link'
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <Button
            type="button"
            variant="kg"
            size="sm"
            onClick={() => logout()}
            className="shrink-0 uppercase tracking-wide"
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 md:px-8 py-8 md:py-10">{children}</main>
    </div>
  );
}
