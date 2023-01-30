import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CountDown from 'components/Time/CountDown';

import { Skeleton, ThemeOptions, useMediaQuery } from '@mui/material';
import { ToastDescriptionWithTx } from 'components/Toast';

import useAuth from 'hooks/useAuth';
import useToast from 'hooks/useToast';
import useCatchTxError from 'hooks/useCatchTxError';
import useActiveWeb3React from 'hooks/useActiveWeb3React';
import { useWalletModal } from 'components/WalletModal';
import { useBaseContract } from 'hooks/useContract';

import { ethersToBigNumber, formatNumber, fromWei, toBigNumber } from 'utils/bigNumber';
import tokens from 'config/constants/tokens';
import axiosServices from 'utils/axios';

const Stake = () => {
    const { login, logout } = useAuth();
    const { onPresentConnectModal } = useWalletModal(login, logout);

    const { toastSuccess } = useToast();
    const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError();

    const [info, setInfo] = useState<any>({});

    const isMobile = useMediaQuery((theme: ThemeOptions) => theme.breakpoints.down('sm'));

    const { account } = useActiveWeb3React();

    const tokenContract = useBaseContract();

    const deposit = async () => {
        const duractionSec = 30 * 24 * 60 * 60;
        const receipt = await fetchWithCatchTxError(() => {
            return tokenContract.stake(duractionSec);
        });
        if (receipt?.status) {
            update();
            toastSuccess(
                'Staked',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>You have staked!!!</ToastDescriptionWithTx>
            );
        }
    };

    const updateStake = () => {
        const payload = JSON.stringify({
            query: `{
            stakes(first:1000){
                id
                account
                amount
                amountPercentageTotal
                duration
                startTime
                endTime
                dividendAmount
            } 
          }`,
            variables: {}
        });

        var config = {
            method: 'post',
            url: 'https://api.thegraph.com/subgraphs/name/wasif28/defi-kings',
            // url: "https://api.thegraph.com/subgraphs/name/ammarsjw/staking-metaskeletons-rinkeby",
            headers: {
                'Content-Type': 'application/json'
            },
            data: payload
        };

        axiosServices(config)
            .then(function (response) {
                let temp = toBigNumber(0);
                const data = response?.data?.data?.stakes;
                const cTime = Math.floor(new Date().getTime() / 1000);
                data.forEach((item: any) => {
                    const { duration, amount, startTime } = item;
                    if (cTime - startTime <= duration) {
                        temp = temp.plus(toBigNumber(amount));
                    }
                });
                setInfo((prevState) => ({
                    ...prevState,
                    totalStaked: temp
                }));
                tokenContract.totalSupply().then(async (result: any) => {
                    const deadBalance = await tokenContract.balanceOf('0x000000000000000000000000000000000000dEaD');
                    const csupply = ethersToBigNumber(result).minus(ethersToBigNumber(deadBalance));
                    const percentage = temp.dividedBy(csupply).times(toBigNumber(100));
                    setInfo((prevState) => ({
                        ...prevState,
                        totalStakedPercent: percentage
                    }));
                });
            })
            .catch(function (error) {
                console.log(error);
            });
    };

    const update = () => {
        updateStake();
        if (!account) return;
        tokenContract.balanceOf(account).then((result: any) => {
            setInfo((prevState) => ({
                ...prevState,
                wBalance: result
            }));
        });
        tokenContract.getStakingInfo(account).then((result: any) => {
            setInfo((prevState) => ({
                ...prevState,
                expireTime: result[0]
            }));
        });
    };

    useEffect(() => {
        update();
    }, [account]);

    return (
        <Container
            maxWidth="md"
            sx={{
                height: isMobile ? '100%' : 'auto',
                overflow: 'auto'
            }}
        >
            <Card
                variant="outlined"
                sx={{
                    width: '100%',
                    height: '100%',
                    mt: 4,
                    position: 'relative',
                    margin: 'auto',
                    maxWidth: (theme) => theme.breakpoints.values.sm,
                    boxShadow: '6px 2px 12px 0px rgba(0, 0, 0, 0.1)',
                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                        margin: 0,
                        WebkitAppearance: 'none'
                    },
                    '& input[type=number]': {
                        MozAppearance: 'textfield'
                    }
                }}
            >
                <CardContent>
                    <Stack p={2} pb={0}>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                            <Box
                                sx={{ width: 64, height: 64 }}
                                component="img"
                                src={require('assets/img/dfk.svg').default}
                                alt="DFK Logo"
                            />
                            <Typography variant="h5">DefiKing's Built-in Staking</Typography>
                        </Stack>
                        <Typography>
                            King's Ransom Staking pays you for staking your $DFK tokens. Staking pays you 7 TIMES MORE in volume-based rewards compared to those that do not stake! 

Additionally, profits we earn from ALL our products and services are shared with King's Ransom, so you get EVEN MORE! Simply stake your $DFK and watch the residual income get delivered to YOU! 

Tokens are LOCKED for 30 days, and you must re-stake every 30 days to keep your tokens staked and continue earning your share of the King’s Ransom! When you stake, ALL $DFK tokens in your wallet will be staked. If you do not want to stake all, send some to a different wallet before staking. There are no wallet-to-wallet transfer taxes. If you buy more $DFK tokens after you stake, you can stake again to add them before your timer is up, but it will restart the timer for all tokens.
                        </Typography>
                        <Table
                            sx={{
                                mt: 4,
                                '& td': {
                                    borderColor: 'divider',
                                    borderStyle: 'dashed',
                                    borderWidth: 1,
                                    border: 'none'
                                }
                            }}
                        >
                            <TableBody>
                                <TableRow>
                                    <TableCell>Total Staked</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        {(() => {
                                            if (!info.totalStaked) return <Skeleton />;
                                            return `${formatNumber(
                                                fromWei(info.totalStaked, tokens.dfk.decimals)
                                            )} DFK`;
                                        })()}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Total % of Circulating Supply Staked</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        {(() => {
                                            if (!info.totalStakedPercent) return <Skeleton />;
                                            return `${Number(info.totalStakedPercent).toFixed(2)} %`;
                                        })()}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>
                                        {(() => {
                                            if (!info.expireTime) return 'Your Balance';
                                            const cTime = Math.floor(new Date().getTime() / 1000);
                                            if (info.expireTime < cTime) return 'Your Balance';
                                            return 'Your Staked';
                                        })()}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        {(() => {
                                            if (!info.wBalance || !info.expireTime) return <Skeleton />;
                                            return `${formatNumber(fromWei(info.wBalance, tokens.dfk.decimals))} DFK`;
                                        })()}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Expire Time:</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        {(() => {
                                            if (!info.expireTime) return <Skeleton />;
                                            const cTime = Math.floor(new Date().getTime() / 1000);
                                            if (info.expireTime <= cTime) return <>-</>;
                                            return (
                                                <Stack spacing={1}>
                                                    <CountDown endTime={info.expireTime} />
                                                    <Typography sx={{ textAlign: 'center', py: 1 }}>
                                                        {new Date(info.expireTime * 1000).toLocaleString('en-US', {
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
                                            );
                                        })()}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        {(() => {
                            if (!account) {
                                return (
                                    <Button
                                        startIcon={
                                            <Box
                                                component="img"
                                                src={require('assets/img/icons/wallet.svg').default}
                                                alt="Wallet"
                                                sx={{
                                                    width: (theme) => theme.spacing(2.5)
                                                }}
                                            />
                                        }
                                        onClick={onPresentConnectModal}
                                        size="large"
                                        color="primary"
                                        variant="contained"
                                        sx={{
                                            marginTop: 4,
                                            marginBottom: 1
                                        }}
                                    >
                                        Connect Wallet
                                    </Button>
                                );
                            }
                            return (
                                <LoadingButton
                                    loading={pendingTx}
                                    size="large"
                                    color="primary"
                                    variant="contained"
                                    sx={{
                                        marginTop: 4,
                                        marginBottom: 1
                                    }}
                                    onClick={deposit}
                                >
                                    Stake
                                </LoadingButton>
                            );
                        })()}
                    </Stack>
                </CardContent>
            </Card>
        </Container>
    );
};

export default Stake;
