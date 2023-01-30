import Box from '@mui/material/Box';

const AppBg = () => {
    return (
        <Box className="app-background">
            <Box
                component="img"
                src={require('assets/img/bg.jpg')}
                alt="app-bg"
                sx={{
                    width: '100%',
                    height: '100%',
                    opacity: 0.5,
                    objectFit: 'cover'
                }}
            />
        </Box>
    );
};

export default AppBg;
