import Campaigns from './pages/Campaigns';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import __Layout from './Layout.jsx';

export const PAGES = {
  Dashboard,
  Leads,
  Campaigns,
  Clients,
};

export const pagesConfig = {
  mainPage: 'Leads',
  Pages: PAGES,
  Layout: __Layout,
};
