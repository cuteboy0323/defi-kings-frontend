// ** React Methods ** //
import { useCallback, useContext, useEffect, useState } from 'react';

// ** Material UI Components ** //
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import useMediaQuery from '@mui/material/useMediaQuery';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';

// ** Material UI Icons ** //
import SwapVertIcon from '@mui/icons-material/SwapVert';
import TokenRoundedIcon from '@mui/icons-material/TokenRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';

// ** Extra Components ** //
import { ToastDescriptionWithTx } from 'components/Toast';

// ** Contexts ** //
import { APIContext } from 'contexts/api';

// ** Utils ** //
import { ethersToBigNumber, formatCurrency, formatNumber, fromWei, toBigNumber, toWei } from 'utils/bigNumber';
import { getBnbBalance } from 'utils/web3';
import { getBscScanLink, isAddress } from 'utils';

// ** Hooks ** //
import useAuth from 'hooks/useAuth';
import useToast from 'hooks/useToast';
import useCatchTxError from 'hooks/useCatchTxError';
import useActiveWeb3React from 'hooks/useActiveWeb3React';
import { useWalletModal } from 'components/WalletModal';
import { useTokenContract, useSwapContract } from 'hooks/useContract';

// ** Config ** //
import { SWAP_TOKENS } from 'config/constants/swap';

// ** Types ** //
import { TokenProps } from 'types/swap';
import { ThemeOptions } from '@mui/material';

