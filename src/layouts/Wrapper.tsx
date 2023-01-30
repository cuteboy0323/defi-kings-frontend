import Box from '@mui/material/Box';
import AppBg from 'components/AppBg';

import { Outlet } from 'react-router-dom';

const Wrapper = () => (
    <Box
        sx={{
            minHeight: 'calc(100vh - 68px - 48px)',
            padding: (theme) => theme.spacing(4, 0)
        }}
    >
        <Outlet />
        <AppBg />
    </Box>
);

export default Wrapper;
