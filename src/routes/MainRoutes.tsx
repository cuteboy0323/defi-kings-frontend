import { lazy } from 'react';

// project imports
import Layout from 'layouts';
import Loadable from 'components/Loadable';

const Swap = Loadable(lazy(() => import('pages/Swap')));
const Referral = Loadable(lazy(() => import('pages/Referral')));
const Dashboard = Loadable(lazy(() => import('pages/Dashboard')));
const Stake = Loadable(lazy(() => import('pages/Stake')));
const Admin = Loadable(lazy(() => import('pages/Admin')));

const MainRoutes = {
    path: '/',
    element: <Layout />,
    children: [
        {
            path: '/swap',
            element: <Swap />
        },
        {
            path: '/referral',
            element: <Referral />
        },
        {
            path: '/dashboard',
            element: <Dashboard />
        },
        {
            path: '/stake',
            element: <Stake />
        },
        {
            path: '/admin',
            element: <Admin />
        }
    ]
};

export default MainRoutes;