const Swap = () => {
    const { login, logout } = useAuth();
    const { chainId, account, library } = useActiveWeb3React();
    const { toastSuccess } = useToast();
    const { onPresentConnectModal } = useWalletModal(login, logout);
    const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError();
    const { tokens, activeCurrency } = useContext(APIContext);
    const isMobile = useMediaQuery((theme: ThemeOptions) => theme.breakpoints.down('sm'));

    const swapTokens = SWAP_TOKENS;

    const [data, setData] = useState<any>({});
    const [isBuy, setIsBuy] = useState(true);
    const [isApproved, setIsApproved] = useState(false);
    const [isRefer, setIsRefer] = useState<boolean>(false);
    const [refer, setRefer] = useState<string>('');
    const [inputTokenBalance, setInputTokenBalance] = useState<any>();
    const [outputTokenBalance, setOutputTokenBalance] = useState<any>();
    const [inputAmount, setInputAmount] = useState<any>({});
    const [outputAmount, setOutputAmount] = useState<any>({});
    const [inputToken, setInputToken] = useState<TokenProps>(swapTokens[0]);
    const [outputToken, setOutputToken] = useState<TokenProps>(swapTokens[1]);
    const [blockNumber, setBlockNumber] = useState<number>();

    const inputTokenContract = useTokenContract(inputToken.address);
    const outputTokenContract = useTokenContract(outputToken.address);
    const swapContract = useSwapContract();

    const resetAmount = () => {
        setInputAmount({
            number: '',
            wei: ''
        });
        setOutputAmount({
            number: '',
            wei: ''
        });
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

    const checkBalance = () => {
        if (!account) return;
        if (inputToken.isBase) {
            getBnbBalance(account).then((result) => {
                setInputTokenBalance(ethersToBigNumber(result));
            });
        } else {
            inputTokenContract.balanceOf(account).then((result) => {
                setInputTokenBalance(ethersToBigNumber(result));
            });
        }
        if (outputToken.isBase) {
            getBnbBalance(account).then((result) => {
                setOutputTokenBalance(ethersToBigNumber(result));
            });
        } else {
            outputTokenContract.balanceOf(account).then((result) => {
                setOutputTokenBalance(ethersToBigNumber(result));
            });
        }
    };

    const update = () => {
        checkFee();
        checkBalance();
    };

    useEffect(() => {
        if (swapTokens[0]) setInputToken(swapTokens[0]);
        if (swapTokens[1]) setOutputToken(swapTokens[1]);
        resetAmount();
    }, [swapTokens]);

    useEffect(() => {
        setIsApproved(false);
        if (!account) return;
        if (!inputToken.isBase) {
            inputTokenContract.allowance(account, swapContract.address).then((result: any) => {
                const allowance = ethersToBigNumber(result);
                const amount = inputAmount.wei;
                if (allowance.isGreaterThanOrEqualTo(amount)) {
                    setIsApproved(true);
                } else {
                    setIsApproved(false);
                }
            });
        }
    }, [inputToken.address, inputAmount.wei, isBuy]);

    useEffect(() => {
        const interval = setInterval(update, 12000);
        update();
        return () => clearInterval(interval);
    }, [account, chainId, isBuy, inputToken, outputToken]);

    const getCustomGasFee = useCallback(
        async (method: string, args: any) => {
            const gasPrice = await library.getGasPrice();
            const gasLimit = await swapContract.estimateGas[method](...args);
            const estimateGas = ethersToBigNumber(gasLimit);
            const customFee = toBigNumber(150000);
            return {
                gasPrice: gasPrice.toString(),
                gasLimit: estimateGas.plus(customFee).toString()
            };
        },
        [library]
    );

    const buy = async () => {
        const amount = inputAmount.wei.toString();
        let buyTx = null;
        if (isRefer) {
            const args = [refer, { value: amount }];
            const gasOverrides = await getCustomGasFee('buyWithReferral', args);
            buyTx = swapContract.buyWithReferral(refer, {
                value: amount,
                ...gasOverrides
            });
        } else {
            const args = [{ value: amount }];
            const gasOverrides = await getCustomGasFee('buy', args);
            buyTx = swapContract.buy({
                value: amount,
                ...gasOverrides
            });
        }
        const receipt = await fetchWithCatchTxError(() => {
            return buyTx;
        });
        if (receipt?.status) {
            update();
            resetAmount();
            toastSuccess(
                'Bought',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    {`You have bought ${outputAmount.number} ${outputToken.symbol}!`}
                </ToastDescriptionWithTx>
            );
        }
    };

    const sell = async () => {
        const amount = inputAmount.wei.toString();
        const receipt = await fetchWithCatchTxError(() => {
            return swapContract.sell(amount);
        });
        if (receipt?.status) {
            update();
            resetAmount();
            toastSuccess(
                'Sold',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    {`You have sold ${inputAmount.number} ${inputToken.symbol}!`}
                </ToastDescriptionWithTx>
            );
        }
    };

    const approve = async () => {
        const spender = swapContract.address;
        const ts = await inputTokenContract.totalSupply();
        const receipt = await fetchWithCatchTxError(() => {
            return inputTokenContract.approve(spender, ts);
        });
        if (receipt?.status) {
            setIsApproved(true);
            toastSuccess(
                'Approved',
                <ToastDescriptionWithTx txHash={receipt.transactionHash}>
                    {`You can now buy or sell your ${inputToken.symbol}!`}
                </ToastDescriptionWithTx>
            );
        }
    };

    const updateOutByInput = (value) => {
        const amount = value.toString();
        if (Number(value) <= 0) {
            return setOutputAmount({
                number: '',
                wei: ''
            });
        } else {
            if (isBuy) {
                swapContract
                    .getAmountOutFromBuy(amount)
                    .then(({ amountOut }) => {
                        setOutputAmount({
                            number: fromWei(amountOut, outputToken.decimals),
                            wei: ethersToBigNumber(amountOut)
                        });
                    })
                    .catch(() => {
                        setOutputAmount({
                            number: '',
                            wei: ''
                        });
                    });
            } else {
                swapContract
                    .getAmountOutFromSell(amount)
                    .then(({ amountOut }) => {
                        setOutputAmount({
                            number: fromWei(amountOut, outputToken.decimals),
                            wei: ethersToBigNumber(amountOut)
                        });
                    })
                    .catch(() => {
                        setOutputAmount({
                            number: '',
                            wei: ''
                        });
                    });
            }
        }
    };

    const updateInByOutput = (value) => {
        const amount = value.toString();
        if (Number(value) <= 0) {
            return setInputAmount({
                number: '',
                wei: ''
            });
        } else {
            if (isBuy) {
                swapContract
                    .getAmountInFromBuy(amount)
                    .then(({ amountIn }) => {
                        setInputAmount({
                            number: fromWei(amountIn, inputToken.decimals),
                            wei: ethersToBigNumber(amountIn)
                        });
                    })
                    .catch(() => {
                        setInputAmount({
                            number: '',
                            wei: ''
                        });
                    });
            } else {
                swapContract
                    .getAmountInFromSell(amount)
                    .then(({ amountIn }) => {
                        setInputAmount({
                            number: fromWei(amountIn, inputToken.decimals),
                            wei: ethersToBigNumber(amountIn)
                        });
                    })
                    .catch(() => {
                        setInputAmount({
                            number: '',
                            wei: ''
                        });
                    });
            }
        }
    };

    const handleChange = (event) => {
        const {
            target: { id, value }
        } = event;
        if (id === 'input-token') {
            updateOutByInput(toWei(value, inputToken.decimals));
            setInputAmount({
                wei: toWei(value, inputToken.decimals),
                number: value
            });
        } else {
            updateInByOutput(toWei(value, outputToken.decimals));
            setOutputAmount({
                wei: toWei(value, outputToken.decimals),
                number: value
            });
        }
    };

    const setMax = () => {
        updateOutByInput(inputTokenBalance);
        setInputAmount({
            number: fromWei(inputTokenBalance, inputToken.decimals),
            wei: inputTokenBalance
        });
    };

    const exchangeBaseQuote = () => {
        const tempB = outputToken;
        const tempQ = inputToken;
        setInputToken(tempB);
        setOutputToken(tempQ);
        setIsBuy(!isBuy);
        setInputAmount(outputAmount);
        setOutputAmount(inputAmount);
    };

    const listener = (bn: number) => {
        setBlockNumber(bn);
        // library.getBlockWithTransactions(bn).then((block: any) => {
        //     const { transactions } = block;
        //     const result = transactions.filter((item) => item.from === account);
        // });
    };

    useEffect(() => {
        library.getBlockNumber().then(setBlockNumber);
        library.on('block', listener);
        return () => {
            library.removeListener('block', listener);
        };
    }, [library, account]);

    return (
        <Container sx={{ py: 4 }} maxWidth="xl">
            {!isMobile && (
                <Link underline="none" target="_blank" href={getBscScanLink(blockNumber, 'block')}>
                    <Card
                        variant="outlined"
                        component={Stack}
                        alignItems="center"
                        direction="row"
                        spacing={1}
                        sx={{
                            position: 'fixed',
                            bottom: (theme) => theme.spacing(8),
                            left: (theme) => theme.spacing(2),
                            p: (theme) => theme.spacing(1)
                        }}
                    >
                        <TokenRoundedIcon fontSize="small" />
                        <Typography color="textSecondary" sx={{ pt: 0.25 }}>
                            {blockNumber ?? 0}
                        </Typography>
                    </Card>
                </Link>
            )}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12}>
                    <Card
                        variant="outlined"
                        sx={{
                            width: '100%',
                            height: '100%',
                            mt: 4,
                            position: 'relative',
                            margin: 'auto',
                            boxShadow: '6px 2px 12px 0px rgba(0, 0, 0, 0.1)',
                            maxWidth: (theme) => theme.spacing(52),
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                margin: 0,
                                WebkitAppearance: 'none'
                            },
                            '& input[type=number]': {
                                MozAppearance: 'textfield'
                            }
                        }}
                    >
                        <Stack
                            justifyContent="center"
                            alignItems="center"
                            direction="row"
                            sx={{
                                p: (theme) => theme.spacing(3),
                                '& button': {
                                    borderWidth: 1,
                                    borderStyle: 'solid',
                                    borderColor: 'divider'
                                }
                            }}
                        >
                            <Stack alignItems="center">
                                <Typography variant="h6">Swap</Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Trade tokens in an instant
                                </Typography>
                            </Stack>
                        </Stack>
                        <Divider flexItem />
                        <CardContent
                            component={Stack}
                            alignItems="center"
                            direction="column"
                            justifyContent="space-between"
                            sx={{
                                p: (theme) => theme.spacing(3)
                            }}
                        >
                            <Stack
                                direction={'column'}
                                sx={{
                                    width: '100%'
                                }}
                            >
                                <Stack
                                    spacing={2}
                                    sx={{
                                        p: (theme) => theme.spacing(1, 1),
                                        bgcolor: 'rgba(85, 119, 253, 0.1)',
                                        borderRadius: 1
                                    }}
                                >
                                    <Stack
                                        direction={'row'}
                                        alignItems="center"
                                        justifyContent={'space-between'}
                                        spacing={2}
                                    >
                                        <Stack direction={'row'} alignItems="flex-end" spacing={1}>
                                            <Button
                                                color="inherit"
                                                startIcon={
                                                    <Box
                                                        component="img"
                                                        sx={{
                                                            height: (theme) => theme.spacing(2.5),
                                                            width: (theme) => theme.spacing(2.5),
                                                            borderRadius: 50
                                                        }}
                                                        src={inputToken.icon}
                                                    />
                                                }
                                                sx={{
                                                    p: (theme) => theme.spacing(1, 2),
                                                    bgcolor: 'rgba(0, 0, 0, .25)',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(0, 0, 0, .1)'
                                                    }
                                                }}
                                            >
                                                <Typography>{inputToken.symbol}</Typography>
                                            </Button>
                                        </Stack>
                                        <TextField
                                            id="input-token"
                                            type="number"
                                            inputProps={{
                                                placeholder: '0.00',
                                                min: 0,
                                                step: 0.01
                                            }}
                                            sx={{
                                                '& input': {
                                                    textAlign: 'right',
                                                    py: 0.75,
                                                    px: 0,
                                                    fontSize: 20
                                                },
                                                '& fieldset': {
                                                    border: 'none'
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    paddingRight: 0
                                                }
                                            }}
                                            disabled={pendingTx}
                                            value={inputAmount.number ?? ''}
                                            onChange={handleChange}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={setMax}
                                                            disabled={!inputTokenBalance}
                                                            sx={{
                                                                minWidth: (theme) => theme.spacing(5),
                                                                lineHeight: 1,
                                                                p: 0.5
                                                            }}
                                                        >
                                                            Max
                                                        </Button>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="textSecondary">
                                            {(() => {
                                                if (!inputTokenBalance) {
                                                    return (
                                                        <Stack component="span" direction="row" alignItems="center">
                                                            Balance:
                                                            <Skeleton
                                                                animation="wave"
                                                                sx={{
                                                                    ml: 1,
                                                                    minWidth: (theme) => theme.spacing(8)
                                                                }}
                                                            />
                                                        </Stack>
                                                    );
                                                }
                                                return `Balance: ${formatNumber(
                                                    fromWei(inputTokenBalance, inputToken.decimals),
                                                    6
                                                )}`;
                                            })()}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {(() => {
                                                if (!tokens[inputToken.apiId]) {
                                                    return <></>;
                                                }
                                                if (!inputAmount.wei) {
                                                    return (
                                                        <Stack component="span" direction="row" alignItems="center">
                                                            <Skeleton
                                                                animation="wave"
                                                                sx={{
                                                                    ml: 1,
                                                                    minWidth: (theme) => theme.spacing(8)
                                                                }}
                                                            />
                                                        </Stack>
                                                    );
                                                }
                                                return `~ ${formatCurrency(
                                                    fromWei(inputAmount.wei, inputToken.decimals) *
                                                        tokens[inputToken.apiId].current_price,
                                                    activeCurrency
                                                )}`;
                                            })()}
                                        </Typography>
                                    </Stack>
                                </Stack>
                                <Divider>
                                    <IconButton
                                        disabled={!inputToken.method.find((item) => item === 'sell')}
                                        onClick={exchangeBaseQuote}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(255, 255, 255, .05)',
                                            mt: 3,
                                            mb: 3
                                        }}
                                    >
                                        <SwapVertIcon fontSize="small" />
                                    </IconButton>
                                    {!isRefer && (
                                        <Button
                                            startIcon={<AddRoundedIcon />}
                                            sx={{
                                                bgcolor: 'rgba(255, 255, 255, .05) !important',
                                                color: 'text.secondary',
                                                boxShadow: 'none !important',
                                                textTransform: 'none',
                                                ml: 2
                                            }}
                                            size="small"
                                            variant="contained"
                                            color="secondary"
                                            onClick={() => {
                                                setIsRefer(true);
                                            }}
                                        >
                                            Add Referral (optional)
                                        </Button>
                                    )}
                                </Divider>
                                <Stack
                                    spacing={2}
                                    sx={{
                                        p: (theme) => theme.spacing(1, 1),
                                        bgcolor: 'rgba(85, 119, 253, 0.1)',
                                        borderRadius: 1
                                    }}
                                >
                                    <Stack
                                        direction={'row'}
                                        alignItems="center"
                                        justifyContent={'space-between'}
                                        spacing={2}
                                    >
                                        <Stack direction={'row'} alignItems="flex-end" spacing={1}>
                                            <Button
                                                color="inherit"
                                                startIcon={
                                                    <Box
                                                        component="img"
                                                        sx={{
                                                            height: (theme) => theme.spacing(2.5),
                                                            width: (theme) => theme.spacing(2.5),
                                                            borderRadius: 50
                                                        }}
                                                        src={outputToken.icon}
                                                    />
                                                }
                                                sx={{
                                                    p: (theme) => theme.spacing(1, 2),
                                                    bgcolor: 'rgba(0, 0, 0, .25)',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(0, 0, 0, .1)'
                                                    }
                                                }}
                                            >
                                                <Typography>{outputToken.symbol}</Typography>
                                            </Button>
                                        </Stack>
                                        <TextField
                                            id="output-token"
                                            type="number"
                                            inputProps={{
                                                placeholder: '0.00',
                                                min: 0,
                                                step: 0.01
                                            }}
                                            sx={{
                                                '& input': {
                                                    textAlign: 'right',
                                                    py: 0.75,
                                                    px: 0,
                                                    fontSize: 20
                                                },
                                                '& fieldset': {
                                                    border: 'none'
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    paddingRight: 0
                                                }
                                            }}
                                            disabled={pendingTx}
                                            value={outputAmount.number ?? ''}
                                            onChange={handleChange}
                                        />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="textSecondary">
                                            {(() => {
                                                if (!outputTokenBalance) {
                                                    return (
                                                        <Stack component="span" direction="row" alignItems="center">
                                                            Balance:
                                                            <Skeleton
                                                                animation="wave"
                                                                sx={{
                                                                    ml: 1,
                                                                    minWidth: (theme) => theme.spacing(8)
                                                                }}
                                                            />
                                                        </Stack>
                                                    );
                                                }
                                                return `Balance: ${formatNumber(
                                                    fromWei(outputTokenBalance, outputToken.decimals),
                                                    6
                                                )}`;
                                            })()}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {(() => {
                                                if (!tokens[outputToken.apiId]) {
                                                    return <></>;
                                                }
                                                if (!outputAmount.wei) {
                                                    return (
                                                        <Stack component="span" direction="row" alignItems="center">
                                                            <Skeleton
                                                                animation="wave"
                                                                sx={{
                                                                    ml: 1,
                                                                    minWidth: (theme) => theme.spacing(8)
                                                                }}
                                                            />
                                                        </Stack>
                                                    );
                                                }
                                                return `~ ${formatCurrency(
                                                    fromWei(outputAmount.wei, outputToken.decimals) *
                                                        tokens[outputToken.apiId].current_price,
                                                    activeCurrency
                                                )}`;
                                            })()}
                                        </Typography>
                                    </Stack>
                                </Stack>
                                {isRefer && (
                                    <>
                                        <Divider>
                                            <IconButton
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(255, 255, 255, .05)',
                                                    mt: 3,
                                                    mb: 3
                                                }}
                                            >
                                                <ArrowDownwardRoundedIcon fontSize="small" />
                                            </IconButton>
                                            <Button
                                                startIcon={<RemoveRoundedIcon />}
                                                sx={{
                                                    bgcolor: 'rgba(255, 255, 255, .05) !important',
                                                    color: 'text.secondary',
                                                    boxShadow: 'none !important',
                                                    textTransform: 'none',
                                                    ml: 2
                                                }}
                                                size="small"
                                                variant="contained"
                                                color="secondary"
                                                onClick={() => {
                                                    setIsRefer(false);
                                                    setRefer('');
                                                }}
                                            >
                                                Remove Referral
                                            </Button>
                                        </Divider>
                                        <Stack
                                            spacing={2}
                                            sx={{
                                                p: (theme) => theme.spacing(1, 1),
                                                bgcolor: 'rgba(85, 119, 253, 0.1)',
                                                borderRadius: 1,
                                                borderStyle: 'solid',
                                                borderWidth: 1,
                                                borderColor: isAddress(refer) ? 'success.dark' : 'error.dark'
                                            }}
                                        >
                                            <Typography variant="caption" color="textSecondary">
                                                Referral
                                            </Typography>
                                            <TextField
                                                id="referral-address"
                                                inputProps={{
                                                    placeholder: '0x'
                                                }}
                                                sx={{
                                                    '& input': {
                                                        fontSize: 16
                                                    },
                                                    '& fieldset': {
                                                        border: 'none'
                                                    },
                                                    '& .MuiOutlinedInput-root': {
                                                        paddingRight: 0,
                                                        borderColor: 'rgba(85, 119, 253, 0.1)',
                                                        borderWidth: 1,
                                                        borderStyle: 'solid'
                                                    }
                                                }}
                                                disabled={pendingTx}
                                                value={refer}
                                                onChange={(e) => setRefer(e.target.value)}
                                            />
                                        </Stack>
                                    </>
                                )}
                                <Divider sx={{ my: 3 }}>
                                    <Typography color="textSecondary" variant="subtitle2">
                                        {!data.buyFee || !data.sellFee ? (
                                            <Skeleton sx={{ minWidth: 80 }} animation="wave" />
                                        ) : isBuy ? (
                                            `Buy Fee: ${formatNumber((data.buyFee * 100) / 10000, 1)}%`
                                        ) : (
                                            `Sell Fee: ${formatNumber((data.sellFee * 100) / 10000, 1)}%`
                                        )}
                                    </Typography>
                                </Divider>
                                {(() => {
                                    if (!account) {
                                        return (
                                            <LoadingButton
                                                size="large"
                                                variant="contained"
                                                onClick={onPresentConnectModal}
                                            >
                                                Connect Wallet
                                            </LoadingButton>
                                        );
                                    } else {
                                        if (!inputAmount.number || !outputAmount.number) {
                                            return (
                                                <LoadingButton size="large" variant="contained" disabled>
                                                    Enter an amount
                                                </LoadingButton>
                                            );
                                        }
                                        if (!inputTokenBalance) {
                                            return (
                                                <LoadingButton size="large" variant="contained" disabled>
                                                    Insufficient {inputToken.symbol} balance
                                                </LoadingButton>
                                            );
                                        }
                                        const inab = toBigNumber(inputAmount.wei);
                                        const itb = toBigNumber(inputTokenBalance);
                                        if (inab.isGreaterThan(itb)) {
                                            return (
                                                <LoadingButton size="large" variant="contained" disabled>
                                                    Insufficient {inputToken.symbol} balance
                                                </LoadingButton>
                                            );
                                        }
                                        if (!isAddress(refer) && isRefer) {
                                            return (
                                                <LoadingButton size="large" variant="contained" disabled>
                                                    Input Referral Address
                                                </LoadingButton>
                                            );
                                        }
                                        if (isBuy) {
                                            if (!isApproved && !inputToken.isBase) {
                                                return (
                                                    <LoadingButton
                                                        loading={pendingTx}
                                                        size="large"
                                                        variant="contained"
                                                        onClick={approve}
                                                    >
                                                        approve
                                                    </LoadingButton>
                                                );
                                            }
                                            return (
                                                <LoadingButton
                                                    loading={pendingTx}
                                                    size="large"
                                                    variant="contained"
                                                    onClick={buy}
                                                >
                                                    Buy
                                                </LoadingButton>
                                            );
                                        } else {
                                            if (!isApproved && !inputToken.isBase) {
                                                return (
                                                    <LoadingButton
                                                        loading={pendingTx}
                                                        size="large"
                                                        variant="contained"
                                                        onClick={approve}
                                                    >
                                                        approve
                                                    </LoadingButton>
                                                );
                                            }
                                            return (
                                                <LoadingButton
                                                    loading={pendingTx}
                                                    size="large"
                                                    variant="contained"
                                                    onClick={sell}
                                                >
                                                    SELL
                                                </LoadingButton>
                                            );
                                        }
                                    }
                                })()}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Swap;
