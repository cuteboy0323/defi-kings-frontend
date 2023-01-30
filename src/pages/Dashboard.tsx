// ** React Methods ** //
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

// ** Material UI Components ** //
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

// ** Material UI Icons ** //
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';

// ** Extra Components ** //
import { ToastDescriptionWithTx } from 'components/Toast';

// ** Contexts ** //
import { APIContext } from 'contexts/api';

// ** Utils ** //
import { ethersToBigNumber, formatCurrency, formatNumber, fromWei, toBigNumber, toWei } from 'utils/bigNumber';

// ** Hooks ** //
import useToast from 'hooks/useToast';
import useActiveWeb3React from 'hooks/useActiveWeb3React';
import useCatchTxError from 'hooks/useCatchTxError';
import {
    useDividendContract,
    useRouterContract,
    useBaseContract,
    useSwapContract,
    useDistributeContract,
    useTokenContract
} from 'hooks/useContract';
import { useNavigate } from 'react-router-dom';

// ** Config ** //
import tokens from 'config/constants/tokens';
import { Link } from '@mui/material';
import { AddressZero } from '@ethersproject/constants';

const rewardTokens = Object.entries({
    BNB: '0x0000000000000000000000000000000000000000',
    BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    XRP: '0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe',
    WBNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    ADA: '0x3ee2200efb3400fabb9aacf31297cbdd1d435d47',
    ETH: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    BTC: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c'
});

