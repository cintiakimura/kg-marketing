import Calendar from './pages/Calendar';
import Campaigns from './pages/Campaigns';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Leads from './pages/Leads';
import ManagerDashboard from './pages/ManagerDashboard';
import ScheduleWebinar from './pages/ScheduleWebinar';
import Statistics from './pages/Statistics';
import Webmail from './pages/Webmail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Calendar": Calendar,
    "Campaigns": Campaigns,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "Home": Home,
    "Leads": Leads,
    "ManagerDashboard": ManagerDashboard,
    "ScheduleWebinar": ScheduleWebinar,
    "Statistics": Statistics,
    "Webmail": Webmail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};