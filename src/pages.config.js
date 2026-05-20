import Campaigns from './pages/Campaigns';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import __Layout from './Layout.jsx';

/** Lowercase URL segments — avoids /dashboard vs /Dashboard routing conflicts. */
export const PAGES = {
  dashboard: Dashboard,
  leads: Leads,
  campaigns: Campaigns,
  clients: Clients,
};

export const pagesConfig = {
  mainPage: 'leads',
  Pages: PAGES,
  Layout: __Layout,
};
