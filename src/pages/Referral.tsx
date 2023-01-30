// ** React Methods ** //
import { useContext, useEffect, useMemo, useState } from 'react';

// ** Material UI Components ** //
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';

// ** Material UI Icons ** //
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';

// ** Contexts ** //
import { APIContext } from 'contexts/api';

// ** Utils ** //
import { ethersToBigNumber, formatNumber, fromWei } from 'utils/bigNumber';

// ** Hooks ** //
import useActiveWeb3React from 'hooks/useActiveWeb3React';
import { useBaseContract, useRouterContract, useSwapContract } from 'hooks/useContract';
import { useNavigate } from 'react-router-dom';

// ** Config ** //
import { PER_PAGE } from 'config';

// ** Types ** //
import { ThemeOptions } from '@mui/material';
import tokens from 'config/constants/tokens';

const Referral = () => {
    const navigate = useNavigate();
    const {
        tokens: { binancecoin }
    } = useContext(APIContext);
    const { account } = useActiveWeb3React();

    const isMobile = useMediaQuery((theme: ThemeOptions) => theme.breakpoints.down('sm'));

    const [bs, setBS] = useState<any>([]);
    const [data, setData] = useState<any>({});
    const [date, setDate] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [endTimer, setEndTimer] = useState<any>({});

    const swapContract = useSwapContract();
    const tokenContract = useBaseContract();
    const routerContract = useRouterContract();

    const buyDFK = () => {
        navigate('/swap');
    };

    const update = () => {
        swapContract.getBuyers(date).then((result) => {
            setBS(result);
        });
        swapContract.getBuyersCount(date).then((result) => {
            setData((prevState) => ({
                ...prevState,
                count: result
            }));
        });
        if (!account) return;
        tokenContract.balanceOf(account).then((result) =>
            setData((prevState) => ({
                ...prevState,
                balance: result
            }))
        );
        if (!binancecoin) return;
        routerContract.getAmountsOut(100000, [tokens.dfk.address, tokens.bnb.address]).then((result: string[]) => {
            const priceInBNB = result[1];
            const priceInFiat = fromWei(priceInBNB) * binancecoin.current_price;
            setData((prevState) => ({
                ...prevState,
                price: priceInFiat
            }));
        });
    };

    const handleDate = (event: React.MouseEvent<HTMLElement>, value: number) => {
        if (value !== null) {
            setPage(1);
            setDate(value);
        }
    };
    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => setPage(value);

    const getTrophyColor = (rank: number) => {
        if (rank === 1) return '#FFD700';
        if (rank === 2) return '#C0C0C0';
        if (rank === 3) return '#CD7F32';
        return '#CD7F32';
    };
    const getRankTime = () => {
        const delta = 60 * 60 * 24 * 4 + 60 * 60 * 4;
        const current_timestamp = Math.floor(new Date().getTime() / 1000);
        const secondsForWeek = 60 * 60 * 24 * 7;
        let endTime = current_timestamp - (current_timestamp % secondsForWeek) + delta;
        if (endTime < current_timestamp) endTime += secondsForWeek;
        return endTime;
    };
    const endTime = useMemo(getRankTime, []);

    const [buyersList] = useMemo(() => {
        if (!bs[0]) return [[]];
        const array = [];
        bs[0].forEach((address, index) => {
            const volume = ethersToBigNumber(bs[1][index]);
            array.push({
                address: address,
                volume: volume
            });
        });
        array.sort((a, b) => b.volume - a.volume);
        const final = array.map((item, idx) => ({
            ...item,
            rank: idx + 1
        }));
        return [final];
    }, [bs]);

    const pageData = useMemo(() => {
        const filtered = buyersList.filter((item) => item.rank > (page - 1) * PER_PAGE && item.rank <= page * PER_PAGE);
        return filtered;
    }, [buyersList, page]);

    useEffect(() => {
        update();
    }, [account, binancecoin, date]);

    useEffect(() => {
        if (!endTime) return;
        const exTime = endTime * 1000;
        const updateTime = () => {
            const now = new Date().getTime();
            const dis = exTime - now;
            const minDis = Math.floor(dis / 1000 / 60);
            const minutesForWeek = 60 * 24 * 7;
            // Time calculations for days, hours, minutes and seconds
            const days = Math.floor(dis / (1000 * 60 * 60 * 24));
            const hours = Math.floor((dis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((dis % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((dis % (1000 * 60)) / 1000);

            // If the count down is finished, write some text
            if (dis < 0) {
                clearInterval(interval);
            }
            setEndTimer({
                minDisPercent: (minDis / minutesForWeek) * 100,
                minDis: minDis,
                days,
                hours,
                minutes,
                seconds
            });
        };
        const interval = setInterval(() => {
            updateTime();
        }, 1000 * 60);
        updateTime();
        return () => clearInterval(interval);
    }, [endTime]);

    return (
        <Container>
            <Grid container spacing={4}>
                <Grid item xs={12} sm={4}>
                    <Card variant="outlined">
                        <CardContent
                            component={Stack}
                            spacing={2}
                            justifyContent="space-between"
                            sx={{
                                height: '100%',
                                padding: '32px !important'
                            }}
                        >
                            <Stack sx={{ flexGrow: 1, position: 'relative' }} alignItems="center" spacing={2}>
                                <Box
                                    sx={{
                                        width: 290,
                                        height: 290,
                                        position: 'relative',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    <CircularProgress
                                        thickness={22}
                                        variant="determinate"
                                        value={endTimer.minDisPercent ?? 0}
                                        color="info"
                                        size={290}
                                        sx={{
                                            position: 'absolute',
                                            '& svg': {
                                                width: '100%',
                                                height: '100%',
                                                borderColor: (theme) => theme.palette.info.main,
                                                borderWidth: (theme) => theme.spacing(2),
                                                borderStyle: 'solid',
                                                borderRadius: '50%',
                                                padding: (theme) => theme.spacing(1)
                                            },
                                            width: '100% !important',
                                            minWidth: 250,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    />
                                    <CircularProgress
                                        thickness={22}
                                        variant="determinate"
                                        value={100}
                                        color="info"
                                        size={290}
                                        sx={{
                                            position: 'absolute',
                                            zIndex: -1,
                                            '& svg': {
                                                width: '100%',
                                                height: '100%',
                                                borderColor: (theme) => theme.palette.info.main,
                                                borderWidth: (theme) => theme.spacing(2),
                                                borderStyle: 'solid',
                                                borderRadius: '50%',
                                                padding: (theme) => theme.spacing(1)
                                            },
                                            width: '100% !important',
                                            minWidth: 250,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}
                                    />
                                    <Stack
                                        sx={{
                                            width: 290,
                                            height: 290,
                                            zIndex: 10,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Typography variant="h3" sx={{ fontWeight: '600' }}>
                                            {endTimer.minDis ?? 0}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                textAlign: 'center',
                                                color: '#a7c9ee'
                                            }}
                                        >
                                            Minutes
                                        </Typography>
                                    </Stack>
                                </Box>
                                <Typography variant="h6" sx={{ textAlign: 'center', py: 1.25 }}>
                                    {new Date(endTime * 1000).toLocaleString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        second: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                    })}
                                </Typography>
                            </Stack>
                            <Stack spacing={1} direction={{ xs: 'column', sm: 'row' }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={buyDFK}
                                    startIcon={<ShoppingCartRoundedIcon />}
                                >
                                    BUY DFK
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={8}>
                    <Card variant="outlined" sx={{ overflow: 'auto', position: 'relative' }}>
                        {!pageData.length && (
                            <Stack
                                spacing={2}
                                justifyContent="center"
                                alignItems="center"
                                sx={{
                                    width: '100%',
                                    height: 'calc(100% - 57px - 57px)',
                                    position: 'absolute',
                                    zIndex: 10,
                                    backdropFilter: 'blur(5px)',
                                    top: 57,
                                    left: 0
                                }}
                            >
                                <Box
                                    component="img"
                                    src={require('assets/img/icons/emptybox.png')}
                                    alt="Empty Box"
                                    sx={{
                                        opacity: 0.5,
                                        width: (theme) => theme.spacing(12)
                                    }}
                                />
                                <Typography color="textSecondary">No Data</Typography>
                            </Stack>
                        )}
                        {!bs[date] && (
                            <Stack
                                justifyContent="center"
                                alignItems="center"
                                sx={{
                                    width: '100%',
                                    height: 'calc(100% - 57px - 57px)',
                                    position: 'absolute',
                                    zIndex: 10,
                                    backdropFilter: 'blur(5px)',
                                    top: 57,
                                    left: 0
                                }}
                            >
                                <CircularProgress />
                            </Stack>
                        )}
                        <Table
                            sx={{
                                '& td, & th': {
                                    borderColor: 'divider',
                                    borderStyle: 'dashed',
                                    borderWidth: 1,
                                    borderLeft: 'none',
                                    borderRight: 'none',
                                    '&:nth-of-type(even)': {
                                        bgcolor: 'rgb(255 255 255 / 2.5%)'
                                    }
                                },
                                '& tr': {
                                    '&:nth-of-type(even)': {
                                        bgcolor: 'rgb(255 255 255 / 5%)'
                                    }
                                }
                            }}
                        >
                            <TableHead>
                                <TableRow
                                    sx={{
                                        bgcolor: (theme) => `${theme.palette.secondary.main}44`
                                    }}
                                >
                                    <TableCell sx={{ textAlign: 'left' }}>Rank</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>Referral Wallet</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>Volume</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody sx={{ position: 'relative' }}>
                                {pageData.map((item) => {
                                    return (
                                        <TableRow
                                            key={item.rank}
                                            sx={{
                                                bgcolor:
                                                    item.address === account
                                                        ? (theme) => `${theme.palette.secondary.main} !important`
                                                        : 'inherit'
                                            }}
                                        >
                                            <TableCell sx={{ textAlign: 'left' }}>
                                                <Stack
                                                    direction={{
                                                        xs: 'column',
                                                        sm: 'row'
                                                    }}
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                >
                                                    {`#${item.rank}`}
                                                    {item.rank <= 4 && (
                                                        <EmojiEventsRoundedIcon
                                                            fontSize="small"
                                                            sx={{
                                                                color: getTrophyColor(item.rank)
                                                            }}
                                                        />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                {isMobile
                                                    ? `${item.address.substring(0, 6)} ... ${item.address.substring(
                                                          item.address.length - 4
                                                      )}`
                                                    : item.address}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'center' }}>
                                                {formatNumber(fromWei(item.volume, tokens.dfk.decimals), 2)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {new Array(PER_PAGE - pageData.length).fill('Skeleton').map((item, idx) => {
                                    return (
                                        <TableRow key={idx} sx={{ visibility: 'hidden' }}>
                                            <TableCell>{item}</TableCell>
                                            <TableCell>
                                                {item}
                                                <IconButton component="span" size="small" sx={{ ml: 0.5 }}>
                                                    <ContentCopyRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>{item}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ py: 1.5, borderBottom: 0 }}>
                                        <Stack
                                            spacing={2}
                                            direction={{ xs: 'column-reverse', sm: 'row' }}
                                            alignItems="center"
                                            justifyContent="space-between"
                                        >
                                            <ToggleButtonGroup
                                                size="small"
                                                color="primary"
                                                value={date}
                                                exclusive
                                                fullWidth={isMobile}
                                                onChange={handleDate}
                                            >
                                                <ToggleButton
                                                    value={1}
                                                    component={Button}
                                                    sx={{
                                                        textTransform: 'none',
                                                        height: 32
                                                    }}
                                                >
                                                    Previous Week
                                                </ToggleButton>
                                                <ToggleButton
                                                    value={0}
                                                    component={Button}
                                                    sx={{
                                                        textTransform: 'none',
                                                        height: 32
                                                    }}
                                                >
                                                    Current Week
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                            <Pagination
                                                count={data.count ? Math.ceil(data.count / PER_PAGE) : 0}
                                                page={page}
                                                onChange={handlePageChange}
                                                showLastButton
                                                siblingCount={0}
                                                boundaryCount={1}
                                                color="primary"
                                                shape="rounded"
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Referral;