const Dashboard = () => {
    const routerContract = useRouterContract();
    const dividendContract = useDividendContract();
    const tokenContract = useBaseContract();
    const swapContract = useSwapContract();
    const distributeContract = useDistributeContract();
    const busdContract = useTokenContract(tokens.busd.address);

    const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError();
    const { toastSuccess } = useToast();
    const navigate = useNavigate();
    const {
        tokens: { binancecoin },
        activeCurrency
    } = useContext(APIContext);

    const [data, setData] = useState<any>({});
    const [newRToken, setNewRToken] = useState<string>();
    const [rewardToken, setRewardToken] = useState<string>();

    const { account, library } = useActiveWeb3React();

    // ** Functions ** //
    const buyDFK = () => {
        navigate('/swap');
    };

    const checkFee = () => {
        swapContract.totalBuyFee().then(async (tFee: any) => {
            const tefiFee = await swapContract.tefiBuyFee();
            const bFee = ethersToBigNumber(tFee).minus(ethersToBigNumber(tefiFee));
            setData((prevState) => ({
                ...prevState,
                buyFee: bFee
            }));
        });
        swapContract.totalSellFee().then(async (tFee: any) => {
            const tefiFee = await swapContract.tefiSellFee();
            const bFee = ethersToBigNumber(tFee).minus(ethersToBigNumber(tefiFee));
            setData((prevState) => ({
                ...prevState,
                sellFee: bFee
            }));
        });
    };

    const getCustomGasFee = useCallback(
        async (method: string, args: any) => {
            const gasPrice = await library.getGasPrice();
            const gasLimit = await tokenContract.estimateGas[method](...args);
            const estimateGas = ethersToBigNumber(gasLimit);
            const customFee = toBigNumber(150000);
            return {
                gasPrice: gasPrice.toString(),
                gasLimit: estimateGas.plus(customFee).toString()
            };
        },
        [library]
    );

    const claim = async () => {
        const gasOverrides = await getCustomGasFee('claim', []);
        const receipt = await fetchWithCatchTxError(() => {
            return tokenContract.claim({ ...gasOverrides });
        });
        if (receipt?.status) {
            toastSuccess(
                'Claimed',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    You have claimed your rewards!
                </ToastDescriptionWithTx>
            );
        }
    };

    const updateRewardToken = async () => {
        const receipt = await fetchWithCatchTxError(() => {
            return tokenContract.updatePayoutToken(newRToken);
        });
        if (receipt?.status) {
            toastSuccess(
                'Updated',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    The reward token has been updated!
                </ToastDescriptionWithTx>
            );
        }
    };

    const handleChange = (event: SelectChangeEvent) => {
        setNewRToken(event.target.value);
    };

    const update = () => {
        checkFee();
        tokenContract.getTotalDividendsDistributed().then((result) => {
            setData((prevState) => ({
                ...prevState,
                tDistributed: result
            }));
        });
        distributeContract.totalDistributed(tokens.busd.address).then((result) => {
            const td = toBigNumber(toWei(8240)).plus(ethersToBigNumber(result));
            setData((prevState) => ({
                ...prevState,
                totalDistributed: td
            }));
        });
        busdContract.balanceOf(distributeContract.address).then(async (result) => {
            const td = await distributeContract.totalDistributed(tokens.busd.address);
            const tc = ethersToBigNumber(result)
                .plus(ethersToBigNumber(td))
                .plus(toBigNumber(toWei(8240)));
            setData((prevState) => ({
                ...prevState,
                totalCollected: tc
            }));
        });
        if (account) {
            tokenContract.balanceOf(account).then((result) =>
                setData((prevState) => ({
                    ...prevState,
                    balance: result
                }))
            );
            tokenContract.withdrawableDividendOf(account).then((result) =>
                setData((prevState) => ({
                    ...prevState,
                    earning: result
                }))
            );
            dividendContract.withdrawnDividendOf(account).then((result) => {
                setData((prevState) => ({
                    ...prevState,
                    earned: result
                }));
            });
            tokenContract.getPayoutToken(account).then((result) => {
                setRewardToken(result);
                setNewRToken(newRToken ?? result);
            });
            distributeContract.totalDistributedPerWallet(account, tokens.busd.address).then((result) => {
                setData((prevState) => ({
                    ...prevState,
                    totalEarned: result
                }));
            });
        }
        if (!binancecoin) return;
        tokenContract.totalSupply().then(async (result: any) => {
            const deadBalance = await tokenContract.balanceOf('0x000000000000000000000000000000000000dEaD');
            const csupply = ethersToBigNumber(result).minus(ethersToBigNumber(deadBalance));
            const priceInBNB = (
                await routerContract.getAmountsOut(1000000000, [tokens.dfk.address, tokens.bnb.address])
            )[1];
            const priceInFiat = fromWei(priceInBNB) * binancecoin.current_price;
            const mcap = toBigNumber(priceInFiat).multipliedBy(csupply);
            setData((prevState) => ({
                ...prevState,
                mcap,
                csupply,
                tsupply: deadBalance,
                price: priceInFiat
            }));
        });
    };

    const rToken = useMemo(() => {
        if (!newRToken) return AddressZero;
        const item = rewardTokens.find(([ticker, address]) => address.toLowerCase() === newRToken.toLowerCase());
        if (!item) return AddressZero;
        return item[1];
    }, [newRToken]);

    // ** Side Effects ** //
    useEffect(() => {
        update();
    }, [binancecoin, activeCurrency, account]);

    return (
        <Container sx={{ py: 4 }}>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Card variant="outlined">
                        <CardContent
                            component={Stack}
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems="center"
                            spacing={2}
                            sx={{
                                padding: '32px !important'
                            }}
                        >
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontSize: 16,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Market Cap
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (!data.mcap) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return formatCurrency(
                                            fromWei(data.mcap, tokens.dfk.decimals),
                                            activeCurrency,
                                            0
                                        );
                                    })()}
                                </Typography>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontSize: 16,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Circulating Supply
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (!data.csupply) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return formatNumber(fromWei(data.csupply, tokens.dfk.decimals), 0);
                                    })()}
                                </Typography>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontSize: 16,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Total Burnt
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (!data.tsupply) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return formatNumber(fromWei(data.tsupply, tokens.dfk.decimals), 0);
                                    })()}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ mt: 4, flexGrow: 1 }}>
                        <CardContent
                            component={Stack}
                            direction={{ xs: 'column', sm: 'row' }}
                            alignItems={{ xs: 'center', sm: 'flex-start' }}
                            spacing={2}
                            sx={{
                                padding: '32px !important',
                                height: '100%'
                            }}
                        >
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontSize: 16,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Your Balance
                                </Typography>
                                {(() => {
                                    if (!data.balance) {
                                        return (
                                            <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            </Typography>
                                        );
                                    }
                                    return (
                                        <Stack direction="row" alignItems="flex-end">
                                            <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                {formatNumber(fromWei(data.balance, tokens.dfk.decimals), 2)}
                                            </Typography>
                                            <Typography
                                                component="span"
                                                sx={{
                                                    ml: 0.5,
                                                    mb: 0.5
                                                }}
                                            >
                                                DFK
                                            </Typography>
                                        </Stack>
                                    );
                                })()}
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontSize: 16,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Price
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                    {(() => {
                                        if (!data.price) {
                                            return (
                                                <Skeleton
                                                    sx={{
                                                        minWidth: (theme) => theme.spacing(10)
                                                    }}
                                                    animation="wave"
                                                />
                                            );
                                        }
                                        return formatCurrency(data.price, activeCurrency, 7);
                                    })()}
                                </Typography>
                            </Stack>
                            <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={1.5}>
                                <Typography
                                    sx={{
                                        fontSize: 16,
                                        color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                                    }}
                                >
                                    Reward Token
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <FormControl sx={{ minWidth: 80 }}>
                                        <InputLabel>Reward Token</InputLabel>
                                        <Select
                                            value={rToken}
                                            onChange={handleChange}
                                            label="Reward Token"
                                            size="small"
                                            sx={{
                                                minWidth: 120
                                            }}
                                        >
                                            {rewardTokens.map(([tick, address]: any) => {
                                                const isSelected = rewardToken
                                                    ? address.toLowerCase() === rewardToken.toLowerCase()
                                                    : address.toLowerCase() === AddressZero;
                                                return (
                                                    <MenuItem key={address} value={address} disabled={isSelected}>
                                                        {tick}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                    <LoadingButton
                                        loading={pendingTx}
                                        disabled={!account || !data.earning}
                                        onClick={updateRewardToken}
                                        variant="outlined"
                                        sx={{
                                            height: 43.28
                                        }}
                                    >
                                        Update
                                    </LoadingButton>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <Stack sx={{ height: '100%' }}>
                        <Typography variant="h5" sx={{ pt: 1, textAlign: 'center' }}>
                            Volume Based Rewards
                        </Typography>
                        <Card variant="outlined" sx={{ mt: 2, flexGrow: 1 }}>
                            <CardContent
                                component={Stack}
                                direction={{ xs: 'column', sm: 'row' }}
                                alignItems={{ xs: 'center', sm: 'flex-start' }}
                                spacing={2}
                                sx={{
                                    padding: '32px 32px 32px 32px !important',
                                    height: '100%'
                                }}
                            >
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Total Distributed
                                    </Typography>
                                    {(() => {
                                        if (!data.tDistributed) {
                                            return (
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                </Typography>
                                            );
                                        }
                                        return (
                                            <Stack direction="row" alignItems="flex-end">
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    {formatNumber(fromWei(data.tDistributed, tokens.bnb.decimals))}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 0.5,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    BNB
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                </Stack>
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Pending Balance
                                    </Typography>
                                    {(() => {
                                        if (!data.earning) {
                                            return (
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                </Typography>
                                            );
                                        }
                                        return (
                                            <Stack direction="row" alignItems="flex-end">
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    {formatNumber(fromWei(data.earning, tokens.bnb.decimals))}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 0.5,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    BNB
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                    <LoadingButton
                                        loading={pendingTx}
                                        disabled={!account || !data.earning}
                                        onClick={claim}
                                        variant="outlined"
                                        size="small"
                                    >
                                        MANUAL CLAIM
                                    </LoadingButton>
                                </Stack>
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Your Total Earned
                                    </Typography>
                                    {(() => {
                                        if (!data.earned) {
                                            return (
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                </Typography>
                                            );
                                        }
                                        return (
                                            <Stack direction="row" alignItems="flex-end">
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    {formatNumber(fromWei(data.earned, tokens.bnb.decimals))}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 0.5,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    BNB
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                </Stack>
                            </CardContent>
                        </Card>
                        <Typography variant="h5" sx={{ mt: 2, pt: 1, textAlign: 'center' }}>
                            Profit Sharing Staking Rewards
                        </Typography>
                        <Card variant="outlined" sx={{ mt: 2, flexGrow: 1 }}>
                            <CardContent
                                component={Stack}
                                direction={{ xs: 'column', sm: 'row' }}
                                alignItems={{ xs: 'center', sm: 'flex-start' }}
                                spacing={2}
                                sx={{
                                    padding: '32px !important',
                                    height: '100%'
                                }}
                            >
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Total Distributed
                                    </Typography>
                                    {(() => {
                                        if (!data.totalDistributed) {
                                            return (
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                </Typography>
                                            );
                                        }
                                        return (
                                            <Stack direction="row" alignItems="flex-end">
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    {formatNumber(fromWei(data.totalDistributed, tokens.busd.decimals))}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 0.5,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    BUSD
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                </Stack>
                                <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={0.5}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            color: (theme) =>
                                                theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                        }}
                                    >
                                        Total Collected
                                    </Typography>
                                    {(() => {
                                        if (!data.totalCollected) {
                                            return (
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    <Skeleton
                                                        sx={{
                                                            minWidth: (theme) => theme.spacing(10)
                                                        }}
                                                        animation="wave"
                                                    />
                                                </Typography>
                                            );
                                        }
                                        return (
                                            <Stack direction="row" alignItems="flex-end">
                                                <Typography variant="h4" sx={{ fontWeight: '600' }}>
                                                    {formatNumber(fromWei(data.totalCollected, tokens.busd.decimals))}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        ml: 0.5,
                                                        mb: 0.5
                                                    }}
                                                >
                                                    BUSD
                                                </Typography>
                                            </Stack>
                                        );
                                    })()}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent
                            sx={{
                                height: '100%',
                                padding: '32px !important'
                            }}
                        >
                            <Stack spacing={4} height="100%" justifyContent="space-between">
                                <Stack spacing={2}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={buyDFK}
                                        startIcon={<ShoppingCartRoundedIcon />}
                                    >
                                        BUY DFK
                                    </Button>
                                    <Link
                                        href="https://www.dextools.io/app/bnb/pair-explorer/0x68aa193e711ce8b4d72f5c8d3497f9810ce87724"
                                        underline="none"
                                        target="_blank"
                                    >
                                        <Button fullWidth variant="outlined" startIcon={<ShowChartRoundedIcon />}>
                                            VIEW CHART
                                        </Button>
                                    </Link>
                                </Stack>
                                <Table
                                    sx={{
                                        '& td': {
                                            borderColor: 'divider',
                                            borderStyle: 'dashed',
                                            borderWidth: 1
                                        }
                                    }}
                                >
                                    <TableBody>
                                        <TableRow>
                                            <TableCell
                                                sx={{
                                                    borderRight: 'none !important'
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: 13,
                                                        color: (theme) =>
                                                            theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                                    }}
                                                >
                                                    Buy Tax
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    borderLeft: 'none !important'
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        color: 'primary.main'
                                                    }}
                                                >
                                                    {(() => {
                                                        if (!data.buyFee) {
                                                            return <Skeleton sx={{ minWidth: 80 }} animation="wave" />;
                                                        }
                                                        return `${formatNumber((data.buyFee * 100) / 10000, 1)}%`;
                                                    })()}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                sx={{
                                                    borderRight: 'none !important'
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: 13,
                                                        color: (theme) =>
                                                            theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                                    }}
                                                >
                                                    Sell Tax
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    borderLeft: 'none !important'
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        color: 'primary.main'
                                                    }}
                                                >
                                                    {(() => {
                                                        if (!data.sellFee) {
                                                            return <Skeleton sx={{ minWidth: 80 }} animation="wave" />;
                                                        }
                                                        return `${formatNumber((data.sellFee * 100) / 10000, 1)}%`;
                                                    })()}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                sx={{
                                                    borderRight: 'none !important'
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontSize: 13,
                                                        color: (theme) =>
                                                            theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main'
                                                    }}
                                                >
                                                    {' '}
                                                    Transfer Tax
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    borderLeft: 'none !important'
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        color: 'primary.main'
                                                    }}
                                                >
                                                    0%
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
