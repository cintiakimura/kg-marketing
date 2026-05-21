import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-kg-black">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-7xl font-light text-gray-600">404</h1>
        <h2 className="text-2xl font-medium text-white">Page not found</h2>
        <p className="text-gray-400">
          <span className="text-gray-300">"{pageName}"</span> is not part of this app.
        </p>
        <Button asChild variant="kg">
          <Link to="/leads">Go to Leads</Link>
        </Button>
      </div>
    </div>
  );
}
