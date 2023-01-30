import { ThemeOptions } from '@mui/material';

export const themeOptions: ThemeOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#f44336'
        },
        secondary: {
            main: '#889ce7'
        },
        background: {
            paper: '#1b1c1e',
            default: '#141416'
        }
    },
    typography: {
        fontFamily: "'Jockey One', sans-serif",
        fontSize: 16
    },
    shape: {
        borderRadius: 6
    },
    components: {
        MuiFilledInput: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(85, 119, 253, 0.1)',
                    borderRadius: 8,
                    '&:before': {
                        content: 'none'
                    },
                    '&:after': {
                        content: 'none'
                    },
                    '& input': {
                        paddingTop: 16,
                        paddingBottom: 16,
                        paddingLeft: 24,
                        paddingRight: 24
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none'
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1b1c1e99',
                    backgroundImage: 'none',
                    boxShadow: '0 8px 12px 0 rgb(0 0 0 / 30%)'
                }
            }
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    borderRadius: 6
                }
            }
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6
                }
            }
        },
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(5px)'
                }
            }
        }
    }
};
