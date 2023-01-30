import type { Signer } from '@ethersproject/abstract-signer';
import type { Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { simpleRpcProvider } from 'utils/providers';

// Addresses
import {
    getRouterAddress,
    getSwapAddress,
    getMulticallAddress,
    getBaseAddress,
    getDividendAddress,
    getDistributeAddress
} from 'utils/addressHelpers';

// ABI
import token from 'config/abi/token.json';
import swap from 'config/abi/swap.json';
import router from 'config/abi/pkrouter.json';
import multicall from 'config/abi/multicall.json';
import dividend from 'config/abi/dividend.json';
import distribute from 'config/abi/distribute.json';

export const getContract = (abi: any, address: string, signer?: Signer | Provider) => {
    const signerOrProvider = signer ?? simpleRpcProvider;
    return new Contract(address, abi, signerOrProvider);
};

export const getRouterContract = (signer?: Signer | Provider) => {
    return getContract(router, getRouterAddress(), signer);
};
export const getSwapContract = (signer?: Signer | Provider) => {
    return getContract(swap, getSwapAddress(), signer);
};
export const getMulticallContract = (signer?: Signer | Provider) => {
    return getContract(multicall, getMulticallAddress(), signer);
};
export const getBaseContract = (signer?: Signer | Provider) => {
    return getContract(token, getBaseAddress(), signer);
};
export const getDividendContract = (signer?: Signer | Provider) => {
    return getContract(dividend, getDividendAddress(), signer);
};
export const getDistributeContract = (signer?: Signer | Provider) => {
    return getContract(distribute, getDistributeAddress(), signer);
};
