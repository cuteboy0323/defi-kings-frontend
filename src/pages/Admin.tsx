import React, { useEffect, useMemo, useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import Pagination from '@mui/material/Pagination';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import useMediaQuery from '@mui/material/useMediaQuery';

import tokens from 'config/constants/tokens';
import axiosServices from 'utils/axios';

import useToast from 'hooks/useToast';
import useCatchTxError from 'hooks/useCatchTxError';
import { useBaseContract, useDistributeContract, useTokenContract } from 'hooks/useContract';
import { ethersToBigNumber, formatDate, formatNumber, fromWei, toBigNumber, toWei } from 'utils/bigNumber';
import { ToastDescriptionWithTx } from 'components/Toast';
import { isAddress } from '@ethersproject/address';
import { ThemeOptions } from '@mui/material';

const Admin = () => {
    const PER_PAGE = 10;
    const [info, setInfo] = useState<any>({});
    const [page, setPage] = useState<number>(1);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [inputToken, setInputToken] = useState<any>({});
    const [balance, setBalance] = useState<any>();

    const isMobile = useMediaQuery((theme: ThemeOptions) => theme.breakpoints.down('sm'));

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => setPage(value);

    const tokenContract = useBaseContract();
    const distributeContract = useDistributeContract();
    const inputTokenContract = useTokenContract(inputToken.address);

    const { toastSuccess } = useToast();
    const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError();

    const handleClose = () => {
        setIsOpen(false);
    };

    const getStakes = async () => {
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

        const response = await axiosServices(config);
        let temp = toBigNumber(0);
        const array = [];
        const data = response?.data?.data?.stakes;
        const cTime = Math.floor(new Date().getTime() / 1000);
        data.forEach((item: any, index: number) => {
            const { duration, amount, startTime } = item;
            if (cTime - startTime <= duration) {
                temp = temp.plus(toBigNumber(amount));
                array.push(item);
            }
        });
        return {
            list: array.map((item: any, index: number) => ({ ...item, index })),
            recipients: array.map((item: any) => item.account),
            totalStaked: temp
        };
    };

    const updateStake = async () => {
        const { list, recipients, totalStaked } = await getStakes();
        tokenContract.totalSupply().then(async (result: any) => {
            const deadBalance = await tokenContract.balanceOf('0x000000000000000000000000000000000000dEaD');
            const csupply = ethersToBigNumber(result).minus(ethersToBigNumber(deadBalance));
            const percentage = totalStaked.dividedBy(csupply).times(toBigNumber(100));
            setInfo((prevState) => ({
                ...prevState,
                list,
                recipients,
                totalStaked: totalStaked,
                totalStakedPercent: percentage
            }));
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            updateStake();
        }, 12000);
        updateStake();
        return () => clearInterval(interval);
    }, []);

    const [baseData, count] = useMemo(() => {
        if (!info.list) return [[], 0];
        return [info.list, info.list.length];
    }, [info.list]);

    const pageData = useMemo(() => {
        const filtered = baseData.filter(
            (item: any) => item.index >= (page - 1) * PER_PAGE && item.index <= page * PER_PAGE
        );
        return filtered;
    }, [baseData, page]);

    useEffect(() => {
        if (!inputTokenContract) return;
        inputTokenContract
            .decimals()
            .then((result: any) => {
                setInputToken((prevState) => ({
                    ...prevState,
                    decimals: result
                }));
            })
            .catch();
    }, [inputToken.address]);

    const isInvalidAddress = useMemo(() => {
        return !(isAddress(inputToken.address) && inputToken.decimals);
    }, [inputToken.address, inputToken.decimals]);

    const pay = async () => {
        const { recipients } = await getStakes();
        const receipt = await fetchWithCatchTxError(() => {
            return distributeContract.distributeMultiple(
                inputToken.address,
                recipients,
                toWei(inputToken.amount, inputToken.decimals).toString()
            );
        });
        if (receipt?.status) {
            setIsOpen(false);
            toastSuccess(
                'Paid',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    {`You have paid successfully`}
                </ToastDescriptionWithTx>
            );
        }
    };

    useEffect(() => {
        if (!distributeContract || !inputToken.address || isInvalidAddress) return;
        inputTokenContract.balanceOf(distributeContract.address).then(setBalance);
    }, [inputToken.address, distributeContract, isInvalidAddress]);

    return (
        <Container>
            <Typography variant="h4" textAlign="center" sx={{ mb: 4 }}>
                DEFI KINGS TRACKER & BONUS PAY DASHBOARD
            </Typography>
            <Card variant="outlined" sx={{ mb: 4, flexGrow: 1 }}>
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
                            Total Staked
                        </Typography>
                        {(() => {
                            if (!info.totalStaked) {
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
                                        {formatNumber(fromWei(info.totalStaked, tokens.dfk.decimals), 2)}
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
                            Total % of Circulating Supply Staked
                        </Typography>
                        {(() => {
                            if (!info.totalStakedPercent) {
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
                                        {Number(info.totalStakedPercent).toFixed(2)}
                                    </Typography>
                                    <Typography
                                        component="span"
                                        sx={{
                                            ml: 0.5,
                                            mb: 0.5
                                        }}
                                    >
                                        %
                                    </Typography>
                                </Stack>
                            );
                        })()}
                    </Stack>
                    <Stack sx={{ flexGrow: 1 }} alignItems="center" spacing={1.25}>
                        <Typography
                            sx={{
                                fontSize: 16,
                                color: (theme) => (theme.palette.mode === 'dark' ? '#a7c9ee' : 'secondary.main')
                            }}
                        >
                            Distribute Reward Token
                        </Typography>
                        <LoadingButton variant="contained" color="secondary" onClick={() => setIsOpen(true)}>
                            Distribute
                        </LoadingButton>
                    </Stack>
                </CardContent>
            </Card>
            <Card variant="outlined">
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
                            <TableCell sx={{ textAlign: 'center' }}>#</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>Wallet Address</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>Amount</TableCell>
                            {!isMobile && (
                                <>
                                    <TableCell sx={{ textAlign: 'center' }}>Start Time</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>End Time</TableCell>
                                </>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pageData.map((item: any) => (
                            <TableRow key={item.id}>
                                <TableCell sx={{ textAlign: 'center' }}>{item.index + 1}</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    {isMobile
                                        ? `${item.account.substring(0, 6)} ... ${item.account.substring(
                                              item.account.length - 4
                                          )}`
                                        : item.account}
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>
                                    {formatNumber(fromWei(item.amount, tokens.dfk.decimals))}
                                </TableCell>
                                {!isMobile && (
                                    <>
                                        <TableCell sx={{ textAlign: 'center' }}>{formatDate(item.startTime)}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>{formatDate(item.endTime)}</TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell colSpan={isMobile ? 3 : 5} sx={{ py: 1.5, borderBottom: 0 }}>
                                <Stack spacing={2} direction="row" alignItems="center" justifyContent="flex-end">
                                    <Pagination
                                        count={count ? Math.ceil(count / PER_PAGE) : 0}
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
            <Dialog onClose={handleClose} open={isOpen} fullWidth maxWidth="xs">
                <DialogTitle textAlign="center">Set Token to Make Payment</DialogTitle>
                <DialogContent>
                    <Stack
                        spacing={2}
                        sx={{
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                margin: 0,
                                WebkitAppearance: 'none'
                            },
                            '& input[type=number]': {
                                MozAppearance: 'textfield'
                            }
                        }}
                    >
                        <Stack spacing={1}>
                            <Typography fontWeight={100} fontSize={14} color="textSecondary">
                                Reward Token Address (BUSD):
                            </Typography>
                            <TextField
                                variant="filled"
                                fullWidth
                                error
                                helperText={isInvalidAddress && inputToken.address ? 'Invalid Token Address' : ''}
                                value={inputToken.address ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setInputToken((prevState: any) => ({
                                        ...prevState,
                                        address: e.target.value
                                    }));
                                }}
                            />
                        </Stack>
                        <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography fontWeight={100} fontSize={14} color="textSecondary">
                                    Reward Amount:
                                </Typography>
                                <Typography fontWeight={100} fontSize={14} color="textSecondary">
                                    {(() => {
                                        if (inputToken.decimals && balance) {
                                            return `Balance: ${formatNumber(fromWei(balance, inputToken.decimals))}`;
                                        }
                                    })()}
                                </Typography>
                            </Stack>
                            <TextField
                                variant="filled"
                                fullWidth
                                type="number"
                                inputProps={{
                                    placeholder: '0.00',
                                    min: 0,
                                    step: 0.01
                                }}
                                sx={{
                                    '& input': {
                                        textAlign: 'right'
                                    }
                                }}
                                disabled={!inputToken.decimals}
                                value={inputToken.amount ?? ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setInputToken((prevState: any) => ({
                                        ...prevState,
                                        amount: e.target.value
                                    }));
                                }}
                            />
                        </Stack>
                        {(() => {
                            return (
                                <LoadingButton
                                    loading={pendingTx}
                                    onClick={pay}
                                    disabled={isInvalidAddress || !inputToken.amount || !inputToken.decimals}
                                    variant="contained"
                                    size="large"
                                    sx={{ mt: '32px !important' }}
                                >
                                    Pay
                                </LoadingButton>
                            );
                        })()}
                    </Stack>
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default Admin;
