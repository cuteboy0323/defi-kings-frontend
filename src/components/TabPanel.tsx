import Box from '@mui/material/Box';

const TabPanel = (props: any) => {
    const { children, value, index, ...other } = props;

    return (
        <Box role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <>{children}</>}
        </Box>
    );
};

export default TabPanel;
